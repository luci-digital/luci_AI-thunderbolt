/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { type ReactNode } from 'react'

type HeaderProps = {
  action?: ReactNode
  banner?: ReactNode
}

const NavLinks = () => (
  <nav className="flex items-center gap-6 font-mono text-sm font-bold uppercase tracking-wider text-[#344054]">
    <a href="/blog" className="transition-opacity hover:opacity-70">
      Blog
    </a>
    <a href="/docs" className="transition-opacity hover:opacity-70">
      Docs
    </a>
  </nav>
)

export const Header = ({ action, banner }: HeaderProps) => (
  <header className={`fixed inset-x-0 top-0 z-50 ${banner ? '' : 'bg-white/20 backdrop-blur-[32px]'}`}>
    {banner}
    <div className={`mx-auto flex h-[104px] max-w-[1440px] items-center justify-between px-6 lg:px-[160px] ${banner ? 'bg-white/20 backdrop-blur-[32px]' : ''}`}>
      <a href="/" className="flex items-center gap-[7px]">
        <img src="/enterprise/thunderbolt-logo.png" alt="Thunderbolt" className="size-[23px]" />
        <span className="text-xl font-medium leading-7 tracking-[-0.4px] text-[#101828]">Thunderbolt</span>
      </a>
      <div className="flex items-center gap-4 md:gap-8">
        <NavLinks />
        <div className="hidden md:block">{action}</div>
      </div>
    </div>
  </header>
)

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE
