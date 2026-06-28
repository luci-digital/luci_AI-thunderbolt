# Monitoring and Alerting Guide: Thunderbolt AIFAM Platform

> **InfluxData Pattern Reference:** This guide follows monitoring architectures from InfluxData's Telegraf and InfluxDB Cloud documentation, including metric collection, dashboard patterns, alert thresholds, and observability best practices. All examples use Prometheus scrape configs and Grafana dashboards (InfluxData-standard stack).

**Status:** Production-ready | **Last Updated:** 2026-06-28

---

## Quick Links
- [Prometheus Setup](#prometheus-setup)
- [Key Metrics](#key-metrics)
- [Grafana Dashboards](#grafana-dashboards)
- [Alert Rules](#alert-rules)
- [Loki Log Aggregation](#loki-log-aggregation)
- [Troubleshooting](#troubleshooting)

---

## Architecture Overview

Thunderbolt monitoring stack:

```
┌─────────────────────────────────────────────────────────────────┐
│                        Monitoring Plane                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Prometheus (metrics) ◄─── scrape Kubernetes metrics-server    │
│         │                    ├─ kube-state-metrics             │
│         │                    ├─ cadvisor (container metrics)    │
│         │                    └─ Application metrics             │
│         │                                                       │
│         ├──► Grafana (visualization & dashboards)              │
│         │       ├─ System health                               │
│         │       ├─ Application performance                     │
│         │       └─ PowerSync replication lag                   │
│         │                                                       │
│         └──► AlertManager (alert routing & deduplication)      │
│                 ├─ PagerDuty                                    │
│                 ├─ Slack                                        │
│                 └─ Email                                        │
│                                                                 │
│  Loki (logs) ◄─────── Promtail (log shipper on each node)     │
│         │                                                       │
│         └──► Grafana (logs dashboard & correlation)            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Prometheus Setup

### 1. Install Prometheus with kube-prometheus-stack

The easiest production approach is using the `kube-prometheus-stack` Helm chart (includes Prometheus, Grafana, AlertManager, and node-exporter):

```bash
# Add Prometheus community Helm repo
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# Install kube-prometheus-stack
helm install kube-prometheus-stack prometheus-community/kube-prometheus-stack \
  --namespace monitoring --create-namespace \
  --values - <<'EOF'
prometheus:
  prometheusSpec:
    retention: 15d
    storageSpec:
      volumeClaimTemplate:
        spec:
          storageClassName: standard
          accessModes: ["ReadWriteOnce"]
          resources:
            requests:
              storage: 50Gi
    externalLabels:
      cluster: thunderbolt-production

grafana:
  enabled: true
  adminPassword: "changeme"  # Change this!
  
alertmanager:
  enabled: true
EOF

# Wait for pods
kubectl rollout status deployment -n monitoring --timeout=5m
```

**Verify installation:**
```bash
kubectl get pod -n monitoring
# Expected: prometheus-kube-prometheus-prometheus-0, grafana-xyz, alertmanager-kube-prometheus-alertmanager-0
```

### 2. Add Thunderbolt Metrics to Prometheus

Create a `ServiceMonitor` to tell Prometheus to scrape Thunderbolt services:

```bash
kubectl apply -f - <<'EOF'
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: thunderbolt-backend
  namespace: thunderbolt
spec:
  selector:
    matchLabels:
      app: backend
  endpoints:
    - port: metrics
      interval: 30s
      path: /metrics
EOF

kubectl apply -f - <<'EOF'
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: thunderbolt-powersync
  namespace: thunderbolt
spec:
  selector:
    matchLabels:
      app: powersync
  endpoints:
    - port: metrics
      interval: 30s
      path: /metrics
EOF

kubectl apply -f - <<'EOF'
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: thunderbolt-postgres
  namespace: thunderbolt
spec:
  selector:
    matchLabels:
      app: postgres
  endpoints:
    - port: "9187"  # postgres-exporter port
      interval: 30s
      path: /metrics
EOF
```

**Verify ServiceMonitor is discovered:**
```bash
# In Prometheus UI (port-forward below), check:
# Status > Targets
# Look for endpoints containing "thunderbolt-backend", "thunderbolt-powersync", "thunderbolt-postgres"
```

### 3. Configure Postgres Exporter

To expose Postgres metrics to Prometheus, use `postgres_exporter`:

```bash
# Add postgres-exporter to your Helm values (values.yaml)
# In the postgres section:

cat >> /tmp/postgres-values.yaml <<'EOF'
postgres:
  exporter:
    enabled: true
    image: prometheuscommunity/postgres-exporter:latest
    port: 9187
    resources:
      requests:
        cpu: 50m
        memory: 64Mi
EOF

# Update Postgres deployment to include exporter sidecar
# (Configure in Helm chart postgres.yaml template)
```

---

## Key Metrics

### Backend API Metrics

| Metric | Description | Threshold (Alert if...) | Query |
|--------|-------------|------------------------|-------|
| `http_requests_total` | Total HTTP requests by method/status | N/A (informational) | `rate(http_requests_total[5m])` |
| `http_request_duration_seconds_bucket` | Request latency in seconds | p95 > 2s, p99 > 5s | `histogram_quantile(0.95, http_request_duration_seconds_bucket)` |
| `db_pool_connections_in_use` | Active database connections | > 80 | `db_pool_connections_in_use` |
| `api_errors_total` | Errors by endpoint | > 1 per second | `rate(api_errors_total[5m])` |
| `auth_failures_total` | OIDC auth failures | > 5 per minute | `rate(auth_failures_total[5m])` |
| `request_queue_length` | Requests waiting for processing | > 100 | `http_request_queue_length` |

### PowerSync Metrics

| Metric | Description | Threshold (Alert if...) | Query |
|--------|-------------|------------------------|-------|
| `powersync_replication_lag_seconds` | Logical replication lag | > 30s | `powersync_replication_lag_seconds` |
| `powersync_connected_clients` | Active sync connections | N/A | `powersync_connected_clients` |
| `powersync_sync_errors_total` | Sync failures | > 0 | `rate(powersync_sync_errors_total[5m])` |
| `powersync_pending_writes` | Queued writes to clients | > 10000 | `powersync_pending_writes` |
| `powersync_message_queue_depth` | Messages in replication queue | > 50000 | `powersync_message_queue_depth` |

### Postgres Database Metrics

| Metric | Description | Threshold (Alert if...) | Query |
|--------|-------------|------------------------|-------|
| `pg_stat_activity_count` | Active connections | > 90 (check max_connections) | `count(pg_stat_activity_count)` |
| `pg_database_size_bytes` | Database disk usage | > 80% of allocated | `pg_database_size_bytes / pg_setting_max_wal_size_bytes` |
| `pg_stat_user_tables_seq_scan_count` | Full table scans | > threshold (investigate slow queries) | `rate(pg_stat_user_tables_seq_scan_count[5m])` |
| `pg_stat_user_tables_live_tup_count` | Live rows per table | N/A (informational) | `pg_stat_user_tables_live_tup_count` |
| `pg_slow_queries` | Query execution time | > 5s | `pg_stat_statements_mean_exec_time` |
| `pg_replication_lag_seconds` | Logical replication lag to PowerSync | > 10s | `pg_replication_lag_seconds` |
| `pg_wal_position_bytes` | WAL write-ahead log position | N/A (informational) | `pg_wal_position_bytes` |

### Kubernetes Infrastructure Metrics

| Metric | Description | Threshold (Alert if...) | Query |
|--------|-------------|------------------------|-------|
| `node_memory_MemAvailable_bytes` | Available memory per node | < 1 Gi | `node_memory_MemAvailable_bytes / 1024^3 < 1` |
| `node_cpu_usage` | CPU usage per node | > 80% | `(1 - avg(rate(node_cpu_seconds_total{mode="idle"}[5m])))` |
| `container_memory_usage_bytes` | Pod memory usage | > pod limit | `container_memory_usage_bytes` |
| `kubelet_volume_stats_used_bytes` | PVC usage | > 80% | `kubelet_volume_stats_used_bytes / kubelet_volume_stats_capacity_bytes` |
| `kube_pod_container_status_restarts_total` | Pod restarts | > 3 in 1h | `rate(kube_pod_container_status_restarts_total[1h])` |
| `kube_deployment_status_replicas_ready` | Ready replicas | < desired | `kube_deployment_status_replicas_ready < kube_deployment_spec_replicas` |

### Application-Level SLI Metrics

| SLI | Type | Definition | Target |
|-----|------|-----------|--------|
| **Availability** | Success Rate | (successful requests) / (total requests) | 99.9% (4 nines) |
| **Latency** | Response Time | p95 API response time | < 2 seconds |
| **Error Budget** | Error Rate | errors / total requests | < 0.1% |
| **Throughput** | Load | Requests per second | baseline + 50% headroom |

---

## Grafana Dashboards

### 1. Access Grafana UI

```bash
# Port-forward to Grafana
kubectl port-forward -n monitoring svc/kube-prometheus-stack-grafana 3000:80 &

# Open browser to http://localhost:3000
# Default credentials: admin / changeme (from helm install)
```

### 2. Create System Health Dashboard

Create a new dashboard at `http://localhost:3000/d/new`:

**Panel 1: Cluster Node Status**
```promql
# Shows number of Ready nodes
count(kube_node_status_condition{condition="Ready", status="true"})
```

**Panel 2: Pod Status Overview**
```promql
# Count by pod phase across thunderbolt namespace
count by (phase) (kube_pod_status_phase{namespace="thunderbolt"})
```

**Panel 3: Memory Usage (Stacked Area)**
```promql
sum by (pod) (container_memory_usage_bytes{namespace="thunderbolt"}) / 1024^3
```

**Panel 4: CPU Usage (Stacked Area)**
```promql
sum by (pod) (rate(container_cpu_usage_seconds_total{namespace="thunderbolt"}[5m]))
```

### 3. Create API Performance Dashboard

**Panel 1: Request Latency (p50, p95, p99)**
```promql
# p50 latency
histogram_quantile(0.50, rate(http_request_duration_seconds_bucket{namespace="thunderbolt"}[5m]))

# p95 latency
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket{namespace="thunderbolt"}[5m]))

# p99 latency
histogram_quantile(0.99, rate(http_request_duration_seconds_bucket{namespace="thunderbolt"}[5m]))
```

**Panel 2: Request Rate by Status Code**
```promql
sum by (status) (rate(http_requests_total{namespace="thunderbolt"}[1m]))
```

**Panel 3: Error Rate (%)** 
```promql
(sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))) * 100
```

**Panel 4: Database Connection Pool Usage**
```promql
db_pool_connections_in_use{namespace="thunderbolt"} / db_pool_connections_max{namespace="thunderbolt"} * 100
```

### 4. Create PowerSync Dashboard

**Panel 1: Replication Lag**
```promql
powersync_replication_lag_seconds{namespace="thunderbolt"}
```

**Panel 2: Connected Clients**
```promql
powersync_connected_clients{namespace="thunderbolt"}
```

**Panel 3: Sync Throughput (rows/sec)**
```promql
rate(powersync_rows_synced_total{namespace="thunderbolt"}[5m])
```

**Panel 4: Sync Errors Over Time**
```promql
increase(powersync_sync_errors_total{namespace="thunderbolt"}[5m])
```

### 5. Create Postgres Dashboard

**Panel 1: Active Connections**
```promql
count(pg_stat_activity_count{namespace="thunderbolt"})
```

**Panel 2: Database Size**
```promql
pg_database_size_bytes{namespace="thunderbolt", datname="thunderbolt"} / 1024^3
```

**Panel 3: Slow Queries (> 1 second)**
```promql
count(pg_stat_statements_mean_exec_time{namespace="thunderbolt"} > 1000)
```

**Panel 4: Cache Hit Ratio (%)**
```promql
(sum(pg_stat_database_blks_hit{namespace="thunderbolt"}) / 
 (sum(pg_stat_database_blks_hit{namespace="thunderbolt"}) + sum(pg_stat_database_blks_read{namespace="thunderbolt"}))) * 100
```

**Panel 5: Transaction Throughput**
```promql
rate(pg_stat_database_xact_commit{namespace="thunderbolt", datname="thunderbolt"}[1m])
```

### 6. Save Dashboards as JSON

Export dashboards for version control:

```bash
# Get dashboard JSON from Grafana API
curl -H "Authorization: Bearer $GRAFANA_TOKEN" \
  http://localhost:3000/api/dashboards/db/api-performance > /tmp/api-performance-dashboard.json

# Store in repo
mkdir -p deploy/monitoring/dashboards
cp /tmp/api-performance-dashboard.json deploy/monitoring/dashboards/

# Commit to version control
git add deploy/monitoring/dashboards/
git commit -m "Add Grafana dashboards"
```

---

## Alert Rules

### 1. Define PrometheusRule Resources

Create alert rules in Kubernetes:

```bash
kubectl apply -f - <<'EOF'
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: thunderbolt-alerts
  namespace: thunderbolt
spec:
  groups:
    - name: thunderbolt
      interval: 30s
      rules:
        # Backend API alerts
        - alert: HighAPILatency
          expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2
          for: 5m
          labels:
            severity: warning
            component: backend
          annotations:
            summary: "API latency p95 > 2s"
            description: "Backend API is slow. Current p95: {{ $value }}s"

        - alert: HighErrorRate
          expr: (sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))) * 100 > 1
          for: 5m
          labels:
            severity: critical
            component: backend
          annotations:
            summary: "Error rate > 1%"
            description: "API error rate is {{ $value }}%"

        - alert: AuthenticationFailures
          expr: rate(auth_failures_total[5m]) > 0.083  # 5 per minute
          for: 5m
          labels:
            severity: warning
            component: backend
          annotations:
            summary: "High authentication failure rate"
            description: "Auth failures: {{ $value }}/s"

        # Database connection pool
        - alert: DatabaseConnectionPoolExhaustion
          expr: db_pool_connections_in_use / db_pool_connections_max > 0.9
          for: 5m
          labels:
            severity: critical
            component: backend
          annotations:
            summary: "Database connection pool > 90%"
            description: "Pool utilization: {{ $value | humanizePercentage }}"

        # PowerSync replication
        - alert: PowerSyncReplicationLagHigh
          expr: powersync_replication_lag_seconds > 30
          for: 5m
          labels:
            severity: warning
            component: powersync
          annotations:
            summary: "PowerSync replication lag > 30s"
            description: "Lag: {{ $value }}s"

        - alert: PowerSyncNoConnectedClients
          expr: powersync_connected_clients == 0
          for: 10m
          labels:
            severity: critical
            component: powersync
          annotations:
            summary: "No connected PowerSync clients"
            description: "No devices syncing; check PowerSync service health"

        - alert: PowerSyncSyncErrors
          expr: increase(powersync_sync_errors_total[5m]) > 0
          for: 5m
          labels:
            severity: critical
            component: powersync
          annotations:
            summary: "PowerSync sync errors occurring"
            description: "Errors: {{ $value }} in last 5m"

        # Postgres database
        - alert: PostgresHighConnections
          expr: count(pg_stat_activity_count{namespace="thunderbolt"}) / 100 > 0.9  # assuming max_connections=100
          for: 5m
          labels:
            severity: warning
            component: postgres
          annotations:
            summary: "Postgres connection count > 90"
            description: "Active connections: {{ $value }}"

        - alert: PostgresDatabaseSizeHigh
          expr: pg_database_size_bytes{datname="thunderbolt"} / (20 * 1024^3) > 0.8  # 80% of 20Gi
          for: 5m
          labels:
            severity: warning
            component: postgres
          annotations:
            summary: "Postgres database > 80% of allocated size"
            description: "Database size: {{ $value | humanize }}B"

        - alert: PostgresSlowQueries
          expr: count(pg_stat_statements_mean_exec_time > 5000) > 10
          for: 10m
          labels:
            severity: warning
            component: postgres
          annotations:
            summary: "High number of slow queries (> 5s)"
            description: "Slow queries: {{ $value }}"

        - alert: PostgresCacheMissRate
          expr: (sum(pg_stat_database_blks_read) / (sum(pg_stat_database_blks_read) + sum(pg_stat_database_blks_hit))) > 0.2
          for: 10m
          labels:
            severity: info
            component: postgres
          annotations:
            summary: "Postgres cache miss rate > 20%"
            description: "Miss rate: {{ $value | humanizePercentage }}"

        # Kubernetes infrastructure
        - alert: PodCrashLooping
          expr: rate(kube_pod_container_status_restarts_total{namespace="thunderbolt"}[15m]) > 0
          for: 5m
          labels:
            severity: critical
            component: kubernetes
          annotations:
            summary: "Pod {{ $labels.pod }} is crash looping"
            description: "Restart rate: {{ $value }} restarts/min"

        - alert: PodNotReady
          expr: kube_deployment_status_replicas_ready{namespace="thunderbolt"} < kube_deployment_spec_replicas{namespace="thunderbolt"}
          for: 5m
          labels:
            severity: critical
            component: kubernetes
          annotations:
            summary: "Deployment {{ $labels.deployment }} missing ready replicas"
            description: "Ready: {{ $value }}, Desired: {{ $value }}"

        - alert: NodeMemoryPressure
          expr: kube_node_status_condition{condition="MemoryPressure", status="true"} == 1
          for: 5m
          labels:
            severity: warning
            component: kubernetes
          annotations:
            summary: "Node {{ $labels.node }} has memory pressure"
            description: "Node may evict pods if memory not freed"

        - alert: PersistentVolumeAlmostFull
          expr: kubelet_volume_stats_used_bytes / kubelet_volume_stats_capacity_bytes > 0.9
          for: 5m
          labels:
            severity: critical
            component: kubernetes
          annotations:
            summary: "PVC {{ $labels.persistentvolumeclaim }} > 90% full"
            description: "Usage: {{ $value | humanizePercentage }}"
EOF

# Verify rules loaded
kubectl get prometheusrule -n thunderbolt
```

### 2. Alert Severity Levels

| Severity | SLA | Action | Examples |
|----------|-----|--------|----------|
| **Critical** | 5–15 min response | Page on-call engineer immediately | Pod crash loop, database unavailable, high error rate |
| **Warning** | 30 min – 1 hour | Create ticket, notify team Slack channel | High latency, connection pool near exhaustion, slow queries |
| **Info** | No SLA | Log for trend analysis | Cache miss rate, routine maintenance, informational |

---

## AlertManager Configuration

### 1. Set Up Slack Integration

```bash
# Create Slack webhook (Slack Admin > Custom Integrations > Incoming Webhooks)
# Copy webhook URL

# Update AlertManager config
kubectl apply -f - <<'EOF'
apiVersion: monitoring.coreos.com/v1alpha1
kind: AlertmanagerConfig
metadata:
  name: thunderbolt-alerting
  namespace: monitoring
spec:
  receivers:
    - name: slack-critical
      slackConfigs:
        - apiUrl: "https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
          channel: "#thunderbolt-alerts-critical"
          title: "{{ .GroupLabels.alertname }}"
          text: "{{ range .Alerts.Firing }}{{ .Annotations.description }}\n{{ end }}"
          sendResolved: true

    - name: slack-warning
      slackConfigs:
        - apiUrl: "https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
          channel: "#thunderbolt-alerts-warning"
          title: "{{ .GroupLabels.alertname }}"
          text: "{{ range .Alerts.Firing }}{{ .Annotations.description }}\n{{ end }}"
          sendResolved: true

  route:
    receiver: slack-warning
    groupBy: ["alertname", "component"]
    groupWait: 10s
    groupInterval: 10s
    repeatInterval: 12h
    routes:
      - matchers:
          - name: severity
            value: critical
        receiver: slack-critical
        groupWait: 5s
        repeatInterval: 30m
EOF
```

### 2. Set Up PagerDuty Integration

```bash
# Get PagerDuty integration key from your service

kubectl apply -f - <<'EOF'
apiVersion: monitoring.coreos.com/v1alpha1
kind: AlertmanagerConfig
metadata:
  name: thunderbolt-pagerduty
  namespace: monitoring
spec:
  receivers:
    - name: pagerduty-critical
      pagerdutyConfigs:
        - serviceKey: "YOUR_PAGERDUTY_SERVICE_KEY"
          description: "{{ .GroupLabels.alertname }}"
          details:
            firing: "{{ range .Alerts.Firing }}{{ .Annotations.description }}\n{{ end }}"
EOF
```

### 3. Set Up Email Notifications

```bash
kubectl apply -f - <<'EOF'
apiVersion: monitoring.coreos.com/v1alpha1
kind: AlertmanagerConfig
metadata:
  name: thunderbolt-email
  namespace: monitoring
spec:
  global:
    resolve_timeout: 5m
    smtp_smarthost: "smtp.gmail.com:587"
    smtp_from: "alerts@thunderbolt.example.com"
    smtp_auth_username: "alerts@thunderbolt.example.com"
    smtp_auth_password: "YOUR_APP_PASSWORD"  # Use app-specific password, not real password

  receivers:
    - name: email-critical
      emailConfigs:
        - to: "oncall@thunderbolt.example.com"
          headers:
            Subject: "[CRITICAL] {{ .GroupLabels.alertname }}"
          html: |
            <h2>{{ .GroupLabels.alertname }}</h2>
            <p>{{ range .Alerts.Firing }}{{ .Annotations.description }}<br/>{{ end }}</p>

  route:
    receiver: email-critical
    matchers:
      - name: severity
        value: critical
EOF
```

---

## Loki Log Aggregation

### 1. Install Loki Stack

```bash
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update

helm install loki grafana/loki-stack \
  --namespace monitoring \
  --set loki.persistence.enabled=true \
  --set loki.persistence.size=10Gi \
  --set promtail.enabled=true \
  --set grafana.enabled=false  # Already installed via kube-prometheus-stack
```

### 2. Configure Log Scraping for Thunderbolt

Update Promtail to include Thunderbolt pod labels:

```bash
kubectl apply -f - <<'EOF'
apiVersion: v1
kind: ConfigMap
metadata:
  name: promtail-config
  namespace: monitoring
data:
  promtail.yaml: |
    clients:
      - url: http://loki:3100/loki/api/v1/push
    positions:
      filename: /tmp/positions.yaml
    scrape_configs:
      - job_name: kubernetes-pods
        kubernetes_sd_configs:
          - role: pod
        relabel_configs:
          - source_labels: [__meta_kubernetes_pod_label_app]
            target_label: app
          - source_labels: [__meta_kubernetes_pod_namespace]
            target_label: namespace
          - source_labels: [__meta_kubernetes_pod_name]
            target_label: pod
          - source_labels: [__meta_kubernetes_container_name]
            target_label: container
        pipeline_stages:
          - json:
              expressions:
                level: level
                message: msg
                timestamp: ts
EOF
```

### 3. Create Log Queries in Grafana

Access Loki via Grafana's Explore tab:

**Query 1: Backend Error Logs**
```logql
{namespace="thunderbolt", app="backend"} | json | level="error"
```

**Query 2: PowerSync Replication Logs**
```logql
{namespace="thunderbolt", app="powersync"} | json | message=~"replicat|lag|error"
```

**Query 3: Database Connection Logs**
```logql
{namespace="thunderbolt", app="backend"} | json | message=~"connection|pool|database"
```

**Query 4: Authentication Failures**
```logql
{namespace="thunderbolt"} | json | message=~"auth|login|unauthorized"
```

### 4. Create Logs Dashboard

```bash
# Add Loki as data source in Grafana
# Settings > Data Sources > Add data source > Loki
# URL: http://loki:3100

# Create dashboard with log panels:
# - Backend errors (last 24h)
# - Auth failures (last 24h)
# - PowerSync warnings (last 24h)
# - Database slow queries (last 24h)
```

---

## Runbook Templates

### Alert Runbook Format

Create a runbook for each critical alert:

```markdown
# Alert: HighAPILatency

**Severity:** Warning
**SLA:** 30–60 min
**Runbook:** `/deploy/docs/runbooks/high-api-latency.md`

## Diagnosis

1. Check backend pod CPU/memory usage
2. Check database connection pool utilization
3. Check Postgres slow query log
4. Check network latency to database
5. Check PowerSync replication lag

## Resolution Steps

1. Identify slow endpoint via metrics
2. Query Postgres slow query log
3. Check for missing indexes
4. Scale backend replicas if CPU-bound
5. Optimize queries or add caching

## Escalation

If latency persists > 15 min after scaling:
- Page on-call database engineer
- Check for infrastructure issues (network, disk I/O)
```

Create runbooks for:
- `high-api-latency.md`
- `high-error-rate.md`
- `database-connection-pool-exhaustion.md`
- `powersync-replication-lag.md`
- `postgres-disk-full.md`
- `pod-crash-loop.md`

---

## SLO Definition and Tracking

### Availability SLO: 99.9% Uptime

```promql
# Calculate: (1 - (total errors / total requests)) * 100
(1 - (sum_over_time(rate(http_requests_total{status=~"5.."}[5m])[30d:5m]) / sum_over_time(rate(http_requests_total[5m])[30d:5m]))) * 100

# Alert if monthly availability drops below 99.9%
```

### Latency SLO: p95 < 2 seconds

```promql
# Track p95 over 30-day window
histogram_quantile(0.95, sum_over_time(rate(http_request_duration_seconds_bucket[5m])[30d:5m]))
```

### Error Budget Calculator

```bash
# If SLO is 99.9% uptime, monthly error budget is:
# 100% - 99.9% = 0.1% = 2.88 minutes per month

# Track remaining budget:
# Error Budget = (1 - (current errors / SLO errors)) * 100%

MONTH_SECONDS=$((30 * 24 * 60 * 60))
SLO_PERCENT=99.9
SLO_ERRORS=$(echo "scale=2; $MONTH_SECONDS * (100 - $SLO_PERCENT) / 100" | bc)
ACTUAL_ERRORS=$(...)  # from Prometheus
REMAINING_BUDGET=$(echo "scale=2; 100 * (1 - $ACTUAL_ERRORS / $SLO_ERRORS)" | bc)

echo "Error budget remaining: $REMAINING_BUDGET%"
```

---

## Maintenance and Tuning

### 1. Retention Policies

Set appropriate data retention to balance storage and queryability:

```bash
# Prometheus (from helm install)
helm upgrade kube-prometheus-stack prometheus-community/kube-prometheus-stack \
  -n monitoring \
  --set prometheus.prometheusSpec.retention=15d \
  --set prometheus.prometheusSpec.storageSpec.volumeClaimTemplate.spec.resources.requests.storage=50Gi

# Loki
helm upgrade loki grafana/loki-stack \
  -n monitoring \
  --set loki.config.limits_config.retention_period=720h  # 30 days
```

### 2. Alert Tuning

After initial deployment, adjust alert thresholds based on actual baselines:

```bash
# Collect baseline metrics (run for 1 week)
# Review Grafana dashboards
# Adjust alert thresholds to baseline + 20% headroom
# Update PrometheusRule resources

kubectl edit prometheusrule thunderbolt-alerts -n thunderbolt
```

### 3. Dashboard Maintenance

Review and update dashboards monthly:

```bash
# Export dashboards for version control
for dashboard in $(curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/search?query=thunderbolt | jq -r '.[].title'); do
  DASHBOARD_ID=$(curl -s -H "Authorization: Bearer $TOKEN" \
    http://localhost:3000/api/search?query="$dashboard" | jq -r '.[0].id')
  curl -H "Authorization: Bearer $TOKEN" \
    http://localhost:3000/api/dashboards/db/$DASHBOARD_ID > "dashboards/$dashboard.json"
done
```

---

## Troubleshooting

### No Metrics in Prometheus

**Symptoms:** Prometheus targets show "Down" or no data in Grafana.

**Diagnosis:**
```bash
# Check if ServiceMonitor is discovered
kubectl get servicemonitor -n thunderbolt

# Check Prometheus configuration
kubectl port-forward -n monitoring svc/kube-prometheus-stack-prometheus 9090:9090 &
# Visit http://localhost:9090/config
# Look for thunderbolt targets

# Check Prometheus logs
kubectl logs -n monitoring -l app.kubernetes.io/name=prometheus --tail=100 | grep thunderbolt
```

**Solutions:**
- Verify service has matching labels in ServiceMonitor selector
- Ensure metrics endpoint is exposed (port 9100 or custom)
- Check firewall rules between Prometheus and target pods

### High Memory Usage in Prometheus

**Symptoms:** Prometheus pod using > 2 Gi memory.

**Solutions:**
```bash
# Reduce retention period
helm upgrade kube-prometheus-stack prometheus-community/kube-prometheus-stack \
  -n monitoring \
  --set prometheus.prometheusSpec.retention=7d  # From 15d

# Or add more persistent volume
helm upgrade kube-prometheus-stack prometheus-community/kube-prometheus-stack \
  -n monitoring \
  --set prometheus.prometheusSpec.storageSpec.volumeClaimTemplate.spec.resources.requests.storage=100Gi
```

### Loki Logs Not Appearing

**Symptoms:** Promtail running but no logs in Loki.

**Diagnosis:**
```bash
# Check Promtail pod logs
kubectl logs -n monitoring -l app=promtail --tail=100 | grep -i "error\|refused\|connection"

# Test Loki connectivity
kubectl exec -it <promtail-pod> -n monitoring -- curl -s http://loki:3100/ready
# Expected: "ready"

# Verify scrape config
kubectl get configmap promtail-config -n monitoring -o yaml | grep -A 20 "scrape_configs"
```

**Solutions:**
- Restart Promtail pods
- Verify Loki service is accessible
- Check pod label selectors match your pods

---

## Metric Export and Analysis

### Export Metrics to CSV

```bash
# Query Prometheus for time-series data
curl -s 'http://prometheus:9090/api/v1/query_range' \
  --data-urlencode 'query=rate(http_requests_total[5m])' \
  --data-urlencode 'start=1234567890' \
  --data-urlencode 'end=1234567900' \
  --data-urlencode 'step=60' | jq . > metrics.json

# Parse and convert to CSV
jq -r '.data.result[] | [.metric | keys[] as $key | "\($key)=\(.[$key])", .values[] | @csv] | @csv' metrics.json
```

### Trend Analysis

```bash
# Compare current day vs previous week same time
# (Use Grafana time-series diff feature or:)

promtool query instant-range \
  --start 1d \
  --end 0d \
  'rate(http_requests_total[5m])'
```

---

## Next Steps

1. Deploy kube-prometheus-stack (30 min)
2. Create dashboards (1–2 hours)
3. Configure alerts (1–2 hours)
4. Set up integrations: Slack, PagerDuty, email (30 min)
5. Run alert testing & tuning (ongoing)
6. Document runbooks for each alert (2–3 hours)

**Total Setup Time:** 5–8 hours

---

See also: `TROUBLESHOOTING_GUIDE.md`, `INCIDENT_RESPONSE.md`
