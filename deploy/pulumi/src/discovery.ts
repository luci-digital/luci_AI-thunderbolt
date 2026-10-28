/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import * as aws from '@pulumi/aws'
import * as pulumi from '@pulumi/pulumi'

export const createServiceDiscovery = (name: string, vpcId: pulumi.Input<string>) => {
  const namespace = new aws.servicediscovery.PrivateDnsNamespace(`${name}-ns`, {
    name: 'thunderbolt.local',
    vpc: vpcId,
    tags: { Name: `${name}-ns` },
  })

  const serviceNames = ['postgres', 'powersync', 'keycloak', 'backend', 'frontend', 'marketing'] as const

  const services = Object.fromEntries(
    serviceNames.map((svc) => [
      svc,
      new aws.servicediscovery.Service(`${name}-${svc}-discovery`, {
        name: svc,
        namespaceId: namespace.id,
        dnsConfig: {
          namespaceId: namespace.id,
          dnsRecords: [{ ttl: 10, type: 'A' }],
          routingPolicy: 'MULTIVALUE',
        },
        healthCheckCustomConfig: { failureThreshold: 1 },
        tags: { Name: `${name}-${svc}` },
      }),
    ]),
  ) as Record<(typeof serviceNames)[number], aws.servicediscovery.Service>

  return { namespace, services }
}

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE
