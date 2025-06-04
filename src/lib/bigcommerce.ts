interface BigCommerceProduct {
  id: number;
  name: string;
  price: number;
  description?: string;
  images?: { url: string }[];
  categories?: string[];
}

export async function searchProducts(query: string): Promise<BigCommerceProduct[]> {
  try {
    const response = await fetch(
      `https://api.bigcommerce.com/stores/${process.env.BIGCOMMERCE_STORE_HASH}/v3/catalog/products?keyword=${encodeURIComponent(query)}&limit=12`,
      {
        headers: {
          'X-Auth-Token': process.env.BIGCOMMERCE_ACCESS_TOKEN!,
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (!response.ok) {
      throw new Error(`BigCommerce API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('BigCommerce search error:', error);
    return [];
  }
}

export async function getProduct(productId: string): Promise<BigCommerceProduct | null> {
  try {
    const response = await fetch(
      `https://api.bigcommerce.com/stores/${process.env.BIGCOMMERCE_STORE_HASH}/v3/catalog/products/${productId}`,
      {
        headers: {
          'X-Auth-Token': process.env.BIGCOMMERCE_ACCESS_TOKEN!,
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (!response.ok) {
      throw new Error(`BigCommerce API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('BigCommerce get product error:', error);
    return null;
  }
}

export async function getAllProducts(page = 1, limit = 250): Promise<BigCommerceProduct[]> {
  try {
    const response = await fetch(
      `https://api.bigcommerce.com/stores/${process.env.BIGCOMMERCE_STORE_HASH}/v3/catalog/products?page=${page}&limit=${limit}`,
      {
        headers: {
          'X-Auth-Token': process.env.BIGCOMMERCE_ACCESS_TOKEN!,
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (!response.ok) {
      throw new Error(`BigCommerce API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('BigCommerce get all products error:', error);
    return [];
  }
}

export async function syncCatalogToPinecone() {
  const { upsertProductToPinecone } = await import('./pinecone');
  let page = 1;
  let hasMore = true;
  
  console.log('Starting catalog sync to Pinecone...');
  
  while (hasMore) {
    const products = await getAllProducts(page, 250);
    
    if (products.length === 0) {
      hasMore = false;
      break;
    }
    
    console.log(`Processing page ${page} (${products.length} products)`);
    
    for (const product of products) {
      try {
        await upsertProductToPinecone(product);
      } catch (error) {
        console.error(`Failed to sync product ${product.id}:`, error);
      }
    }
    
    page++;
    if (products.length < 250) {
      hasMore = false;
    }
  }
  
  console.log('Catalog sync completed!');
}