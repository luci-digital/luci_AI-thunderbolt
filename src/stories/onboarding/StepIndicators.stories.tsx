/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { StepIndicators } from '@/components/onboarding/step-indicators'
import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  title: 'components/onboarding/step-indicators',
  component: StepIndicators,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    currentStep: {
      control: { type: 'number', min: 1, max: 5 },
      description: 'Current step number (1-based)',
    },
    totalSteps: {
      control: { type: 'number', min: 1, max: 10 },
      description: 'Total number of steps',
    },
  },
} satisfies Meta<typeof StepIndicators>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    currentStep: 1,
    totalSteps: 5,
  },
}

export const Step2: Story = {
  args: {
    currentStep: 2,
    totalSteps: 5,
  },
}

export const Step3: Story = {
  args: {
    currentStep: 3,
    totalSteps: 5,
  },
}

export const Step4: Story = {
  args: {
    currentStep: 4,
    totalSteps: 5,
  },
}

export const Step5: Story = {
  args: {
    currentStep: 5,
    totalSteps: 5,
  },
}

export const ManySteps: Story = {
  args: {
    currentStep: 3,
    totalSteps: 8,
  },
}

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE
