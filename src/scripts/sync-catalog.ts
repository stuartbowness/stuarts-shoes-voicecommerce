import { config } from 'dotenv';
import { resolve } from 'path';
import { syncCatalogToPinecone } from '../lib/bigcommerce';
import { initializePineconeIndex } from '../lib/pinecone';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

async function main() {
  try {
    console.log('Starting catalog sync process...');
    
    console.log('1. Initializing Pinecone index...');
    await initializePineconeIndex();
    
    console.log('2. Syncing BigCommerce catalog to Pinecone...');
    await syncCatalogToPinecone();
    
    console.log('✅ Catalog sync completed successfully!');
  } catch (error) {
    console.error('❌ Catalog sync failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}