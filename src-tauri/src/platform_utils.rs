/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

use serde::Serialize;
use tauri::{command, plugin::Builder, plugin::TauriPlugin, Runtime};

#[derive(Serialize)]
pub struct AndroidInsets {
    #[serde(rename = "adjustedInsetTop")]
    pub adjusted_inset_top: f64,
    #[serde(rename = "adjustedInsetBottom")]
    pub adjusted_inset_bottom: f64,
}

/// Returns Android edge-to-edge display insets. On Android this is overridden by
/// the Kotlin PlatformUtilsPlugin which reads real WindowInsetsCompat values.
/// On desktop/iOS this Rust fallback returns None.
#[command]
fn get_android_insets() -> Option<AndroidInsets> {
    None
}

/// Sets Android status/navigation bar icon appearance. On Android this is
/// overridden by the Kotlin PlatformUtilsPlugin which calls
/// WindowInsetsControllerCompat. On desktop/iOS this Rust fallback is a no-op.
#[command]
fn set_bar_color(style: String) -> Result<(), String> {
    let _ = style;
    Ok(())
}

pub fn init<R: Runtime>() -> TauriPlugin<R> {
    let builder = Builder::new("platform-utils")
        .invoke_handler(tauri::generate_handler![get_android_insets, set_bar_color]);

    #[cfg(target_os = "android")]
    let builder = builder.setup(|_app, api| {
        api.register_android_plugin("net.thunderbird.thunderbolt", "PlatformUtilsPlugin")?;
        Ok(())
    });

    builder.build()
}

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE
