# FoundationDB Integration Guide

This guide walks through integrating FoundationDB as the source-of-truth for Thunderbolt's data consistency layer, with PowerSync providing the sync substrate for iOS devices.

---

## Quick Start

### 1. Enable FDB in Environment

```bash
# backend/.env
FOUNDATIONDB_ENABLED=true
FOUNDATIONDB_CLUSTER=/path/to/fdb.cluster  # or "localhost:4500" for local dev
FOUNDATIONDB_NAMESPACE=thunderbolt:v1
FOUNDATIONDB_PROTOCOL=fdb
FDB_CONFLICT_RESOLUTION_STRATEGY=LAST_WRITE_WINS
```

### 2. Initialize the Bridge

```typescript
// backend/src/index.ts
import { ConflictResolver, FdbToPowerSyncBridge } from '@/sync'

const conflictResolver = new ConflictResolver({
  chat_messages: { strategy: 'LAST_WRITE_WINS', notifyUser: true },
  tasks: { strategy: 'LAST_WRITE_WINS' },
  // ... per-table config
})

const fdbBridge = new FdbToPowerSyncBridge(conflictResolver, {
  batchSize: 100,
  batchIntervalMs: 5000,
  maxRetries: 5,
})

app.use(fdbSyncMiddleware(fdbBridge, { table: 'chat_messages' }))
```

### 3. Verify Sync

```bash
# Check bridge health
curl http://localhost:8000/v1/health/fdb-bridge | jq

# Expected response:
{
  "healthy": true,
  "lastSyncTime": "2024-01-01T10:05:00Z",
  "totalSynced": 1250,
  "totalFailed": 2,
  "failureRate": 0.0016,
  "syncLagMs": 500
}
```

---

## Integration Phases

### Phase 1: Dual-Write (Verification)

Keep Postgres as primary, write to both FDB and Postgres for verification.

**Goal:** Validate FDB works before switching read path.

```typescript
// backend/src/dal/chats.ts
export const createChatMessage = async (db: DB, data: CreateChatMessageData) => {
  // Write to Postgres (primary)
  const psqlResult = await db.insert(chatMessagesTable).values(data).returning()

  // Also write to FDB (for verification)
  if (fdbEnabled) {
    await fdbRepository.insert('chat_messages', data).catch((err) => {
      // Log error but don't fail; Postgres is still source of truth
      console.error('[FDB] Failed to write:', err)
    })
  }

  return psqlResult
}
```

**Validation:**
- Monitor FDB write latency
- Check for divergence between Postgres and FDB
- Verify PowerSync gets updates from both sources

### Phase 2: Read from FDB

Switch read path to FDB, keep Postgres as backup.

```typescript
// backend/src/dal/chats.ts
export const getChatMessages = async (userId: string, threadId: string) => {
  if (fdbEnabled) {
    return fdbRepository.query('chat_messages', {
      userId,
      threadId,
      deletedAt: null, // Exclude soft-deleted
    })
  }

  // Fallback to Postgres
  return db.query().from(chatMessagesTable).where(...)
}
```

**Validation:**
- All reads return same data from FDB and Postgres
- No stale reads
- Performance acceptable (<100ms p99)

### Phase 3: Deprecate Postgres

Remove Postgres writes, use only FDB. Postgres becomes archive/backup.

```typescript
// backend/src/dal/chats.ts
export const createChatMessage = async (db: DB, data: CreateChatMessageData) => {
  // Write only to FDB
  const result = await fdbRepository.insert('chat_messages', data)

  // Async: eventually write to Postgres archive (optional)
  if (archiveEnabled) {
    archiveToPostgres(data).catch((err) => {
      // Log error; doesn't affect user-facing operation
      console.error('[Archive] Failed:', err)
    })
  }

  return result
}
```

---

## Conflict Resolver Configuration

### Per-Table Strategies

```typescript
import { ConflictResolver, ConflictResolutionStrategy } from '@/sync'

const resolver = new ConflictResolver({
  // Chat: LWW with user notification (user sees "message was overwritten")
  chat_messages: {
    strategy: ConflictResolutionStrategy.LAST_WRITE_WINS,
    notifyUser: true,
  },

  // Tasks: LWW, silent (user may not notice)
  tasks: {
    strategy: ConflictResolutionStrategy.LAST_WRITE_WINS,
    notifyUser: false,
  },

  // Settings: CRDT (merge field-by-field)
  settings: {
    strategy: ConflictResolutionStrategy.CRDT,
    notifyUser: false,
  },

  // Custom: Email labels always trust backend
  emails: {
    strategy: ConflictResolutionStrategy.CUSTOM,
    customResolver: async (conflict) => {
      const merged = {
        ...conflict.deviceVersion, // Device can edit body, subject
        classification: conflict.fdbVersion.classification, // Server classification wins
        labels: conflict.fdbVersion.labels,
      }
      return {
        resolved: true,
        winnerVersion: merged,
        strategy: ConflictResolutionStrategy.CUSTOM,
        reason: 'Backend classification always wins',
      }
    },
    notifyUser: false,
  },
})
```

