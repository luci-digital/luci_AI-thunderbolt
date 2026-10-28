/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

import { defineCollection, z } from 'astro:content';
import { docsSchema } from '@astrojs/starlight/schema';
import { glob } from 'astro/loaders';
import { repoDocsLoader } from './loaders/repo-docs-loader';

export const collections = {
	// Starlight docs collection (thunderbolt.io/docs).
	// Pulls canonical contributor docs straight from the repo-root `/docs/`
	// directory so GitHub and the docs site share one source of truth.
	docs: defineCollection({
		loader: repoDocsLoader({ base: '../docs' }),
		schema: docsSchema(),
	}),

	// Blog collection (thunderbolt.io/blog)
	blog: defineCollection({
		loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
		schema: z.object({
			title: z.string(),
			description: z.string(),
			date: z.coerce.date(),
			author: z.string(),
			tags: z.array(z.string()).default([]),
			image: z.string().optional(),
			draft: z.boolean().default(false),
		}),
	}),
};

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE
