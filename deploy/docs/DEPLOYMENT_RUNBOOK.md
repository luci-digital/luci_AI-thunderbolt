# Deployment Runbook: Thunderbolt AIFAM Platform

> **InfluxData Pattern Reference:** This runbook follows the operational patterns from InfluxData's enterprise deployment guides, including prerequisites validation, step-by-step procedures, secrets management, health checks, rollback procedures, and estimated times. See `docs/operations-patterns.md` for reference architecture.

**Status:** Production-ready | **Last Updated:** 2026-06-28 | **Estimated Time:** 30–45 minutes

---

## Quick Links
- [Prerequisites Checklist](#prerequisites-checklist)
- [Pre-Deployment Validation](#pre-deployment-validation)
- [Deployment Procedures](#deployment-procedures)
- [Post-Deployment Validation](#post-deployment-validation)
- [Rollback Procedures](#rollback-procedures)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites Checklist

Complete all items before proceeding to deployment. Estimated time: 10 minutes.

### Infrastructure Requirements

- [ ] **Kubernetes cluster** 1.28+ (GKE, EKS, AKS, on-prem, or `kind`/`minikube` for dev)
  - **Command to verify:**
    ```bash
    kubectl version --short
    # Expected: Client Version: v1.28+, Server Version: v1.28+
    ```
  - **Issue:** Older clusters may lack Pod Disruption Budgets or other required APIs
  - **Resolution:** Upgrade cluster using your cloud provider's documented procedure

- [ ] **Helm 3.12+** installed locally
  - **Command to verify:**
    ```bash
    helm version --short
    # Expected: v3.12+
    ```
  - **Installation:** https://helm.sh/docs/intro/install/

- [ ] **kubectl 1.28+** installed locally
  - **Command to verify:**
    ```bash
    kubectl version --short
    ```

- [ ] **Network connectivity** to your cluster (kubeconfig configured)
  - **Command to verify:**
    ```bash
    kubectl cluster-info
    # Expected: Kubernetes control plane is running at https://...
    ```
  - **Issue:** Cannot connect to cluster
  - **Resolution:** Verify `~/.kube/config` or set `KUBECONFIG` environment variable

- [ ] **cert-manager 1.12+** installed in cluster (for TLS certificates)
  - **Command to verify:**
    ```bash
    kubectl get deployment -n cert-manager
    # Expected: cert-manager, cert-manager-cainjector, cert-manager-webhook
    ```
  - **Installation if missing:**
    ```bash
    helm repo add jetstack https://charts.jetstack.io
    helm repo update
    helm install cert-manager jetstack/cert-manager \
      --namespace cert-manager --create-namespace \
      --set installCRDs=true
    ```

- [ ] **ingress-nginx 4.8+** installed in cluster (for request routing)
  - **Command to verify:**
    ```bash
    kubectl get deployment -n ingress-nginx
    # Expected: ingress-nginx-controller
    ```
  - **Installation if missing (choose one):**
    
    **For kind:**
    ```bash
    kubectl apply -f https://kind.sigs.k8s.io/examples/ingress/deploy-ingress-nginx.yaml
    kubectl wait --namespace ingress-nginx --for=condition=ready pod \
      --selector=app.kubernetes.io/component=controller --timeout=120s
    ```
    
    **For cloud clusters:**
    ```bash
    helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
    helm repo update
    helm install ingress-nginx ingress-nginx/ingress-nginx \
      -n ingress-nginx --create-namespace \
      --set controller.service.type=LoadBalancer
    ```

- [ ] **Default StorageClass** available for Postgres persistent volume
  - **Command to verify:**
    ```bash
    kubectl get storageclass
    # Expected: at least one class with (default) marker, e.g., "standard (default)"
    ```
  - **Issue:** No storage class
  - **Resolution:** Create one via your cloud provider or use local storage (dev only)

- [ ] **Resource quota** in target namespace (if using quota-per-namespace policy)
  - **Command to verify:**
    ```bash
    kubectl describe resourcequota -n thunderbolt 2>/dev/null || echo "No quota set"
    ```
  - **Minimum required:**
    - CPU: 4 cores (dev: 2 cores)
    - Memory: 8 Gi (dev: 4 Gi)
    - Storage: 20 Gi

### Access Requirements

- [ ] **Cluster admin access** or namespace-level admin in target namespace
  - **Verify:**
    ```bash
    kubectl auth can-i create namespaces
    # Expected: yes
    ```

- [ ] **Image registry access** (if using private images)
  - For public images (`ghcr.io/thunderbird/thunderbolt/*`): no setup needed
  - For private registry: create `imagePullSecret` (see [Secrets Setup](#secrets-setup))

- [ ] **DNS or ingress hostname** (production deployments)
  - DNS record pointing to ingress load balancer IP
  - Or use local `/etc/hosts` entry for testing

### Secrets Preparation

- [ ] Generate **Better Auth secret** (asymmetric signing key for session tokens)
  - **Command:**
    ```bash
    BETTER_AUTH_SECRET=$(openssl rand -base64 32 | tr -d '\n' | base64)
    echo "Save this for next step: $BETTER_AUTH_SECRET"
    ```

- [ ] (Optional) Prepare **AI provider keys** if using server-side inference
  - Anthropic, OpenAI, or other provider API keys
  - Will be base64-encoded and stored as Kubernetes secrets

- [ ] (Optional) Prepare **Keycloak admin credentials** for realm management
  - Defaults to `admin` / auto-generated password
  - For production, specify in `values.yaml`

---

## Pre-Deployment Validation

Run these checks to catch issues before deployment. Estimated time: 5 minutes.

### 1. Cluster Health Check

```bash
# Verify all nodes are Ready
kubectl get nodes -o wide

# Expected output (4+ Ready nodes for production; 1+ for dev):
# NAME           STATUS   ROLES          AGE   VERSION
# control-plane  Ready    control-plane  10d   v1.28.3
```

**Expected state:** All nodes in `Ready` status with at least 1 CPU and 2 Gi memory available.

**If nodes are NotReady:**
```bash
# Describe node to see issues
kubectl describe node <node-name>

# Check node logs
kubectl logs -n kube-system -l component=kubelet --tail=50
```

### 2. Available Capacity

```bash
# Check total available resources
kubectl describe nodes | grep -A 5 "Allocated resources"

# Expected: at least 4 CPU, 8 Gi memory available (2 CPU, 4 Gi for dev)
```

### 3. DNS Resolution

```bash
# Create a test pod to verify DNS works inside cluster
kubectl run -it --image=busybox:1.35 --restart=Never dnscheck -- nslookup kubernetes.default

# Expected output includes: Server: 10.x.x.x
```

### 4. Ingress Controller Status

```bash
# Verify ingress controller is running
kubectl get pod -n ingress-nginx -l app.kubernetes.io/name=ingress-nginx

# Expected: at least 1 pod in Running state
kubectl get service -n ingress-nginx ingress-nginx-controller

# Expected: external IP assigned or LoadBalancer Pending
```

**For kind (no LoadBalancer):**
```bash
# Ingress will be accessible via 127.0.0.1:80/443 (port forwarding)
kubectl port-forward -n ingress-nginx svc/ingress-nginx-controller 80:80 443:443
```

### 5. Helm Chart Validation

```bash
# Download and lint the chart
cd deploy/k8s

# Validate template rendering
helm template thunderbolt . \
  --set backend.betterAuthSecretBase64="test123==" \
  --namespace thunderbolt > /tmp/rendered.yaml

# Check for obvious errors
grep -i "error\|invalid" /tmp/rendered.yaml || echo "No template errors"

# Count resources that will be created
grep "^kind:" /tmp/rendered.yaml | wc -l
# Expected: ~15 resources (pods, services, configmaps, secrets, etc.)
```

### 6. Values File Validation

```bash
# Create a values file for your deployment
cat > /tmp/my-values.yaml <<'EOF'
appUrl: "https://thunderbolt.example.com"  # or http://localhost for dev
backend:
  betterAuthSecretBase64: "YOUR_SECRET_HERE"  # Replace with generated secret
  image:
    repository: "ghcr.io/thunderbird/thunderbolt/thunderbolt-backend"
    tag: "latest"  # Specify exact version for production
postgres:
  storage: "20Gi"  # Adjust based on data volume estimate
ingress:
  enabled: true
  host: "thunderbolt.example.com"  # or "" for localhost
EOF

# Validate syntax
helm lint deploy/k8s --values /tmp/my-values.yaml
# Expected: 0 error(s)
```

---

## Deployment Procedures

Follow these steps in order. Total time: 15–20 minutes. Each step includes rollback guidance.

### Step 1: Create Namespace

```bash
NAMESPACE="thunderbolt"
kubectl create namespace "$NAMESPACE"

# Verify
kubectl get namespace "$NAMESPACE"
# Expected: NAME        STATUS   AGE
#          thunderbolt   Active   3s
```

**Rollback:** `kubectl delete namespace thunderbolt`

### Step 2: Configure RBAC (Optional, for Multi-Tenant)

If deploying in a shared cluster with RBAC enforced:

```bash
# Create service account for Thunderbolt
kubectl create serviceaccount thunderbolt-admin -n "$NAMESPACE"

# Grant admin role in namespace
kubectl create rolebinding thunderbolt-admin \
  --clusterrole=admin \
  --serviceaccount="$NAMESPACE:thunderbolt-admin" \
  -n "$NAMESPACE"

# Verify
kubectl get rolebinding -n "$NAMESPACE"
```

**Rollback:** `kubectl delete serviceaccount,rolebinding thunderbolt-admin -n "$NAMESPACE"`

### Step 3: Create Secrets

#### 3a. Better Auth Secret (Required)

```bash
BETTER_AUTH_SECRET=$(openssl rand -base64 32 | tr -d '\n' | base64)

kubectl create secret generic thunderbolt-secrets \
  --from-literal=better-auth-secret="$BETTER_AUTH_SECRET" \
  -n "$NAMESPACE"

# Verify (secret content is base64, not readable)
kubectl get secret thunderbolt-secrets -n "$NAMESPACE" -o jsonpath='{.data}'
```

#### 3b. AI Provider Keys (Optional)

```bash
# If using Anthropic API server-side:
ANTHROPIC_KEY=$(echo "sk-ant-..." | base64 -w 0)  # Replace with actual key
kubectl patch secret thunderbolt-secrets \
  --type merge \
  -p "{\"data\":{\"anthropic-api-key\":\"$ANTHROPIC_KEY\"}}" \
  -n "$NAMESPACE"
```

#### 3c. Image Pull Secrets (If Using Private Registry)

```bash
# Create pull secret for private container registry
kubectl create secret docker-registry ghcr-pull-secret \
  --docker-server=ghcr.io \
  --docker-username=<github-username> \
  --docker-password=<github-token> \
  --docker-email=<email> \
  -n "$NAMESPACE"

# Verify
kubectl get secret ghcr-pull-secret -n "$NAMESPACE"
```

**Rollback:** `kubectl delete secret thunderbolt-secrets ghcr-pull-secret -n "$NAMESPACE"`

### Step 4: Add Helm Repository

```bash
# (If using official Thunderbolt Helm repo)
helm repo add thunderbolt https://helm.thunderbolt.example.com/
helm repo update

# Verify
helm repo list | grep thunderbolt
```

Or use local chart:
```bash
cd deploy/k8s
```

### Step 5: Create Values File

Create a production values file with your specific configuration:

```bash
cat > /tmp/thunderbolt-values.yaml <<'EOF'
# Thunderbolt Deployment Configuration

appUrl: "https://thunderbolt.example.com"

# Backend API server
backend:
  betterAuthSecretBase64: ""  # Will be injected from secret in next step
  image:
    repository: ghcr.io/thunderbird/thunderbolt/thunderbolt-backend
    tag: "v1.2.3"  # Use specific version, never "latest" in production
    pullPolicy: IfNotPresent
  replicas: 2  # For high availability
  resources:
    requests:
      cpu: 500m
      memory: 512Mi
    limits:
      cpu: 2
      memory: 2Gi

# Frontend SPA
frontend:
  image:
    repository: ghcr.io/thunderbird/thunderbolt/thunderbolt-frontend
    tag: "v1.2.3"
  replicas: 2
  resources:
    requests:
      cpu: 100m
      memory: 128Mi
    limits:
      cpu: 500m
      memory: 512Mi

# PostgreSQL database
postgres:
  storage: 20Gi  # Adjust based on data volume
  resources:
    requests:
      cpu: 500m
      memory: 1Gi
    limits:
      cpu: 1
      memory: 2Gi

# Keycloak OIDC provider
keycloak:
  replicas: 1
  resources:
    requests:
      cpu: 250m
      memory: 512Mi

# PowerSync real-time sync
powersync:
  replicas: 1
  resources:
    requests:
      cpu: 250m
      memory: 256Mi

# Ingress configuration
ingress:
  enabled: true
  host: "thunderbolt.example.com"
  tls:
    enabled: true
    issuer: "letsencrypt-prod"  # Use cert-manager

# Node affinity for HA (optional)
affinity:
  podAntiAffinity:
    preferredDuringSchedulingIgnoredDuringExecution:
      - weight: 100
        podAffinityTerm:
          labelSelector:
            matchExpressions:
              - key: app
                operator: In
                values: ["backend", "frontend", "powersync"]
          topologyKey: kubernetes.io/hostname
EOF

# Verify file is valid YAML
cat /tmp/thunderbolt-values.yaml | head -20
```

### Step 6: Install Helm Chart

```bash
NAMESPACE="thunderbolt"
RELEASE_NAME="thunderbolt"
CHART_PATH="deploy/k8s"  # or "thunderbolt/thunderbolt" if using repo

# Read the secret value we created earlier
BETTER_AUTH_SECRET=$(kubectl get secret thunderbolt-secrets -n "$NAMESPACE" \
  -o jsonpath='{.data.better-auth-secret}' | base64 -d)

# Install
helm install "$RELEASE_NAME" "$CHART_PATH" \
  --namespace "$NAMESPACE" \
  --values /tmp/thunderbolt-values.yaml \
  --set backend.betterAuthSecretBase64="$BETTER_AUTH_SECRET" \
  --timeout 10m \
  --wait

# Expected output:
# NAME: thunderbolt
# NAMESPACE: thunderbolt
# STATUS: deployed
# REVISION: 1
```

**Troubleshooting helm install failures:**
```bash
# Check for syntax errors
helm template "$RELEASE_NAME" "$CHART_PATH" \
  --namespace "$NAMESPACE" \
  --values /tmp/thunderbolt-values.yaml > /tmp/rendered.yaml

# Render and check
grep -i "error" /tmp/rendered.yaml | head -5

# Dry run to catch issues before actual install
helm install "$RELEASE_NAME" "$CHART_PATH" \
  --namespace "$NAMESPACE" \
  --values /tmp/thunderbolt-values.yaml \
  --dry-run --debug
```

**Rollback:** `helm uninstall thunderbolt -n thunderbolt`

### Step 7: Monitor Pod Startup

```bash
# Watch pods come up (Ctrl+C to exit)
kubectl get pods -n "$NAMESPACE" -w

# Expected sequence:
# 1. postgres-0 Ready first (~1-2 min)
# 2. keycloak, frontend, marketing Ready next (~2-3 min)
# 3. backend, powersync may restart 1-2 times while postgres becomes fully ready
# 4. All pods eventually reach 1/1 Running state

# Total expected time: 3–5 minutes
```

### Step 8: Wait for Healthy State

```bash
# Wait for all deployments to be ready
kubectl rollout status deployment -n "$NAMESPACE" --timeout=5m

# Expected output:
# deployment.apps/backend rolled out successfully
# deployment.apps/frontend rolled out successfully
# ...

# Check service readiness
kubectl get svc -n "$NAMESPACE"

# Expected:
# NAME          TYPE           CLUSTER-IP       EXTERNAL-IP      PORT(S)
# backend       ClusterIP      10.96.x.x        <none>           8000/TCP
# frontend      ClusterIP      10.96.x.x        <none>           80/TCP
# postgres      ClusterIP      10.96.x.x        <none>           5432/TCP
# ...
```

---

## Post-Deployment Validation

Run these tests to verify all systems are working. Estimated time: 10 minutes.

### Test 1: Pod Health

```bash
# Check all pods are running and ready
kubectl get pods -n thunderbolt

# Expected:
# NAME                          READY   STATUS    RESTARTS   AGE
# backend-xyz-abc123            1/1     Running   0          3m
# frontend-xyz-def456           1/1     Running   0          3m
# postgres-0                    1/1     Running   0          4m
# keycloak-xyz-ghi789           1/1     Running   0          3m
# powersync-xyz-jkl012          1/1     Running   0          3m

# If any pod shows CrashLoopBackOff or pending, investigate:
kubectl describe pod <pod-name> -n thunderbolt
kubectl logs <pod-name> -n thunderbolt --tail=50
```

### Test 2: Service Connectivity

```bash
# Test backend API health
BACKEND_POD=$(kubectl get pod -n thunderbolt -l app=backend -o jsonpath='{.items[0].metadata.name}')
kubectl exec -it "$BACKEND_POD" -n thunderbolt -- curl -s http://localhost:8000/health

# Expected output: {"status":"ok"} or similar health indicator
```

### Test 3: Database Connectivity

```bash
# Test Postgres connection from backend
BACKEND_POD=$(kubectl get pod -n thunderbolt -l app=backend -o jsonpath='{.items[0].metadata.name}')
kubectl exec -it "$BACKEND_POD" -n thunderbolt -- psql -h postgres -U thunderbolt -d thunderbolt -c "SELECT version();" 2>&1 | grep -i postgres

# Expected: PostgreSQL version info
```

### Test 4: Ingress Access

```bash
# Get ingress address
kubectl get ingress -n thunderbolt -o wide

# For cloud clusters with LoadBalancer:
INGRESS_IP=$(kubectl get ingress -n thunderbolt -o jsonpath='{.items[0].status.loadBalancer.ingress[0].ip}')
echo "Ingress IP: $INGRESS_IP"

# For local kind/minikube setup, use port forwarding:
# kubectl port-forward -n ingress-nginx svc/ingress-nginx-controller 8080:80 &
# Then access: http://localhost:8080

# Test connectivity
curl -v http://$INGRESS_IP/ 2>&1 | head -20

# Expected: HTTP 200 or 302 (redirect to frontend)
```

### Test 5: End-to-End User Signup

```bash
# 1. Open browser to ingress address or localhost
#    (For kind: http://localhost:8080)
# 2. Click "Sign Up"
# 3. Enter email and password
# 4. Submit
# 5. Expected: Redirect to Keycloak, then back to app

# If stuck on Keycloak login, check logs:
KEYCLOAK_POD=$(kubectl get pod -n thunderbolt -l app=keycloak -o jsonpath='{.items[0].metadata.name}')
kubectl logs "$KEYCLOAK_POD" -n thunderbolt --tail=100 | grep -i "error\|login\|realm"
```

### Test 6: PowerSync Replication

```bash
# Test PowerSync sync service health
POWERSYNC_POD=$(kubectl get pod -n thunderbolt -l app=powersync -o jsonpath='{.items[0].metadata.name}')
kubectl logs "$POWERSYNC_POD" -n thunderbolt --tail=50 | grep -i "connected\|replicat\|error"

# Expected: Messages about logical replication slot setup, no persistent errors
```

### Test 7: Persistent Volume Mounting

```bash
# Verify Postgres data is persisted
kubectl get pvc -n thunderbolt

# Expected:
# NAME         STATUS   VOLUME   CAPACITY   ACCESS MODES   STORAGECLASS
# postgres-pvc Bound    pvc-abc  20Gi       RWO            standard

# Check actual mount inside postgres pod
POSTGRES_POD=$(kubectl get pod -n thunderbolt -l app=postgres -o jsonpath='{.items[0].metadata.name}')
kubectl exec "$POSTGRES_POD" -n thunderbolt -- ls -lh /var/lib/postgresql/data/ | head -10
```

---

## Rollback Procedures

If deployment fails or you need to revert to a previous version:

### Option 1: Helm Rollback (Recommended)

```bash
# List deployment revisions
helm history thunderbolt -n thunderbolt

# Expected output:
# REVISION UPDATED                  STATUS     CHART              APP VERSION
# 1        Sat Jun 28 10:00:00 2026 SUPERSEDED thunderbolt-1.2.3  1.2.3
# 2        Sat Jun 28 10:15:00 2026 DEPLOYED   thunderbolt-1.2.4  1.2.4

# Rollback to previous revision
helm rollback thunderbolt 1 -n thunderbolt

# Verify rollback
kubectl get deployment -n thunderbolt -o wide

# Check pod restarts
kubectl get pods -n thunderbolt
```

**Expected behavior:** Pods will restart with the previous image version within 1-2 minutes.

### Option 2: Full Uninstall and Reinstall

```bash
# Backup data first (see Backup Procedures section)

# Uninstall
helm uninstall thunderbolt -n thunderbolt

# Wait for pods to terminate
kubectl get pods -n thunderbolt -w

# Reinstall with previous values/image tags
helm install thunderbolt deploy/k8s \
  -n thunderbolt \
  --values /tmp/previous-values.yaml

# Verify
kubectl get pods -n thunderbolt -w
```

### Option 3: Pod Restart (For Single Pod Issues)

```bash
# If only one pod is failing, delete it (Kubernetes will recreate it)
kubectl delete pod <pod-name> -n thunderbolt

# Wait for replacement pod to start
kubectl get pods -n thunderbolt -w
```

**Caution:** Only use this if you understand the issue is transient (network blip, temporary resource exhaustion, etc.).

---

## Upgrade Procedures

To deploy a new version of Thunderbolt:

### 1. Review Release Notes

Check GitHub releases or documentation for breaking changes, required migrations, or configuration updates.

### 2. Update Values File

```bash
# Update image tags in your values file
sed -i 's/tag: "v1.2.3"/tag: "v1.2.4"/' /tmp/thunderbolt-values.yaml
```

### 3. Dry Run

```bash
helm upgrade thunderbolt deploy/k8s \
  -n thunderbolt \
  --values /tmp/thunderbolt-values.yaml \
  --dry-run --debug | head -50
```

### 4. Perform Upgrade

```bash
# Upgrade (similar to install, but updates existing release)
helm upgrade thunderbolt deploy/k8s \
  -n thunderbolt \
  --values /tmp/thunderbolt-values.yaml \
  --timeout 10m \
  --wait

# Watch pods roll out
kubectl get pods -n thunderbolt -w

# Expected: Pods gradually terminate and restart with new image
```

### 5. Verify

```bash
# Check revision increased
helm history thunderbolt -n thunderbolt | head -3

# Verify all pods running
kubectl get pods -n thunderbolt

# Test a user action (sign in, send message, etc.)
```

---

## Secrets Setup

Production deployments require careful secrets management:

### Using Kubernetes Secrets

```bash
# Store in `secrets/` directory (NOT in version control)
cat > secrets/better-auth.txt <<'EOF'
YOUR_BASE64_ENCODED_SECRET_HERE
EOF

# Create secret from file
kubectl create secret generic thunderbolt-secrets \
  --from-file=better-auth-secret=secrets/better-auth.txt \
  -n thunderbolt

# Reference in Helm values
kubectl patch secret thunderbolt-secrets \
  --type merge \
  -p '{"stringData":{"better-auth-secret":"YOUR_SECRET"}}' \
  -n thunderbolt
```

### Using External Secrets Operator (ESO)

For integration with AWS Secrets Manager, HashiCorp Vault, or Azure Key Vault:

```bash
# Install ESO (prerequisite)
helm repo add external-secrets https://charts.external-secrets.io
helm install external-secrets external-secrets/external-secrets \
  -n external-secrets-system --create-namespace

# Create SecretStore (example: AWS Secrets Manager)
kubectl apply -f - <<'EOF'
apiVersion: external-secrets.io/v1beta1
kind: SecretStore
metadata:
  name: aws-secrets
  namespace: thunderbolt
spec:
  provider:
    aws:
      service: SecretsManager
      region: us-east-1
      auth:
        jwt:
          serviceAccountRef:
            name: external-secrets-sa
EOF

# Create ExternalSecret
kubectl apply -f - <<'EOF'
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: thunderbolt-secrets
  namespace: thunderbolt
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: aws-secrets
    kind: SecretStore
  target:
    name: thunderbolt-secrets
    creationPolicy: Owner
  data:
    - secretKey: better-auth-secret
      remoteRef:
        key: thunderbolt/better-auth-secret
EOF
```

---

## Troubleshooting

### Pods Stuck in Pending

**Symptoms:** Pods show `Pending` status after 5+ minutes.

**Diagnosis:**
```bash
kubectl describe pod <pod-name> -n thunderbolt
# Look for "Events" section at the end

# Common causes:
# - "Insufficient cpu" or "Insufficient memory"
# - "PersistentVolumeClaim" not bound
# - "nodes are unavailable"
```

**Solutions:**
- **Insufficient resources:** Add nodes or reduce resource requests
  ```bash
  kubectl describe nodes | grep -A 5 "Allocated resources"
  ```
- **PVC not bound:** Check PersistentVolume and StorageClass
  ```bash
  kubectl get pvc -n thunderbolt
  kubectl get pv
  ```
- **No nodes:** Add nodes to cluster via cloud provider console or `kind create node`

---

### Pods in CrashLoopBackOff

**Symptoms:** Pod restarts repeatedly; status shows `CrashLoopBackOff`.

**Diagnosis:**
```bash
# Check logs from last crash
kubectl logs <pod-name> -n thunderbolt --previous --tail=100

# Check current logs if pod is still running
kubectl logs <pod-name> -n thunderbolt --tail=100

# Get more detail
kubectl describe pod <pod-name> -n thunderbolt | tail -20
```

**Common Causes & Solutions:**

| Cause | Diagnosis | Solution |
|-------|-----------|----------|
| Database not ready | `backend` logs show `connect ECONNREFUSED postgres:5432` | Wait for postgres pod: `kubectl rollout status statefulset/postgres -n thunderbolt` |
| Missing secret | Logs show `Error: BETTER_AUTH_SECRET not set` | Verify secret exists: `kubectl get secret thunderbolt-secrets -n thunderbolt` |
| Bad image | Logs show `image not found` or pull errors | Check image repository and tag: `kubectl describe pod <pod> -n thunderbolt` \| grep Image |
| Resource exhaustion | Pod killed with OOM (Out of Memory) | Increase memory limits: `helm upgrade ... --set backend.resources.limits.memory=3Gi` |
| Config error | Logs show YAML or config parsing errors | Check `values.yaml` syntax: `helm lint deploy/k8s` |

---

### Service Not Accessible via Ingress

**Symptoms:** Can reach backend pods directly but not via ingress hostname.

**Diagnosis:**
```bash
# Check ingress resource
kubectl get ingress -n thunderbolt -o wide

# Describe ingress for errors
kubectl describe ingress -n thunderbolt

# Check ingress controller logs
kubectl logs -n ingress-nginx -l app.kubernetes.io/name=ingress-nginx --tail=100 | grep thunderbolt

# Test connectivity to backend service directly
kubectl port-forward svc/backend 8000:8000 -n thunderbolt &
curl http://localhost:8000/health
```

**Common Causes & Solutions:**

| Cause | Solution |
|-------|----------|
| Ingress host mismatch | Ensure DNS points to ingress IP: `nslookup thunderbolt.example.com` |
| TLS certificate not ready | Check cert-manager: `kubectl get certificate -n thunderbolt` |
| Service not ready | Verify backend deployment: `kubectl get svc -n thunderbolt` |
| Ingress controller not running | Check ingress-nginx: `kubectl get pod -n ingress-nginx` |

---

### High Memory or CPU Usage

**Symptoms:** Pods using more resources than expected; node pressure warnings.

**Diagnosis:**
```bash
# Check current resource usage
kubectl top pods -n thunderbolt
kubectl top nodes

# Check for resource limits vs requests mismatch
kubectl describe pod <pod-name> -n thunderbolt | grep -A 5 "Limits\|Requests"

# Check for memory leaks (Postgres)
POSTGRES_POD=$(kubectl get pod -n thunderbolt -l app=postgres -o jsonpath='{.items[0].metadata.name}')
kubectl exec "$POSTGRES_POD" -n thunderbolt -- psql -U thunderbolt -d thunderbolt -c "SELECT * FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;"
```

**Solutions:**
```bash
# Increase resource limits
helm upgrade thunderbolt deploy/k8s \
  -n thunderbolt \
  --values /tmp/thunderbolt-values.yaml \
  --set backend.resources.limits.memory=3Gi \
  --set backend.resources.limits.cpu=2

# Or kill memory leaking pods and let them restart
kubectl delete pod <pod-name> -n thunderbolt
```

---

### Database Migrations Failed

**Symptoms:** Backend pod restarts; logs show migration errors.

**Diagnosis:**
```bash
# Check backend logs for migration errors
BACKEND_POD=$(kubectl get pod -n thunderbolt -l app=backend -o jsonpath='{.items[0].metadata.name}')
kubectl logs "$BACKEND_POD" -n thunderbolt | grep -i "migrat\|error\|sql"

# Connect to postgres and check migration state
POSTGRES_POD=$(kubectl get pod -n thunderbolt -l app=postgres -o jsonpath='{.items[0].metadata.name}')
kubectl exec -it "$POSTGRES_POD" -n thunderbolt -- psql -U thunderbolt -d thunderbolt -c "SELECT * FROM schema_migrations ORDER BY version DESC LIMIT 5;"
```

**Solutions:**
```bash
# Rollback to previous release
helm rollback thunderbolt -n thunderbolt

# Or manually fix database state
# (Consult with database administrator if schema is corrupted)
```

---

### Keycloak Realm Not Loaded

**Symptoms:** Sign-in redirects to Keycloak but shows error; realm config missing.

**Diagnosis:**
```bash
# Check Keycloak logs
KEYCLOAK_POD=$(kubectl get pod -n thunderbolt -l app=keycloak -o jsonpath='{.items[0].metadata.name}')
kubectl logs "$KEYCLOAK_POD" -n thunderbolt | grep -i "realm\|import\|error" | tail -20

# Verify realm config in ConfigMap
kubectl get configmap -n thunderbolt -o yaml | grep -A 20 "keycloak-realm.json"
```

**Solutions:**
```bash
# Restart Keycloak pod to retrigger realm import
kubectl delete pod "$KEYCLOAK_POD" -n thunderbolt

# Or update realm config
kubectl patch configmap keycloak-realm-config \
  --type merge \
  -p '{"data":{"realm.json":"'"$(cat config/keycloak-realm.json | jq -c)"'"}}' \
  -n thunderbolt
```

---

## Backup and Disaster Recovery

### Backup Postgres Data

```bash
# Backup via pg_dump
POSTGRES_POD=$(kubectl get pod -n thunderbolt -l app=postgres -o jsonpath='{.items[0].metadata.name}')

kubectl exec "$POSTGRES_POD" -n thunderbolt -- pg_dump \
  -U thunderbolt \
  -d thunderbolt \
  -F c \
  > /backups/thunderbolt-$(date +%Y%m%d-%H%M%S).dump

# Verify backup size
ls -lh /backups/thunderbolt-*.dump | tail -1
```

### Backup PersistentVolumes

```bash
# Take a snapshot via cloud provider
# (AWS EBS, Azure Managed Disks, GCP Persistent Disks)

# Or use velero for cluster-wide backups:
velero backup create thunderbolt-backup --selector app=thunderbolt -n thunderbolt
velero backup logs thunderbolt-backup
```

### Restore from Backup

```bash
# Restore from pg_dump
POSTGRES_POD=$(kubectl get pod -n thunderbolt -l app=postgres -o jsonpath='{.items[0].metadata.name}')

kubectl exec -i "$POSTGRES_POD" -n thunderbolt -- pg_restore \
  -U thunderbolt \
  -d thunderbolt \
  < /backups/thunderbolt-20260628-100000.dump

# Or use velero
velero restore create --from-backup thunderbolt-backup
```

---

## Maintenance Windows

### Scheduling Downtime (If Required)

```bash
# Create a maintenance notice for users
kubectl patch configmap app-config -n thunderbolt \
  --type merge \
  -p '{"data":{"maintenance_mode":"true"}}'

# Scale down to single replica (reduce data to sync)
kubectl scale deployment backend --replicas=1 -n thunderbolt
kubectl scale deployment frontend --replicas=1 -n thunderbolt

# Perform maintenance

# Scale back up
kubectl scale deployment backend --replicas=2 -n thunderbolt
kubectl scale deployment frontend --replicas=2 -n thunderbolt

# Remove maintenance notice
kubectl patch configmap app-config -n thunderbolt \
  --type merge \
  -p '{"data":{"maintenance_mode":"false"}}'
```

---

## Estimated Deployment Times

| Phase | Duration | Notes |
|-------|----------|-------|
| Prerequisites validation | 10 min | Cluster & tool setup checks |
| Pre-deployment validation | 5 min | Health checks, capacity verification |
| Secrets creation | 2 min | kubectl commands |
| Helm install | 3–5 min | Parallelized pod startup |
| Pod startup | 3–5 min | Postgres takes longest |
| Post-deployment tests | 5 min | Service health & user flow |
| **Total** | **30–45 min** | First-time deployment |

**Subsequent upgrades:** 10–15 minutes (pods restart rolling, no database init).

---

## Contact & Support

- **Documentation:** `/deploy/docs/`
- **Kubernetes docs:** https://kubernetes.io/docs/
- **Helm docs:** https://helm.sh/docs/
- **Troubleshooting:** See "Troubleshooting" section above
- **Community:** GitHub Issues or Slack
