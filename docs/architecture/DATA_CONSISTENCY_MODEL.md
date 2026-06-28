# Data Consistency Model: FoundationDB, PowerSync, and iOS Devices

This document describes the data consistency architecture for Thunderbolt's self-hosted iOS deployment, where **FoundationDB (FDB) is the source-of-truth**, PowerSync provides the sync substrate, and iOS devices cache encrypted data locally.

---

## Section 1: Architecture Overview

### System Layers

```
┌─────────────────────────────────────────────────────────────────────┐
│                         iOS Devices (Edge)                          │
│  • Local SQLite cache (encrypted with device key)                   │
│  • Optimistic writes: fire-and-forget to PowerSync                  │
│  • Reads: immediate from local cache                                │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                          PowerSync API
                          (Sync endpoint)
                               │
┌──────────────────────────────▼──────────────────────────────────────┐
│              PowerSync Cloud / Server (Sync Broker)                  │
│  • Bidirectional sync orchestration                                  │
│  • Conflict detection (device vs server versions)                    │
│  • Upload queue (device → server)                                    │
│  • Download queue (server → device)                                  │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                  FDB-PowerSync Bridge (Middleware)
                               │
┌──────────────────────────────▼──────────────────────────────────────┐
│            FoundationDB Cluster (Source of Truth)                    │
│  • ACID transactions                                                 │
│  • Distributed consensus                                             │
│  • All user data (canonical version)                                 │
│  • Multi-device coordination layer                                   │
└─────────────────────────────────────────────────────────────────────┘
```

### Key Principles

1. **FDB is canonical**: All user data lives in FDB. iOS devices and PowerSync store replicas.
2. **Eventual consistency**: Devices converge to the same state within 5 seconds (p99).
3. **Offline-first**: iOS works fully offline. Sync resumes when network returns.
4. **Encrypted end-to-end**: Data encrypted on-device before upload; server stores only ciphertext.
5. **Hard deletes cascade**: Account deletion removes all data from FDB → PowerSync → iOS caches.

---

## Section 2: Sync Model

### Write Propagation: iOS → PowerSync → FDB

1. **Device writes locally** (instant, no network required)
   - User edits a chat message on iPhone
   - SQLite transaction commits locally with `is_synced=0`
   - UI updates immediately (optimistic)

2. **Device queues upload to PowerSync** (async, batched)
   - PowerSync SDK batches local changes (every 1-5 seconds)
   - Sends to PowerSync endpoint as `PUT` / `PATCH` / `DELETE` operations
   - Device receives batch confirmation from PowerSync

3. **FDB-PowerSync Bridge pulls from PowerSync and syncs FDB** (every 5s or 100 records)
   - Bridge polls PowerSync for pending uploads
   - Applies operations to FDB transactionally
   - Conflict detection happens here (device version vs FDB version)
   - Conflict resolution (see Section 3) determines winner
   - FDB transaction commits or rolls back atomically

### Read Propagation: FDB → PowerSync → iOS

1. **Backend/server reads from FDB** (source of truth)
   - Chat API queries FDB for current state
   - Returns canonical data to mobile client (if authenticated)

2. **Bridge syncs FDB changes to PowerSync** (batched, <5s)
   - Watches FDB for mutations
   - Batches writes: 100 records or 5 seconds, whichever first
   - Uploads to PowerSync as canonical state
   - Watermark tracking prevents re-syncing the same FDB revision

3. **PowerSync pushes to iOS devices** (propagates immediately)
   - PowerSync Cloud detects new server-side data
   - Checks device subscription rules (user_id filter)
   - Sends encrypted down sync to all subscribed devices
   - iOS SQLite merges into local cache
   - UI refreshes automatically via React/state listeners

### Watermark Tracking (Idempotency)

The bridge maintains per-table **watermarks**: the FDB revision number of the last successfully synced batch.

```
FDB revision:  100  101  102  103  104
               ├────┤─────────┤────┤────
Bridge batches: [100-101]   (synced) → watermark = 101
                        [102-103]   (synced) → watermark = 103
                              [104] (syncing)

If re-sync happens: check watermark, skip if already synced.
Prevents: duplicate operations, infinite loops, double-charging.
```

**Guarantee:** Same FDB change synced multiple times = idempotent (no duplicate in PowerSync).

---

## Section 3: Conflict Resolution

### Conflict Types

| Type               | Scenario                                                         | Example                                                    |
| ------------------ | ---------------------------------------------------------------- | ---------------------------------------------------------- |
| **concurrent_edit** | Device A and Device B both edit the same field simultaneously     | User edits chat message on iPhone; backend updates on web  |
| **delete_vs_update** | One device deletes; another device updates the same record        | iPhone deletes task; web adds a note to task               |
| **encryption_key_mismatch** | Device doesn't have the correct E2E encryption key to decrypt     | User lost device; new device syncing before key setup      |

### Resolution Strategies

#### 1. LAST_WRITE_WINS (LWW)

The newer timestamp wins. Simple, deterministic, no data loss.

```typescript
// Example: Chat message edited by two devices
FDB version:     { id: 'msg-1', content: 'Hello', updatedAt: 2024-01-01T10:00:00Z }
Device version:  { id: 'msg-1', content: 'Hi',    updatedAt: 2024-01-01T10:05:00Z }

→ Device version wins (newer timestamp)
→ FDB updated to device version
→ PowerSync propagates to all devices
```

**Configuration (default for most tables):**
```typescript
const resolver = new ConflictResolver({
  chat_messages: { strategy: 'LAST_WRITE_WINS', notifyUser: true },
  tasks: { strategy: 'LAST_WRITE_WINS', notifyUser: false },
})
```

#### 2. CRDT (Conflict-free Replicated Data Type)

Merges versions field-by-field using LWW on each field. Useful for collaborative editing.

```typescript
// Example: Settings object edited by two devices
FDB version:     { theme: 'dark' (10:00), fontSize: 12 (10:00) }
Device version:  { theme: 'light' (10:05), fontSize: 14 (10:01) }

→ Merge by field:
   - theme: device wins (10:05 > 10:00)
   - fontSize: device wins (10:01 > 10:00)
→ Result: { theme: 'light', fontSize: 14 }
```

#### 3. CUSTOM

Table-specific resolution logic. Example: email classification always wins from backend (never device).

```typescript
const emailResolver = async (conflict) => {
  // Always trust server (FDB) for email labels/classification
  // Device can change subject, body — but server sets spam/phishing/category
  const merged = {
    ...conflict.deviceVersion, // Device edits
    ...conflict.fdbVersion, // Server classification (overwrites)
  }
  return { resolved: true, winnerVersion: merged, strategy: 'CUSTOM' }
}

const resolver = new ConflictResolver({
  emails: { strategy: 'CUSTOM', customResolver: emailResolver },
})
```

### Conflict Resolution Flow

```
Device sync arrives at PowerSync
         ↓
Bridge polls PowerSync upload queue
         ↓
Check: Does record exist in FDB?
  ├─ NO  → Insert into FDB (no conflict)
  └─ YES → Compare timestamps
              ├─ Device is newer → Use device version
              └─ FDB is newer   → Keep FDB version
         ↓
Apply resolution to FDB
         ↓
Update PowerSync with winner
         ↓
Log conflict to audit trail
         ↓
Propagate winner to all devices
```

### User Notification

When a conflict resolves against the user's device, notify the user:

```typescript
// In UI: "Your changes were overwritten by edits from another device"
// Show: FDB version vs device version, resolution timestamp
// Allow: manual merge or accept resolution
```

### Audit Trail

All conflicts logged for debugging and compliance:

```typescript
conflictLog: [
  {
    tableName: 'chat_messages',
    recordId: 'msg-123',
    userId: 'user-1',
    conflictType: 'concurrent_edit',
    fdbVersion: { content: '...' },
    deviceVersion: { content: '...' },
    resolution: 'LAST_WRITE_WINS',
    winner: 'device',
    timestamp: '2024-01-01T10:05:00Z',
  },
  // ...
]
```

---

## Section 4: Account Deletion (Hard Delete)

Account deletion cascades from FDB → PowerSync → iOS, ensuring no deleted data leaks.

### Deletion Process

```
1. User requests account deletion
   ↓
2. Backend validates request (OTP, password, or MFA)
   ↓
3. Begin FDB transaction:
   ├─ Mark user.deleted_at = NOW
   ├─ Delete all user records (cascade):
   │  ├─ chat_threads
   │  ├─ chat_messages
   │  ├─ tasks, models, prompts, skills, modes, agents
   │  ├─ devices (including public keys)
   │  ├─ encryption keys
   │  └─ session tokens
   ├─ FDB transaction commits atomically
   └─ Emit deletion event to event bus
   ↓
4. FDB-PowerSync Bridge detects deletion:
   ├─ Polls FDB change stream
   ├─ Identifies deleted user
   ├─ Marks all user's records as DELETE in PowerSync
   └─ Queues PowerSync sync
   ↓
5. PowerSync propagates deletes to iOS:
   ├─ For each device: send DELETE operations
   ├─ Device applies DELETE locally (removes from SQLite)
   ├─ Device sends acknowledgment
   └─ Wait for all devices to acknowledge (timeout: 30s)
   ↓
6. Cleanup complete:
   ├─ Log deletion to audit trail
   ├─ Emit completion event
   └─ Return 200 to user
```

### Timing Guarantees

| Phase          | Latency | Guarantee                                       |
| -------------- | ------- | ----------------------------------------------- |
| FDB delete     | <100ms  | ACID: atomic, consistent                        |
| Bridge sync    | <5s p99 | All records marked deleted in PowerSync          |
| iOS propagate  | <15s    | Delete received by 95% of devices                |
| Full cleanup   | <30s    | All devices acknowledge or timeout               |

### Safety: Deleted Data Never Visible

1. **PowerSync filters**:
   ```sql
   SELECT * FROM chat_messages 
   WHERE user_id = ? AND deleted_at IS NULL
   ```

2. **iOS app** filters local queries:
   ```typescript
   db.query('SELECT * FROM chat_messages WHERE deleted_at IS NULL')
   ```

3. **Backend**:
   ```typescript
   db.select().from(chatMessagesTable).where(isNull(chatMessagesTable.deletedAt))
   ```

### Device Revocation

When a device is revoked (trust removed), its encryption key is deleted from FDB:

```
Device revoked
   ↓
FDB: Delete device.deviceId and device.publicKey
   ↓
Bridge syncs to PowerSync
   ↓
PowerSync marks device as revoked (can't decrypt new envelopes)
   ↓
iOS receives revocation notice
   ├─ Clears local cache
   └─ Requires re-setup to access data
```

---

## Section 5: Transaction Guarantees

### Per-Device Isolation

Each device operates independently until sync. No cross-device locking.

```
Device A                  Device B
│                         │
├─ Write task-1          ├─ Write task-2
├─ Write task-3          ├─ Write task-4
└─ Commit locally (sync=0)└─ Commit locally (sync=0)
  │                         │
  └──→ PowerSync ←──────────┘
        │
        ├─ Upload A: [task-1, task-3]
        ├─ Upload B: [task-2, task-4]
        │
        └──→ FDB
              Apply all 4 in order of arrival
              No coordination needed
```

### Cross-Device Ordering (Causality)

FDB timestamps ensure causal ordering across devices:

```
Device A edits message at 10:00 UTC
Device B reads message at 10:01 UTC (sees A's edit)
Device B edits at 10:02 UTC
Device A syncs down at 10:03 UTC (sees B's edit)

→ Causal chain: A's edit → B's read → B's edit → A's read
→ All devices eventually see the same order
```

### Network Partition Handling

When a device loses network:

1. **Local operations continue** (offline-first)
   ```
   Device loses network
   ├─ App continues working (SQLite reads/writes)
   ├─ Changes queued locally (is_synced = 0)
   └─ UI shows offline indicator
   ```

2. **Sync resumes on reconnection**
   ```
   Network returns
   ├─ PowerSync reconnects
   ├─ Bridge pulls pending uploads
   ├─ Conflicts resolved (device vs FDB)
   ├─ FDB updated
   ├─ Bridge syncs back to all devices
   └─ All devices converge to same state
   ```

3. **No data loss during partition**
   - Local changes persist in SQLite
   - No operations dropped
   - No truncated sync history

---

## Section 6: Performance Characteristics

### Latency (p99)

| Operation                    | Latency | Notes                                        |
| ---------------------------- | ------- | -------------------------------------------- |
| **iOS local write**          | <10ms   | SQLite + local validation                    |
| **iOS local read**           | <10ms   | In-memory SQLite query                       |
| **Upload to PowerSync**      | <500ms  | Batched, network dependent                   |
| **FDB write (bridge sync)**  | <100ms  | Single transaction                           |
| **Download from FDB to iOS** | <5s     | Batched (5s or 100 records)                  |
| **Full end-to-end (write)**  | <15s    | iOS write → FDB → PowerSync → all iOS synced |

### Throughput

- **Bridge batching**: 100 records per batch or 5 seconds
- **PowerSync**: 1000+ records/second per sync endpoint
- **FDB**: Millions of operations/second (cluster dependent)
- **iOS**: Local writes bottlenecked by network, not local storage

### Memory Overhead

- **Bridge watermarks**: ~8KB (one per table, 12 tables)
- **Conflict audit log**: ~1KB per conflict (older entries archived)
- **iOS local cache**: Synced tables only (typically 1-100MB per user)

### Storage (FDB)

- **User data**: ~1KB per user baseline (settings, profile)
- **Chat history**: ~100 bytes per message
- **Tasks/notes**: ~500 bytes each
- **Encryption keys**: ~256 bytes per device

---

## Section 7: Monitoring & Debugging

### Key Metrics

1. **Sync lag** (time from FDB write to iOS sync)
   ```typescript
   // Target: <5s p99
   lag = max(lastSyncTime) - fdbWriteTime
   ```

2. **Conflict rate** (conflicts per 1000 syncs)
   ```typescript
   // Target: <10 conflicts per 1000 syncs
   rate = (totalConflicts / totalSyncs) * 1000
   ```

3. **Failed syncs** (upload/download failures)
   ```typescript
   // Target: <0.1% failure rate
   failureRate = totalFailed / (totalSynced + totalFailed)
   ```

4. **Device acknowledgment lag** (time for devices to ack deletes)
   ```typescript
   // Target: <30s for 95% of devices
   ackLag = deviceAckTime - deleteInitiationTime
   ```

### Debug: Watermark Inspection

```typescript
// Check watermark status
const bridge = getFdbPowerSyncBridge()
const watermarks = {
  chat_messages: bridge.getWatermark('chat_messages'),
  tasks: bridge.getWatermark('tasks'),
  models: bridge.getWatermark('models'),
}

// Watermark stuck? → Bridge not pulling PowerSync uploads
// Watermark far behind FDB revision? → Bridge lagging, increase batch size
```

### Debug: FDB Transaction Logs

```typescript
// Query FDB transaction log for a specific user
const userTxs = await fdb.query({
  user_id: 'user-123',
  timestamp: { $gte: new Date(Date.now() - 3600000) }, // Last hour
  limit: 1000,
})

// Each tx shows: operation, before, after, conflict resolution if any
```

### Debug: PowerSync Upload Queue

```bash
# Check pending uploads in PowerSync
curl -s https://powersync.endpoint/health | jq '.uploadQueueStats'

# If queue is backed up:
# - Bridge may be slow (check error logs)
# - FDB may be unavailable (check cluster health)
# - Conflict resolver may be stuck (check resolver logs)
```

### Troubleshooting Guide

| Issue                     | Symptom                         | Diagnosis                                         | Fix                                        |
| ------------------------- | ------------------------------- | ------------------------------------------------- | ------------------------------------------ |
| **Sync lag > 10s**        | Changes take >10s to sync       | Check bridge logs, conflict resolver performance | Increase batch size, check FDB latency     |
| **High conflict rate**    | Users report stale data         | Check conflict audit log, device clocks          | Check device time sync, resolver logic     |
| **Failed syncs**          | Changes don't replicate         | Bridge error logs, network connectivity          | Restart bridge, check PowerSync health     |
| **Deleted data visible**  | User data still synced after del | PowerSync filter not applied, iOS cache stale    | Clear iOS cache, force sync                |
| **Device stuck offline**  | Device can't connect to PowerSync | Check device network, PowerSync endpoint health  | Restart app, check network config          |
| **Watermark stuck**       | Watermark not advancing         | Bridge not running or crashed                    | Check bridge process, restart if needed    |

### Observability Stack

- **Metrics**: Prometheus (sync lag, conflict rate, failure rate)
- **Logs**: ELK (error logs, conflict audit trail)
- **Tracing**: OpenTelemetry (end-to-end sync flow)
- **Alerting**: PagerDuty (high conflict rate, failed syncs, FDB unavailable)

---

## Summary

This model ensures:

- **Consistency**: All devices eventually converge (within 5s)
- **Durability**: FDB ACID guarantees (no data loss)
- **Availability**: Offline-first iOS works without network
- **Security**: E2E encryption, deleted data never visible
- **Auditability**: Conflict logs for compliance

The bridge acts as the critical middleware, batching changes, resolving conflicts, and maintaining idempotency through watermarks. By combining FDB's ACID guarantees, PowerSync's sync orchestration, and iOS's offline-first architecture, Thunderbolt achieves a production-ready multi-device sync system.
