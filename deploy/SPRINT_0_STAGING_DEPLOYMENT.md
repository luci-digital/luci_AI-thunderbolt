# Sprint 0 Staging Deployment Guide

**Status**: Ready for deployment  
**Date**: 2026-06-28  
**Target**: Staging Kubernetes Cluster  
**Timeline**: 2-3 hours for initial deployment + 48 hours for validation  

---

## Overview

This guide deploys Sprint 0 infrastructure hardening to a staging Kubernetes cluster for validation testing before production release.

**Sprint 0 Components**:
- External secret management (1Password/Vault)
- Circuit breaker error recovery + exponential backoff
- Health check endpoints
- Pod Disruption Budgets (HA)
- Horizontal Pod Autoscaling
- Encryption-at-rest (etcd)
- Comprehensive monitoring & observability

**Expected Outcomes**:
- ✅ All services stable with circuit breaker protection
- ✅ Health endpoints responding correctly
- ✅ Secrets managed externally (no hardcoded values)
- ✅ Pod Disruption Budgets preventing cascade failures
- ✅ Horizontal Pod Autoscaler scaling pods under load
- ✅ Circuit breakers triggering correctly under failure scenarios

---

## Pre-Deployment Checklist (30 minutes)

### Infrastructure Prerequisites

- [ ] Staging Kubernetes cluster running (K8s 1.28+)
- [ ] kubectl configured and authenticated
- [ ] At least 3 nodes with 4CPU, 8GB RAM each
- [ ] Persistent volume storage available
- [ ] Ingress controller deployed (nginx or similar)
- [ ] cert-manager installed (for TLS)

**Verification Commands**:
```bash
# Check cluster version
kubectl version --short

# Check nodes
kubectl get nodes -o wide

# Check storage classes
kubectl get storageclass

# Check ingress controller
kubectl get pods -n ingress-nginx
```

### External Secret Store Setup

Choose one:

**Option A: 1Password** (Recommended)
```bash
# Install 1Password Connect server
helm repo add onepassword https://charts.1password.com
helm install onepassword-connect onepassword/connect-server \
  -n onepassword --create-namespace \
  -f deploy/k8s/onepassword-values.yaml

# Verify running
kubectl get pods -n onepassword

# Create secrets in 1Password:
# 1. Login to 1Password vault
# 2. Create vault "Thunderbolt"
# 3. Add secrets (see deploy/scripts/generate-secrets.sh)
```

**Option B: HashiCorp Vault**
```bash
# Install Vault Helm chart
helm repo add hashicorp https://helm.releases.hashicorp.com
helm install vault hashicorp/vault \
  -n vault --create-namespace \
  -f deploy/k8s/vault-values.yaml

# Unseal vault and add secrets
vault auth enable kubernetes
vault policy write thunderbolt-policy - <<EOF
path "secret/thunderbolt/*" {
  capabilities = ["read", "list"]
}
EOF
```

### Generate/Configure Secrets

```bash
# Method 1: Generate new secrets
cd deploy
bash scripts/generate-secrets.sh \
  --backend 1password \
  --op-account myaccount

# Method 2: Use existing secrets from .env
# Edit deploy/k8s/values.yaml to reference existing secret names
```

### Install External Secrets Controller

```bash
# Add Helm repo
helm repo add external-secrets https://charts.external-secrets.io
helm repo update

# Install controller
helm install external-secrets \
  external-secrets/external-secrets \
  -n external-secrets-system \
  --create-namespace \
  --set installCRDs=true

# Verify installation
kubectl get pods -n external-secrets-system
kubectl get crd | grep external-secrets
```

---

## Deployment Phase 1: Apply Kubernetes Manifests (30 minutes)

### Step 1: Create Namespace

```bash
kubectl create namespace thunderbolt-staging
kubectl label namespace thunderbolt-staging environment=staging
```

### Step 2: Deploy External Secrets

```bash
# Create SecretStore
kubectl apply -f deploy/k8s/templates/external-secrets.yaml \
  -n thunderbolt-staging

# Verify SecretStore created
kubectl get secretstore -n thunderbolt-staging

# Wait for ExternalSecrets to sync (1-2 minutes)
kubectl get externalsecret -n thunderbolt-staging -w
```

**Expected Output**:
```
NAME                               STORE                    READY   AGE
better-auth-secret                 external-secret-store    True    1m
powersync-jwt-secret               external-secret-store    True    1m
postgres-password                  external-secret-store    True    1m
keycloak-admin                     external-secret-store    True    1m
lucivault-public-key               external-secret-store    True    1m
foundationdb-credentials           external-secret-store    True    1m
service-tls-certs                  external-secret-store    True    1m
```

**Troubleshooting**:
```bash
# If ExternalSecrets not syncing
kubectl describe externalsecret better-auth-secret -n thunderbolt-staging

# Check secret store connection
kubectl logs -n thunderbolt-staging deployment/external-secrets

# Verify secrets exist in backend
op item get better-auth-secret --account myaccount  # for 1Password
vault kv get secret/thunderbolt/better-auth-secret  # for Vault
```

### Step 3: Deploy Pod Disruption Budgets

```bash
kubectl apply -f deploy/k8s/templates/pdb.yaml \
  -n thunderbolt-staging

# Verify PDBs created
kubectl get pdb -n thunderbolt-staging
```

**Expected Output**:
```
NAME               MIN AVAILABLE   MAX UNAVAILABLE   ALLOWED DISRUPTIONS   AGE
backend-pdb        1               <none>            0                     15s
frontend-pdb       1               <none>            0                     15s
powersync-pdb      1               <none>            0                     15s
```

### Step 4: Deploy Horizontal Pod Autoscalers

```bash
kubectl apply -f deploy/k8s/templates/hpa.yaml \
  -n thunderbolt-staging

# Verify HPAs created
kubectl get hpa -n thunderbolt-staging
```

**Expected Output**:
```
NAME             REFERENCE           TARGETS           MINPODS   MAXPODS   REPLICAS   AGE
backend-hpa      Deployment/backend  15%/70%, 20%/80%  2         10        2          15s
frontend-hpa     Deployment/frontend 45%/75%           2         5         2          15s
powersync-hpa    Deployment/powersync 25%/70%          2         5         2          15s
```

### Step 5: Deploy Applications with Circuit Breaker Support

Update Helm values to include Sprint 0 components:

```bash
# Update values.yaml with circuit breaker configuration
cat >> deploy/k8s/values.yaml <<EOF

# Sprint 0: Circuit Breaker Configuration
circuitBreaker:
  enabled: true
  postgres:
    failureThreshold: 5
    resetTimeoutMs: 60000
    halfOpenTimeoutMs: 30000
  keycloak:
    failureThreshold: 5
    resetTimeoutMs: 60000
  powersync:
    failureThreshold: 5
    resetTimeoutMs: 60000

# Sprint 0: Exponential Backoff Configuration
backoff:
  initialDelayMs: 100
  maxDelayMs: 60000
  maxRetries: 5

# Sprint 0: Health Check Configuration
healthChecks:
  enabled: true
  liveness:
    path: /health/live
    initialDelaySeconds: 10
    periodSeconds: 10
  readiness:
    path: /health/ready
    initialDelaySeconds: 5
    periodSeconds: 5
EOF

# Deploy Helm chart
helm install thunderbolt-staging deploy/k8s \
  -n thunderbolt-staging \
  -f deploy/k8s/values.yaml \
  --wait --timeout 10m
```

**Monitor deployment**:
```bash
# Watch pods coming up
kubectl get pods -n thunderbolt-staging -w

# Check deployment status
kubectl rollout status deployment/backend -n thunderbolt-staging
kubectl rollout status deployment/frontend -n thunderbolt-staging
kubectl rollout status deployment/powersync -n thunderbolt-staging
```

---

## Deployment Phase 2: Validation (30 minutes)

### Step 1: Verify Health Endpoints

```bash
# Port-forward backend service
kubectl port-forward -n thunderbolt-staging svc/backend 5000:5000 &

# Test liveness probe (should return 200)
curl -v http://localhost:5000/health/live

# Test readiness probe (should return 200 if all circuits CLOSED)
curl -v http://localhost:5000/health/ready

# Test detailed status
curl http://localhost:5000/health/detailed | jq .

# Kill port-forward
kill %1
```

**Expected Response**:
```json
{
  "status": "healthy",
  "timestamp": "2026-06-28T08:45:00.000Z",
  "uptime": 120000,
  "circuitBreakers": {
    "postgres": "CLOSED",
    "keycloak": "CLOSED",
    "powersync": "CLOSED"
  }
}
```

### Step 2: Verify Pod Disruption Budgets

```bash
# Drain a node (PDB should prevent eviction of critical pods)
kubectl cordon <node-name>
kubectl drain <node-name> --ignore-daemonsets --delete-emptydir-data

# Watch what happens - should evict only 1 pod per service due to PDB
kubectl get pods -n thunderbolt-staging -w

# Uncordon node
kubectl uncordon <node-name>

# Verify pods re-schedule
kubectl get pods -n thunderbolt-staging
```

### Step 3: Verify Horizontal Pod Autoscaling

```bash
# Get current HPA status
kubectl get hpa -n thunderbolt-staging

# Generate load against backend
kubectl run -i --tty load-generator --rm --image=busybox /bin/sh

# Inside the pod, run load test
for i in {1..1000}; do
  wget -q -O- http://backend.thunderbolt-staging.svc.cluster.local:5000/health/ready
done

# Watch HPA scale up (outside the pod)
kubectl get hpa -n thunderbolt-staging -w

# Should see REPLICAS increase from 2 to 3, 4, 5 as load increases
```

### Step 4: Verify Secrets Management

```bash
# Check that secrets exist and are not hardcoded
kubectl get secrets -n thunderbolt-staging

# Verify secrets came from ExternalSecrets
kubectl get externalsecrets -n thunderbolt-staging

# Check that backend can access secrets
kubectl exec -it deployment/backend -n thunderbolt-staging -- \
  env | grep -i secret

# Should NOT see base64-encoded secrets in logs
kubectl logs deployment/backend -n thunderbolt-staging | grep secret
```

### Step 5: Verify Encryption at Rest

```bash
# Check that encryption provider is configured
kubectl get nodes -o jsonpath='{.items[0].status.nodeInfo.kubeletVersion}'

# Check kube-apiserver logs for encryption
kubectl logs -n kube-system -l component=kube-apiserver | grep encryption

# Verify secrets are encrypted in etcd (if accessible)
etcdctl get /registry/secrets/thunderbolt-staging/better-auth-secret | od -c
# Should show binary data, not plaintext
```

---

## Testing Phase: 48-Hour Validation

### Day 1: Stability Testing

**Morning (4 hours)**:
```bash
# 1. Monitor all services for stability
kubectl top pods -n thunderbolt-staging
kubectl top nodes

# 2. Check logs for errors
kubectl logs -f deployment/backend -n thunderbolt-staging
kubectl logs -f deployment/frontend -n thunderbolt-staging

# 3. Verify metrics are being collected
kubectl get --raw /metrics | head -20
```

**Afternoon (4 hours)**:
```bash
# 1. Simulate Postgres failure
kubectl scale deployment postgres --replicas=0 -n thunderbolt-staging

# 2. Watch circuit breaker activate
curl http://localhost:5000/health/detailed | jq .circuitBreakers.postgres
# Should show "OPEN"

# 3. Verify API returns 503 quickly (< 100ms)
time curl http://localhost:5000/health/ready
# Should get 503 Service Unavailable in <100ms

# 4. Restore Postgres
kubectl scale deployment postgres --replicas=1 -n thunderbolt-staging

# 5. Watch circuit breaker close after recovery
sleep 60
curl http://localhost:5000/health/detailed | jq .circuitBreakers.postgres
# Should show "CLOSED"
```

### Day 2: Load & Chaos Testing

**Morning (4 hours)**:
```bash
# 1. Run load test with k6
cat > load-test.js <<EOF
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '5m', target: 100 },   // Ramp up to 100 users
    { duration: '10m', target: 100 },  // Stay at 100
    { duration: '5m', target: 0 },     // Ramp down
  ],
};

export default function () {
  let response = http.get('http://backend.thunderbolt-staging.svc.cluster.local:5000/health/ready');
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 200ms': (r) => r.timings.duration < 200,
  });
  sleep(1);
}
EOF

k6 run load-test.js
```

**Afternoon (4 hours)**:
```bash
# 1. Simulate network partition (drain node)
kubectl cordon <node-name>
kubectl drain <node-name> --ignore-daemonsets --delete-emptydir-data

# 2. Monitor pod disruption budgets
kubectl get pdb -n thunderbolt-staging

# 3. Verify minimum 1 pod stays running per service
kubectl get pods -n thunderbolt-staging

# 4. Restore node
kubectl uncordon <node-name>
kubectl wait --for=condition=Ready node/<node-name> --timeout=300s
```

---

## Success Criteria

✅ **All pods running and healthy**:
```bash
kubectl get pods -n thunderbolt-staging -o wide
# All pods should be in Running state
```

✅ **Health endpoints returning correct status**:
```bash
curl http://localhost:5000/health/live  # Returns 200
curl http://localhost:5000/health/ready # Returns 200 (if circuits CLOSED)
curl http://localhost:5000/health/detailed | jq .status # Returns "healthy"
```

✅ **Circuit breakers functioning**:
- Simulate failure → Circuit opens → API returns 503 quickly
- Failure clears → Circuit closes after configured timeout
- Prometheus metrics show state transitions

✅ **Pod Disruption Budgets preventing cascade failures**:
- Node drain respects PDB
- Minimum 1 pod stays running per service
- No service interruption

✅ **Horizontal Pod Autoscaler scaling under load**:
- Load increases → replicas scale up (2 → 3 → 4 → 5)
- Load decreases → replicas scale down (5 → 4 → 3 → 2)
- Scaling completes within 2-3 minutes

✅ **Secrets managed externally**:
- No base64 secrets in values.yaml
- ExternalSecrets syncing successfully
- No hardcoded secrets in logs

✅ **No errors in logs for 24+ hours**:
```bash
kubectl logs deployment/backend -n thunderbolt-staging --since=24h | grep ERROR
# Should return empty (no errors)
```

---

## Rollback Procedure

If issues arise, rollback Sprint 0:

```bash
# 1. Delete Helm release
helm uninstall thunderbolt-staging -n thunderbolt-staging

# 2. Remove PDBs and HPAs
kubectl delete pdb --all -n thunderbolt-staging
kubectl delete hpa --all -n thunderbolt-staging

# 3. Remove external secrets configuration
kubectl delete secretstore --all -n thunderbolt-staging
kubectl delete externalsecret --all -n thunderbolt-staging

# 4. Restore previous deployment
helm install thunderbolt-staging deploy/k8s \
  -n thunderbolt-staging \
  --set circuitBreaker.enabled=false \
  --set healthChecks.enabled=false \
  --wait --timeout 10m

# 5. Verify rollback
kubectl get pods -n thunderbolt-staging
kubectl logs deployment/backend -n thunderbolt-staging | tail -20
```

---

## Monitoring & Alerting (Post-Deployment)

### Prometheus Metrics

Key metrics to monitor:

```prometheus
# Circuit breaker state (0=CLOSED, 1=OPEN, 2=HALF_OPEN)
circuitbreaker_state{service="postgres"}

# Retry attempts
backoff_retries_total{service="postgres"}

# HPA scaling activity
kube_hpa_status_current_replicas{hpa="backend-hpa"}
kube_hpa_status_desired_replicas{hpa="backend-hpa"}

# Pod disruption metrics
kube_poddisruptionbudget_allowed_disruptions
kube_poddisruptionbudget_pods_available

# API latency (should be < 200ms p95)
http_request_duration_seconds{endpoint="/health/ready"}
```

### Grafana Dashboards

Create dashboards for:
1. **Health Status** — Circuit breaker states, pod counts
2. **Circuit Breaker Activity** — State transitions, failure rates
3. **HPA Behavior** — Replica scaling over time, CPU/memory trends
4. **Error Rates** — Request failures, retry counts
5. **Pod Disruption** — Evictions, PDB violations

See `deploy/docs/MONITORING_AND_ALERTING.md` for detailed setup.

---

## Troubleshooting

### Issue: ExternalSecrets not syncing

```bash
# Check SecretStore connection
kubectl describe secretstore external-secret-store -n thunderbolt-staging

# Check external-secrets-system logs
kubectl logs -n external-secrets-system -l app.kubernetes.io/name=external-secrets

# Verify secrets exist in backend
op item list --vault "Thunderbolt" --account myaccount
```

### Issue: Pods not scaling up

```bash
# Check HPA status
kubectl describe hpa backend-hpa -n thunderbolt-staging

# Check metrics server (required for HPA)
kubectl get deployment metrics-server -n kube-system

# Check pod metrics
kubectl top pod -n thunderbolt-staging
kubectl top node
```

### Issue: Health endpoints returning errors

```bash
# Check backend pod logs
kubectl logs deployment/backend -n thunderbolt-staging | grep -i health

# Verify circuit breaker initialization
kubectl exec -it deployment/backend -n thunderbolt-staging -- \
  curl http://localhost:5000/health/detailed

# Check database connectivity
kubectl run -it --rm psql-check --image=postgres:15 -- \
  psql -h postgres.thunderbolt-staging -U postgres -c "SELECT 1"
```

---

## Sign-Off Checklist

After 48-hour validation:

- [ ] All pods running and healthy
- [ ] Health endpoints returning correct status
- [ ] Circuit breakers triggered and recovered correctly
- [ ] Pod Disruption Budgets preventing cascade failures
- [ ] Horizontal Pod Autoscaler scaling properly
- [ ] Secrets managed externally (no hardcoded values)
- [ ] No errors in logs for 24+ hours
- [ ] Load testing completed successfully
- [ ] Chaos testing completed successfully
- [ ] Monitoring and alerting configured
- [ ] Runbooks tested and updated
- [ ] Documentation reviewed and approved

**Ready for Production**: ✅ (after all checkboxes marked)

---

## Next Steps

After successful staging validation:

1. **Code Review**: Review Sprint 0 code with security team
2. **Staging Sign-Off**: Get approval from infrastructure team
3. **Production Deployment**: Deploy to production using same process
4. **Production Validation**: 24-hour monitoring in production
5. **Sprint 1 Deployment**: Begin Sprint 1 (iOS PowerSync Integration)

---

**Questions?** See `deploy/docs/TROUBLESHOOTING_GUIDE.md` or `deploy/docs/INCIDENT_RESPONSE.md`

**Estimated Timeline**: 2-3 hours deployment + 48 hours validation = **2.5 days total**
