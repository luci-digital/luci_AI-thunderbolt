/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import starlight from '@astrojs/starlight';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
	site: 'https://thunderbolt.io',
	redirects: {
		'/announcing-thunderbolt': '/blog/mozilla-introduces-thunderbolt',
		// Old root-level self-hosting docs were duplicates of /docs/self-hosting/*.
		// Removed to eliminate drift; redirect old URLs to the canonical ones.
		'/docs/configuration': '/docs/self-hosting/configuration',
		'/docs/kubernetes': '/docs/self-hosting/kubernetes',
		'/docs/docker-compose': '/docs/self-hosting/docker-compose',
		'/docs/pulumi': '/docs/self-hosting/pulumi',
	},
	integrations: [
		react(),
		starlight({
			title: 'Thunderbolt Docs',
			customCss: ['./src/styles/starlight.css'],
			expressiveCode: {
				themes: ['night-owl'],
				useStarlightUiThemeColors: false,
				styleOverrides: {
					borderRadius: '0',
					codeBackground: '#0f172a',
					codeFontFamily: 'var(--tb-font-mono)',
					frames: {
						frameBoxShadowCssValue: 'none',
					},
				},
			},
			logo: {
				src: './src/assets/thunderbolt-logo.png',
				replacesTitle: false,
			},
			favicon: '/favicon.png',
			components: {
				Head: './src/components/starlight/Head.astro',
				Header: './src/components/starlight/Header.astro',
				ThemeSelect: './src/components/starlight/ThemeSelect.astro',
			},
			sidebar: [
				{
					label: 'Getting Started',
					items: [
						{ label: 'Introduction', slug: 'docs' },
						{ label: 'Customize', slug: 'docs/customize' },
						{ label: 'FAQ', slug: 'docs/faq' },
					],
				},
				{
					label: 'Self-Hosting',
					items: [
						{ label: 'Overview', slug: 'docs/self-hosting' },
						{ label: 'Configuration', slug: 'docs/self-hosting/configuration' },
						{ label: 'Docker Compose', slug: 'docs/self-hosting/docker-compose' },
						{ label: 'Kubernetes', slug: 'docs/self-hosting/kubernetes' },
						{ label: 'Pulumi (AWS)', slug: 'docs/self-hosting/pulumi' },
					],
				},
				{
					label: 'Features',
					items: [
						{ label: 'Widgets', slug: 'docs/features/widgets' },
						{
							label: 'Data Syncing',
							collapsed: true,
							items: [
								{ label: 'Architecture', slug: 'docs/architecture' },
								{ label: 'Multi-Device Sync', slug: 'docs/architecture/multi-device-sync' },
								{ label: 'End-to-End Encryption', slug: 'docs/architecture/e2e-encryption' },
								{
									label: 'PowerSync · Account & Devices',
									slug: 'docs/architecture/powersync-account-devices',
								},
								{
									label: 'PowerSync · Sync Middleware',
									slug: 'docs/architecture/powersync-sync-middleware',
								},
								{
									label: 'Composite Primary Keys & Default Data',
									slug: 'docs/architecture/composite-primary-keys-and-default-data',
								},
								{
									label: 'Delete Account & Revoke Device',
									slug: 'docs/architecture/delete-account-and-revoke-device',
								},
							],
						},
						{ label: 'WebView', slug: 'docs/features/webview' },
					],
				},
				{
					label: 'Development',
					items: [
						{ label: 'Quick Start', slug: 'docs/development/quick-start' },
						{ label: 'Mobile Setup', slug: 'docs/development/mobile-setup' },
						{ label: 'Testing', slug: 'docs/development/testing' },
					],
				},
				{
					label: 'Dev Tooling',
					items: [
						{ label: 'Tauri Signing Keys', slug: 'docs/features/tauri-signing-keys' },
						{ label: 'Storybook', slug: 'docs/dev-tooling/storybook' },
						{ label: 'Vite Bundle Analyzer', slug: 'docs/dev-tooling/vite-bundle-analyzer' },
						{
							label: 'Local CDN for App Updates',
							slug: 'docs/dev-tooling/local-cdn-for-app-update-testing',
						},
					],
				},
			],
		}),
	],
	vite: {
		plugins: [tailwindcss()],
	},
});

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE
