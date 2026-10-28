/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import * as aws from '@pulumi/aws'
import * as pulumi from '@pulumi/pulumi'

export const createStorage = (name: string, vpcId: pulumi.Input<string>, subnetIds: pulumi.Input<string>[], servicesSgId: pulumi.Input<string>) => {
  const efs = new aws.efs.FileSystem(`${name}-efs`, {
    encrypted: true,
    tags: { Name: `${name}-efs` },
  })

  const efsSg = new aws.ec2.SecurityGroup(`${name}-efs-sg`, {
    vpcId,
    ingress: [{ protocol: 'tcp', fromPort: 2049, toPort: 2049, securityGroups: [servicesSgId] }],
    egress: [{ protocol: '-1', fromPort: 0, toPort: 0, cidrBlocks: ['0.0.0.0/0'] }],
    tags: { Name: `${name}-efs-sg` },
  })

  const mountTargets = subnetIds.map(
    (subnetId, i) =>
      new aws.efs.MountTarget(`${name}-efs-mt-${i}`, {
        fileSystemId: efs.id,
        subnetId,
        securityGroups: [efsSg.id],
      }),
  )

  const pgAccessPoint = new aws.efs.AccessPoint(`${name}-pg-ap`, {
    fileSystemId: efs.id,
    // postgres:17-alpine uses uid 70 (the `postgres` system user).
    // MIGRATION NOTE: if upgrading from postgres:18 (uid 999), existing EFS data
    // must be chowned: `chown -R 70:70 /postgres-data` before the new container starts.
    posixUser: { uid: 70, gid: 70 },
    rootDirectory: {
      path: '/postgres-data',
      creationInfo: { ownerUid: 70, ownerGid: 70, permissions: '700' },
    },
    tags: { Name: `${name}-pg` },
  })

  return { efs, mountTargets, pgAccessPoint }
}

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE
