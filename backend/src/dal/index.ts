/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

// Devices
export {
  getDeviceById,
  upsertDevice,
  revokeDevice,
  denyDevice,
  markDeviceTrusted,
  registerDevice,
  countActiveDevices,
} from './devices'

// Users
export { getUserById, getUserByEmail, deleteUser, markUserNotNew } from './users'

// Sessions
export { getActiveSessionByToken, linkSessionToDevice, revokeDeviceSessions } from './sessions'

// Waitlist
export { getWaitlistByEmail, createWaitlistEntry, approveWaitlistEntry } from './waitlist'

// Workspaces
export {
  promotePendingMemberships,
  countWorkspaceAdmins,
  countWorkspaceMemberships,
  deleteMembership,
  deletePendingMembership,
  deleteWorkspacePermission,
  getMembershipById,
  getPendingMembershipById,
  getWorkspaceById,
  getWorkspacePermissionById,
  insertPersonalWorkspaceIfMissing,
  isAdminOfAnyWorkspace,
  isPersonalWorkspace,
  isWorkspaceAdmin,
  isWorkspaceMember,
  syncMembershipDisplayInfo,
  updateMembership,
  updatePendingMembership,
  updateWorkspace,
  updateWorkspacePermission,
  upsertMembership,
  upsertPendingMembership,
  upsertWorkspace,
  upsertWorkspacePermission,
} from './workspaces'

// OTP Challenge (session binding)
export {
  getOrCreateOtpChallenge,
  validateOtpChallenge,
  deleteOtpChallengesForEmail,
  deletePersistedSignInOtp,
} from './otp-challenge'

// Encryption
export {
  getEnvelopeByDeviceId,
  hasEnvelopesForUser,
  upsertEnvelope,
  deleteEnvelope,
  getEncryptionMetadata,
  insertEncryptionMetadataIfNotExists,
} from './encryption'

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE
