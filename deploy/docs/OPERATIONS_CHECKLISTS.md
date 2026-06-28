# Operations Checklists: Thunderbolt AIFAM Platform

> **InfluxData Pattern Reference:** This document provides recurring operational checklists based on InfluxData's production operations methodology, covering daily health checks, weekly maintenance, monthly compliance reviews, pre-production sign-off, security audits, and backup verification.

**Status:** Production-ready | **Last Updated:** 2026-06-28

---

## Daily Health Check (15 minutes)

**Frequency:** Every morning (9am PT) or start of business day  
**Owner:** On-call engineer or ops team  
**Escalation:** If any item fails, file SEV-3 ticket and notify team Slack channel

### Cluster Health

- [ ] All cluster nodes in `Ready` state
  ```bash
  kubectl get nodes
  # All should show "Ready" status
  ```

- [ ] No nodes with memory/disk pressure
  ```bash
  kubectl describe nodes | grep -i "memory\|disk.*pressure" | grep "True"
  # Should return nothing
  ```

- [ ] Pod eviction rate < 1 per day
  ```bash
  kubectl get events -n thunderbolt | grep -i "evicted\|oom" | wc -l
  # Should be 0-1
  ```

### Service Health

- [ ] All Thunderbolt pods in `Running` state
  ```bash
  kubectl get pods -n thunderbolt | grep -v Running
  # Should return headers only (no pods)
  ```

- [ ] Pod restart count < 2 per service in last 24h
  ```bash
  kubectl get pods -n thunderbolt -o jsonpath='{range .items[*]}{.metadata.name}: {.status.containerStatuses[0].restartCount}{"\n"}{end}'
  # All should be 0-2
  ```

- [ ] Deployment replicas at desired count
  ```bash
  kubectl get deployments -n thunderbolt -o wide
  # READY and UPDATED columns should match DESIRED
  ```

### Database Health

- [ ] Database accepting connections
  ```bash
  POSTGRES_POD=$(kubectl get pod -n thunderbolt -l app=postgres -o jsonpath='{.items[0].metadata.name}')
  kubectl exec -it "$POSTGRES_POD" -n thunderbolt -- pg_isready -U thunderbolt
  # Should output: accepting connections
  ```

- [ ] Replication slot active (for PowerSync)
  ```bash
  kubectl exec -it "$POSTGRES_POD" -n thunderbolt -- psql -U thunderbolt -d thunderbolt -c "SELECT slot_name, active FROM pg_replication_slots WHERE slot_name='powersync';"
  # Should show: powersync | t
  ```

- [ ] Database size reasonable (< 80% of allocated)
  ```bash
  kubectl exec -it "$POSTGRES_POD" -n thunderbolt -- psql -U thunderbolt -d thunderbolt -c "SELECT pg_size_pretty(pg_database_size('thunderbolt'));"
  # Compare to PVC size: kubectl get pvc -n thunderbolt
  ```

### API Metrics

- [ ] Error rate < 1%
  ```bash
  # Check Prometheus or metrics endpoint
  # http_requests_total{status=~"5.."} / http_requests_total < 0.01
  ```

- [ ] API latency p95 < 2 seconds
  ```bash
  # Check Grafana API Performance dashboard
  # Or query: histogram_quantile(0.95, http_request_duration_seconds_bucket)
  ```

- [ ] Throughput consistent with baseline
  ```bash
  # Compare today's request rate to last week same time
  # Should be ±20% of baseline
  ```

### PowerSync Health

- [ ] Replication lag < 30 seconds
  ```bash
  # Check Grafana PowerSync dashboard or:
  POSTGRES_POD=$(kubectl get pod -n thunderbolt -l app=postgres -o jsonpath='{.items[0].metadata.name}')
  kubectl exec -it "$POSTGRES_POD" -n thunderbolt -- psql -U thunderbolt -d thunderbolt -c "SELECT pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn)/1024/1024 AS lag_mb FROM pg_replication_slots WHERE slot_name='powersync';"
  ```

- [ ] Connected clients > 0 (if expecting users)
  ```bash
  # Check Grafana or metrics
  # powersync_connected_clients > 0
  ```

### Resources

- [ ] Memory pressure on any node
  ```bash
  kubectl top nodes
  # Memory %Used should be < 80%
  ```

- [ ] CPU pressure on any node
  ```bash
  kubectl top nodes
  # CPU %Used should be < 70%
  ```

- [ ] PVC usage < 90%
  ```bash
  kubectl get pvc -n thunderbolt
  # Check with: kubectl exec <postgres-pod> -- df -h /var/lib/postgresql/data/
  ```

### Alerts

- [ ] No firing alerts in Prometheus
  ```bash
  # Check http://prometheus:9090/alerts
  # Should show 0 firing alerts
  ```

- [ ] No pending incidents in on-call rotation
  ```bash
  # Check PagerDuty dashboard
  # Should show 0 active incidents
  ```

---

## Weekly Maintenance (1-2 hours)

**Frequency:** Every Monday morning  
**Owner:** Platform engineer + on-call  
**Escalation:** Coordinate changes during low-traffic windows

### Code and Deployments

- [ ] Review recent deployments for issues
  ```bash
  kubectl rollout history deployment backend -n thunderbolt | head -10
  # Any recent rollbacks? If yes, investigate
  ```

- [ ] Check for pending security patches
  ```bash
  # Review GitHub security advisories
  # https://github.com/thunderbird/thunderbolt/security/advisories
  ```

- [ ] Verify image tags in production
  ```bash
  kubectl get deployment -n thunderbolt -o wide
  # No "latest" tags; all should be specific versions
  ```

### Database Maintenance

- [ ] Run VACUUM ANALYZE on database
  ```bash
  POSTGRES_POD=$(kubectl get pod -n thunderbolt -l app=postgres -o jsonpath='{.items[0].metadata.name}')
  kubectl exec -it "$POSTGRES_POD" -n thunderbolt -- psql -U thunderbolt -d thunderbolt -c "VACUUM ANALYZE;" &
  # Can run in background; takes 5-30 min depending on size
  ```

- [ ] Check for unused indexes
  ```bash
  kubectl exec -it "$POSTGRES_POD" -n thunderbolt -- psql -U thunderbolt -d thunderbolt -c \
    "SELECT schemaname, tablename, indexname FROM pg_stat_user_indexes WHERE idx_scan = 0 LIMIT 20;"
  # If many, consider dropping them
  ```

- [ ] Monitor log file growth
  ```bash
  kubectl exec -it "$POSTGRES_POD" -n thunderbolt -- du -sh /var/lib/postgresql/data/pg_log/
  # If > 5GB, logs should be rotated
  ```

- [ ] Backup verification
  ```bash
  # Verify latest backup exists and is not corrupted
  ls -lh /backups/thunderbolt-*.dump | tail -1
  # Test restore on dev environment (see Backup Procedures)
  ```

### Monitoring and Logging

- [ ] Review metrics retention and disk usage
  ```bash
  kubectl exec -it <prometheus-pod> -n monitoring -- df -h /prometheus/
  # Should have > 10GB free
  ```

- [ ] Check for high-cardinality metrics
  ```bash
  # In Prometheus, check: http://prometheus:9090/tsdb-status
  # Look for series with many label values
  ```

- [ ] Rotate logs (if not auto-rotated)
  ```bash
  kubectl exec -it "$POSTGRES_POD" -n thunderbolt -- \
    find /var/lib/postgresql/data/pg_log/ -name "*.log.*" -mtime +7 -delete
  # Delete logs older than 7 days
  ```

### Security

- [ ] Audit Kubernetes RBAC permissions
  ```bash
  kubectl get rolebinding -n thunderbolt
  kubectl get clusterrolebinding | grep thunderbolt
  # Should have minimal permissions (least privilege)
  ```

- [ ] Check for exposed secrets in logs
  ```bash
  kubectl logs -n thunderbolt --all-containers=true | grep -i "secret\|password\|token\|key" | head -5
  # Should not leak secrets; if found, rotate them immediately
  ```

- [ ] Review network policies
  ```bash
  kubectl get networkpolicies -n thunderbolt
  # Should restrict traffic to necessary ports/pods
  ```

### Documentation

- [ ] Update runbooks based on recent incidents
  ```bash
  # Review recent SEV-2+ incidents
  # Update /deploy/docs/runbooks/ if needed
  ```

- [ ] Review and update deployment checklist
  ```bash
  # Make notes of any new prerequisites or gotchas
  ```

---

## Monthly Compliance Review (2-3 hours)

**Frequency:** Last Friday of month  
**Owner:** Engineering Lead + Compliance Officer  
**Scope:** Full system audit

### Availability & SLO Tracking

- [ ] Calculate monthly uptime
  ```bash
  # Query: uptime % = (1 - errors/requests) * 100
  # Target: 99.9% (max 2.88 min downtime)
  # Actual: [calculate from Prometheus]
  ```

- [ ] Review error budget consumption
  ```bash
  # Budget remaining: [calculated in dashboard]
  # If < 50%: urgent action required
  ```

- [ ] Review incident trends
  ```bash
  # Count incidents by month
  # Severity distribution (SEV-1/2/3/4)
  # MTTR (mean time to resolution)
  # Goal: Decrease MTTR, increase uptime
  ```

### Performance Metrics

- [ ] API latency p95 trend
  ```bash
  # Trend over last 30 days
  # Should be stable or improving
  # If degrading: investigate cause
  ```

- [ ] Database query performance
  ```bash
  POSTGRES_POD=$(kubectl get pod -n thunderbolt -l app=postgres -o jsonpath='{.items[0].metadata.name}')
  kubectl exec -it "$POSTGRES_POD" -n thunderbolt -- psql -U thunderbolt -d thunderbolt -c \
    "SELECT query, mean_exec_time FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 20;"
  # Top queries should be < 100ms
  ```

- [ ] Resource utilization trends
  ```bash
  # Check Grafana historical data
  # CPU trend: should be stable or decreasing
  # Memory trend: should not exceed 80%
  # Disk trend: should not exceed 70% of allocated
  ```

### Security Audit

- [ ] Verify all secrets are rotated
  ```bash
  # BETTER_AUTH_SECRET: rotated? (every 90 days)
  # API keys: rotated? (every 30 days)
  # Database password: rotated? (every 90 days)
  ```

- [ ] Review access logs for suspicious activity
  ```bash
  # Check Loki/ELK for failed auth attempts
  # Anomalies in request patterns?
  # Spikes in 4xx/5xx errors?
  ```

- [ ] Audit container image vulnerabilities
  ```bash
  # Run vulnerability scan on all images
  # trivy image ghcr.io/thunderbird/thunderbolt/thunderbolt-backend:v1.2.3
  # Severity: no CRITICAL, < 5 HIGH
  ```

- [ ] Verify encryption in transit
  ```bash
  # TLS certificates valid?
  kubectl get certificate -n thunderbolt -o wide
  # All should show "True" for Ready
  
  # Check TLS version (should be 1.2+)
  openssl s_client -connect thunderbolt.example.com:443 -tls1_2
  ```

### Disaster Recovery

- [ ] Test backup restoration
  ```bash
  # Take latest backup
  ls -lh /backups/thunderbolt-*.dump | tail -1
  
  # Restore to temporary database in dev
  # Verify all data present and intact
  # Measure restoration time
  ```

- [ ] Test failover procedures
  ```bash
  # If multi-region deployed:
  # Simulate primary region failure
  # Verify clients fail over to secondary
  # Measure failover time
  ```

- [ ] Review disaster recovery runbook
  ```bash
  # Is it current?
  # Has it been tested in last 90 days?
  # Update if needed
  ```

### Compliance

- [ ] GDPR audit (if applicable)
  ```bash
  # Data retention policies in place?
  # User data exportable on request?
  # Right to be forgotten implemented?
  ```

- [ ] SOC 2 audit (if applicable)
  ```bash
  # Access controls documented?
  # Change management procedures followed?
  # Monitoring and alerting in place?
  ```

- [ ] HIPAA audit (if health data stored)
  ```bash
  # Encryption at rest configured?
  # Audit logs retained for 6 years?
  # BAA agreements with vendors?
  ```

### Financial

- [ ] Review infrastructure costs
  ```bash
  # Cloud bill breakdown: compute, storage, networking
  # Cost per user per month?
  # Opportunities for optimization?
  ```

- [ ] License and support agreements
  ```bash
  # All third-party licenses up to date?
  # Support contracts valid?
  ```

---

## Pre-Production Sign-Off Checklist (4-6 hours)

**Frequency:** Before each production deployment  
**Owner:** Eng Lead + QA + On-call  
**Gate:** Required for any release

### Code Quality

- [ ] All tests passing
  ```bash
  make test
  # Expected: 100% pass rate
  ```

- [ ] Code review completed
  ```bash
  # GitHub: all commits have ≥1 approval
  # No "FIXME" or "TODO" comments
  ```

- [ ] No high-priority linting errors
  ```bash
  make lint
  # TypeScript: 0 errors
  # Shell: 0 errors
  ```

- [ ] Performance benchmarks acceptable
  ```bash
  # Latency increase < 5% from baseline
  # Memory overhead < 10MB per pod
  ```

### Documentation

- [ ] Release notes written
  ```bash
  # Include: features, fixes, breaking changes
  # Known issues documented
  # Migration steps (if needed)
  ```

- [ ] Runbooks updated (if new features/risks)
  ```bash
  # New failure modes documented?
  # Recovery procedures tested?
  ```

- [ ] API documentation current
  ```bash
  # New endpoints documented
  # Deprecation notices added
  ```

### Testing

- [ ] Unit tests > 80% coverage
  ```bash
  # Report generated in CI
  # Coverage report accessible
  ```

- [ ] Integration tests passing in staging
  ```bash
  # Database migrations tested
  # Service-to-service calls tested
  # PowerSync sync tested
  ```

- [ ] Load test completed
  ```bash
  # Simulated 2x expected traffic
  # Latency, error rate acceptable
  # Resource limits sufficient
  ```

- [ ] Smoke test defined and passing
  ```bash
  # Can sign in?
  # Can send message?
  # Can sync data?
  # Mobile client replicates data?
  ```

### Deployment Readiness

- [ ] Docker images built and tested
  ```bash
  docker pull ghcr.io/thunderbird/thunderbolt/thunderbolt-backend:v1.2.3
  docker run --rm ... # Quick sanity check
  ```

- [ ] Helm chart tested in staging
  ```bash
  helm install test deploy/k8s -n staging --values staging-values.yaml
  # All pods Running; health checks passing
  ```

- [ ] Database migrations tested
  ```bash
  # Forward migration: upgrade dev database
  # Backward migration: rollback to previous version
  # Both successful?
  ```

- [ ] Rollback procedure tested
  ```bash
  # Deploy previous version to staging
  # Verify it works
  # Document rollback command
  ```

- [ ] Feature flags configured (if needed)
  ```bash
  # New features behind feature flags?
  # Can be disabled without redeployment?
  ```

### Monitoring & Alerting

- [ ] All alerts configured
  ```bash
  # PrometheusRules applied
  # Test alert firing manually
  # Alert routing verified (Slack, PagerDuty)
  ```

- [ ] Dashboards created and validated
  ```bash
  # All key metrics visible
  # Baselines established for comparison
  ```

- [ ] Log aggregation working
  ```bash
  # Loki collecting logs from staging
  # Search queries work
  ```

### Infrastructure

- [ ] Cluster capacity sufficient
  ```bash
  kubectl top nodes
  # All nodes < 70% CPU, < 80% memory
  ```

- [ ] Network policies reviewed
  ```bash
  # New services have ingress/egress rules
  # Principle of least privilege applied
  ```

- [ ] Storage quota not exceeded
  ```bash
  # Database size < 80% of allocated PVC
  # No lingering test data
  ```

### Team Readiness

- [ ] On-call briefed on changes
  ```bash
  # Review of new features
  # Known issues and workarounds
  # Rollback procedures
  ```

- [ ] Maintenance window scheduled (if downtime needed)
  ```bash
  # Off-peak time (2-4am PT)
  # Customers notified
  # Status page updated
  ```

- [ ] Escalation contacts updated
  ```bash
  # On-call can reach engineering lead
  # Engineering lead can reach VP
  ```

### Final Approval

- [ ] Sign-off from each role:
  ```
  [ ] Engineering Lead: __________________ (Date)
  [ ] QA Lead: __________________ (Date)
  [ ] On-Call: __________________ (Date)
  [ ] Product Lead (if major feature): __________________ (Date)
  ```

---

## Security Audit Procedure (2-3 hours)

**Frequency:** Quarterly (or after security incident)  
**Owner:** Security team + Engineering  
**Gate:** Findings must be addressed before next production release

### Network Security

- [ ] Ingress traffic restricted to HTTPS only
  ```bash
  kubectl get ingress -n thunderbolt -o yaml | grep -i "tls\|https"
  # TLS block present? Redirects HTTP to HTTPS?
  ```

- [ ] Pod-to-pod communication encrypted (optional mTLS check)
  ```bash
  # If using Istio: mTLS enabled between pods?
  # kubectl get peerauthentication
  ```

- [ ] Egress rules restrict outbound traffic
  ```bash
  kubectl get networkpolicies -n thunderbolt -o yaml
  # Egress restricted to necessary external services only?
  ```

### Data Security

- [ ] Encryption at rest configured
  ```bash
  # Kubernetes Secrets encrypted with etcd encryption?
  # Database encrypted with TDE?
  # Check cloud provider console
  ```

- [ ] Sensitive data not logged
  ```bash
  kubectl logs -n thunderbolt --all-containers=true | grep -i "password\|secret\|key\|token" | head -5
  # Should return nothing
  ```

- [ ] Database backups encrypted
  ```bash
  ls -l /backups/thunderbolt-*.dump
  # Backups should be owned by restricted user
  # Moved to encrypted storage immediately after creation?
  ```

### Access Control

- [ ] Kubernetes RBAC principle of least privilege
  ```bash
  kubectl get rolebindings -n thunderbolt -o wide
  # Service accounts should not have cluster-admin
  # Users should have minimal required permissions
  ```

- [ ] Container images run as non-root
  ```bash
  kubectl get pod -n thunderbolt -o jsonpath='{range .items[*]}{.metadata.name}: {.spec.containers[0].securityContext.runAsUser}{"\n"}{end}'
  # Should not be 0 (root)
  ```

- [ ] Secret access audited
  ```bash
  # Who has access to thunderbolt-secrets?
  kubectl get secret thunderbolt-secrets -n thunderbolt -o yaml | grep -i "annotation\|owner"
  ```

### Vulnerability Management

- [ ] Container image vulnerability scanning
  ```bash
  trivy image ghcr.io/thunderbird/thunderbolt/thunderbolt-backend:latest
  # CRITICAL: 0
  # HIGH: < 5 (with mitigation plan)
  ```

- [ ] Dependency vulnerabilities checked
  ```bash
  # Backend: cargo audit
  # Frontend: npm audit
  # No unpatched high/critical vulnerabilities
  ```

- [ ] Security patches applied within SLA
  ```bash
  # Critical: within 24h
  # High: within 7 days
  # Medium: within 30 days
  ```

### Compliance

- [ ] Security policies documented
  ```bash
  # Data retention policy
  # Access control policy
  # Incident response policy
  # Backup policy
  ```

- [ ] Audit logging enabled
  ```bash
  # API audit log: all changes to clusters
  # Application audit log: user actions
  # Database audit log: schema changes
  ```

- [ ] Compliance certifications current
  ```bash
  # SOC 2 Type II
  # ISO 27001 (if applicable)
  # Expiration dates documented
  ```

### Incident Response

- [ ] Security incident response plan documented
  ```bash
  # Process for detecting breaches
  # Notification procedures
  # Investigation procedures
  # RCA process
  ```

- [ ] Security team notified of major changes
  ```bash
  # New services deployed with security review
  # Third-party integrations vetted
  ```

---

## Backup Verification Checklist (1 hour)

**Frequency:** Monthly; after every major change  
**Owner:** Platform engineer  
**Gate:** Must pass before going to production

### Backup Creation

- [ ] Backup created successfully
  ```bash
  POSTGRES_POD=$(kubectl get pod -n thunderbolt -l app=postgres -o jsonpath='{.items[0].metadata.name}')
  kubectl exec "$POSTGRES_POD" -n thunderbolt -- pg_dump -U thunderbolt -d thunderbolt -F c > /tmp/test.dump
  # File should be created, size > 1MB (actual size depends on data volume)
  ls -lh /tmp/test.dump
  ```

- [ ] Backup size reasonable
  ```bash
  # Size should be ~ database size
  # Too small: backup may be corrupted
  POSTGRES_POD=$(kubectl get pod -n thunderbolt -l app=postgres -o jsonpath='{.items[0].metadata.name}')
  kubectl exec -it "$POSTGRES_POD" -n thunderbolt -- psql -U thunderbolt -d thunderbolt -c "SELECT pg_size_pretty(pg_database_size('thunderbolt'));"
  ```

- [ ] Backup moved to secure storage
  ```bash
  # Backup should be moved off pod immediately
  # Encrypted storage (AWS S3, Azure Blob, etc.)
  # Retention: 30 days minimum
  ```

### Backup Restoration

- [ ] Restore to temporary database
  ```bash
  # Do NOT restore to production!
  # Create temporary dev environment or PVC
  
  # Restore backup
  TEMP_POD=postgres-restore-test
  kubectl run -it --image=postgres:15 --restart=Never $TEMP_POD -n thunderbolt -- sh
  # Inside pod: pg_restore -U thunderbolt -d thunderbolt < backup.dump
  ```

- [ ] Verify data integrity post-restore
  ```bash
  # Connect to restored database
  # Check: row counts match original
  kubectl exec -it $TEMP_POD -n thunderbolt -- psql -U thunderbolt -d thunderbolt -c \
    "SELECT schemaname, tablename, n_live_tup FROM pg_stat_user_tables ORDER BY n_live_tup DESC LIMIT 20;"
  
  # Compare to production pre-backup
  # Should match exactly
  ```

- [ ] Verify application can start with restored data
  ```bash
  # Deploy application against restored database
  # Run smoke tests
  # Sign in? Create objects? Sync data?
  ```

- [ ] Measure restoration time
  ```bash
  # Time to restore: [calculate from restore process]
  # Should be < 30 min for typical backup
  # Document in runbook
  ```

### Backup Cleanup

- [ ] Delete temporary test database
  ```bash
  kubectl delete pod postgres-restore-test -n thunderbolt
  ```

- [ ] Verify production database untouched
  ```bash
  POSTGRES_POD=$(kubectl get pod -n thunderbolt -l app=postgres -o jsonpath='{.items[0].metadata.name}')
  kubectl exec -it "$POSTGRES_POD" -n thunderbolt -- psql -U thunderbolt -d thunderbolt -c "SELECT COUNT(*) FROM pg_stat_user_tables;"
  # Should show same count as before restore test
  ```

### Documentation

- [ ] Test results documented
  ```bash
  cat > /tmp/backup-test-$(date +%Y%m%d).txt <<'EOF'
  Backup Test Date: [date]
  Backup File: [filename]
  Backup Size: [size]
  Restoration Time: [time]
  Data Integrity: [PASS/FAIL]
  Application Smoke Tests: [PASS/FAIL]
  Notes: [any issues encountered]
  Signed by: [name]
  EOF
  ```

---

## Quarterly Infrastructure Review (4-6 hours)

**Frequency:** Every quarter (end of Q)  
**Owner:** Infrastructure Lead + Engineering Lead

### Capacity Planning

- [ ] Forecast resource requirements for next quarter
  ```bash
  # Trend analysis: CPU/memory/storage growth
  # Expected user growth: [%]
  # Feature additions: [impact on resource usage]
  # Estimated capacity needed: [resources]
  ```

- [ ] Review vendor quotas and limits
  ```bash
  # Cloud provider account limits
  # Database connection limits
  # API rate limits (PowerSync, etc.)
  ```

- [ ] Plan scaling actions
  ```bash
  # Add more nodes?
  # Increase PVC size?
  # Upgrade compute instances?
  # When? Estimated cost?
  ```

### Technology Debt

- [ ] Review critical dependencies for updates
  ```bash
  # Kubernetes: current version? Supported?
  # Postgres: current version? EOL date?
  # Node.js: current version? Security patches available?
  ```

- [ ] Identify outdated container images
  ```bash
  # Any images using Ubuntu 18.04 or older?
  # Migrate to newer base images
  ```

- [ ] Refactor opportunities
  ```bash
  # Code that violates CLAUDE.md principles
  # Complex components to simplify
  # Performance bottlenecks to optimize
  ```

### Training and Documentation

- [ ] Team training gaps identified
  ```bash
  # New tools or processes needed?
  # Runbook training completed?
  # On-call rotation training?
  ```

- [ ] Update operations guides
  ```bash
  # Deployment procedures changed?
  # New monitoring setup?
  # New rollback procedures?
  ```

---

## Seasonal Maintenance (Annual)

**Q1:** Database maintenance deep dive  
**Q2:** Security audit  
**Q3:** Performance optimization review  
**Q4:** Planning for next year

### Q1: Database Deep Dive
- [ ] Reindex all tables for performance
- [ ] Analyze query plans for all slow queries
- [ ] Plan archival of old data
- [ ] Review and optimize auto-vacuum settings

### Q2: Security Audit
- [ ] Full penetration testing (if not done in Q4)
- [ ] Review access logs for anomalies
- [ ] Update security policies
- [ ] Renew security training for all team members

### Q3: Performance Optimization
- [ ] Benchmark current system performance
- [ ] Identify bottlenecks
- [ ] Implement optimizations
- [ ] Measure and document improvements

### Q4: Planning
- [ ] Review reliability metrics for the year
- [ ] Plan infrastructure improvements
- [ ] Update capacity planning for next year
- [ ] Schedule major maintenance windows

---

See also: `DEPLOYMENT_RUNBOOK.md`, `MONITORING_AND_ALERTING.md`, `INCIDENT_RESPONSE.md`
