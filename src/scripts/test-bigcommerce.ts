import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

async function testBigCommerceConnection() {
  console.log('🔍 Testing BigCommerce API Connection...\n');
  
  // Check environment variables
  console.log('📋 Environment Variables:');
  console.log(`BIGCOMMERCE_STORE_HASH: ${process.env.BIGCOMMERCE_STORE_HASH}`);
  console.log(`BIGCOMMERCE_CLIENT_ID: ${process.env.BIGCOMMERCE_CLIENT_ID?.substring(0, 8)}...`);
  console.log(`BIGCOMMERCE_ACCESS_TOKEN: ${process.env.BIGCOMMERCE_ACCESS_TOKEN?.substring(0, 8)}...\n`);
  
  // Test store info endpoint (basic connectivity)
  console.log('🏪 Testing store info endpoint...');
  try {
    const storeResponse = await fetch(
      `https://api.bigcommerce.com/stores/${process.env.BIGCOMMERCE_STORE_HASH}/v2/store`,
      {
        headers: {
          'X-Auth-Token': process.env.BIGCOMMERCE_ACCESS_TOKEN!,
          'Content-Type': 'application/json',
        },
      }
    );
    
    console.log(`Status: ${storeResponse.status} ${storeResponse.statusText}`);
    
    if (storeResponse.ok) {
      const storeData = await storeResponse.json();
      console.log(`✅ Store Name: ${storeData.name}`);
      console.log(`✅ Store URL: ${storeData.domain}`);
    } else {
      const errorText = await storeResponse.text();
      console.log(`❌ Error: ${errorText}`);
    }
  } catch (error) {
    console.log(`❌ Network Error: ${error}`);
  }
  
  console.log('\n📦 Testing products endpoint...');
  try {
    const productsResponse = await fetch(
      `https://api.bigcommerce.com/stores/${process.env.BIGCOMMERCE_STORE_HASH}/v3/catalog/products?limit=5`,
      {
        headers: {
          'X-Auth-Token': process.env.BIGCOMMERCE_ACCESS_TOKEN!,
          'Content-Type': 'application/json',
        },
      }
    );
    
    console.log(`Status: ${productsResponse.status} ${productsResponse.statusText}`);
    
    if (productsResponse.ok) {
      const productsData = await productsResponse.json();
      console.log(`✅ Found ${productsData.data?.length || 0} products`);
      if (productsData.data && productsData.data.length > 0) {
        console.log(`✅ Sample product: ${productsData.data[0].name}`);
      }
    } else {
      const errorText = await productsResponse.text();
      console.log(`❌ Products Error: ${errorText}`);
    }
  } catch (error) {
    console.log(`❌ Products Network Error: ${error}`);
  }
  
  // Test search endpoint (try different approach)
  console.log('\n🔍 Testing search with products endpoint...');
  try {
    const searchResponse = await fetch(
      `https://api.bigcommerce.com/stores/${process.env.BIGCOMMERCE_STORE_HASH}/v3/catalog/products?keyword=towel&limit=3`,
      {
        headers: {
          'X-Auth-Token': process.env.BIGCOMMERCE_ACCESS_TOKEN!,
          'Content-Type': 'application/json',
        },
      }
    );
    
    console.log(`Status: ${searchResponse.status} ${searchResponse.statusText}`);
    
    if (searchResponse.ok) {
      const searchData = await searchResponse.json();
      console.log(`✅ Search found ${searchData.data?.length || 0} products`);
    } else {
      const errorText = await searchResponse.text();
      console.log(`❌ Search Error: ${errorText}`);
    }
  } catch (error) {
    console.log(`❌ Search Network Error: ${error}`);
  }
}

testBigCommerceConnection().catch(console.error);