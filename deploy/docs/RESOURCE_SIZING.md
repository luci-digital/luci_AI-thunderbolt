# Resource Sizing and High Availability Guide

This document explains how to size Kubernetes resource requests and limits for Thunderbolt components, and how to scale the system for different workloads.

## Overview

Every container in the Helm chart now specifies:

- **Resource Requests**: Minimum guaranteed resources (CPU, memory) for scheduling
- **Resource Limits**: Maximum resources a container can consume
- **Horizontal Pod Autoscaler (HPA)**: Automatic scaling based on utilization metrics
- **Pod Disruption Budget (PDB)**: High availability during node maintenance

## Component Resource Matrix

### Stateless Services (Autoscaled)

These services are stateless and scale horizontally based on CPU and memory utilization.

| Component | Request CPU | Request Memory | Limit CPU | Limit Memory | Min Replicas | Max Replicas | Scale Trigger |
|-----------|-------------|----------------|-----------|--------------|--------------|--------------|---------------|
| Backend | 250m | 512Mi | 1000m | 1Gi | 2 | 10 | CPU 70% / Memory 80% |
| Frontend | 100m | 128Mi | 500m | 256Mi | 2 | 5 | CPU 75% |
| PowerSync | 250m | 256Mi | 1000m | 1Gi | 2 | 5 | CPU 70% |

### Stateful Services (Manual Scaling)

These services do NOT autoscale. To scale, edit the StatefulSet replicas manually.

| Component | Request CPU | Request Memory | Limit CPU | Limit Memory | Replicas | Notes |
|-----------|-------------|----------------|-----------|--------------|----------|-------|
| PostgreSQL | 500m | 1Gi | 2000m | 2Gi | 1 | StatefulSet; shared_buffers = 256MB |
| Keycloak | 500m | 512Mi | 2000m | 1Gi | 1 | Single auth instance; JVM heap = 768MB |

## Understanding Requests vs. Limits

### Resource Request
- **Purpose**: Tells Kubernetes "I need at least this much"
- **Used for**: Scheduling decisions and PDB calculations
- **Effect**: Pod is guaranteed this much; scheduler won't place pod on node if available resources < request
- **Example**: `cpu: 250m, memory: 512Mi` means the pod needs at least 0.25 CPU and 512MB RAM

### Resource Limit
- **Purpose**: "Don't let me use more than this"
- **Used for**: Enforcement at runtime via cgroups
- **Effect**: Kernel will throttle CPU; OOMKill process if memory exceeds limit
- **Example**: `cpu: 1000m, memory: 1Gi` means the pod will be killed if it uses >1GB RAM

## Measuring Current Usage

Check actual pod resource consumption:

```bash
# Real-time resource usage (requires metrics-server in cluster)
kubectl top pods -n <namespace>

# Get pod memory usage and compare to limits
kubectl top pods -n default --containers

# Get detailed pod resource info
kubectl describe pod <pod-name> -n <namespace>

# Check if any pods are being OOMKilled
kubectl get events -n <namespace> --sort-by='.lastTimestamp' | grep -i "oom\|kill"
```

## Sizing for Different Workloads

### Small Deployment (10 concurrent users, dev/testing)

Suitable for local development, CI/CD testing, or small internal deployments.

```yaml
backend:
  replicas: 1
  resources:
    requests: { cpu: 100m, memory: 256Mi }
    limits: { cpu: 500m, memory: 512Mi }
  autoscaling:
    enabled: false  # Disable HPA for dev

frontend:
  replicas: 1
  resources:
    requests: { cpu: 50m, memory: 64Mi }
    limits: { cpu: 250m, memory: 128Mi }
  autoscaling:
    enabled: false

powersync:
  replicas: 1
  resources:
    requests: { cpu: 100m, memory: 128Mi }
    limits: { cpu: 500m, memory: 256Mi }
  autoscaling:
    enabled: false

postgres:
  resources:
    requests: { cpu: 250m, memory: 512Mi }
    limits: { cpu: 1000m, memory: 1Gi }
```

### Medium Deployment (100 concurrent users, staging)

Suitable for staging environments and small production deployments.

```yaml
backend:
  replicas: 2
  resources:
    requests: { cpu: 250m, memory: 512Mi }
    limits: { cpu: 1000m, memory: 1Gi }
  autoscaling:
    enabled: true
    minReplicas: 2
    maxReplicas: 5
    targetCPUUtilizationPercentage: 70

frontend:
  replicas: 2
  resources:
    requests: { cpu: 100m, memory: 128Mi }
    limits: { cpu: 500m, memory: 256Mi }
  autoscaling:
    enabled: true
    minReplicas: 2
    maxReplicas: 3

powersync:
  replicas: 2
  resources:
    requests: { cpu: 250m, memory: 256Mi }
    limits: { cpu: 1000m, memory: 1Gi }
  autoscaling:
    enabled: true
    minReplicas: 2
    maxReplicas: 3

postgres:
  resources:
    requests: { cpu: 500m, memory: 1Gi }
    limits: { cpu: 2000m, memory: 2Gi }
```

