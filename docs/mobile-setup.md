# iOS PowerSync Integration Guide

This guide provides comprehensive step-by-step instructions for iOS engineers implementing PowerSync integration with Thunderbolt's backend. It covers device registration, authentication, token management, offline-first sync, encryption setup (optional), APNs integration, testing, and troubleshooting.

**Target audience:** iOS developers new to PowerSync and multi-device synchronization. Examples provided in both native Swift and TypeScript/React Native.

**Status:** End-to-end encryption is in preview and optional. Basic sync works without it (recommended for initial integration).

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Device Registration Flow](#device-registration-flow)
3. [PowerSync Configuration](#powersync-configuration)
4. [Token Management](#token-management)
5. [APNs Setup](#apns-setup)
6. [Offline-First Behavior](#offline-first-behavior)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### iOS App Requirements

Before integrating PowerSync, ensure your iOS app has:

- **iOS 14+ deployment target** – PowerSync requires iOS 14 or later
- **Xcode 15+** – For SwiftUI and Swift 5.9 support
- **Basic authentication flow** – Sign-in/sign-out mechanics with token storage in Keychain
- **HTTPS networking** – All requests to backend and PowerSync must use TLS
- **SQLite database** – For local data persistence (local storage schema)
- **Background capabilities** – Enable "Background Fetch" and "Remote Notifications" in Signing & Capabilities

### PowerSync SDK Installation

#### For Native Swift (Recommended for iOS)

PowerSync provides a native Swift SDK via Swift Package Manager or CocoaPods:

```bash
# Via CocoaPods (Podfile)
pod 'PowerSync'

# Via Swift Package Manager (Xcode)
# File > Add Packages > https://github.com/powersync-ja/powersync-swift.git
```

In your code:

```swift
import PowerSync

let powerSyncConnector = PowerSyncDBConnector(
    endpoint: URL(string: "https://api.example.com/powersync")!,
    auth: PowerSyncAuthDelegate()
)
```

Documentation: https://docs.powersync.com/client-sdk/swift

#### For React Native (If using Cross-Platform)

```bash
npm install @powersync/react-native @powersync/web
# or
yarn add @powersync/react-native @powersync/web
pnpm add @powersync/react-native @powersync/web
```

#### For Tauri 2 iOS

If building a cross-platform app with Tauri 2:

```toml
[dependencies]
tauri = { version = "2", features = ["macos", "linux", "windows"] }
tokio = { version = "1", features = ["full"] }
serde_json = "1"
reqwest = { version = "0.11", features = ["json"] }

[target.'cfg(target_os = "ios")'.dependencies]
tauri = { version = "2", features = ["ios"] }
```

### LuciVault Authentication Setup

Your app must have a valid auth token in Keychain before any PowerSync requests. Backend issues JWTs scoped by `user_id`.

**Swift implementation:**

```swift
import Foundation
import Security

class AuthManager {
    static let shared = AuthManager()
    
    private let keychainService = "com.lucidigital.app"
    private let authTokenKey = "auth_token"
    private let deviceIdKey = "device_id"
    
    struct AuthCredentials: Codable {
        let accessToken: String
        let userId: String
        let expiresAt: Date
    }
    
    // MARK: - Login Flow
    func login(email: String, password: String) async throws -> String {
        let url = URL(string: "https://api.example.com/v1/auth/login")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let body = ["email": email, "password": password]
        request.httpBody = try JSONEncoder().encode(body)
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse, 
              httpResponse.statusCode == 200 else {
            throw AuthError.loginFailed
        }
        
        let loginResponse = try JSONDecoder().decode(
            ["accessToken": String, "userId": String].self, 
            from: data
        )
        
        let credentials = AuthCredentials(
            accessToken: loginResponse["accessToken"]!,
            userId: loginResponse["userId"]!,
            expiresAt: Date().addingTimeInterval(3600) // 1 hour
        )
        
        try saveCredentials(credentials)
        return loginResponse["accessToken"]!
    }
    
    // MARK: - Token Retrieval
    func getAuthToken() -> String? {
        guard let credentialsData = Keychain.load(key: authTokenKey) else {
            return nil
        }
        
        if let credentials = try? JSONDecoder().decode(
            AuthCredentials.self,
            from: credentialsData
        ) {
            // Return token if not expired
            if credentials.expiresAt > Date() {
                return credentials.accessToken
            } else {
                // Token expired, need to refresh
                return nil
            }
        }
        
        return nil
    }
    
    func getUserId() -> String? {
        guard let credentialsData = Keychain.load(key: authTokenKey) else {
            return nil
        }
        
        return try? JSONDecoder().decode(
            AuthCredentials.self,
            from: credentialsData
        ).userId
    }
    
    // MARK: - Device ID Management
    func getOrCreateDeviceId() -> String {
        if let deviceId = Keychain.loadString(key: deviceIdKey) {
            return deviceId
        }
        
        let newDeviceId = UUID().uuidString.lowercased()
        Keychain.save(string: newDeviceId, key: deviceIdKey)
        return newDeviceId
    }
    
    // MARK: - Cleanup
    func logout() {
        Keychain.delete(key: authTokenKey)
        Keychain.delete(key: deviceIdKey)
        // Also clear local databases and sync state
    }
    
    private func saveCredentials(_ credentials: AuthCredentials) throws {
        let data = try JSONEncoder().encode(credentials)
        Keychain.save(data: data, key: authTokenKey)
    }
}

enum AuthError: Error {
    case loginFailed
    case invalidCredentials
    case networkError
}

// MARK: - Keychain Helper
class Keychain {
    static func save(data: Data, key: String) {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecValueData as String: data,
            kSecAttrAccessible as String: kSecAttrAccessibleWhenUnlockedThisDeviceOnly
        ]
        
        SecItemDelete(query as CFDictionary)
        SecItemAdd(query as CFDictionary, nil)
    }
    
    static func save(string: String, key: String) {
        guard let data = string.data(using: .utf8) else { return }
        save(data: data, key: key)
    }
    
    static func load(key: String) -> Data? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecReturnData as String: true
        ]
        
        var result: AnyObject?
        SecItemCopyMatching(query as CFDictionary, &result)
        return result as? Data
    }
    
    static func loadString(key: String) -> String? {
        guard let data = load(key: key),
              let string = String(data: data, encoding: .utf8) else {
            return nil
        }
        return string
    }
    
    static func delete(key: String) {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key
        ]
        SecItemDelete(query as CFDictionary)
    }
}
```

**Backend endpoint:**

```
POST /v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password"
}

Response (200 OK):
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "userId": "user-uuid-here",
  "expiresIn": 3600
}
```

**Important:** Always store auth tokens in Keychain with `kSecAttrAccessibleWhenUnlockedThisDeviceOnly` to prevent access when device is locked.

---

## Device Registration Flow

### Step 1: Generate a Device ID

On first app launch (or when sync is enabled), generate a unique device ID and store it in Keychain.

**Swift implementation:**

```swift
func getOrCreateDeviceId() -> String {
    let keychainKey = "device_id"
    
    // Try to load existing device ID
    if let existingId = Keychain.loadString(key: keychainKey) {
        return existingId
    }
    
    // Generate new device ID
    let newId = UUID().uuidString.lowercased()
    Keychain.save(string: newId, key: keychainKey)
    return newId
}
```

**TypeScript example (React Native):**

```typescript
import * as SecureStore from 'expo-secure-store';
import crypto from 'expo-crypto';

async function getOrCreateDeviceId(): Promise<string> {
  const keychainKey = 'device_id';
  
  try {
    const existingId = await SecureStore.getItemAsync(keychainKey);
    if (existingId) return existingId;
  } catch (e) {
    // Key doesn't exist, generate new one
  }
  
  const newId = crypto.randomUUID();
  await SecureStore.setItemAsync(keychainKey, newId);
  return newId;
}
```

### Step 2: Request PowerSync Token

Call the token endpoint with your auth token and device ID. This auto-creates the device on the backend.

**API endpoint:**

```
GET /powersync/token
Authorization: Bearer {authToken}
X-Device-ID: {deviceId}
X-Device-Name: {optional device name}

Response (200 OK):
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600,
  "device": {
    "id": "device-uuid",
    "userId": "user-uuid",
    "status": "APPROVAL_PENDING" | "TRUSTED" | "REVOKED",
    "createdAt": "2026-06-28T10:00:00Z",
    "lastSeen": "2026-06-28T10:05:00Z"
  }
}
```

**Swift implementation:**

```swift
struct PowerSyncTokenResponse: Codable {
    let token: String
    let expiresIn: Int
    let device: DeviceInfo
    
    struct DeviceInfo: Codable {
        let id: String
        let userId: String
        let status: String
        let createdAt: String
        let lastSeen: String
    }
}

class DeviceManager {
    static let shared = DeviceManager()
    
    func requestPowerSyncToken(authToken: String, deviceId: String) async throws -> PowerSyncTokenResponse {
        let url = URL(string: "https://api.example.com/powersync/token")!
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("Bearer \(authToken)", forHTTPHeaderField: "Authorization")
        request.setValue(deviceId, forHTTPHeaderField: "X-Device-ID")
        request.setValue("iPhone App", forHTTPHeaderField: "X-Device-Name")
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw NetworkError.invalidResponse
        }
        
        switch httpResponse.statusCode {
        case 200:
            return try JSONDecoder().decode(PowerSyncTokenResponse.self, from: data)
        case 410:
            // Account deleted
            throw DeviceError.accountDeleted
        case 403:
            // Device revoked or other authorization issue
            let error = try JSONDecoder().decode(["code": String].self, from: data)
            if error["code"] == "DEVICE_DISCONNECTED" {
                throw DeviceError.deviceRevoked
            }
            throw DeviceError.forbidden
        case 401:
            throw DeviceError.unauthorized
        default:
            throw NetworkError.httpError(status: httpResponse.statusCode)
        }
    }
}

enum DeviceError: Error {
    case accountDeleted
    case deviceRevoked
    case forbidden
    case unauthorized
}

enum NetworkError: Error {
    case invalidResponse
    case httpError(status: Int)
}
```

### Step 3: Handle Device Status

**Status values:**
- `APPROVAL_PENDING` – Device registered but not approved (E2EE only)
- `TRUSTED` – Device is approved and can sync
- `REVOKED` – Device was revoked, cannot sync

**Error responses:**

```json
// 410 Gone - Account deleted
{
  "code": "ACCOUNT_DELETED",
  "message": "The account has been deleted"
}

// 403 Forbidden - Device revoked
{
  "code": "DEVICE_DISCONNECTED",
  "message": "This device has been revoked"
}

// 409 Conflict - Device ID taken by another user
{
  "code": "DEVICE_ID_TAKEN",
  "message": "Device ID already registered to a different account"
}
```

**Swift error handling:**

```swift
func handleTokenRequestError(_ error: Error) async {
    switch error {
    case DeviceError.accountDeleted:
        // Account was deleted - perform full app reset
        await appReset()
        navigateToLogin()
        
    case DeviceError.deviceRevoked:
        // Device was revoked - perform full app reset
        await appReset()
        showAlert("Device Revoked", "This device has been revoked by another device.")
        navigateToLogin()
        
    case DeviceError.unauthorized:
        // Auth token invalid - redirect to login
        AuthManager.shared.logout()
        navigateToLogin()
        
    case NetworkError.httpError(let status):
        if status == 409 {
            // Device ID collision - generate new ID and retry
            Keychain.delete(key: "device_id")
            // Retry login flow
        }
        
    default:
        showAlert("Error", "Failed to register device: \(error.localizedDescription)")
    }
}

func appReset() async {
    // Clear auth tokens
    AuthManager.shared.logout()
    
    // Clear local sync state
    await PowerSyncManager.shared.reset()
    
    // Clear local databases
    try? FileManager.default.removeItem(atPath: appDatabasePath)
    
    // Reset navigation
    DispatchQueue.main.async {
        // Reset to login screen
    }
}
```

### Step 4: Wait for Approval (E2EE Only)

If E2EE is enabled, the device will be in `pending_approval`. The user must approve it from a trusted device.

**Poll for approval:**

```swift
func pollDeviceApproval(deviceId: String, authToken: String, maxWaitSeconds: Int = 300) async throws {
    let startTime = Date()
    let maxDuration = TimeInterval(maxWaitSeconds)
    
    while Date().timeIntervalSince(startTime) < maxDuration {
        let response = try await getDeviceStatus(deviceId: deviceId, authToken: authToken)
        
        if response.status == "TRUSTED" {
            print("Device approved!")
            return
        } else if response.status == "REVOKED" {
            throw DeviceError.deviceRevoked
        }
        
        // Wait 5 seconds before polling again
        try await Task.sleep(nanoseconds: 5_000_000_000)
    }
    
    throw DeviceError.approvalTimeout
}
```

### Step 5: Approve Device (from Another Device)

When a new device requests access, a trusted device must approve it.

**API endpoint:**

```
POST /v1/account/devices/{deviceId}/approve
Authorization: Bearer {authToken}

Response (200 OK):
{
  "approved": true
}
```

**Swift implementation:**

```swift
func approveDevice(deviceId: String, authToken: String) async throws {
    let url = URL(string: "https://api.example.com/v1/account/devices/\(deviceId)/approve")!
    var request = URLRequest(url: url)
    request.httpMethod = "POST"
    request.setValue("Bearer \(authToken)", forHTTPHeaderField: "Authorization")
    
    let (_, response) = try await URLSession.shared.data(for: request)
    
    guard let httpResponse = response as? HTTPURLResponse,
          httpResponse.statusCode == 200 else {
        throw NetworkError.httpError(status: (response as? HTTPURLResponse)?.statusCode ?? -1)
    }
}
```

### Device Registration Status Lifecycle

```
[New device signed in]
    ↓ (Request PowerSync token)
[pending_approval] (E2EE enabled only)
    ↓ (Poll for approval OR push notification)
[TRUSTED] ← Can sync data
    or
[REVOKED] ← User rejected; must re-register
```

If E2EE is disabled (default), devices auto-approve to `TRUSTED` immediately.

---

## PowerSync Configuration

### Step 1: Define Your Database Schema

All tables must include a `user_id` column for data scoping. Define schemas locally to match backend.

**Swift SQLite schema:**

```swift
import SQLite

class DatabaseSchema {
    static func createTables(database: Connection) throws {
        // User settings table
        let settings = Table("settings")
        let userId = Expression<String>("user_id")
        let key = Expression<String>("key")
        let value = Expression<String?>("value")
        let updatedAt = Expression<Date>("updated_at")
        
        try database.run(settings.create(ifNotExists: true) { t in
            t.column(userId)
            t.column(key)
            t.column(value)
            t.column(updatedAt)
            t.primaryKey([userId, key])
        })
        
        // Chat threads
        let threads = Table("chat_threads")
        let id = Expression<String>("id")
        let title = Expression<String>("title")
        let createdAt = Expression<Date>("created_at")
        
        try database.run(threads.create(ifNotExists: true) { t in
            t.column(id, primaryKey: true)
            t.column(userId)
            t.column(title)
            t.column(createdAt)
            t.column(updatedAt)
        })
        try database.run(threads.createIndex(userId, ifNotExists: true))
        
        // Chat messages
        let messages = Table("chat_messages")
        let threadId = Expression<String>("thread_id")
        let content = Expression<String>("content")
        let deletedAt = Expression<Date?>("deleted_at")
        
        try database.run(messages.create(ifNotExists: true) { t in
            t.column(id, primaryKey: true)
            t.column(userId)
            t.column(threadId)
            t.column(content)
            t.column(createdAt)
            t.column(updatedAt)
            t.column(deletedAt)
        })
        try database.run(messages.createIndex(userId, ifNotExists: true))
        try database.run(messages.createIndex(threadId, ifNotExists: true))
    }
}
```

**Critical requirement:** Every table must have `user_id` column. PowerSync uses this to scope data per user.

### Step 2: Implement PowerSync Connector (Native Swift)

**Swift implementation:**

```swift
import PowerSync

class PowerSyncAuthDelegate: NSObject, PowerSyncCredentialsProvider {
    func getCredentials() async throws -> PowerSyncCredentials {
        guard let authToken = AuthManager.shared.getAuthToken() else {
            throw PowerSyncError.noAuthToken
        }
        
        let deviceId = AuthManager.shared.getOrCreateDeviceId()
        
        // Request PowerSync token from backend
        let response = try await DeviceManager.shared.requestPowerSyncToken(
            authToken: authToken,
            deviceId: deviceId
        )
        
        return PowerSyncCredentials(token: response.token)
    }
}

class PowerSyncManager: NSObject {
    static let shared = PowerSyncManager()
    
    private var connector: PowerSyncDBConnector?
    private let dbPath = FileManager.default.urls(
        for: .documentDirectory,
        in: .userDomainMask
    )[0].appendingPathComponent("powersync.db").path
    
    override private init() {
        super.init()
    }
    
    func initialize() async throws {
        let credentials = PowerSyncAuthDelegate()
        
        connector = PowerSyncDBConnector(
            endpoint: URL(string: "https://api.example.com/powersync")!,
            auth: credentials,
            database: dbPath
        )
        
        try await connector?.connect()
        connector?.syncEngine.start()
    }
    
    func executeSync() async throws {
        try await connector?.syncEngine.refresh()
    }
    
    func isConnected() -> Bool {
        return connector?.status == .connected
    }
    
    func reset() async throws {
        try await connector?.disconnect()
        // Delete local database file
        try FileManager.default.removeItem(atPath: dbPath)
        connector = nil
    }
    
    // MARK: - Query Methods
    func query(_ sql: String, params: [Any?] = []) throws -> [[String: Any]] {
        guard let db = connector?.database else {
            throw PowerSyncError.notConnected
        }
        
        var results: [[String: Any]] = []
        let statement = try db.prepare(sql)
        
        for row in try statement.bind(params).run() {
            var dict: [String: Any] = [:]
            for (index, value) in row.enumerated() {
                dict[String(index)] = value
            }
            results.append(dict)
        }
        
        return results
    }
    
    func execute(_ sql: String, params: [Any?] = []) throws {
        guard let db = connector?.database else {
            throw PowerSyncError.notConnected
        }
        
        try db.run(sql, params)
    }
}

enum PowerSyncError: Error {
    case notConnected
    case noAuthToken
    case syncFailed(Error)
}
```

In your AppDelegate:

```swift
@main
class AppDelegate: UIResponder, UIApplicationDelegate {
    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
    ) -> Bool {
        Task {
            do {
                // Create local database if needed
                let dbPath = FileManager.default.urls(
                    for: .documentDirectory,
                    in: .userDomainMask
                )[0].appendingPathComponent("app.db")
                
                let database = try Connection(dbPath.path)
                try DatabaseSchema.createTables(database: database)
                
                // Initialize PowerSync
                try await PowerSyncManager.shared.initialize()
            } catch {
                print("Failed to initialize app: \(error)")
            }
        }
        
        return true
    }
}
```

**Sync rules (backend `config.yaml`):**

```yaml
sync_rules:
  content: |
    bucket_definitions:
      user_data:
        data:
          - SELECT * FROM settings WHERE settings.user_id = bucket.user_id
          - SELECT * FROM chat_threads WHERE chat_threads.user_id = bucket.user_id
          - SELECT * FROM chat_messages WHERE chat_messages.user_id = bucket.user_id
```


---

## Token Management

### Obtaining PowerSync JWT

PowerSync tokens are JWTs issued by the backend, scoped by `user_id` and device. Default expiration is 3600 seconds (1 hour).

**API endpoint:**

```
GET /powersync/token
Authorization: Bearer {authToken}
X-Device-ID: {deviceId}
X-Device-Name: {optional device name}

Response (200 OK):
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600
}
```

**Swift implementation:**

```swift
class TokenManager {
    static let shared = TokenManager()
    
    private var tokenCache: (token: String, expiresAt: Date)?
    
    func getPowerSyncToken(authToken: String, deviceId: String) async throws -> String {
        // Return cached token if still valid (refresh 60 seconds before expiry)
        if let cached = tokenCache, 
           cached.expiresAt.timeIntervalSinceNow > 60 {
            return cached.token
        }
        
        let response = try await fetchTokenFromBackend(
            authToken: authToken,
            deviceId: deviceId
        )
        
        let expiresAt = Date().addingTimeInterval(TimeInterval(response.expiresIn))
        tokenCache = (token: response.token, expiresAt: expiresAt)
        
        return response.token
    }
    
    private func fetchTokenFromBackend(
        authToken: String,
        deviceId: String
    ) async throws -> TokenResponse {
        let url = URL(string: "https://api.example.com/powersync/token")!
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("Bearer \(authToken)", forHTTPHeaderField: "Authorization")
        request.setValue(deviceId, forHTTPHeaderField: "X-Device-ID")
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw TokenError.invalidResponse
        }
        
        switch httpResponse.statusCode {
        case 200:
            return try JSONDecoder().decode(TokenResponse.self, from: data)
            
        case 401:
            throw TokenError.unauthorized
            
        case 403:
            let error = try? JSONDecoder().decode(["code": String].self, from: data)
            if error?["code"] == "DEVICE_DISCONNECTED" {
                throw TokenError.deviceDisconnected
            }
            throw TokenError.forbidden
            
        case 410:
            throw TokenError.accountDeleted
            
        default:
            throw TokenError.httpError(status: httpResponse.statusCode)
        }
    }
    
    func clearCache() {
        tokenCache = nil
    }
}

struct TokenResponse: Codable {
    let token: String
    let expiresIn: Int
}

enum TokenError: Error {
    case invalidResponse
    case unauthorized
    case forbidden
    case deviceDisconnected
    case accountDeleted
    case httpError(status: Int)
}
```

### Token Refresh Flow

PowerSync automatically calls the auth delegate when a token is needed or has expired. Do not implement manual token refresh — PowerSync handles this.

**When PowerSync needs a token:**

1. PowerSync calls `PowerSyncAuthDelegate.getCredentials()`
2. Auth delegate requests token from backend via `GET /powersync/token`
3. Backend returns 200 with new JWT, or error (410/403/401)
4. If error, PowerSync handles retry or reset

**Swift implementation in auth delegate:**

```swift
class PowerSyncAuthDelegate: NSObject, PowerSyncCredentialsProvider {
    func getCredentials() async throws -> PowerSyncCredentials {
        guard let authToken = AuthManager.shared.getAuthToken() else {
            throw AuthError.noToken
        }
        
        let deviceId = AuthManager.shared.getOrCreateDeviceId()
        
        do {
            let psToken = try await TokenManager.shared.getPowerSyncToken(
                authToken: authToken,
                deviceId: deviceId
            )
            return PowerSyncCredentials(token: psToken)
        } catch TokenError.accountDeleted {
            // Account deleted - trigger reset
            await handleAccountDeleted()
            throw AuthError.accountDeleted
        } catch TokenError.deviceDisconnected {
            // Device revoked - trigger reset
            await handleDeviceRevoked()
            throw AuthError.deviceRevoked
        } catch {
            // Other errors (401, network) - PowerSync will retry
            throw error
        }
    }
    
    private func handleAccountDeleted() async {
        await PowerSyncManager.shared.reset()
        AuthManager.shared.logout()
        DispatchQueue.main.async {
            // Navigate to login screen
        }
    }
    
    private func handleDeviceRevoked() async {
        await PowerSyncManager.shared.reset()
        AuthManager.shared.logout()
        DispatchQueue.main.async {
            // Navigate to login with message: "Device was revoked"
        }
    }
}
```

### 401 Unauthorized Response Handling

If the backend returns **401** on a token request:

1. The user's auth token is invalid or expired
2. Redirect to sign-in
3. Clear Keychain and reset app state

**Swift error handling:**

```swift
func handleTokenError(_ error: Error) async {
    switch error {
    case TokenError.unauthorized:
        // Auth token invalid/expired
        AuthManager.shared.logout()
        await PowerSyncManager.shared.reset()
        navigateToLogin()
        
    case TokenError.deviceDisconnected:
        // Device was revoked
        AuthManager.shared.logout()
        await PowerSyncManager.shared.reset()
        showAlert("Device Revoked", "This device was revoked and cannot sync.")
        navigateToLogin()
        
    case TokenError.accountDeleted:
        // Account was deleted
        AuthManager.shared.logout()
        await PowerSyncManager.shared.reset()
        showAlert("Account Deleted", "Your account was deleted.")
        navigateToLogin()
        
    default:
        print("Token error: \(error)")
    }
}
```

---

## APNs Setup

### Certificate Configuration

1. **Generate APNs Certificate in Apple Developer Portal**
   - Go to Certificates, Identifiers & Profiles
   - Create a new "Apple Push Notification service (APNs) SSL (Sandbox & Production)" certificate
   - Download the certificate (`.cer`)

2. **Convert to PEM Format**
   ```bash
   # Convert .cer to .p8 (private key format)
   openssl x509 -inform der -in Certificates.cer -out APNs.pem
   ```

3. **Store Certificate on Backend**
   ```bash
   # Keep the APNs certificate and private key secure
   # Store in environment variables or a secrets manager
   export APNS_CERTIFICATE_PATH=/path/to/APNs.pem
   export APNS_KEY_ID=YOUR_KEY_ID
   export APNS_TEAM_ID=YOUR_TEAM_ID
   ```

### Device Token Registration

When the app first starts, request user permission and register the device token:

```swift
// iOS/AppDelegate.swift

import UserNotifications

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {
    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
    ) -> Bool {
        // Request user permission for notifications
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { 
            granted, error in
            if granted {
                DispatchQueue.main.async {
                    UIApplication.shared.registerForRemoteNotifications()
                }
            }
        }
        return true
    }

    // Called when device token is successfully registered
    func application(
        _ application: UIApplication,
        didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data
    ) {
        let token = deviceToken.map { String(format: "%02.2hhx", $0) }.joined()
        print("Device token: \(token)")
        
        // Send to backend
        Task {
            do {
                try await registerDeviceToken(token)
            } catch {
                print("Failed to register device token: \(error)")
            }
        }
    }

    func application(
        _ application: UIApplication,
        didFailToRegisterForRemoteNotificationsWithError error: Error
    ) {
        print("Failed to register for remote notifications: \(error)")
    }

    // Handle incoming push notification
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification,
        withCompletionHandler completionHandler:
        @escaping (UNNotificationPresentationOptions) -> Void
    ) {
        let userInfo = notification.request.content.userInfo
        print("Received notification: \(userInfo)")
        
        // Handle notification payload
        if let syncRequired = userInfo["sync_required"] as? Bool, syncRequired {
            // Trigger PowerSync refresh
            Task {
                await PowerSyncManager.shared.connector.syncEngine.refresh()
            }
        }
        
        completionHandler([.banner, .sound, .badge])
    }
}

// Register device token with backend
func registerDeviceToken(_ deviceToken: String) async throws {
    let response = try await URLSession.shared.data(
        from: URL(string: "https://your-backend.com/v1/devices/\(auth.getDeviceId())/token")!,
        method: "POST",
        headers: [
            "Authorization": "Bearer \(auth.getToken()!)",
            "Content-Type": "application/json"
        ],
        body: ["apns_token": deviceToken].jsonData()
    )
    
    guard (response.1 as? HTTPURLResponse)?.statusCode == 200 else {
        throw NSError(domain: "TokenRegistration", code: -1)
    }
}
```

### Testing Notifications

```bash
# Test APNs from backend using curl and your certificate
curl -v \
  --cert /path/to/APNs.pem \
  --key /path/to/APNs.key \
  -H "apns-priority: 10" \
  -H "apns-topic: com.yourcompany.app" \
  -d '{"aps":{"alert":"Test notification","sound":"default"}}' \
  https://api.sandbox.push.apple.com/3/device/<DEVICE_TOKEN>
```

Backend APNs sender example:

```typescript
// backend/src/services/apns.ts

import * as APNs from 'apn';

const apnsProvider = new APNs.Provider({
  token: {
    key: process.env.APNS_KEY_PATH!,
    keyId: process.env.APNS_KEY_ID!,
    teamId: process.env.APNS_TEAM_ID!,
  },
  production: false // Use sandbox for testing
});

export async function sendSyncNotification(deviceToken: string): Promise<void> {
  const notification = new APNs.Notification({
    alert: 'You have new messages',
    sound: 'default',
    badge: 1,
    contentAvailable: true,
    mutableContent: true,
    custom: {
      sync_required: true
    }
  });

  try {
    const result = await apnsProvider.send(notification, deviceToken);
    console.log(`Sent notification to ${deviceToken}:`, result);
  } catch (error) {
    console.error('Failed to send APNs notification:', error);
  }
}
```

---

## Offline-First Behavior

### Local Storage (SQLite for iOS)

Data is stored locally in SQLite and synced asynchronously:

```typescript
// src/db/local-storage.ts

export async function saveMessageLocally(message: ChatMessage): Promise<void> {
  // Write immediately to local SQLite
  await db.execute(
    `INSERT INTO chat_messages (id, thread_id, user_id, content, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [message.id, message.threadId, message.userId, message.content, new Date().toISOString()]
  );

  // PowerSync queues upload automatically
  // No explicit sync needed
}

export async function getMessagesForThread(threadId: string): Promise<ChatMessage[]> {
  // Always reads from local SQLite, even if offline
  const result = await db.execute(
    `SELECT * FROM chat_messages WHERE thread_id = ? AND deleted_at IS NULL`,
    [threadId]
  );

  return result.rows.map(row => ({
    id: row.id,
    threadId: row.thread_id,
    userId: row.user_id,
    content: row.content,
    createdAt: new Date(row.created_at)
  }));
}
```

### Sync Conflict Resolution

Last-writer-wins at the row level:

```typescript
// PowerSync handles conflicts automatically
// When a sync conflict occurs, the row with the latest timestamp wins

// If you need custom conflict resolution:
db.watch({
  tables: ['chat_messages'],
  onConflict: (conflicts: SyncConflict[]) => {
    conflicts.forEach(conflict => {
      console.log(`Conflict on ${conflict.table}:`, {
        local: conflict.localRow,
        remote: conflict.remoteRow
      });

      // Accept remote (server) version if timestamp is newer
      if (conflict.remoteRow.updated_at > conflict.localRow.updated_at) {
        conflict.accept('remote');
      } else {
        conflict.accept('local');
      }
    });
  }
});
```

### Network Reconnection Handling

```typescript
// src/lib/network.ts

import { NetInfo } from '@react-native-netinfo/netinfo';

export function setupNetworkListener(): void {
  NetInfo.addEventListener((state) => {
    if (state.isConnected && state.isInternetReachable) {
      // Network is back - trigger sync
      PowerSyncManager.shared.connector.syncEngine.refresh();
      
      // Update UI
      dispatch({ type: 'SET_ONLINE', online: true });
    } else {
      // Network is down
      dispatch({ type: 'SET_ONLINE', online: false });
    }
  });
}

// In your component
function ChatThread() {
  const [isOnline, setIsOnline] = useReducer(...);

  useEffect(() => {
    setupNetworkListener();
  }, []);

  return (
    <View>
      {!isOnline && (
        <Banner message="You are offline. Changes will sync when you reconnect." />
      )}
      {/* Rest of component */}
    </View>
  );
}
```

---

## Testing

### Mock PowerSync Server for Local Dev

```typescript
// test/mock-powersync.ts

import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

export const mockPowerSyncServer = setupServer(
  // Mock token endpoint
  http.get('*/powersync/token', ({ request }) => {
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
    return HttpResponse.json({
      token,
      expires_in: 3600,
      device: {
        id: 'test-device-id',
        user_id: 'test-user-id',
        status: 'TRUSTED',
        created_at: new Date().toISOString(),
        last_seen: new Date().toISOString()
      }
    });
  }),

  // Mock sync endpoint
  http.post('*/powersync/sync', async ({ request }) => {
    const body = await request.json() as any;
    
    return HttpResponse.json({
      data: {
        buckets: [
          {
            bucket: 'user_data',
            cursor: '1000',
            data: [
              {
                table: 'chat_threads',
                op: 'PUT',
                record: {
                  id: 'thread-1',
                  user_id: 'test-user-id',
                  title: 'Test thread',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                }
              }
            ]
          }
        ]
      }
    });
  })
);

// Setup in test files
beforeAll(() => mockPowerSyncServer.listen());
afterEach(() => mockPowerSyncServer.resetHandlers());
afterAll(() => mockPowerSyncServer.close());
```

### Device Approval Flow Testing

```typescript
// test/device-approval.test.ts

describe('Device Approval Flow', () => {
  it('should show setup wizard when E2EE enabled and no CK', async () => {
    // Mock backend returning E2EE_ENABLED=true
    mockBackendConfig({ encryptionEnabled: true });

    // Mock device with no content key
    mockDeviceState({ hasContentKey: false });

    const { getByText, getByTestId } = render(<App />);

    // Should show encryption setup wizard
    expect(getByText(/Set up encryption/i)).toBeInTheDocument();
    expect(getByTestId('recovery-key-display')).toBeInTheDocument();
  });

  it('should register device with public keys', async () => {
    const { getByText } = render(<App />);

    await userEvent.click(getByText('Continue'));

    // Verify device registration API called
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/devices'),
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"public_key"')
      })
    );
  });

  it('should handle device revoked error on sync', async () => {
    // Mock 403 response from token endpoint
    mockPowerSyncServer.use(
      http.get('*/powersync/token', () => {
        return HttpResponse.json(
          { code: 'DEVICE_DISCONNECTED' },
          { status: 403 }
        );
      })
    );

    const { getByText } = render(<App />);
    await waitFor(() => {
      expect(getByText(/Device.*revoked/i)).toBeInTheDocument();
    });
  });
});
```

### Offline Sync Testing

```typescript
// test/offline-sync.test.ts

describe('Offline Sync', () => {
  beforeEach(() => {
    // Simulate network offline
    NetInfo.fetch.mockResolvedValue({
      isConnected: false,
      isInternetReachable: false
    });
  });

  it('should save messages locally while offline', async () => {
    const { getByPlaceholderText, getByRole } = render(<ChatThread />);

    const input = getByPlaceholderText('Type a message');
    await userEvent.type(input, 'Hello offline');
    await userEvent.click(getByRole('button', { name: /Send/i }));

    // Message should appear immediately
    expect(getByText('Hello offline')).toBeInTheDocument();

    // Verify saved to local DB
    const message = await db.query(
      'SELECT * FROM chat_messages WHERE content = ?',
      ['Hello offline']
    );
    expect(message.length).toBe(1);
  });

  it('should sync messages when network returns', async () => {
    // Start offline
    NetInfo.fetch.mockResolvedValue({
      isConnected: false,
      isInternetReachable: false
    });

    // Save a message
    await saveMessageLocally({ id: 'msg-1', content: 'Test' });

    // Network comes back
    NetInfo.fetch.mockResolvedValue({
      isConnected: true,
      isInternetReachable: true
    });

    // Trigger reconnection
    await act(async () => {
      NetInfo.addEventListener.mock.calls[0][0]({
        isConnected: true,
        isInternetReachable: true
      });
    });

    // Verify sync upload called
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/powersync/upload'),
        expect.any(Object)
      );
    });
  });
});
```

---

## Troubleshooting

### Common Issues

#### 1. PowerSync Token Not Refreshing
**Symptom:** Sync stops working after 1 hour
**Solution:** Ensure your auth module implements token refresh and PowerSync calls `getToken()` callback

```typescript
// Debug: log token requests
class DebugConnector extends PowerSyncConnector {
  async getToken(): Promise<string> {
    const token = await super.getToken();
    console.log('Token requested, expires in 1 hour');
    return token;
  }
}
```

#### 2. Device Not Appearing in Settings
**Symptom:** Device list shows empty after sign-in
**Solution:** Verify the `devices` table is syncing and synced to local DB

```typescript
// Check local devices
const devices = await db.execute(
  'SELECT * FROM devices WHERE user_id = ?',
  [auth.getUserId()]
);
console.log('Local devices:', devices.rows);

// Check sync status
console.log('Sync active:', db.isSyncing);
```

#### 3. Encryption Setup Wizard Not Showing
**Symptom:** No encryption setup on first sync with E2EE enabled
**Solution:** Verify backend `E2EE_ENABLED=true` and check `needsSyncSetupWizard()`

```typescript
// Debug encryption status
const isE2EEEnabled = isEncryptionEnabled();
const hasCK = await hasContentKey();
const needsSetup = needsSyncSetupWizard();

console.log('E2EE enabled:', isE2EEEnabled);
console.log('Has content key:', hasCK);
console.log('Needs setup wizard:', needsSetup);
```

#### 4. APNs Notifications Not Arriving
**Symptom:** Push notifications sent but not received
**Solution:** Check certificate configuration and device token registration

```bash
# Verify APNs certificate is valid
openssl x509 -in APNs.pem -text -noout

# Check device token was registered
curl -H "Authorization: Bearer TOKEN" \
  https://your-backend.com/v1/devices/DEVICE_ID
```

#### 5. Sync Conflict Data Loss
**Symptom:** Local edits lost when syncing
**Solution:** Ensure `updated_at` timestamp is set on every write

```typescript
// Always include updated_at
await db.execute(
  `UPDATE chat_messages SET content = ?, updated_at = ? WHERE id = ?`,
  [newContent, new Date().toISOString(), messageId]
);
```

### Debug Logging

Enable verbose PowerSync logging:

```typescript
// Enable PowerSync debug logs
if (__DEV__) {
  PowerSync.enableLogging(LogLevel.DEBUG);
}

// Log all sync operations
db.watch({
  tables: ['chat_threads', 'chat_messages'],
  onChange: (changes) => {
    console.log('Sync changes:', changes);
  }
});

// Log network status
NetInfo.addEventListener((state) => {
  console.log('Network state:', {
    isConnected: state.isConnected,
    isInternetReachable: state.isInternetReachable,
    type: state.type
  });
});
```

### Health Check Endpoint

Request a health check from your backend:

```typescript
async function checkBackendHealth(): Promise<void> {
  const response = await fetch('https://your-backend.com/health');
  const health = await response.json();

  console.log('Backend health:', {
    status: health.status,
    powersyncConnected: health.powersync_connected,
    databaseConnected: health.database_connected
  });
}
```

---

## Next Steps

1. **Set up your backend** — See `docs/architecture/powersync-account-devices.md` for backend PowerSync configuration
2. **Enable encryption (optional)** — Follow `docs/architecture/e2e-encryption.md` if you need E2E encryption
3. **Deploy to production** — Update APNs certificate and PowerSync endpoint URLs in your release build
4. **Monitor sync** — Add logging and error tracking to monitor sync health in production

---

**Related Documentation:**
- [PowerSync Account & Device Management](powersync-account-devices.md)
- [End-to-End Encryption](e2e-encryption.md)
- [Multi-Device Sync](multi-device-sync.md)
- [PowerSync Sync Middleware](powersync-sync-middleware.md)
