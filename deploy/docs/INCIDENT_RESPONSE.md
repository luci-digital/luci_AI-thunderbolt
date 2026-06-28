# Incident Response Guide: Thunderbolt AIFAM Platform

> **InfluxData Pattern Reference:** This guide follows incident management patterns from InfluxData's production operations, including severity classification, response procedures, communication templates, post-incident review processes, common scenarios, and escalation paths.

**Status:** Production-ready | **Last Updated:** 2026-06-28

---

## Quick Links
- [Severity Levels](#severity-levels)
- [Response Procedures](#response-procedures)
- [Communication Templates](#communication-templates)
- [Common Scenarios](#common-scenarios)
- [Post-Incident Review](#post-incident-review)
- [Escalation Paths](#escalation-paths)

---

## Severity Levels

### Level 1 (Critical) - Paging Response

**SLA:** 5-15 minute response | **Impact:** Users completely unable to access service

| Trigger | Example | Action |
|---------|---------|--------|
| Service down > 100% uptime SLO breached | All frontend/API servers down | Page on-call engineer (SMS + call) |
| Data loss or corruption | Database corruption detected | Declare SEV-1; assemble full team |
| Security breach | Unauthorized access detected | SEV-1 + Security team + exec notify |

**Notification Channels:**
1. PagerDuty (immediate page to on-call)
2. Slack #incidents channel with `@here`
3. SMS alert to on-call (automatic via PagerDuty)
4. Executive notification (if >30 min outage)

**Escalation Timing:**
- T+0: On-call responds
- T+15m: If not resolved, page backup engineer
- T+30m: If not resolved, involve engineering lead + ops lead
- T+60m: VP Engineering + CTO notified

---

### Level 2 (High) - Urgent Ticket

**SLA:** 30-60 minute response | **Impact:** Significant feature or subset of users affected

| Trigger | Example | Action |
|---------|---------|--------|
| Degraded performance | API latency > 5s p95 sustained > 5 min | Create high-priority ticket; page if in business hours |
| High error rate | >5% 5xx errors sustained > 5 min | Create ticket; start investigation |
| Partial outage | 1 of 3 backend pods down for >5 min | Investigate + fix; monitor closely |

**Notification Channels:**
1. Slack #incidents channel with `@oncall`
2. Ticket created in Jira/Linear
3. Email to ops team if after-hours

**Escalation Timing:**
- T+0: Ticket created; on-call is aware
- T+30m: If ongoing, sync with engineering lead
- T+60m: If not fixed, escalate to manager
- T+120m: VP Engineering notification

---

### Level 3 (Medium) - Standard Ticket

**SLA:** 2-4 hour response | **Impact:** Minor feature affected, workaround exists

| Trigger | Example | Action |
|---------|---------|--------|
| Single feature degraded | Specific endpoint slow | Standard ticket; no paging |
| Intermittent errors | <1% error rate | Log for monitoring; create ticket |
| Warnings in logs | Cache miss rate elevated | Standard ticket; investigate trend |

**Notification Channels:**
1. Slack #incidents (no `@` mention)
2. Ticket created in Jira/Linear
3. No paging required

---

### Level 4 (Low) - FYI

**SLA:** Backlog | **Impact:** No user impact; infrastructure notification

| Trigger | Example | Action |
|---------|---------|--------|
| Informational | Metrics collected; disk usage trending up | Log for trend; no immediate action |
| Maintenance | Database VACUUM completed | Log completion; close ticket |

---

## Response Procedures

### Step 1: Acknowledge Incident (0-2 minutes)

When paged or alerted:

```bash
# 1. Acknowledge in PagerDuty
#    (dismisses alert, starts incident timer)

# 2. Join incident bridge (Slack Huddle or Zoom link in PagerDuty)

# 3. Post initial status in Slack #incidents
echo "🚨 SEV-2: API latency spike detected (T=0s)"
echo "Responder: @oncall"
echo "Status: Investigating"
echo "Last update: $(date)"

# 4. Start incident clock
START_TIME=$(date +%s)
```

### Step 2: Triage and Diagnosis (2-10 minutes)

**Run diagnostic script:**

```bash
#!/bin/bash
NAMESPACE="thunderbolt"

echo "=== INCIDENT DIAGNOSIS ==="
echo "Time: $(date)"
echo

echo "1. Pod Status"
kubectl get pods -n "$NAMESPACE" -o wide
echo

echo "2. Recent Events"
kubectl get events -n "$NAMESPACE" --sort-by='.lastTimestamp' | tail -20
echo

echo "3. CPU/Memory Usage"
kubectl top nodes
kubectl top pods -n "$NAMESPACE"
echo

echo "4. Error Logs (last 50 lines)"
kubectl logs -n "$NAMESPACE" -l app=backend --tail=50 | grep -i "error\|exception\|critical"
echo

echo "5. Database Status"
POSTGRES_POD=$(kubectl get pod -n "$NAMESPACE" -l app=postgres -o jsonpath='{.items[0].metadata.name}')
kubectl exec -it "$POSTGRES_POD" -n "$NAMESPACE" -- psql -U thunderbolt -d thunderbolt -c "SELECT count(*) as active_connections FROM pg_stat_activity;" 2>/dev/null || echo "Database unavailable"
echo

echo "6. API Health"
BACKEND_POD=$(kubectl get pod -n "$NAMESPACE" -l app=backend -o jsonpath='{.items[0].metadata.name}')
kubectl exec -it "$BACKEND_POD" -n "$NAMESPACE" -- curl -s http://localhost:8000/health | jq . || echo "Health check failed"
echo

echo "=== END DIAGNOSIS ==="
```

**Identify Issue Category:**

| Symptoms | Category | Action |
|----------|----------|--------|
| Pods CrashLoopBackOff | Pod Failure | Go to § Pod Debugging |
| High CPU/Memory | Resource Exhaustion | Go to § Resource Emergency |
| Database connection errors | Database Issue | Go to § Database Recovery |
| High latency p95 > 5s | Performance | Go to § Performance Emergency |
| Error rate >5% | Application Errors | Go to § Error Investigation |

### Step 3: Declare Severity and Notify (2-5 minutes)

```bash
# Post incident declaration
echo "🚨 [SEV-2] API Latency Spike"
echo "Severity: High (users affected)"
echo "Status: Investigating"
echo "Suspected cause: Database connection pool exhaustion"
echo "Responder: @oncall"
echo "Bridge: [Slack Huddle link]"
echo "Last update: $(date)"
echo "Next update: in 5 min"
```

**If SEV-1, immediately:**
1. Page additional team members
2. Start war room bridge
3. Notify VP Engineering

### Step 4: Implement Fix or Mitigation (5-30 minutes)

**Always start with the least-risky action:**

| Scenario | Quick Mitigation | Full Fix |
|----------|------------------|----------|
| Pod restart loop | Scale down to 1 pod; wait for logs | Fix root cause; deploy new image |
| Database connection pool full | Scale backend replicas down; reduce traffic | Increase pool size; fix leaked connections |
| Memory leak in service | Kill pod; let K8s recreate it | Deploy fixed code version |
| High latency | Scale up to 3 replicas; add cache | Optimize slow query; add index |
| Disk full on Postgres | Vacuum old data; resize PVC | Archive old data; increase storage quota |

**Implementation Commands:**

```bash
NAMESPACE="thunderbolt"

# Scale down replicas (reduce load)
kubectl scale deployment backend --replicas=1 -n "$NAMESPACE"

# Or kill a specific pod
kubectl delete pod <pod-name> -n "$NAMESPACE"

# Restart service
kubectl rollout restart deployment backend -n "$NAMESPACE"

# Temporary resource limit increase (if testing if resources are the issue)
kubectl set resources deployment backend -n "$NAMESPACE" \
  --limits=memory=3Gi --requests=memory=2Gi

# Circuit breaker: temporarily take service offline
kubectl patch service backend -n "$NAMESPACE" \
  --type merge -p '{"spec":{"selector":{"app":"backend-offline"}}}'
```

### Step 5: Validate Fix and Monitor (10-30 minutes)

```bash
# Confirm metrics returning to normal
kubectl top pod -n "$NAMESPACE" -l app=backend
kubectl exec -it <backend-pod> -n "$NAMESPACE" -- curl -s http://localhost:9090/metrics | grep http_request_duration_seconds_bucket

# Monitor error rate
echo "Checking error rate..."
BEFORE=$(date +%s -d '10 minutes ago')
AFTER=$(date +%s)
# Query Prometheus for errors in time range

# Run smoke test (user-facing flow)
echo "Testing sign-in flow..."
# Automated test or manual browser check

# Check all pods running normally
kubectl get pods -n "$NAMESPACE"
# Expected: all pods 1/1 Running, 0 restarts
```

### Step 6: Post-Incident Communication (At Resolution + 1h)

```bash
# Post resolution update to Slack
echo "✅ [RESOLVED] API Latency Spike - T+45min"
echo "Root cause: Database connection pool was at 95% capacity"
echo "Fix applied: Increased max_connections from 100 to 200"
echo "Impact: 12 minutes of elevated latency (p95: 2-5s)"
echo "Affected: ~500 users"
echo "Status: All systems nominal; monitoring closely"
echo "RCA meeting: Tomorrow 10am PT"
```

---

## Communication Templates

### Initial Status (T+5 minutes)

```
🚨 INCIDENT: [Service] - [Brief Description]

Severity: [SEV-1/2/3]
Status: Investigating
Impact: [% users affected or feature down]
Responder: @[on-call name]
Bridge: [URL]

Last update: [timestamp]
Next update: In 5 minutes
```

### Mitigation in Progress (T+15 minutes)

```
🔧 [SEV-2] Mitigation in Progress

Root cause identified: [2-3 sentence explanation]
Mitigation: [Action being taken]
ETA to resolution: [time estimate]
Impact ongoing: [current metrics: latency, error rate, users affected]

Responder: @[name]
Last update: [time]
Next update: In 5 minutes
```

### Incident Resolved (T+45 minutes)

```
✅ RESOLVED: [Service] - [Brief Description]

Resolution: [What was done to fix]
Duration: [XX minutes of impact]
Impact: [peak metrics, # users affected]
Root cause: [2-3 sentence technical explanation]
Prevention: [What we'll do to prevent recurrence]

Post-incident review: [Date/Time]
Responder: @[name]
All systems: Nominal
```

### Status Page Update (if applicable)

```
Investigating - API Latency
We are investigating an issue with elevated API response times.
Users may experience slower response times. We're monitoring closely.

Status: Investigating | Started: 10:45am PT | Last update: 10:52am PT

---

Resolved - API Latency
Issue resolved at 11:30am PT. Database connection pool was exhausted
due to a cache miss in a popular endpoint. We've deployed a fix.

Impact: ~12 min outage, ~500 users affected
RCA will be published in our status page tomorrow.
```

---

## Common Scenarios

### Scenario 1: Backend Pods Crashing

**Symptoms:**
- Backend pods show `CrashLoopBackOff`
- Users cannot access frontend (502 errors)
- Error log: `Error: Database connection refused`

**Diagnosis (2 min):**
```bash
BACKEND_POD=$(kubectl get pod -n thunderbolt -l app=backend -o jsonpath='{.items[0].metadata.name}')
kubectl logs "$BACKEND_POD" -n thunderbolt --previous --tail=50
# Check: Is Postgres pod running?
kubectl get pod -n thunderbolt -l app=postgres
```

**Quick Fix (3 min):**
```bash
# If Postgres not running, restart it
kubectl delete pod -n thunderbolt -l app=postgres
kubectl wait --for=condition=ready pod -l app=postgres -n thunderbolt --timeout=2m

# Backend will auto-recover once Postgres is ready
kubectl get pods -n thunderbolt -w
```

**Expected Recovery:** 2-3 minutes

**RCA:** Postgres OOM or connection limit reached. Increase memory limits or connection pool.

---

### Scenario 2: Database Disk Full

**Symptoms:**
- Postgres pod killed (OOMKilled)
- All write operations fail
- Logs: `Error: No space left on device`

**Diagnosis (2 min):**
```bash
POSTGRES_POD=$(kubectl get pod -n thunderbolt -l app=postgres -o jsonpath='{.items[0].metadata.name}')
kubectl exec "$POSTGRES_POD" -n thunderbolt -- df -h /var/lib/postgresql/data/
```

**Quick Fix (5 min):**
```bash
# Expand PVC to 100 Gi
kubectl patch pvc postgres-pvc -n thunderbolt \
  -p '{"spec":{"resources":{"requests":{"storage":"100Gi"}}}}'

# Or vacuum to reclaim space (risky: may hang if very full)
# kubectl exec "$POSTGRES_POD" -n thunderbolt -- psql -U thunderbolt -d thunderbolt -c "VACUUM FULL;" &
```

**Expected Recovery:** 1-2 minutes (for PVC expansion)

**RCA:** Data growth faster than expected. Implement archival strategy or increase default PVC size.

---

### Scenario 3: PowerSync Replication Lag > 30 seconds

**Symptoms:**
- Mobile clients showing stale data
- Sync changes not visible across devices
- Metrics: `powersync_replication_lag_seconds > 30`

**Diagnosis (2 min):**
```bash
POSTGRES_POD=$(kubectl get pod -n thunderbolt -l app=postgres -o jsonpath='{.items[0].metadata.name}')
kubectl exec -it "$POSTGRES_POD" -n thunderbolt -- psql -U thunderbolt -d thunderbolt -c \
  "SELECT slot_name, pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn) / 1024 / 1024 AS lag_mb FROM pg_replication_slots;"
```

**Quick Fix (5 min):**
```bash
# Check PowerSync CPU/memory
kubectl top pod -n thunderbolt -l app=powersync

# If under-resourced, scale down other services
kubectl scale deployment backend --replicas=1 -n thunderbolt
kubectl scale deployment frontend --replicas=1 -n thunderbolt

# Restart PowerSync to reset replication
kubectl delete pod -n thunderbolt -l app=powersync
```

**Expected Recovery:** 2-5 minutes

**RCA:** PowerSync under-resourced or slow network to Postgres. Increase replicas or optimize network.

---

### Scenario 4: High Error Rate (>5%)

**Symptoms:**
- Users report "errors" when using app
- Metrics: `http_requests_total{status=~"5.."}` spiking
- Slack alerts firing

**Diagnosis (5 min):**
```bash
# Check error type
kubectl logs -n thunderbolt -l app=backend | grep -i "error\|exception" | tail -20

# Check database errors
POSTGRES_POD=$(kubectl get pod -n thunderbolt -l app=postgres -o jsonpath='{.items[0].metadata.name}')
kubectl logs "$POSTGRES_POD" -n thunderbolt | grep -i "error" | tail -20

# Check specific endpoint
kubectl logs -n thunderbolt -l app=backend | grep "POST /api/" | head -20
```

**Quick Fix (5 min):**
```bash
# If specific endpoint causing 5xx, disable or route around it
# (temporary circuit breaker)

# Or scale up backend to handle load
kubectl scale deployment backend --replicas=3 -n thunderbolt

# Check recent deployments for new code
kubectl rollout history deployment backend -n thunderbolt
kubectl rollout undo deployment backend -n thunderbolt  # If recent deploy caused it
```

**Expected Recovery:** 2-5 minutes

**RCA:** Code bug, resource exhaustion, or traffic spike. Fix code or scale resources; implement rate limiting.

---

### Scenario 5: Keycloak Realm Missing (Can't Sign In)

**Symptoms:**
- Users redirected to Keycloak
- Keycloak shows "Realm not found"
- Error: `404 Realm not found: thunderbolt`

**Diagnosis (2 min):**
```bash
KEYCLOAK_POD=$(kubectl get pod -n thunderbolt -l app=keycloak -o jsonpath='{.items[0].metadata.name}')
kubectl logs "$KEYCLOAK_POD" -n thunderbolt | grep -i "realm\|import\|error" | tail -20

# Check if realm exists
kubectl exec -it "$KEYCLOAK_POD" -n thunderbolt -- \
  curl -s -u admin:admin http://localhost:8080/admin/realms/ | jq '.[] | select(.realm == "thunderbolt")'
```

**Quick Fix (3 min):**
```bash
# Restart Keycloak pod (triggers realm import)
kubectl delete pod -n thunderbolt -l app=keycloak

# Wait for pod to come up
kubectl wait --for=condition=ready pod -l app=keycloak -n thunderbolt --timeout=2m

# Verify realm created
kubectl exec -it "$KEYCLOAK_POD" -n thunderbolt -- \
  curl -s -u admin:admin http://localhost:8080/admin/realms/ | jq '.[] | .realm'
```

**Expected Recovery:** 1-2 minutes

**RCA:** Keycloak pod didn't successfully import realm config. Verify ConfigMap is mounted correctly.

---

### Scenario 6: Certificate Expired (HTTPS Access Fails)

**Symptoms:**
- Browser shows "certificate expired" warning
- Users cannot access site over HTTPS
- HTTP redirects work but then fails on HTTPS

**Diagnosis (2 min):**
```bash
# Check certificate status
kubectl get certificate -n thunderbolt

# Describe for details
kubectl describe certificate thunderbolt-cert -n thunderbolt

# Check cert-manager logs
kubectl logs -n cert-manager -l app.kubernetes.io/name=cert-manager | tail -50 | grep thunderbolt
```

**Quick Fix (5 min):**
```bash
# Delete certificate to force renewal
kubectl delete certificate thunderbolt-cert -n thunderbolt

# Delete associated secret
kubectl delete secret thunderbolt-tls -n thunderbolt

# Update ingress to retrigger cert creation
kubectl delete ingress thunderbolt-ingress -n thunderbolt
kubectl apply -f deploy/k8s/templates/ingress.yaml -n thunderbolt

# Wait for new certificate
kubectl wait --for=condition=ready certificate/thunderbolt-cert -n thunderbolt --timeout=5m
```

**Expected Recovery:** 2-5 minutes (cert-manager processes renewal)

**RCA:** cert-manager failed to renew certificate automatically. Check cert-manager logs for DNS/API issues.

---

## Post-Incident Review

### Timing

Hold RCA within **24-48 hours** while incident is fresh.

**Attendees:**
- On-call responder
- Engineering lead
- Platform team
- Product lead (if user-facing impact significant)

### Meeting Agenda (90 minutes)

**1. Timeline Reconstruction (20 min)**
```
T+0 - Alert fired
T+5 - On-call responded
T+12 - Root cause identified
T+45 - Fix deployed and validated
T+50 - All metrics nominal

Graph key metrics during incident for visual reference
```

**2. Root Cause Analysis (30 min)**

Ask "why" 5 times to get to true root cause:

```
Q1: Why did error rate spike?
A1: Database connection pool hit max connections

Q2: Why did connection pool max out?
A2: Backend scaled from 1 to 2 replicas, both using persistent connections

Q3: Why did we hit pool max if scaled up?
A3: Pool size was configured for 1 replica, not scaled dynamically

Q4: Why isn't pool size dynamic?
A4: Configuration doesn't account for multi-replica deployments

Q5: Why did we deploy multi-replica setup without testing pool scaling?
A5: Load testing wasn't performed; assumption was pool would auto-scale
```

**True root cause:** Inadequate load testing before rolling out HA setup.

**3. Lessons Learned (20 min)**

| Category | Learning | Action Item |
|----------|----------|-------------|
| Process | We don't have runbooks for SEV-2 database issues | Create runbook (Owner: On-call, Due: 1 week) |
| Testing | No load test for multi-replica setup | Add load test to pre-deploy checklist (Owner: Eng Lead, Due: 2 weeks) |
| Monitoring | Alert threshold too high (triggered at 30 min lag, not 10 min) | Tune alert thresholds based on SLO (Owner: On-call, Due: 3 days) |
| Communication | Took 10 min to determine SEV level; should have been immediate | Create incident severity flowchart (Owner: On-call, Due: 1 week) |

**4. Action Items (20 min)**

```
[ ] Owner: Eng Lead | Due: 2026-07-05 | Increase database connection pool from 20 to 50
[ ] Owner: On-call  | Due: 2026-07-03 | Create runbook for "connection pool exhaustion"
[ ] Owner: On-call  | Due: 2026-07-01 | Tune PowerSync replication lag alert to 10s (not 30s)
[ ] Owner: Eng Lead | Due: 2026-07-12 | Run load test with 3 backend replicas
[ ] Owner: QA       | Due: 2026-07-20 | Add "multi-replica failover" test to CI/CD
```

### RCA Document Template

```markdown
# Incident RCA: API Latency Spike - 2026-06-28

## Summary
Incident occurred at 10:45am PT; resolved at 11:30am PT.
Impact: 500 users experienced degraded service for 12 minutes.
Database connection pool exhaustion during scale-up.

## Timeline
- 10:45 - Alert fires (latency spike detected)
- 10:52 - On-call identifies database connection pool at 95%
- 11:00 - Decision to scale backend replicas down; investigate root cause
- 11:15 - Increased max_connections from 100 to 200
- 11:30 - Metrics nominal; incident resolved
- 11:45 - Validated fix via smoke tests

## Root Cause
Rapid deployment of multi-replica backend without load testing.
Application established persistent connections to Postgres;
when scaled from 1 to 2 replicas, connection count doubled,
exceeding pool size (max_connections=100).

## Contributing Factors
1. No dynamic connection pool scaling based on replica count
2. No load test before deploying HA setup
3. Alert threshold set too high (triggered at 30s lag, not 10s)

## Resolution
- Increased Postgres max_connections to 200
- Added load test to pre-deploy validation

## Preventive Measures
- [ ] Implement connection pooler (PgBouncer) for connection multiplexing
- [ ] Automate connection pool size calculation based on replica count
- [ ] Decrease alert thresholds (p95 latency to 2s, replication lag to 10s)
- [ ] Require load test before any topology change

## Action Items
See section 3 above
```

---

## Escalation Paths

### On-Call Escalation

```
SEV-1 Incident
    ↓
T+5 min: On-call responds
T+15 min: If not resolved → Page Backup Engineer
T+30 min: If not resolved → Page Engineering Lead
T+45 min: If not resolved → VP Engineering + CTO
T+60+ min: War room; consider customer communication
```

### Business Escalation

```
SEV-1 Incident > 30 min
    ↓
Notify VP Engineering
    ↓
If customer-facing: Notify VP Customer Success
    ↓
If data loss: Notify General Counsel + CTO
    ↓
If high profile customer: Notify VP Sales
```

### On-Call Rotation

```
Weekly rotation: Monday 12pm PT → Monday 12pm PT next week

On-call responsibilities:
- Available for pages 24/7
- Respond within 5 min (SMS alert + call)
- Can escalate to backup on-call
- Cannot have two on-calls in same team (spread fatigue)
- Cannot be on-call > 1 week/month

Current on-call: @oncall in Slack
Backup on-call: @oncall-backup
```

---

## Prevention Checklist

**Before Deploying to Production:**
- [ ] Load test completed with expected traffic + 2x headroom
- [ ] Deployment tested in staging with same topology
- [ ] Runbooks reviewed for new services
- [ ] Monitoring and alerts configured
- [ ] Rollback procedure documented and tested
- [ ] Team briefed on changes and incident procedures
- [ ] Maintenance window scheduled (if needed)

**Before Going on Incident On-Call:**
- [ ] Reviewed runbooks for all services
- [ ] Tested paging and communication channels
- [ ] Have laptop and internet access available 24/7
- [ ] Familiar with dashboard links and diagnostic commands
- [ ] Know escalation paths and have contact numbers
- [ ] Briefed on recent changes/deployments

---

## Incident Drills

Schedule quarterly incident response drills to keep team sharp.

**Drill 1: Backend Pod Failure**
- Objective: Practice pod troubleshooting and restart procedures
- Duration: 30 minutes
- Scenario: Manually crash backend pod; team must diagnose and recover
- Success: Service fully recovered in <10 min

**Drill 2: Database Issue**
- Objective: Practice database diagnostics and recovery
- Duration: 45 minutes
- Scenario: Fill Postgres disk; team must diagnose and expand PVC
- Success: Service fully recovered in <15 min

**Drill 3: Full Service Outage**
- Objective: Practice end-to-end incident response
- Duration: 60 minutes
- Scenario: All frontend pods crash; team must:
  - Declare incident
  - Communicate with stakeholders
  - Diagnose root cause
  - Implement fix
  - Validate recovery
- Success: Service fully recovered in <30 min; communication clear

**Drill Schedule:**
- Q1 (Jan-Mar): Drill 1
- Q2 (Apr-Jun): Drill 2
- Q3 (Jul-Sep): Drill 3
- Q4 (Oct-Dec): Full outage drill

**Post-Drill:**
- Same RCA process as real incidents
- Document learnings; update runbooks
- Identify process/training gaps

---

## External Communication

### Customer Notification (SEV-1 > 15 min)

**Status Page Update:**
```
Investigating - API Latency
We are investigating elevated API response times.
Some users may experience degraded service.
Updates posted every 15 minutes.

Started: 10:45am PT | Last update: 10:52am PT
```

**Email to Customers:**
```
Subject: Thunderbolt Service Degradation - We're Investigating

Dear valued customers,

We are currently investigating elevated API response times on Thunderbolt.
Our engineering team is working to resolve the issue.

Status: Investigating
Started: 10:45am PT
Last update: 10:52am PT

We will provide updates every 15 minutes. Thank you for your patience.

Best regards,
Thunderbolt Operations Team
```

**Twitter/Public Announcement:**
```
🚨 We are investigating API latency issues on Thunderbolt.
Our team is working on a fix. Updates: https://status.thunderbolt.io

#Thunderbolt #Incident
```

### Post-Incident Customer Communication

```
Dear Valued Customers,

We want to provide you with a summary of the incident that occurred on
June 28, 2026.

INCIDENT SUMMARY
Time: 10:45am - 11:30am PT
Duration: 45 minutes
Impact: ~500 users experienced elevated API latency
Root cause: Database connection pool exhaustion during scaling

WHAT WE'RE DOING TO PREVENT RECURRENCE
1. Implemented dynamic connection pool sizing
2. Increased load testing requirements before topology changes
3. Improved alert sensitivity for early detection

APOLOGY
We sincerely apologize for this incident. We take reliability very
seriously and will continue to invest in our infrastructure.

For detailed information, see our RCA:
https://blog.thunderbolt.io/incident-rca-20260628

Questions? Contact support@thunderbolt.io

Thank you,
Thunderbolt Operations Team
```

---

See also: `TROUBLESHOOTING_GUIDE.md`, `MONITORING_AND_ALERTING.md`, `OPERATIONS_CHECKLISTS.md`