### Large Deployment (1000+ concurrent users, production)

Suitable for production environments with high traffic and availability requirements.

```yaml
backend:
  replicas: 3
  resources:
    requests: { cpu: 500m, memory: 1Gi }
    limits: { cpu: 2000m, memory: 2Gi }
  autoscaling:
    enabled: true
    minReplicas: 3
    maxReplicas: 15
    targetCPUUtilizationPercentage: 65

frontend:
  replicas: 3
  resources:
    requests: { cpu: 200m, memory: 256Mi }
    limits: { cpu: 1000m, memory: 512Mi }
  autoscaling:
    enabled: true
    minReplicas: 3
    maxReplicas: 10

powersync:
  replicas: 3
  resources:
    requests: { cpu: 500m, memory: 512Mi }
    limits: { cpu: 1500m, memory: 1.5Gi }
  autoscaling:
    enabled: true
    minReplicas: 3
    maxReplicas: 8

postgres:
  resources:
    requests: { cpu: 1000m, memory: 4Gi }
    limits: { cpu: 4000m, memory: 8Gi }

keycloak:
  replicas: 2  # Manual scale only; no autoscaling
  resources:
    requests: { cpu: 1000m, memory: 1Gi }
    limits: { cpu: 2000m, memory: 2Gi }
```

## How Horizontal Pod Autoscaler (HPA) Works

### Scaling Trigger
HPA monitors resource metrics every 15 seconds by default and compares against targets:

```
Current Utilization = (sum of actual usage) / (sum of requests) × 100

Scale-up trigger: Current Utilization > Target Utilization
Scale-down trigger: Current Utilization < Target Utilization × 0.8
```

### Example
If backend has 2 pods with 250m request each (500m total) and average CPU usage is 250m:
- Current utilization: 250m / 500m × 100 = 50%
- Target: 70%
- **Action**: No scaling (50% < 70%)

If traffic increases and CPU goes to 420m:
- Current utilization: 420m / 500m × 100 = 84%
- Target: 70%
- **Action**: Scale up to 3 pods after 60s stabilization window

### Scaling Behavior

The HPA in this chart is configured with:

**Scale-Up Policy**:
- Stabilization: 60 seconds (wait 60s before deciding to scale up again)
- Growth: 100% per 30 seconds (can double replicas every 30s if needed)
- Allows rapid scale-up during traffic spikes

**Scale-Down Policy**:
- Stabilization: 300 seconds (conservative; waits 5 minutes before scaling down)
- Reduction: 10% per 60 seconds (reduce by 10% every 60s)
- Prevents thrashing when traffic drops temporarily

### Scaling Latency

Typical time from utilization spike to new pods ready:
1. **Detection**: ~15 seconds (metric collection interval)
2. **Stabilization**: 60 seconds (scale-up window)
3. **Scheduling**: 10-30 seconds (finding available nodes)
4. **Image pull**: 10-30 seconds (depends on image size and registry)
5. **Startup**: 5-15 seconds (application startup time)

**Total**: 100-150 seconds (1.5-2.5 minutes)

To reduce latency:
- Pre-pull container images on worker nodes
- Use smaller images
- Optimize application startup time
- Lower stabilization window (risky; causes thrashing)

## Pod Disruption Budgets (PDB)

PDBs prevent simultaneous disruption of critical pods during:
- Node drain (updates, decommissioning)
- Cluster autoscaler scale-down
- Manual pod eviction

### Configured PDBs

| Component | min Available | Effect |
|-----------|---------------|--------|
| Backend | 1 | At least 1 backend pod must stay running |
| Frontend | 1 | At least 1 frontend pod must stay running |
| PowerSync | 1 | At least 1 PowerSync pod must stay running |
| PostgreSQL | None | StatefulSet; no PDB (single pod, no scaling) |
| Keycloak | None | Single auth pod; no PDB (prevents maintenance) |

### Why No PDB for Postgres/Keycloak?

- **Postgres**: Single-pod StatefulSet. A PDB with `minAvailable: 1` would be meaningless (already enforced) and might block legitimate maintenance.
- **Keycloak**: Single OIDC provider. During maintenance, some requests must fail or wait. A PDB won't help and would block cluster operations.

### Testing PDB

```bash
# View configured PDBs
kubectl get poddisruptionbudgets -n default

# Simulate eviction and check if PDB prevents it
kubectl evict pod <pod-name> -n <namespace>
# Will fail if violates PDB; succeeds if allowed

# Drain node (respects PDBs)
kubectl drain <node-name> --ignore-daemonsets
# Will not drain pods that would violate PDB
```

## Database Tuning for Resource Limits

### PostgreSQL

Adjust these environment variables based on memory limit:

```yaml
# For 1Gi limit (25% rule)
- name: POSTGRES_INIT_ARGS
  value: "-c shared_buffers=256MB -c effective_cache_size=768MB -c work_mem=16MB"

# For 2Gi limit (25% rule)
- name: POSTGRES_INIT_ARGS
  value: "-c shared_buffers=512MB -c effective_cache_size=1536MB -c work_mem=32MB"

# For 4Gi limit (25% rule)
- name: POSTGRES_INIT_ARGS
  value: "-c shared_buffers=1GB -c effective_cache_size=3GB -c work_mem=64MB"
```

**Key settings**:
- `shared_buffers`: 25% of available memory
- `effective_cache_size`: 75% of available memory
- `work_mem`: Per-operation memory (shared_buffers / max_connections)

### Keycloak (Java)

Adjust JVM heap based on memory limit:

```yaml
# For 1Gi limit
- name: JAVA_OPTS
  value: "-Xmx768m -Xms768m"

# For 2Gi limit
- name: JAVA_OPTS
  value: "-Xmx1536m -Xms1536m"
```

**Rule of thumb**: Set `-Xmx` to 75-80% of memory limit.

## Troubleshooting

### Pod stuck in Pending state

```bash
kubectl describe pod <pod-name> -n <namespace>
```

Common causes:
- **Insufficient CPU/memory**: Increase `requests`, remove limits, or scale down other pods
- **PDB prevents scaling**: Temporarily disable PDB if needed: `kubectl delete pdb <pdb-name>`
- **Node selector mismatch**: Check node labels and affinity rules

### Pod OOMKilled (killed due to memory)

```bash
kubectl logs <pod-name> -n <namespace>
kubectl describe pod <pod-name> -n <namespace>  # Check status.lastState.terminated
```

Solutions:
- Increase `limits.memory` in values.yaml
- Reduce concurrent connections/requests
- Optimize application memory usage
- Upgrade to larger node machines

### HPA not scaling (stuck at minReplicas)

```bash
kubectl describe hpa <hpa-name> -n <namespace>
```

Common causes:
- **Metrics-server not installed**: `kubectl get deployment metrics-server -n kube-system`
- **Metrics not available**: Wait 1-2 minutes for metrics to populate
- **Target CPU too low**: Increase traffic to exceed target utilization
- **HPA disabled**: Check `autoscaling.enabled: true` in values.yaml

### High latency between scaling decision and new pod ready

1. Check if images are pre-pulled: `kubectl describe node <node-name> | grep -A 5 Images`
2. Monitor: `kubectl top nodes` (if using large node types, consider splitting load)
3. Reduce stabilization window (risky): Change `stabilizationWindowSeconds: 60` to 30 in hpa.yaml

## Monitoring Recommendations

Install Prometheus + Grafana to track:

- **Pod resource usage**: Compare to requests/limits
- **HPA decisions**: When scaling occurred and why
- **Node capacity**: CPU/memory pressure on worker nodes
- **Evictions/failures**: OOMKilled, pending, failed pods

Example queries (Prometheus):
```promql
# Backend CPU utilization
sum(rate(container_cpu_usage_seconds_total{pod=~"backend-.*"}[5m])) / sum(kube_pod_container_resource_requests{pod=~"backend-.*", resource="cpu"})

# Current replica count
count(kube_pod_info{pod=~"backend-.*"})

# Memory usage vs limit
sum(container_memory_usage_bytes{pod=~"backend-.*"}) / sum(kube_pod_container_resource_limits{pod=~"backend-.*", resource="memory"})
```

## Deployment Strategy

When deploying new resource configurations:

1. **Test in dev/staging first** with real or simulated traffic
2. **Monitor closely** for the first 24-48 hours after production deployment
3. **Gradually roll out** to avoid overloading the cluster
4. **Keep previous values** in a git branch for quick rollback if needed

Example rollout (production):

```bash
# Day 1: Update replicas and resource requests only (no limits yet)
helm upgrade thunderbolt ./charts/thunderbolt -f values.yaml

# Monitor for 24 hours; if stable, proceed to day 2

# Day 2: Enable HPA and reduce limits gradually
helm upgrade thunderbolt ./charts/thunderbolt -f values.yaml

# Monitor for another 24-48 hours; scale resources up if needed
```

## References

- [Kubernetes Resource Management](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/)
- [Horizontal Pod Autoscaler](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/)
- [Pod Disruption Budgets](https://kubernetes.io/docs/tasks/run-application/configure-pdb/)
- [Metrics Server](https://github.com/kubernetes-sigs/metrics-server)
- [PostgreSQL Resource Tuning](https://wiki.postgresql.org/wiki/Performance_Optimization)
- [Keycloak Performance Tuning](https://www.keycloak.org/server/configuration-production)
