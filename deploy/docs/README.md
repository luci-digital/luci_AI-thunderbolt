# Thunderbolt Operations Documentation

Complete operations runbooks, monitoring guides, and incident response procedures for the Thunderbolt AIFAM platform.

**Status:** Production-ready | **Last Updated:** 2026-06-28

---

## Quick Start

### First-Time Deployment?
**→ Start here:** [DEPLOYMENT_RUNBOOK.md](DEPLOYMENT_RUNBOOK.md)

- Prerequisites checklist (15 min)
- Pre-deployment validation (5 min)
- Step-by-step deployment (15–20 min)
- Post-deployment validation (10 min)
- Total time: 30–45 minutes

### Setting Up Monitoring?
**→ Start here:** [MONITORING_AND_ALERTING.md](MONITORING_AND_ALERTING.md)

- Prometheus setup (15 min)
- Grafana dashboards (1–2 hours)
- Alert rules configuration (1–2 hours)
- Loki log aggregation (30 min)

### Production Incident Occurring Now?
**→ Go to:** [INCIDENT_RESPONSE.md](INCIDENT_RESPONSE.md)

- Severity levels → understand scope
- Response procedures → steps to resolve
- Communication templates → what to post
- Common scenarios → diagnosis & remediation

### System Acting Strange?
**→ Consult:** [TROUBLESHOOTING_GUIDE.md](TROUBLESHOOTING_GUIDE.md)

- Diagnosis flowchart (2–5 min)
- Component-specific troubleshooting (varies)
- Log query examples (ready-to-use)
- Performance debugging procedures

### Setting Up Kubernetes Cluster?
**→ Start here:** [KUBERNETES_SETUP.md](KUBERNETES_SETUP.md)

- Cluster prerequisites
- Node configuration
- Network setup
- Storage configuration
- Pod Disruption Budgets
- Horizontal Pod Autoscaling

### Routine Operational Tasks?
**→ Refer to:** [OPERATIONS_CHECKLISTS.md](OPERATIONS_CHECKLISTS.md)

- Daily health check (15 min)
- Weekly maintenance (1–2 hours)
- Monthly compliance review (2–3 hours)
- Quarterly infrastructure review (4–6 hours)
- Security audit procedures
- Backup verification

### Want to Understand the Design?
**→ Read:** [OPERATIONS_PATTERNS_REFERENCE.md](OPERATIONS_PATTERNS_REFERENCE.md)

- Why these procedures were chosen
- How InfluxData patterns apply to Thunderbolt
- Principles behind the design
- When and how to evolve the documentation

---

## Document Overview

| Document | Purpose | Audience | Read Time |
|----------|---------|----------|-----------|
| **DEPLOYMENT_RUNBOOK.md** | Deploy Thunderbolt to Kubernetes | DevOps/Platform team | 30–45 min |
| **MONITORING_AND_ALERTING.md** | Set up metrics, dashboards, alerts | Platform team/On-call | 4–6 hours |
| **TROUBLESHOOTING_GUIDE.md** | Diagnose and fix issues | On-call/Engineers | 2–3 hours (reference) |
| **INCIDENT_RESPONSE.md** | Respond to production incidents | On-call/Managers | 30 min (reference) |
| **OPERATIONS_CHECKLISTS.md** | Routine maintenance and checks | Ops team/On-call | 1–2 hours (reference) |
| **KUBERNETES_SETUP.md** | Configure Kubernetes cluster | Platform/Infrastructure | 2–3 hours |
| **OPERATIONS_PATTERNS_REFERENCE.md** | Understand design rationale | Architects/Tech leads | 1 hour |

---

## Responsibility Map

### Deployment Team (First-Time Setup)

1. Read: KUBERNETES_SETUP.md § Cluster Prerequisites
2. Complete: DEPLOYMENT_RUNBOOK.md § Prerequisites Checklist
3. Run: DEPLOYMENT_RUNBOOK.md § Deployment Procedures
4. Validate: DEPLOYMENT_RUNBOOK.md § Post-Deployment Validation
5. Next: Assign MONITORING_AND_ALERTING.md to platform team

**Duration:** ~1 day for cluster setup + deployment

### Platform Team (Ongoing Operations)

1. Read: MONITORING_AND_ALERTING.md (full setup)
2. Implement: Prometheus, Grafana, AlertManager
3. Create: Dashboards (system, API, database, PowerSync)
4. Configure: Alert rules for each service
5. Document: Dashboard links in Slack/wiki
6. Train: On-call team on alert meanings

**Duration:** ~1 week for full monitoring setup

### On-Call Engineer (Daily Responsibilities)

1. Start shift: OPERATIONS_CHECKLISTS.md § Daily Health Check
2. During shift: Have TROUBLESHOOTING_GUIDE.md open
3. If incident: Follow INCIDENT_RESPONSE.md procedures
4. After incident: Complete RCA (INCIDENT_RESPONSE.md)
5. Update: Runbooks based on learnings

**Time commitment:** 15 min/day + incident response time

### Managers (Weekly Review)

1. Check: OPERATIONS_CHECKLISTS.md § Weekly Maintenance status
2. Monitor: Key metrics from Grafana dashboards
3. Review: Incident reports (INCIDENT_RESPONSE.md)
4. Approve: Any major changes before deployment

**Time commitment:** 1–2 hours/week

### Leadership (Monthly/Quarterly)

1. Review: OPERATIONS_CHECKLISTS.md § Monthly Compliance
2. Analyze: Uptime %, error budget, incident trends
3. Plan: Quarterly infrastructure review (§ Quarterly)
4. Approve: Security audit findings and remediation

**Time commitment:** 2–4 hours/month

---

## Critical Paths

### For an Outage (SEV-1)

```
Now: Read INCIDENT_RESPONSE.md § Severity Levels (2 min)
├─ Declare SEV-1
├─ Page on-call engineer (automatic via PagerDuty)
├─ Join war room bridge
└─ Go to: INCIDENT_RESPONSE.md § Response Procedures

T+5 min: Run diagnosis
├─ Execute: TROUBLESHOOTING_GUIDE.md § Diagnosis Flowchart
├─ Identify: Which component is down
└─ Go to: TROUBLESHOOTING_GUIDE.md § Component-Specific section

T+10 min: Implement fix
├─ Consult: INCIDENT_RESPONSE.md § Common Scenarios
├─ Execute: Provided diagnostic commands
└─ Validate: Service health restored

T+30 min: Communicate status
├─ Update: Status page
├─ Notify: Customers via email/Slack
└─ Post: Incident channel with ETA to resolution

T+45 min+: RCA and prevention
├─ Complete: INCIDENT_RESPONSE.md § Post-Incident Review
├─ Create: Action items with owners/due dates
└─ Update: Runbooks to prevent recurrence
```

### For First Deployment

```
Week 1:
├─ Day 1: KUBERNETES_SETUP.md (cluster prep)
├─ Day 2: DEPLOYMENT_RUNBOOK.md (deploy)
└─ Day 3: Validation & handoff

Week 2:
├─ Day 1–2: MONITORING_AND_ALERTING.md (monitoring setup)
├─ Day 3–4: Alert tuning, dashboard creation
└─ Day 5: On-call team training

Week 3:
├─ Day 1–2: OPERATIONS_CHECKLISTS.md § Pre-Production Sign-Off
├─ Day 3: Go/no-go decision
└─ Day 4–5: Monitoring during first week

Week 4:
├─ Day 1–5: Operations and incident response readiness
└─ Transition to steady-state operations
```

---

## How the Pieces Fit Together

```
┌─────────────────────────────────────────────────┐
│         Operations Documentation                │
└─────────────────────────────────────────────────┘

DEPLOYMENT_RUNBOOK.md ◄──┐
(Step-by-step setup)      │
         │                │
         v                │
    Cluster ready         │
         │                │
         ├──────────────► KUBERNETES_SETUP.md
         │                (Cluster tuning)
         │
         v
    MONITORING_AND_ALERTING.md
    (Metrics, dashboards, alerts)
         │
         v
    System live & observable
         │
    ┌────┴────┐
    │          │
    v          v
INCIDENT_RESPONSE.md    OPERATIONS_CHECKLISTS.md
(When things break)     (Routine maintenance)
    │                        │
    ├──────────┬─────────────┤
    │          │             │
    v          v             v
    TROUBLESHOOTING_GUIDE.md
    (Diagnosis procedures)
         │
         v
    RCA & learning
         │
         v
    Update runbooks ────► Loop back to TROUBLESHOOTING_GUIDE.md
```

**Flow:**
1. Deploy using DEPLOYMENT_RUNBOOK.md
2. Monitor using MONITORING_AND_ALERTING.md
3. Maintain using OPERATIONS_CHECKLISTS.md
4. When incidents occur, use INCIDENT_RESPONSE.md
5. Diagnose using TROUBLESHOOTING_GUIDE.md
6. Learn and improve by updating runbooks
7. Repeat

---

## Common Tasks Quick Reference

### "I need to deploy Thunderbolt"
→ [DEPLOYMENT_RUNBOOK.md](DEPLOYMENT_RUNBOOK.md) § Deployment Procedures

### "The API is down"
→ [INCIDENT_RESPONSE.md](INCIDENT_RESPONSE.md) § Response Procedures  
→ [TROUBLESHOOTING_GUIDE.md](TROUBLESHOOTING_GUIDE.md) § Backend Service

### "Replication lag is high"
→ [TROUBLESHOOTING_GUIDE.md](TROUBLESHOOTING_GUIDE.md) § PowerSync Sync Service

### "Database is slow"
→ [TROUBLESHOOTING_GUIDE.md](TROUBLESHOOTING_GUIDE.md) § PostgreSQL Database

### "Users can't sign in"
→ [TROUBLESHOOTING_GUIDE.md](TROUBLESHOOTING_GUIDE.md) § Keycloak Authentication

### "Pods won't start"
→ [TROUBLESHOOTING_GUIDE.md](TROUBLESHOOTING_GUIDE.md) § Component-Specific Troubleshooting

### "I need to upgrade Kubernetes"
→ [KUBERNETES_SETUP.md](KUBERNETES_SETUP.md) § Cluster Upgrade Procedures

### "What's the daily checklist?"
→ [OPERATIONS_CHECKLISTS.md](OPERATIONS_CHECKLISTS.md) § Daily Health Check

### "How do I set up alerts?"
→ [MONITORING_AND_ALERTING.md](MONITORING_AND_ALERTING.md) § Alert Rules

### "I don't understand why we do this"
→ [OPERATIONS_PATTERNS_REFERENCE.md](OPERATIONS_PATTERNS_REFERENCE.md)

---

## Key Principles

These docs embody these principles:

1. **Actionable:** Every procedure includes exact commands to run
2. **Testable:** Expected outputs documented so you know it worked
3. **Recoverable:** Rollback procedures after each step
4. **Learnable:** Designed for teams new to Kubernetes/Thunderbolt
5. **Improvable:** Procedures updated after every incident
6. **Honest:** Known limitations and workarounds documented
7. **Fast:** Optimized for quick diagnosis and resolution

---

## Feedback and Updates

These docs will evolve. After each:

- **Deployment:** Any new gotchas discovered? Add to Prerequisites or Troubleshooting
- **Incident:** New scenario or pattern? Add to Common Scenarios or Incident Response
- **Operational task:** New tool or procedure? Update Operations Checklists
- **Quarter:** Full review against latest best practices (including InfluxData)

See [OPERATIONS_PATTERNS_REFERENCE.md](OPERATIONS_PATTERNS_REFERENCE.md) § Continuous Improvement for the review schedule.

---

## Related Documentation

- **Architecture:** `/docs/architecture/`
- **Development:** `/docs/development/`
- **Deployment Config:** `/deploy/` (Docker, Helm, Pulumi)
- **Project Guidelines:** `/CLAUDE.md`

---

**For questions or updates:** Create an issue or PR at https://github.com/thunderbird/thunderbolt
