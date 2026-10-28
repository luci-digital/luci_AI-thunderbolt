/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// LDS: 700.741 | Orchestration / Thunderbolt AI Client
// ISO: ISO/IEC 42001 §8.4, ISO 27001 §A.5 | Agent: lucia
// Genesis Bond: GB-2025-0524-DRH-LCS-001
// Temporal: origin=2026-10-28T22:37:06Z updated=2026-10-28T22:37:06Z anchor=P15060742/C459/D523 basis=OBSERVED

const { invoke } = window.__TAURI__.tauri;

async function testEmbeddings() {
  try {
    // First initialize the embedder
    await invoke('init_embedder');
    console.log('Embedder initialized successfully');
    
    // Test with a small list of texts
    const texts = [
      "Hello world",
      "This is a test",
      "Generate embeddings for these texts"
    ];
    
    console.log('Generating embeddings for:', texts);
    const embeddings = await invoke('generate_embeddings', { texts });
    
    console.log('Generated embeddings:', embeddings);
    console.log('Number of embeddings:', embeddings.length);
    console.log('Embedding dimensions:', embeddings[0].length);
    
    // Test completed successfully
    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Error during test:', error);
  }
}

// Run the test
testEmbeddings();

// LUCI-PROVENANCE-END
// Source-Payload-CID: TO_BE_COMPUTED
// Provenance-Root: TO_BE_COMPUTED
// Luci-Metadata-Footer-Version: 0.1.0
// Generation-State: DRAFT
// END-LUCI-PROVENANCE
