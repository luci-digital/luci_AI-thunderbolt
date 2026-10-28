/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { type OAuthProvider } from '@/lib/auth'
import { type Dispatch, useReducer } from 'react'

export type OAuthProviderOrEmpty = OAuthProvider | ''

export type ConnectIntegrationWidgetState = {
  isConnecting: boolean
  isDismissed: boolean
  isConnected: boolean
  connectedProvider: OAuthProvider | null
  showConnectedState: boolean
  selectedProvider: OAuthProvider | null
}

export type ConnectIntegrationWidgetAction =
  | { type: 'SET_CONNECTING'; payload: boolean }
  | { type: 'SET_DISMISSED'; payload: boolean }
  | { type: 'SET_SHOW_CONNECTED_STATE'; payload: boolean }
  | { type: 'SET_SELECTED_PROVIDER'; payload: OAuthProvider | null }
  | { type: 'CONNECT_SUCCESS'; payload: OAuthProvider }
  | { type: 'CONNECT_FAILED'; payload: OAuthProvider | null }

const connectIntegrationWidgetReducer = (
  state: ConnectIntegrationWidgetState,
  action: ConnectIntegrationWidgetAction,
): ConnectIntegrationWidgetState => {
  switch (action.type) {
    case 'SET_CONNECTING':
      return { ...state, isConnecting: action.payload }
    case 'SET_DISMISSED':
      return { ...state, isDismissed: action.payload }
    case 'SET_SHOW_CONNECTED_STATE':
      return { ...state, showConnectedState: action.payload }
    case 'SET_SELECTED_PROVIDER':
      return { ...state, selectedProvider: action.payload }
    case 'CONNECT_SUCCESS':
      return {
        ...state,
        isConnecting: false,
        isConnected: true,
        connectedProvider: action.payload,
        showConnectedState: true,
      }
    case 'CONNECT_FAILED':
      return {
        ...state,
        isConnecting: false,
        isConnected: false,
        connectedProvider: action.payload,
      }
    default:
      return state
  }
}

const createInitialState = (initialProvider: OAuthProviderOrEmpty): ConnectIntegrationWidgetState => ({
  isConnecting: false,
  isDismissed: false,
  isConnected: false,
  connectedProvider: null,
  showConnectedState: false,
  selectedProvider: initialProvider === '' ? null : initialProvider,
})

export const useConnectIntegrationWidgetState = (
  initialProvider: OAuthProviderOrEmpty,
): [ConnectIntegrationWidgetState, Dispatch<ConnectIntegrationWidgetAction>] => {
  return useReducer(connectIntegrationWidgetReducer, createInitialState(initialProvider))
}

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE
