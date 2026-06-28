# Troubleshooting Guide: Thunderbolt AIFAM Platform

> **InfluxData Pattern Reference:** This guide follows InfluxData's troubleshooting methodologies, including component-level diagnostics, log aggregation queries, performance profiling, network testing, and systematic issue isolation patterns.

**Status:** Production-ready | **Last Updated:** 2026-06-28

---

## Quick Links
- [Diagnosis Flowchart](#diagnosis-flowchart)
- [Component-Specific Troubleshooting](#component-specific-troubleshooting)
- [Log Query Examples](#log-query-examples)
- [Performance Debugging](#performance-debugging)
- [Network Connectivity Testing](#network-connectivity-testing)
- [Database Recovery](#database-recovery)

---

## Diagnosis Flowchart

```
Is the deployment working?
├─ NO → Pod Status Check (below)
│       ├─ Pods Pending? → Resource Check (§ Resources)
│       ├─ Pods CrashLoopBackOff? → Logs Check (§ Logs)
│       └─ Pods ImagePullBackOff? → Registry Check
│
└─ YES → Service Accessible?
         ├─ NO → Ingress Check (§ Ingress)
         │       ├─ Ingress rules wrong? → Update Ingress
         │       ├─ TLS cert missing? → cert-manager Check
         │       └─ No external IP? → LoadBalancer Check
         │
         └─ YES → Functional Issues?
                  ├─ Slow API → Latency Debug (§ Performance)
                  ├─ High error rate → Error Analysis (§ Logs)
                  ├─ Sync not working → PowerSync Check (§ PowerSync)
                  ├─ Can't sign in → Auth Check (§ Keycloak)
                  └─ Data loss → Database Check (§ Database)
```

---

## Component-Specific Troubleshooting

### Backend API Service

#### Symptoms: Pods show CrashLoopBackOff

**Step 1: Check Container Logs**

```bash
BACKEND_POD=$(kubectl get pod -n thunderbolt -l app=backend -o jsonpath='{.items[0].metadata.name}')

# Current logs
kubectl logs "$BACKEND_POD" -n thunderbolt --tail=100

# Previous crash logs
kubectl logs "$BACKEND_POD" -n thunderbolt --previous

# Follow logs in real-time
kubectl logs -f "$BACKEND_POD" -n thunderbolt
```

**Common Log Patterns:**

| Log Pattern | Cause | Solution |
|-------------|-------|----------|
| `ECONNREFUSED postgres:5432` | Postgres not ready | Wait for postgres-0 pod to be Running |
| `Error: BETTER_AUTH_SECRET not set` | Missing secret | Verify secret exists: `kubectl get secret thunderbolt-secrets -n thunderbolt` |
| `Error: Cannot find module` | Dependency missing | Rebuild Docker image |
| `listen EADDRINUSE :8000` | Port conflict | Scale down to 1 replica; check for lingering processes |
| `Error: timeout awaiting connection` | Database connection timeout | Check Postgres logs, network connectivity |

**Step 2: Describe Pod for Event Details**

```bash
kubectl describe pod "$BACKEND_POD" -n thunderbolt

# Look at "Events" section at the end:
# Type     Reason            Age      Message
# ----     ------            ---      -------
# Warning  BackOff           2m       Back-off restarting failed container
```

**Step 3: Check Restart Count**

```bash
kubectl get pod "$BACKEND_POD" -n thunderbolt -o jsonpath='{.status.containerStatuses[0].restartCount}'
# If > 5: likely persistent issue, not transient network hiccup
```

#### Symptoms: Pods Running but Health Check Failing

```bash
# Check health endpoint
BACKEND_POD=$(kubectl get pod -n thunderbolt -l app=backend -o jsonpath='{.items[0].metadata.name}')
kubectl exec -it "$BACKEND_POD" -n thunderbolt -- curl -v http://localhost:8000/health

# Expected: 200 OK with JSON response
```

If health check fails but pod is running:

```bash
# Check if backend is listening
kubectl exec "$BACKEND_POD" -n thunderbolt -- netstat -tlnp | grep 8000

# If not listening, check startup logs
kubectl logs "$BACKEND_POD" -n thunderbolt | head -50
```

#### Symptoms: High Response Time or Errors

**Collect Metrics:**
```bash
# Get recent error rate
kubectl exec -it "$BACKEND_POD" -n thunderbolt -- curl -s http://localhost:9090/metrics | grep http_requests_total

# Check request queue length
kubectl exec -it "$BACKEND_POD" -n thunderbolt -- curl -s http://localhost:9090/metrics | grep queue_length

# Check database pool usage
kubectl exec -it "$BACKEND_POD" -n thunderbolt -- curl -s http://localhost:9090/metrics | grep db_pool
```

---

### Frontend Service

#### Symptoms: Nginx shows 502/503 errors

**Diagnosis:**

```bash
# Check if frontend pod is running
kubectl get pod -n thunderbolt -l app=frontend

# Check nginx access logs
FRONTEND_POD=$(kubectl get pod -n thunderbolt -l app=frontend -o jsonpath='{.items[0].metadata.name}')
kubectl logs "$FRONTEND_POD" -n thunderbolt | grep "502\|503\|error"

# Check if backend service is accessible from frontend
kubectl exec -it "$FRONTEND_POD" -n thunderbolt -- curl -v http://backend:8000/health
```

**Common Causes:**

| Issue | Diagnosis | Solution |
|-------|-----------|----------|
| Backend unreachable | `curl http://backend:8000/health` fails | Verify backend pod is Running; check Service; check network policy |
| DNS resolution fails | `nslookup backend.thunderbolt.svc` fails | Verify CoreDNS is running: `kubectl get pod -n kube-system -l k8s-app=kube-dns` |
| Nginx config error | nginx startup logs show config error | Verify nginx.conf.template is valid |

#### Symptoms: 404 on Routes

```bash
# Verify static assets are present
FRONTEND_POD=$(kubectl get pod -n thunderbolt -l app=frontend -o jsonpath='{.items[0].metadata.name}')
kubectl exec "$FRONTEND_POD" -n thunderbolt -- ls -la /usr/share/nginx/html/

# Should show index.html, assets/, etc.
```

If assets missing, rebuild frontend Docker image.

---

### PostgreSQL Database

#### Symptoms: Pods Pending

```bash
# Check if PVC is bound
kubectl get pvc -n thunderbolt

# Expected: postgres-pvc in Bound state
# If Pending: check StorageClass and PersistentVolumes

kubectl get storageclass
kubectl get pv

# Issue: No default StorageClass
# Solution: Create or set as default
kubectl patch storageclass <sc-name> -p '{"metadata": {"annotations":{"storageclass.kubernetes.io/is-default-class":"true"}}}'
```

#### Symptoms: Pod Running but Database Won't Accept Connections

```bash
# Check if Postgres is actually running inside container
POSTGRES_POD=$(kubectl get pod -n thunderbolt -l app=postgres -o jsonpath='{.items[0].metadata.name}')
kubectl exec -it "$POSTGRES_POD" -n thunderbolt -- pg_isready -h localhost -U thunderbolt

# Expected: accepting connections
# If: rejecting connections -> database is starting/crashed

# Check Postgres logs
kubectl logs "$POSTGRES_POD" -n thunderbolt | tail -100 | grep -i "error\|fatal"
```

#### Symptoms: Disk Space Running Out

```bash
POSTGRES_POD=$(kubectl get pod -n thunderbolt -l app=postgres -o jsonpath='{.items[0].metadata.name}')

# Check disk usage
kubectl exec "$POSTGRES_POD" -n thunderbolt -- df -h /var/lib/postgresql/data/

# Check database size
kubectl exec -it "$POSTGRES_POD" -n thunderbolt -- psql -U thunderbolt -d thunderbolt -c "SELECT pg_database.datname, pg_size_pretty(pg_database_size(pg_database.datname)) FROM pg_database ORDER BY pg_database_size DESC;"

# If database is large, check for unused tables/indexes
kubectl exec -it "$POSTGRES_POD" -n thunderbolt -- psql -U thunderbolt -d thunderbolt -c "SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size FROM pg_tables WHERE schemaname NOT IN ('pg_catalog', 'information_schema') ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC LIMIT 20;"

# Vacuum to reclaim space
kubectl exec -it "$POSTGRES_POD" -n thunderbolt -- psql -U thunderbolt -d thunderbolt -c "VACUUM FULL;" 

# Or expand PVC
kubectl patch pvc postgres-pvc -n thunderbolt -p '{"spec":{"resources":{"requests":{"storage":"50Gi"}}}}'
```

#### Symptoms: High Connection Count or Connection Pool Exhaustion

```bash
POSTGRES_POD=$(kubectl get pod -n thunderbolt -l app=postgres -o jsonpath='{.items[0].metadata.name}')

# List active connections
kubectl exec -it "$POSTGRES_POD" -n thunderbolt -- psql -U thunderbolt -d thunderbolt -c "SELECT usename, application_name, state, query FROM pg_stat_activity WHERE state != 'idle';"

# Check max_connections setting
kubectl exec -it "$POSTGRES_POD" -n thunderbolt -- psql -U thunderbolt -d thunderbolt -c "SHOW max_connections;"

# If connections are stuck (idle in transaction), terminate them:
kubectl exec -it "$POSTGRES_POD" -n thunderbolt -- psql -U thunderbolt -d thunderbolt -c "SELECT pg_terminate_backend(pg_stat_activity.pid) FROM pg_stat_activity WHERE pg_stat_activity.state = 'idle in transaction' AND pg_stat_activity.query_start < now() - interval '10 minutes';"

# Increase max_connections if needed
# Edit Postgres StatefulSet and restart
kubectl patch statefulset postgres -n thunderbolt -p \
  '{"spec":{"template":{"spec":{"containers":[{"name":"postgres","env":[{"name":"POSTGRES_MAX_CONNECTIONS","value":"200"}]}]}}}}'
```

#### Symptoms: Slow Queries or High CPU

```bash
POSTGRES_POD=$(kubectl get pod -n thunderbolt -l app=postgres -o jsonpath='{.items[0].metadata.name}')

# List currently running queries
kubectl exec -it "$POSTGRES_POD" -n thunderbolt -- psql -U thunderbolt -d thunderbolt -c "SELECT pid, now() - pg_stat_activity.query_start AS duration, query, state FROM pg_stat_activity WHERE state != 'idle' ORDER BY duration DESC;"

# Get slow query stats (if pg_stat_statements enabled)
kubectl exec -it "$POSTGRES_POD" -n thunderbolt -- psql -U thunderbolt -d thunderbolt -c "SELECT query, calls, mean_exec_time, max_exec_time FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 20;"

# Enable slow query logging
kubectl exec -it "$POSTGRES_POD" -n thunderbolt -- psql -U thunderbolt -d postgres -c "ALTER SYSTEM SET log_min_duration_statement = 1000;" # Log queries > 1s
kubectl exec -it "$POSTGRES_POD" -n thunderbolt -- psql -U thunderbolt -d postgres -c "SELECT pg_reload_conf();"

# View slow query logs
kubectl logs "$POSTGRES_POD" -n thunderbolt | grep "duration:"
```

#### Symptoms: Replication Lag (PowerSync)

```bash
POSTGRES_POD=$(kubectl get pod -n thunderbolt -l app=postgres -o jsonpath='{.items[0].metadata.name}')

# Check replication slots
kubectl exec -it "$POSTGRES_POD" -n thunderbolt -- psql -U thunderbolt -d thunderbolt -c "SELECT slot_name, slot_type, active, restart_lsn FROM pg_replication_slots;"

# Check WAL consumption
kubectl exec -it "$POSTGRES_POD" -n thunderbolt -- psql -U thunderbolt -d thunderbolt -c "SELECT pg_wal_lsn_diff(pg_current_wal_lsn(), '0/0') / 1024 / 1024 / 1024 AS wal_size_gb;"

# If replication lag is high:
# 1. Check PowerSync pod health
# 2. Verify network connectivity between Postgres and PowerSync
# 3. Check PowerSync logs for errors
```

---

### PowerSync Sync Service

#### Symptoms: PowerSync Pod CrashLooping

```bash
POWERSYNC_POD=$(kubectl get pod -n thunderbolt -l app=powersync -o jsonpath='{.items[0].metadata.name}')
kubectl logs "$POWERSYNC_POD" -n thunderbolt --previous --tail=100

# Common errors:
# - "Database connection refused" -> Postgres not ready yet
# - "replication slot does not exist" -> Manual recreation needed
# - "invalid JWT" -> PowerSync JWT secret mismatch
```

#### Symptoms: No Clients Connected

```bash
POWERSYNC_POD=$(kubectl get pod -n thunderbolt -l app=powersync -o jsonpath='{.items[0].metadata.name}')

# Check for connection errors in logs
kubectl logs "$POWERSYNC_POD" -n thunderbolt | grep -i "client\|connect\|error"

# Check metrics
kubectl exec -it "$POWERSYNC_POD" -n thunderbolt -- curl -s http://localhost:9090/metrics | grep powersync_connected_clients

# Test JWT generation from backend
BACKEND_POD=$(kubectl get pod -n thunderbolt -l app=backend -o jsonpath='{.items[0].metadata.name}')
kubectl exec -it "$BACKEND_POD" -n thunderbolt -- curl -v http://localhost:8000/api/powersync-token
```

#### Symptoms: Sync Lag > 30 Seconds

```bash
# Check replication status in Postgres
POSTGRES_POD=$(kubectl get pod -n thunderbolt -l app=postgres -o jsonpath='{.items[0].metadata.name}')
kubectl exec -it "$POSTGRES_POD" -n thunderbolt -- psql -U thunderbolt -d thunderbolt -c "SELECT slot_name, restart_lsn, confirmed_flush_lsn FROM pg_replication_slots;"

# Check WAL accumulation
kubectl exec -it "$POSTGRES_POD" -n thunderbolt -- psql -U thunderbolt -d thunderbolt -c "SELECT pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn) / 1024 / 1024 AS lag_mb FROM pg_replication_slots;"

# If lag is high:
# 1. Check PowerSync CPU/memory
kubectl top pod "$POWERSYNC_POD" -n thunderbolt

# 2. Check for errors in PowerSync logs
kubectl logs "$POWERSYNC_POD" -n thunderbolt --tail=200 | grep -i "error\|warning"

# 3. Reduce data volume or increase PowerSync resources
```

---

### Keycloak Authentication

#### Symptoms: Sign-In Redirect Loop

```bash
KEYCLOAK_POD=$(kubectl get pod -n thunderbolt -l app=keycloak -o jsonpath='{.items[0].metadata.name}')

# Check Keycloak logs for realm loading errors
kubectl logs "$KEYCLOAK_POD" -n thunderbolt | grep -i "realm\|import\|error"

# Verify realm config is mounted
kubectl exec "$KEYCLOAK_POD" -n thunderbolt -- ls -la /opt/keycloak/realm-import/

# Check if realm was imported
kubectl exec -it "$KEYCLOAK_POD" -n thunderbolt -- curl -s -u admin:admin http://localhost:8080/admin/realms/ | grep -o '"realm":"[^"]*"'

# If realm missing, manually import
kubectl cp config/keycloak-realm.json "$KEYCLOAK_POD":/tmp/realm.json -n thunderbolt
kubectl exec -it "$KEYCLOAK_POD" -n thunderbolt -- \
  /opt/keycloak/bin/kc.sh import --file /tmp/realm.json
```

#### Symptoms: "Invalid Client" Error on Callback

```bash
# Check if OIDC client is configured correctly
# Backend expects:
# - Client ID: thunderbolt
# - Redirect URIs: https://your-domain/auth/callback
# - Valid redirect URIs must match exactly (including protocol + domain)

KEYCLOAK_POD=$(kubectl get pod -n thunderbolt -l app=keycloak -o jsonpath='{.items[0].metadata.name}')

# Query Keycloak API
kubectl exec -it "$KEYCLOAK_POD" -n thunderbolt -- curl -s -u admin:admin \
  http://localhost:8080/admin/realms/thunderbolt/clients \
  | jq '.[] | select(.clientId == "thunderbolt") | {clientId, redirectUris, webOrigins}'

# If redirectUri doesn't match, update it
# (Easiest: edit keycloak-realm.json and reimport)
```

---

### Ingress and Network

#### Symptoms: Can't Access Application via Hostname

**Step 1: Verify Ingress Resource**

```bash
kubectl get ingress -n thunderbolt -o wide

# Expected:
# NAME                     CLASS   HOSTS                  ADDRESS      PORTS
# thunderbolt-ingress      nginx   thunderbolt.example.com 10.0.1.123   80, 443
```

**Step 2: Verify DNS Resolution**

```bash
# From your local machine
nslookup thunderbolt.example.com

# Expected: Name Server returns the ingress external IP

# Or use public DNS testers:
# https://www.nslookup.io/
```

**Step 3: Verify Ingress Controller is Running**

```bash
kubectl get pod -n ingress-nginx

# Expected: ingress-nginx-controller pod running

# Check controller logs
kubectl logs -n ingress-nginx -l app.kubernetes.io/name=ingress-nginx --tail=100 | grep -i "error\|thunderbolt"
```

**Step 4: Verify SSL/TLS Certificate**

```bash
# Check if cert-manager issued certificate
kubectl get certificate -n thunderbolt

# Expected: status Ready

# Describe certificate for details
kubectl describe certificate -n thunderbolt

# Check cert-manager logs if certificate not ready
kubectl logs -n cert-manager -l app.kubernetes.io/name=cert-manager --tail=100 | grep thunderbolt

# Manual certificate check
curl -v https://thunderbolt.example.com 2>&1 | head -30
```

**Step 5: Test HTTP → HTTPS Redirect**

```bash
curl -v -L http://thunderbolt.example.com 2>&1 | head -30

# Expected: 301 redirect to https, then 200 OK
```

#### Symptoms: Ingress Rules Not Applied

```bash
# Verify ingress resource
kubectl get ingress -n thunderbolt -o yaml

# Check ingress annotations
kubectl get ingress -n thunderbolt -o jsonpath='{.items[0].metadata.annotations}' | jq .

# Ingress controller should have specific annotations:
# - nginx.ingress.kubernetes.io/rewrite-target: /
# - etc.

# Test by updating ingress
kubectl patch ingress thunderbolt-ingress -n thunderbolt \
  --type merge \
  -p '{"spec":{"rules":[{"host":"test.example.com","http":{"paths":[{"path":"/","pathType":"Prefix","backend":{"service":{"name":"frontend","port":{"number":80}}}}]}}]}}'
```

---

## Log Query Examples

### Using kubectl logs

```bash
# View logs from all backend pods
kubectl logs -n thunderbolt -l app=backend --tail=100

# View logs from all pods in parallel (follow mode)
kubectl logs -n thunderbolt -l app=backend -f

# View logs from specific date/time
kubectl logs -n thunderbolt -l app=backend --since=2h
kubectl logs -n thunderbolt -l app=backend --since-time=2026-06-28T10:00:00Z
```

### Using Loki (if configured)

```bash
# Query backend errors
curl -s 'http://loki:3100/loki/api/v1/query' \
  --data-urlencode 'query={namespace="thunderbolt", app="backend"} | json | level="error"' | jq .

# Query by label
curl -s 'http://loki:3100/loki/api/v1/labels' | jq .

# Range query (time range)
curl -s 'http://loki:3100/loki/api/v1/query_range' \
  --data-urlencode 'query={app="backend"}' \
  --data-urlencode 'start=1234567890' \
  --data-urlencode 'end=1234567900' | jq .
```

### Log Patterns to Search For

**Backend Errors:**
```bash
kubectl logs -n thunderbolt -l app=backend | grep -i "error\|exception\|failed\|warn"
```

**Database Issues:**
```bash
kubectl logs -n thunderbolt -l app=postgres | grep -i "error\|fatal\|slow\|connection"
```

**Auth Issues:**
```bash
kubectl logs -n thunderbolt -l app=keycloak | grep -i "error\|auth\|realm\|token"
```

**Sync Issues:**
```bash
kubectl logs -n thunderbolt -l app=powersync | grep -i "error\|replication\|lag\|client"
```

---

## Performance Debugging

### CPU Profiling

```bash
# Get current CPU usage
kubectl top pod -n thunderbolt

# If high CPU detected:
BACKEND_POD=$(kubectl get pod -n thunderbolt -l app=backend -o jsonpath='{.items[0].metadata.name}')

# Try to get heap profile (if Prometheus client enabled)
kubectl exec -it "$BACKEND_POD" -n thunderbolt -- curl -s http://localhost:9090/debug/pprof/heap > /tmp/heap.prof

# Or check Prometheus metrics
kubectl exec -it "$BACKEND_POD" -n thunderbolt -- curl -s http://localhost:9090/metrics | grep "process_cpu"
```

### Memory Profiling

```bash
# Check memory usage
kubectl top pod -n thunderbolt

# If OOM detected, check if pod has memory limit
kubectl describe pod <pod-name> -n thunderbolt | grep -A 5 "Limits\|Requests"

# If pod is hitting limit, increase it
kubectl set resources deployment backend -n thunderbolt \
  --limits=memory=2Gi \
  --requests=memory=1Gi
```

### Database Query Performance

```bash
POSTGRES_POD=$(kubectl get pod -n thunderbolt -l app=postgres -o jsonpath='{.items[0].metadata.name}')

# Analyze slow query (EXPLAIN ANALYZE)
kubectl exec -it "$POSTGRES_POD" -n thunderbolt -- psql -U thunderbolt -d thunderbolt -c \
  "EXPLAIN ANALYZE SELECT * FROM your_table WHERE condition;"

# Check missing indexes
kubectl exec -it "$POSTGRES_POD" -n thunderbolt -- psql -U thunderbolt -d thunderbolt -c \
  "SELECT schemaname, tablename, attname, n_distinct FROM pg_stats WHERE n_distinct < 0 AND n_distinct > -0.01;"

# Get index usage statistics
kubectl exec -it "$POSTGRES_POD" -n thunderbolt -- psql -U thunderbolt -d thunderbolt -c \
  "SELECT indexrelname, idx_scan, idx_tup_read, idx_tup_fetch FROM pg_stat_user_indexes ORDER BY idx_scan DESC;"
```

### Network Latency

```bash
# Test latency from frontend to backend
FRONTEND_POD=$(kubectl get pod -n thunderbolt -l app=frontend -o jsonpath='{.items[0].metadata.name}')
kubectl exec -it "$FRONTEND_POD" -n thunderbolt -- ping backend.thunderbolt.svc.cluster.local -c 5

# Test latency from backend to postgres
BACKEND_POD=$(kubectl get pod -n thunderbolt -l app=backend -o jsonpath='{.items[0].metadata.name}')
kubectl exec -it "$BACKEND_POD" -n thunderbolt -- ping postgres.thunderbolt.svc.cluster.local -c 5

# Measure connection time
kubectl exec -it "$BACKEND_POD" -n thunderbolt -- time curl -s http://postgres:5432 &>/dev/null || true
```

---

## Network Connectivity Testing

### DNS Resolution

```bash
# Test DNS from pod
BACKEND_POD=$(kubectl get pod -n thunderbolt -l app=backend -o jsonpath='{.items[0].metadata.name}')

kubectl exec -it "$BACKEND_POD" -n thunderbolt -- nslookup postgres.thunderbolt.svc.cluster.local

# Expected: Address: 10.x.x.x

# If fails, check CoreDNS
kubectl get pod -n kube-system -l k8s-app=kube-dns
```

### Service Connectivity

```bash
# Test service is accessible
BACKEND_POD=$(kubectl get pod -n thunderbolt -l app=backend -o jsonpath='{.items[0].metadata.name}')

# Test TCP connection
kubectl exec -it "$BACKEND_POD" -n thunderbolt -- nc -zv backend.thunderbolt.svc.cluster.local 8000

# If no nc, use curl
kubectl exec -it "$BACKEND_POD" -n thunderbolt -- curl -v telnet://backend.thunderbolt.svc.cluster.local:8000 2>&1 | head -20

# Test from different namespace
kubectl run -it --image=alpine --restart=Never nettest -n default -- sh
# Inside pod:
# ping backend.thunderbolt.svc.cluster.local
# exit
# kubectl delete pod nettest -n default
```

### Network Policy Validation

```bash
# Check if network policies restrict traffic
kubectl get networkpolicies -n thunderbolt

# If policies exist, verify they allow inter-pod traffic
kubectl describe networkpolicy -n thunderbolt

# Temporarily disable network policies for testing
kubectl delete networkpolicies --all -n thunderbolt
# Then test connectivity
# Then reapply policies
```

---

## Database Recovery

### Backup and Restore

```bash
POSTGRES_POD=$(kubectl get pod -n thunderbolt -l app=postgres -o jsonpath='{.items[0].metadata.name}')

# Backup
kubectl exec "$POSTGRES_POD" -n thunderbolt -- \
  pg_dump -U thunderbolt -d thunderbolt -F c > /tmp/thunderbolt.dump

# Restore (stop backend first!)
kubectl scale deployment backend --replicas=0 -n thunderbolt
kubectl scale deployment powersync --replicas=0 -n thunderbolt

kubectl exec -i "$POSTGRES_POD" -n thunderbolt -- \
  pg_restore -U thunderbolt -d thunderbolt --clean < /tmp/thunderbolt.dump

# Restart services
kubectl scale deployment backend --replicas=2 -n thunderbolt
kubectl scale deployment powersync --replicas=1 -n thunderbolt
```

### Verify Database Integrity

```bash
POSTGRES_POD=$(kubectl get pod -n thunderbolt -l app=postgres -o jsonpath='{.items[0].metadata.name}')

# Check for corrupted tables
kubectl exec -it "$POSTGRES_POD" -n thunderbolt -- psql -U thunderbolt -d thunderbolt -c \
  "SELECT datname, pg_database.datallowconn FROM pg_database WHERE datname = 'thunderbolt';"

# Run VACUUM to reclaim space and check for corruption
kubectl exec -it "$POSTGRES_POD" -n thunderbolt -- psql -U thunderbolt -d thunderbolt -c \
  "VACUUM ANALYZE;"

# Check replication slot health
kubectl exec -it "$POSTGRES_POD" -n thunderbolt -- psql -U thunderbolt -d thunderbolt -c \
  "SELECT slot_name, active FROM pg_replication_slots;"
```

### Reset Replication Slot (if corrupted)

```bash
POSTGRES_POD=$(kubectl get pod -n thunderbolt -l app=postgres -o jsonpath='{.items[0].metadata.name}')

# Drop and recreate slot (WARNING: may cause sync lag on PowerSync)
kubectl exec -it "$POSTGRES_POD" -n thunderbolt -- psql -U thunderbolt -d thunderbolt -c \
  "SELECT pg_drop_replication_slot('powersync');" 2>/dev/null || true

# Restart PowerSync pod to recreate slot
kubectl delete pod -n thunderbolt -l app=powersync

# Verify new slot created
kubectl exec -it "$POSTGRES_POD" -n thunderbolt -- psql -U thunderbolt -d thunderbolt -c \
  "SELECT slot_name, restart_lsn FROM pg_replication_slots;"
```

---

## Common Issues and Solutions

### Issue: "Backend and database version mismatch"

**Symptoms:** Backend pod shows "migration pending" or database schema errors.

**Solution:**
```bash
# Scale backend to 0 (run migrations alone)
kubectl scale deployment backend --replicas=0 -n thunderbolt

# Run migrations manually
BACKEND_POD=$(kubectl get pod -n thunderbolt -l app=backend -o jsonpath='{.items[0].metadata.name}')
kubectl exec -it "$BACKEND_POD" -n thunderbolt -- bun run src/db/migrate.ts

# Scale backend back up
kubectl scale deployment backend --replicas=2 -n thunderbolt
```

---

### Issue: "Port 8000 is already in use"

**Symptoms:** Backend pod crashes with "EADDRINUSE :8000".

**Solution:**
```bash
# Scale backend to 1 replica (remove extra pods)
kubectl scale deployment backend --replicas=1 -n thunderbolt

# Delete and restart the pod
kubectl delete pod -n thunderbolt -l app=backend
```

---

### Issue: "Out of memory" on Postgres

**Symptoms:** Postgres pod killed (OOMKilled), restart loop.

**Solution:**
```bash
# Increase memory limit
kubectl patch statefulset postgres -n thunderbolt \
  --type merge \
  -p '{"spec":{"template":{"spec":{"containers":[{"name":"postgres","resources":{"limits":{"memory":"2Gi"}}}]}}}}'

# Or reduce shared_buffers in Postgres config
# (edit values.yaml and redeploy)
```

---

### Issue: "Certificate not updating"

**Symptoms:** Browser shows expired certificate warning.

**Solution:**
```bash
# Check cert-manager
kubectl get certificate -n thunderbolt

# If stuck on pending, check cert-manager logs
kubectl logs -n cert-manager -l app.kubernetes.io/name=cert-manager | tail -50

# Force cert renewal
kubectl delete secret thunderbolt-tls -n thunderbolt
kubectl delete certificate thunderbolt-cert -n thunderbolt

# Recreate via Ingress update
kubectl apply -f deploy/k8s/templates/ingress.yaml -n thunderbolt
```

---

## Getting More Help

If you're stuck:

1. **Collect logs from all components:**
   ```bash
   mkdir -p /tmp/thunderbolt-debug
   kubectl logs -n thunderbolt -l app=backend > /tmp/thunderbolt-debug/backend.log
   kubectl logs -n thunderbolt -l app=postgres > /tmp/thunderbolt-debug/postgres.log
   kubectl logs -n thunderbolt -l app=powersync > /tmp/thunderbolt-debug/powersync.log
   kubectl logs -n thunderbolt -l app=keycloak > /tmp/thunderbolt-debug/keycloak.log
   kubectl describe pod -n thunderbolt > /tmp/thunderbolt-debug/pods.txt
   kubectl describe svc -n thunderbolt > /tmp/thunderbolt-debug/services.txt
   tar -czf /tmp/thunderbolt-debug.tar.gz /tmp/thunderbolt-debug/
   ```

2. **Check system logs:**
   ```bash
   kubectl get events -n thunderbolt
   kubectl get events -n kube-system | grep thunderbolt
   ```

3. **Check cloud provider logs** (if using AWS/GCP/Azure)
   - AWS CloudWatch
   - Google Cloud Logging
   - Azure Monitor

4. **File GitHub issue** with:
   - Thunderbolt version
   - Kubernetes version
   - Deployment environment
   - Reproduction steps
   - Debug logs (see above)

---

See also: `MONITORING_AND_ALERTING.md`, `DEPLOYMENT_RUNBOOK.md`