### Accessing Resolver in API Routes

```typescript
// backend/src/api/conflicts.ts
import { getConflictResolver } from '@/sync/resolver-context'

export const getConflictStats = async (req: Request, res: Response) => {
  const resolver = getConflictResolver()
  const userId = req.auth?.userId
  const stats = resolver.getStats()
  const auditLog = resolver.getAuditLog(userId, 100)

  res.json({ stats, auditLog })
}
```

---

## Middleware Integration

### Method 1: Automatic Sync (Recommended)

Middleware automatically queues sync after successful mutation.

```typescript
// backend/src/api/chat-messages.ts
import { fdbSyncMiddleware } from '@/sync'

app.post('/chat-messages', fdbSyncMiddleware(fdbBridge, { table: 'chat_messages' }), async (req, res) => {
  const message = await createChatMessage(req.body, req.auth.userId)
  res.json(message) // Middleware queues sync automatically
})

app.patch('/chat-messages/:id', fdbSyncMiddleware(fdbBridge, { table: 'chat_messages' }), async (req, res) => {
  const message = await updateChatMessage(req.params.id, req.body)
  res.json(message) // Middleware queues sync
})

app.delete('/chat-messages/:id', fdbSyncMiddleware(fdbBridge, { table: 'chat_messages' }), async (req, res) => {
  await deleteChatMessage(req.params.id)
  res.status(204).send()
})
```

### Method 2: Manual Sync

Explicit sync calls for custom logic.

```typescript
// backend/src/api/bulk-operations.ts
app.post('/bulk-delete-tasks', async (req, res) => {
  const taskIds = req.body.ids // [id1, id2, id3, ...]
  const userId = req.auth.userId

  // Delete from database
  await db.delete(tasksTable).where(inArray(tasksTable.id, taskIds))

  // Manually sync each deletion
  const fdbBridge = getFdbBridge()
  for (const taskId of taskIds) {
    await fdbBridge.deleteRecord('tasks', taskId, userId)
  }

  res.json({ deleted: taskIds.length })
})
```

---

## Account Deletion Flow

When user deletes account, cascade deletes FDB → PowerSync → iOS.

```typescript
// backend/src/api/account/delete.ts
import { getConflictResolver, getFdbBridge } from '@/sync'

export const deleteAccount = async (req: Request, res: Response) => {
  const userId = req.auth.userId

  // 1. Verify user identity (OTP, password, etc.)
  await verifyUserIdentity(req.body.verificationMethod, userId)

  // 2. Begin FDB transaction: mark deleted and cascade
  await fdb.transaction(async (tx) => {
    // Mark user deleted
    await tx.update('users', userId, { deletedAt: new Date() })

    // Delete all user's data (cascades via foreign keys)
    for (const table of SYNCED_TABLES) {
      await tx.delete(table, { userId })
    }

    // Delete encryption keys
    await tx.delete('encryption_keys', { userId })

    // Delete sessions
    await tx.delete('sessions', { userId })
  })

  // 3. Bridge detects FDB deletes and syncs to PowerSync
  // (Bridge runs async; responds to client immediately)

  // 4. PowerSync propagates deletes to iOS devices
  // (Each device receives DELETE operations in sync)

  // 5. Emit audit event
  emit('account-deleted', { userId, timestamp: new Date() })

  res.json({ success: true, message: 'Account and all data deleted' })
}
```

**iOS Side:**
```typescript
// ios/ThunderboltApp/Sync/AccountDeletionHandler.swift
// Receives DELETE operations from PowerSync
db.transaction { tx in
  try tx.delete(from: ChatMessages.self).where(\.$userId == userId).execute()
  try tx.delete(from: Tasks.self).where(\.$userId == userId).execute()
  // ... delete all user tables
  try tx.delete(from: EncryptionKeys.self).where(\.$userId == userId).execute()
}

// Show "Account deleted" screen
DispatchQueue.main.async {
  presentSignedOutScreen()
}
```

---

## Monitoring & Debugging

### Health Endpoint

```typescript
// backend/src/api/health.ts
import { getFdbBridge } from '@/sync'

app.get('/v1/health/fdb-bridge', (req, res) => {
  const fdbBridge = getFdbBridge()
  const health = fdbBridge.getHealth()

  if (health.healthy) {
    res.status(200).json(health)
  } else {
    res.status(503).json(health)
  }
})
```

### Debug: Watermark Status

```typescript
// Check if bridge is lagging
const watermarks = {
  chat_messages: fdbBridge.getWatermark('chat_messages'),
  tasks: fdbBridge.getWatermark('tasks'),
  models: fdbBridge.getWatermark('models'),
}

// If watermark is old, bridge is lagging
// Fix: increase batch size, check FDB latency, or restart bridge
```

### Debug: Conflict Audit Log

```typescript
const resolver = getConflictResolver()
const conflicts = resolver.getAuditLog('user-123', 50) // Last 50 conflicts for user

conflicts.forEach((conflict) => {
  console.log(`
    Conflict: ${conflict.conflictType}
    Table: ${conflict.tableName} / ${conflict.recordId}
    FDB: ${JSON.stringify(conflict.fdbVersion)}
    Device: ${JSON.stringify(conflict.deviceVersion)}
    Resolved: ${conflict.timestamp.toISOString()}
  `)
})
```

### Alerting

Set up alerts for:

```typescript
const health = fdbBridge.getHealth()

if (!health.healthy) {
  alert('FDB Bridge degraded', {
    failureRate: health.failureRate,
    syncLag: health.syncLagMs,
    lastError: health.lastError,
  })
}

if (health.failureRate > 0.05) {
  alert('High sync failure rate', {
    failed: health.totalFailed,
    synced: health.totalSynced,
  })
}
```

---

## Testing

### Unit Tests

```typescript
// Test conflict resolution
import { ConflictResolver } from '@/sync'

const resolver = new ConflictResolver()
const conflict = {
  tableName: 'chat_messages',
  recordId: 'msg-1',
  userId: 'user-1',
  fdbVersion: { content: 'FDB', updatedAt: new Date('2024-01-01T10:00Z') },
  deviceVersion: { content: 'Device', updatedAt: new Date('2024-01-01T10:05Z') },
  conflictType: 'concurrent_edit',
  timestamp: new Date(),
}

const result = await resolver.resolve(conflict)
expect(result.winnerVersion.content).toBe('Device') // Device is newer
```

### Integration Tests

```typescript
// Test FDB sync with PowerSync
const bridge = new FdbToPowerSyncBridge(resolver, { batchSize: 2, batchIntervalMs: 100 })

await bridge.syncTable('chat_messages', 'msg-1', 'user-1', { content: 'Hello' })
await new Promise((r) => setTimeout(r, 150)) // Wait for batch flush

const health = bridge.getHealth()
expect(health.totalSynced).toBe(1)
```

### E2E Tests (iOS)

```swift
// iOS test: concurrent edits resolve correctly
func testConcurrentEdits() async throws {
  let device1 = TestDevice(name: "iPhone A")
  let device2 = TestDevice(name: "iPhone B")

  // Both devices edit the same message
  try await device1.editMessage("msg-1", content: "Edit from A")
  try await device2.editMessage("msg-1", content: "Edit from B")

  // Wait for sync
  try await Task.sleep(nanoseconds: 5_000_000_000) // 5 seconds

  // Both devices should see the same content (conflict resolved)
  let device1Content = try await device1.getMessage("msg-1").content
  let device2Content = try await device2.getMessage("msg-1").content
  XCTAssertEqual(device1Content, device2Content)
}
```

---

## Troubleshooting

| Issue                  | Root Cause                        | Solution                              |
| ---------------------- | --------------------------------- | ------------------------------------- |
| Sync lag >10s          | Bridge lagging, FDB slow          | Increase batch size, check FDB health |
| Conflicts not resolved | Resolver not configured           | Check resolver config, enable logging |
| Deleted data visible   | PowerSync filter not applied      | Clear iOS cache, restart sync         |
| FDB connection failed  | Wrong cluster path, network issue | Check FOUNDATIONDB_CLUSTER, network   |
| High failure rate      | PowerSync down, FDB unavailable   | Check service health, restart bridge  |

---

## Performance Targets

| Metric                | Target  | Notes                          |
| --------------------- | ------- | ------------------------------ |
| Local write latency   | <10ms   | SQLite transaction             |
| FDB write latency     | <100ms  | p99                            |
| Bridge sync latency   | <5s     | FDB to PowerSync (p99)         |
| iOS download latency  | <15s    | Server to iOS device (p99)     |
| Full sync end-to-end  | <30s    | iOS write to all devices synced |
| Conflict rate         | <0.1%   | <10 per 1000 syncs             |
| Failure rate          | <0.01%  | Sync failures                  |

---

## Next Steps

1. **Enable FDB in staging**
   - Deploy with `FOUNDATIONDB_ENABLED=true`
   - Monitor bridge health for 24 hours
   - Compare Postgres and FDB data for divergence

2. **Switch read path** (Phase 2)
   - Update DAL to read from FDB
   - Run canary: 10% of users read from FDB
   - Monitor latency and errors
   - Ramp to 100%

3. **Deprecate Postgres** (Phase 3)
   - Archive Postgres to S3/cold storage
   - Keep for N months as backup
   - Delete after confidence period

---

See [DATA_CONSISTENCY_MODEL.md](DATA_CONSISTENCY_MODEL.md) for architectural details.
