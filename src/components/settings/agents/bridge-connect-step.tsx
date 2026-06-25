/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import type { ReactNode } from 'react'

type StepProps = {
  index: number
  title: string
  children: ReactNode
}

/** A numbered step (badge + title + body) shared by the ACP and MCP bridge connect dialogs. */
export const Step = ({ index, title, children }: StepProps) => (
  <div className="flex gap-3">
    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-[length:var(--font-size-xs)] font-medium">
      {index}
    </span>
    <div className="flex min-w-0 flex-1 flex-col gap-2">
      <p className="text-[length:var(--font-size-sm)] font-medium">{title}</p>
      {children}
    </div>
  </div>
)
