/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { defaultChatTitle } from '@/lib/constants'
import { useRef, useState } from 'react'

type RenameChatDialogProps = {
  open: boolean
  title: string | null
  onOpenChange: (open: boolean) => void
  onRename: (title: string) => void
}

const RenameChatForm = ({ title, onOpenChange, onRename }: Omit<RenameChatDialogProps, 'open'>) => {
  const [value, setValue] = useState(title ?? defaultChatTitle)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSave = () => {
    const trimmed = value.trim()
    const newTitle = trimmed || defaultChatTitle
    if (newTitle !== (title ?? defaultChatTitle)) {
      onRename(newTitle)
    }
    onOpenChange(false)
  }

  return (
    <DialogContent
      showCloseButton={false}
      className="top-[30%]"
      onOpenAutoFocus={(e) => {
        e.preventDefault()
        inputRef.current?.focus()
        inputRef.current?.select()
      }}
    >
      <DialogHeader>
        <DialogTitle>Rename chat</DialogTitle>
      </DialogHeader>
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            handleSave()
          }
        }}
        placeholder="Chat name"
      />
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button onClick={handleSave}>Save</Button>
      </DialogFooter>
    </DialogContent>
  )
}

export const RenameChatDialog = ({ open, title, onOpenChange, onRename }: RenameChatDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    {open && <RenameChatForm key={title} title={title} onOpenChange={onOpenChange} onRename={onRename} />}
  </Dialog>
)

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE
