# Kubernetes Setup Guide: Thunderbolt AIFAM Platform

> **InfluxData Pattern Reference:** This guide covers cluster prerequisites, node preparation, networking, storage configuration, pod disruption budgets, and horizontal pod autoscaler setup based on InfluxData's Kubernetes deployment best practices.

**Status:** Production-ready | **Last Updated:** 2026-06-28

---

## Quick Links
- [Cluster Prerequisites](#cluster-prerequisites)
- [Node Configuration](#node-configuration)
- [Network Setup](#network-setup)
- [Storage Configuration](#storage-configuration)
- [Pod Disruption Budgets](#pod-disruption-budgets)
- [Horizontal Pod Autoscaling](#horizontal-pod-autoscaling)
- [Troubleshooting](#troubleshooting)

---

## Cluster Prerequisites

### Kubernetes Version

**Required:** Kubernetes 1.28+  
**Recommended:** Kubernetes 1.29+ (to ensure support for newer APIs)

```bash
# Verify cluster version
kubectl version --short
# Expected output:
# Client Version: v1.29.0
# Server Version: v1.29.0
```

### Cluster Size Recommendations

| Environment | Min Nodes | Total CPU | Total Memory | Storage | Notes |
|-------------|-----------|-----------|--------------|---------|-------|
| **Dev/Test** | 1 | 2 cores | 4 Gi | 20 Gi | Single node; no HA |
| **Staging** | 3 | 6 cores | 12 Gi | 50 Gi | Multi-node; pod affinity |
| **Production** | 5+ | 20+ cores | 40+ Gi | 100+ Gi | HA; node redundancy |

### Required Kubernetes Features

These features must be enabled:

```bash
# Check if API server has required flags
kubectl api-versions | grep -E "policy|storage|autoscaling"

# Expected to see:
# policy/v1
# policy/v1beta1 (for PDB)
# storage.k8s.io/v1
# autoscaling/v2
```

| Feature | Purpose | Verification |
|---------|---------|--------------|
| **Pod Disruption Budgets (PDB)** | Protect pods during node drain | `kubectl get pdb -A` should work |
| **Horizontal Pod Autoscaling (HPA)** | Scale replicas based on metrics | `kubectl api-resources \| grep hpa` should work |
| **Network Policies** | Restrict traffic between pods | `kubectl get networkpolicies -A` should work |
| **RBAC** | Role-based access control | `kubectl get rolebindings -A` should work |
| **Persistent Volumes** | Stateful storage for Postgres | `kubectl get pv` should work |

### Cluster Add-Ons Required

**Install these add-ons before deploying Thunderbolt:**

#### 1. Metrics Server (for HPA and kubectl top)

```bash
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

# Verify installation
kubectl get deployment metrics-server -n kube-system
# Expected: metrics-server in Deployed state
```

#### 2. Ingress Controller (nginx-ingress)

See `DEPLOYMENT_RUNBOOK.md` § Kubernetes Setup § ingress-nginx

#### 3. cert-manager (for TLS)

See `DEPLOYMENT_RUNBOOK.md` § Kubernetes Setup § cert-manager

#### 4. Storage Provisioner

```bash
# For cloud providers (AWS/GCP/Azure), default storage provisioner is included
# For on-prem/kind clusters, install local provisioner or NFS provisioner

# Check default storage class
kubectl get storageclass

# If none exist, create one (for kind):
kubectl apply -f - <<'EOF'
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: standard
  annotations:
    storageclass.kubernetes.io/is-default-class: "true"
provisioner: k8s.io/minikube-hostpath
EOF
```

---

## Node Configuration

### Node Requirements

Each node must meet these specifications:

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| **CPU** | 2 cores | 4 cores |
| **Memory** | 4 Gi | 8 Gi |
| **Disk** | 20 Gi | 50 Gi |
| **Max Pods** | 110 (default) | 250+ |

### Node Labels and Taints

Use labels to schedule workloads appropriately:

```bash
# Label nodes by workload type
kubectl label node node1 workload=compute
kubectl label node node2 workload=compute
kubectl label node node3 workload=database

# Verify labels
kubectl get nodes --show-labels

# (Optional) Taint database nodes to restrict other workloads
kubectl taint node node3 workload=database:NoSchedule
```

### kubelet Configuration

Verify important kubelet settings:

```bash
# Check max pods per node
kubectl describe node node1 | grep "Max Pods"
# Expected: 110+ (default, can increase)

# Increase max pods if needed (edit /etc/kubernetes/kubelet/kubelet-config.yaml)
# maxPods: 250
# Then restart kubelet service

# Check for resource reservation
kubectl describe node node1 | grep -A 5 "Allocated"
# Should show some resources reserved for system pods
```

### Node Drain and Cordoning

Before maintenance, safely evict pods from a node:

```bash
# Prevent new pods from scheduling on node
kubectl cordon node1

# Drain existing pods (this respects PDBs)
kubectl drain node1 --ignore-daemonsets --ignore-daemonset-pods

# Perform maintenance...

# Re-enable node for scheduling
kubectl uncordon node1

# Verify
kubectl get nodes
# node1 should be Ready, not Ready,SchedulingDisabled
```

---

## Network Setup

### Cluster Networking

Thunderbolt requires pod-to-pod networking:

```bash
# Test pod-to-pod connectivity
kubectl run -it --image=busybox:1.35 --restart=Never test-pod -- sh
# Inside pod:
# ping kubernetes.default
# nslookup kubernetes.default
# exit

kubectl delete pod test-pod
```

### Service Discovery (DNS)

Kubernetes provides internal DNS for services:

```bash
# Test DNS resolution
kubectl run -it --image=busybox:1.35 --restart=Never dns-test -- nslookup backend.thunderbolt.svc.cluster.local

# Expected output:
# Name:   backend.thunderbolt.svc.cluster.local
# Address: 10.x.x.x
```

**If DNS fails:**
```bash
# Check CoreDNS pods
kubectl get pods -n kube-system -l k8s-app=kube-dns

# Check CoreDNS logs
kubectl logs -n kube-system -l k8s-app=kube-dns --tail=50

# Restart CoreDNS if needed
kubectl rollout restart deployment -n kube-system coredns
```

### Network Policies (Optional but Recommended)

Restrict traffic between pods for security:

```bash
# Create network policy for Thunderbolt namespace
kubectl apply -f - <<'EOF'
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: thunderbolt-egress
  namespace: thunderbolt
spec:
  podSelector: {}  # Apply to all pods in namespace
  policyTypes:
    - Egress
  egress:
    # Allow DNS
    - to:
        - namespaceSelector:
            matchLabels:
              name: kube-system
      ports:
        - protocol: UDP
          port: 53
    # Allow inter-pod traffic
    - to:
        - podSelector: {}
    # Allow external API traffic (if needed)
    - to:
        - namespaceSelector: {}
      ports:
        - protocol: TCP
          port: 443
EOF

# Verify
kubectl get networkpolicies -n thunderbolt
```

### Ingress Configuration

See `DEPLOYMENT_RUNBOOK.md` § Ingress and Network

---

## Storage Configuration

### Persistent Volume Claims (PVCs)

Thunderbolt requires persistent storage for Postgres:

```bash
# Verify default storage class
kubectl get storageclass

# Expected output:
# NAME             PROVISIONER                    RECLAIMPOLICY
# standard         ebs.csi.aws.com                Delete
# (default)
```

**Storage requirements:**
- **Postgres:** 20 Gi minimum; recommended 50+ Gi
- **Prometheus (optional):** 50 Gi for 15-day retention
- **Loki (optional):** 10 Gi for 30-day log retention

### Dynamic Volume Provisioning

Modern clusters provision volumes automatically:

```bash
# Test PVC creation
kubectl apply -f - <<'EOF'
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: test-pvc
  namespace: default
spec:
  accessModes:
    - ReadWriteOnce
  storageClassName: standard
  resources:
    requests:
      storage: 1Gi
EOF

# Verify PVC bound to PV
kubectl get pvc test-pvc
# Status should be "Bound"

# Cleanup
kubectl delete pvc test-pvc
```

### Persistent Volume Backup

Backup volumes regularly to protect against data loss:

```bash
# Create snapshot of Postgres PVC (AWS example)
aws ec2 create-snapshot \
  --volume-id vol-12345 \
  --description "Thunderbolt Postgres backup $(date +%Y-%m-%d)"

# Restore from snapshot if needed
# (See DEPLOYMENT_RUNBOOK.md § Backup and Disaster Recovery)
```

### Volume Performance Tuning

Optimize storage performance for database:

```bash
# Check I/O latency
kubectl exec <postgres-pod> -n thunderbolt -- iostat -xz 1 1 | grep vda

# Key metrics:
# r_await, w_await: latency in ms (should be < 10ms for production)
# %util: % disk utilization (should be < 80%)

# If slow, consider:
# - Upgrade to faster storage class (SSD vs HDD)
# - Add SSD-specific storage class:
kubectl apply -f - <<'EOF'
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: fast-ssd
provisioner: ebs.csi.aws.com
parameters:
  type: gp3
  iops: "3000"
  throughput: "125"
EOF
```

---

## Pod Disruption Budgets

Pod Disruption Budgets (PDBs) protect pods during voluntary disruptions (node drain, cluster upgrade):

### Creating PDBs for Thunderbolt

```bash
# Ensure backend has ≥1 available pod at all times
kubectl apply -f - <<'EOF'
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: backend-pdb
  namespace: thunderbolt
spec:
  minAvailable: 1
  selector:
    matchLabels:
      app: backend
EOF

# For frontend
kubectl apply -f - <<'EOF'
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: frontend-pdb
  namespace: thunderbolt
spec:
  minAvailable: 1
  selector:
    matchLabels:
      app: frontend
EOF

# Postgres (StatefulSet) already has replica strategy
# For PowerSync
kubectl apply -f - <<'EOF'
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: powersync-pdb
  namespace: thunderbolt
spec:
  minAvailable: 1
  selector:
    matchLabels:
      app: powersync
EOF
```

### Testing PDB Behavior

```bash
# Verify PDB is enforced
kubectl get pdb -n thunderbolt

# Try to drain a node with Thunderbolt pods
kubectl drain node1 --ignore-daemonsets

# Expected: Kubernetes respects PDB and waits for new replicas to start
# On completion, old pod evicted

# Verify pod count remained ≥ minAvailable during drain
# (The eviction should fail until new pod is Running)
```

### Postgres Special Case

Postgres StatefulSet should not have minAvailable > 0 (single replica):

```bash
# Postgres does NOT have a PDB by design
# If you deploy Postgres with replicas:
# (Not typical for Thunderbolt; would require HA setup)

# Then create PDB:
kubectl apply -f - <<'EOF'
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: postgres-pdb
  namespace: thunderbolt
spec:
  minAvailable: 1
  selector:
    matchLabels:
      app: postgres
EOF
```

---

## Horizontal Pod Autoscaling

Automatically scale deployments based on CPU/memory load:

### Backend HPA

```bash
kubectl apply -f - <<'EOF'
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: backend-hpa
  namespace: thunderbolt
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: backend
  minReplicas: 2  # Always run ≥2 for HA
  maxReplicas: 10  # Scale up to 10 under load
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70  # Scale up if avg CPU > 70%
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80  # Scale up if avg memory > 80%
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300  # Wait 5 min before scaling down
      policies:
        - type: Percent
          value: 50  # Scale down by max 50% at a time
          periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0  # Scale up immediately
      policies:
        - type: Percent
          value: 100  # Scale up by 100% (double replicas)
          periodSeconds: 60
EOF

# Verify HPA
kubectl get hpa -n thunderbolt
kubectl describe hpa backend-hpa -n thunderbolt

# Watch scaling in action
kubectl get hpa backend-hpa -n thunderbolt -w
```

### Frontend HPA

```bash
kubectl apply -f - <<'EOF'
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: frontend-hpa
  namespace: thunderbolt
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: frontend
  minReplicas: 2
  maxReplicas: 5  # Frontend doesn't need to scale as much
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 80
EOF
```

### Testing HPA

```bash
# Generate load to trigger scaling
BACKEND_POD=$(kubectl get pod -n thunderbolt -l app=backend -o jsonpath='{.items[0].metadata.name}')
kubectl exec -it "$BACKEND_POD" -n thunderbolt -- \
  while true; do curl -s http://localhost:8000/health > /dev/null; done &

# Watch HPA scale up
kubectl get hpa backend-hpa -n thunderbolt -w

# After test, kill load generator
# kill %1  (in bash) or exit port-forward
```

### HPA Limits

Be aware of these constraints:

```bash
# Check resource limits on deployment
kubectl describe deployment backend -n thunderbolt | grep -A 5 "Limits\|Requests"

# HPA scales replicas but respects per-pod resource limits
# If total requested resources exceed node capacity, pods stay Pending

# Example: If each pod requests 2 cores and nodes only have 4 cores:
# Max 2 pods per node
# If HPA tries to scale to 3, 3rd pod stays Pending
# Check node capacity: kubectl top nodes
```

---

## Cluster Upgrade Procedures

### Pre-Upgrade Checklist

```bash
# 1. Verify cluster health
kubectl get nodes
# All should be Ready

# 2. Check for pod issues
kubectl get pods --all-namespaces | grep -v Running
# Should return headers only

# 3. Backup data
POSTGRES_POD=$(kubectl get pod -n thunderbolt -l app=postgres -o jsonpath='{.items[0].metadata.name}')
kubectl exec "$POSTGRES_POD" -n thunderbolt -- pg_dump -U thunderbolt -d thunderbolt > /tmp/pre-upgrade.dump

# 4. Drain and cordon nodes (one at a time)
for node in $(kubectl get nodes -o jsonpath='{.items[*].metadata.name}'); do
  kubectl cordon "$node"
  kubectl drain "$node" --ignore-daemonsets
  # Cloud provider: upgrade node
  kubectl uncordon "$node"
done
```

### Post-Upgrade Verification

```bash
# 1. Verify new version
kubectl version --short

# 2. Check all nodes Ready
kubectl get nodes

# 3. Verify all pods Running
kubectl get pods -n thunderbolt

# 4. Run smoke tests
curl -v https://thunderbolt.example.com/api/health
```

---

## Troubleshooting

### Cluster Not Ready

```bash
# Check nodes
kubectl get nodes
# If NotReady: kubectl describe node <node>

# Check system pods
kubectl get pods -n kube-system
# All should be Running

# Check for resource constraints
kubectl top nodes
# Memory/CPU should not be 100%

# Check cluster info
kubectl cluster-info dump | grep -i "error" | head -20
```

### PVC Not Binding

```bash
# Check PVC status
kubectl get pvc -n thunderbolt

# If Pending: describe for details
kubectl describe pvc postgres-pvc -n thunderbolt

# Check available PVs
kubectl get pv

# Check storage class
kubectl get storageclass

# If no default: mark one as default
kubectl patch storageclass <sc-name> -p '{"metadata": {"annotations":{"storageclass.kubernetes.io/is-default-class":"true"}}}'
```

### HPA Not Scaling

```bash
# Check HPA status
kubectl describe hpa backend-hpa -n thunderbolt

# Common issues:
# - Metrics not available: "unable to compute replica count"
#   → Check metrics-server: kubectl get deployment -n kube-system metrics-server
#
# - Targets not found: "unknown"
#   → Check deployment label selector matches HPA selector
#
# - Scaling throttled: "Waiting for scale-down window"
#   → HPA is respecting stabilization window; wait and try again

# View HPA events
kubectl get events -n thunderbolt | grep hpa

# View detailed metrics
kubectl get hpa backend-hpa -n thunderbolt -o jsonpath='{.status}' | jq .
```

---

## Performance Tuning

### Kubelet Tuning

Edit `/etc/kubernetes/kubelet/kubelet-config.yaml`:

```yaml
# Increase max pods
maxPods: 250

# Increase node capacity
systemReserved:
  cpu: 100m
  memory: 100Mi
  ephemeralStorage: 1Gi

kubeReserved:
  cpu: 100m
  memory: 100Mi
  ephemeralStorage: 1Gi

# Increase eviction thresholds
evictionHard:
  memory.available: "100Mi"
  nodefs.available: "10%"

evictionSoft:
  memory.available: "500Mi"
  nodefs.available: "20%"

evictionSoftGracePeriod:
  memory.available: "1m"
  nodefs.available: "2m"
```

Then restart kubelet:
```bash
sudo systemctl restart kubelet
```

### API Server Tuning

Edit `/etc/kubernetes/manifests/kube-apiserver.yaml`:

```yaml
spec:
  containers:
  - name: kube-apiserver
    command:
      - kube-apiserver
      - --max-requests-inflight=1000
      - --max-mutating-requests-inflight=500
      - --request-timeout=60s
      - --etcd-request-limit=100
```

Then restart API server (static pod will auto-restart).

---

See also: `DEPLOYMENT_RUNBOOK.md`, `MONITORING_AND_ALERTING.md`
