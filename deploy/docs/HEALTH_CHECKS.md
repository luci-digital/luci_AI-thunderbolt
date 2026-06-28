# Health Checks & Circuit Breaker Architecture

## Overview

The Thunderbolt backend implements a resilience layer to prevent cascade failures when downstream services are unavailable. This document describes the health check endpoints, circuit breaker behavior, and fallback strategies.

## Health Check Endpoints

### `GET /health/live` (Liveness Probe)

Used by Kubernetes liveness probes to determine if the pod should be restarted.

**Returns 200 OK if:**
- No circuit breakers exist (all systems initialized but not yet exercised), OR
- At least one circuit breaker is not in OPEN state (service attempted recovery)

**Returns 503 Service Unavailable if:**
- All circuit breakers are OPEN (complete failure)

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-06-28T12:34:56.789Z"
}
```

**Use case:** Quick check that the pod is alive. Does not require full system health.

---

### `GET /health/ready` (Readiness Probe)

Used by Kubernetes readiness probes to determine if the pod should receive traffic.

**Returns 200 OK if:**
- All circuit breakers are in CLOSED state, OR
- No circuit breakers exist yet

**Returns 503 Service Unavailable if:**
- Any circuit breaker is OPEN

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-06-28T12:34:56.789Z",
  "checks": {
    "circuits": {
      "status": "healthy",
      "details": {
        "postgres": "CLOSED",
        "oidc": "CLOSED"
      }
    }
  }
}
```

**Use case:** Traffic routing decision. Pod only receives traffic when fully healthy.

---

### `GET /health/detailed`

Detailed health status including circuit breaker telemetry.

**Response:**
```json
{
  "status": "degraded",
  "timestamp": "2024-06-28T12:34:56.789Z",
  "checks": {
    "circuits": {
      "status": "degraded",
      "details": [
        {
          "name": "postgres",
          "state": "CLOSED",
          "failureCount": 0,
          "successCount": 0,
          "nextAttemptTime": 1719590096789
        },
        {
          "name": "oidc",
          "state": "HALF_OPEN",
          "failureCount": 3,
          "successCount": 1,
          "nextAttemptTime": 1719590156789
        }
      ]
    }
  }
}
```

## Circuit Breaker States

### CLOSED (Normal)
- Service is healthy and responding normally
- All requests pass through to the backend

### OPEN (Failure)
- Service has failed more than `failureThreshold` times
- All new requests are rejected immediately with a 503 error
- No requests are sent to the failing service (prevents DOS)
- After `resetTimeout` (default: 60s), state transitions to HALF_OPEN

### HALF_OPEN (Recovering)
- Service has been unavailable, but we're testing if it recovered
- A limited number of requests are allowed through
- On success, transitions back to CLOSED
- On failure, transitions back to OPEN with refreshed `resetTimeout`

## Resilience Configuration

### Environment Variables

Add to `.env`:

```bash
# Circuit Breaker Configuration
# =============================

# Postgres Circuit Breaker
POSTGRES_CB_FAILURE_THRESHOLD=5          # Failures before opening
POSTGRES_CB_RESET_TIMEOUT_MS=60000       # Time to wait before half-open
POSTGRES_CB_HALF_OPEN_TIMEOUT_MS=30000   # Time to test recovery
POSTGRES_CB_SUCCESS_THRESHOLD=2          # Successes needed to close

# OIDC/Keycloak Circuit Breaker
OIDC_CB_FAILURE_THRESHOLD=5
OIDC_CB_RESET_TIMEOUT_MS=60000
OIDC_CB_HALF_OPEN_TIMEOUT_MS=30000
OIDC_CB_SUCCESS_THRESHOLD=2

# Backoff Configuration
BACKOFF_INITIAL_DELAY_MS=100             # Starting delay
BACKOFF_MAX_DELAY_MS=60000               # Maximum delay cap
BACKOFF_MAX_RETRIES=5                    # Max retry attempts
```

## Fallback Behaviors

### Postgres Unavailable

1. **Liveness:** Returns 503 after circuit opens (pod may be restarted by Kubernetes)
2. **Readiness:** Returns 503 (pod removed from load balancer)
3. **Graceful degradation:** For certain operations, stale data from cache may be used (if available)

**RTO/RPO:** 60 seconds to detect failure + attempt recovery; up to 5 minutes of requests rejected while circuit is open.

### OIDC/Keycloak Unavailable

1. **In-memory token cache:** Last valid tokens cached for 5 minutes
2. **When circuit OPEN:** Valid cached tokens returned for re-use
3. **When cache expires:** Returns 503 Service Unavailable (auth required)

**RTO/RPO:** 
- First 5 minutes: degraded auth using cached tokens
- After 5 minutes: auth unavailable

## Deployment Kubernetes YAML

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: thunderbolt-backend
spec:
  template:
    spec:
      containers:
      - name: api
        livenessProbe:
          httpGet:
            path: /health/live
            port: 8000
          initialDelaySeconds: 10
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 8000
          initialDelaySeconds: 5
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 2
```

## Monitoring & Alerting

### Prometheus Metrics

The following metrics are emitted:

- `circuit_breaker_state{service="postgres"|"oidc"}` — Current state (0=CLOSED, 1=HALF_OPEN, 2=OPEN)
- `circuit_breaker_transition{service=..., from=..., to=...}` — State transitions (counter)
- `retry_attempts_total{service=...}` — Total retry attempts (counter)
- `retry_delay_seconds{service=...}` — Delay before retry (histogram)

### Alert Rules

```yaml
# Critical: Circuit breaker opened
- alert: CircuitBreakerOpen
  expr: circuit_breaker_state >= 2
  for: 1m
  labels:
    severity: critical
  annotations:
    summary: "Circuit breaker {{ $labels.service }} is OPEN"

# Warning: High retry rate
- alert: HighRetryRate
  expr: rate(retry_attempts_total[5m]) > 0.5
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "High retry rate for {{ $labels.service }}"
```

## Testing Circuit Breaker Behavior

### Simulate Postgres Failure

```bash
# 1. Connect to Postgres and run:
SELECT pg_terminate_backend(pid) FROM pg_stat_activity;

# 2. Monitor health endpoint:
watch -n 1 curl -s http://localhost:8000/health/detailed | jq '.checks.circuits'

# 3. Observe:
# - Circuit transitions to HALF_OPEN after 60s
# - Circuit returns to CLOSED after successful recovery
```

### Simulate OIDC Failure

```bash
# 1. Block Keycloak network:
iptables -A OUTPUT -d keycloak -j DROP

# 2. Trigger OIDC operation (e.g., SSO login)

# 3. Monitor health endpoint
# - OIDC circuit opens
# - Cached tokens used for 5 minutes
# - After 5 minutes, new login attempts fail
```

## Best Practices

1. **Configure appropriate timeouts:** `resetTimeout` should be 60-120s for production
2. **Monitor circuits:** Set up alerts for circuit state transitions
3. **Test recovery:** Regularly test that services can recover from temporary failures
4. **Log transitions:** All state changes are logged at INFO level
5. **Use `maxDelayMs`:** Prevent exponential backoff from waiting forever (cap at 60s)

## Future Enhancements

- [ ] Bulkhead pattern (isolate failure domains)
- [ ] Adaptive retry timing based on failure patterns
- [ ] Per-operation circuit breakers (fine-grained control)
- [ ] Fallback data store (Redis) for degraded queries
- [ ] Correlation IDs for tracing failures across services
