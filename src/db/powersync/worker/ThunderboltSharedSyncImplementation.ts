/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import type { SubscribedStream } from '@powersync/common'
import { WebRemote } from 'powersync-web-internal/db/sync/WebRemote.js'
import { WebStreamingSyncImplementation } from 'powersync-web-internal/db/sync/WebStreamingSyncImplementation.js'
import { SharedSyncImplementation } from 'powersync-web-internal/worker/sync/SharedSyncImplementation.js'
import { encryptionMiddleware } from '../middleware/EncryptionMiddleware'
import { TransformableBucketStorage } from '../TransformableBucketStorage'

/**
 * Extends SharedSyncImplementation to inject TransformableBucketStorage with
 * encryption middleware into the SharedWorker's sync pipeline.
 *
 * This enables multi-tab support (enableMultiTabs: true) while still running
 * data transformations before sync data is written to the local database.
 *
 * The parent class hardcodes SqliteBucketStorage in generateStreamingImplementation().
 * We override it to use TransformableBucketStorage with our middleware instead.
 */
export class ThunderboltSharedSyncImplementation extends SharedSyncImplementation {
  protected generateStreamingImplementation() {
    const syncParams = this.syncParams!

    const storage = new TransformableBucketStorage(this.database)
    storage.addTransformer(encryptionMiddleware)

    // `subscriptions` is declared private in SharedSyncImplementation — access at runtime.
    const subscriptions = (this as unknown as { subscriptions: SubscribedStream[] }).subscriptions

    return new WebStreamingSyncImplementation({
      adapter: storage,
      remote: new WebRemote(
        {
          invalidateCredentials: async () => {
            const lastPort = await this.getLastWrappedPort()
            if (!lastPort) {
              throw new Error('No client port found to invalidate credentials')
            }
            try {
              this.logger.log('calling the last port client provider to invalidate credentials')
              lastPort.clientProvider.invalidateCredentials()
            } catch (ex) {
              this.logger.error('error invalidating credentials', ex)
            }
          },
          fetchCredentials: async () => {
            const lastPort = await this.getLastWrappedPort()
            if (!lastPort) {
              throw new Error('No client port found to fetch credentials')
            }
            return new Promise(async (resolve, reject) => {
              const abortController = new AbortController()
              this.fetchCredentialsController = {
                controller: abortController,
                activePort: lastPort,
              }
              abortController.signal.onabort = reject
              try {
                this.logger.log('calling the last port client provider for credentials')
                resolve(await lastPort.clientProvider.fetchCredentials())
              } catch (ex) {
                reject(ex)
              } finally {
                this.fetchCredentialsController = undefined
              }
            })
          },
        },
        this.logger,
      ),
      uploadCrud: async () => {
        const lastPort = await this.getLastWrappedPort()
        if (!lastPort) {
          throw new Error('No client port found to upload crud')
        }
        return new Promise(async (resolve, reject) => {
          const abortController = new AbortController()
          this.uploadDataController = {
            controller: abortController,
            activePort: lastPort,
          }
          abortController.signal.onabort = () => resolve()
          try {
            resolve(await lastPort.clientProvider.uploadCrud())
          } catch (ex) {
            reject(ex)
          } finally {
            this.uploadDataController = undefined
          }
        })
      },
      ...syncParams.streamOptions,
      subscriptions,
      logger: this.logger,
    })
  }
}

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE
