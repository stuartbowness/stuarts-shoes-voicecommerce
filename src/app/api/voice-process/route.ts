import { NextResponse } from 'next/server';
import { searchProducts } from '@/lib/bigcommerce';
import { vectorSearch } from '@/lib/pinecone';

export async function POST(request: Request) {
  try {
    const { query } = await request.json();
    
    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('compare')) {
      const products = await findProductsForComparison(query);
      return NextResponse.json({ action: 'compare', products });
    }
    
    if (lowerQuery.includes('add to cart') || lowerQuery.includes('buy this')) {
      const product = await getCurrentProduct();
      return NextResponse.json({ action: 'add_to_cart', product });
    }
    
    if (lowerQuery.includes('tell me about') || lowerQuery.includes('show me details')) {
      const product = await findSpecificProduct(query);
      return NextResponse.json({ action: 'show_product', product });
    }
    
    const products = await searchProductsWithVector(query);
    return NextResponse.json({ action: 'search', products, query });
    
  } catch (error) {
    console.error('Voice processing error:', error);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}

async function searchProductsWithVector(query: string) {
  try {
    console.log('Searching for:', query);
    const [, bcProducts] = await Promise.all([
      vectorSearch(query),
      searchProducts(query)
    ]);
    
    console.log('Found products:', bcProducts.length);
    return bcProducts.slice(0, 12);
  } catch (error) {
    console.error('Search error:', error);
    try {
      const fallbackProducts = await searchProducts(query);
      console.log('Fallback products:', fallbackProducts.length);
      return fallbackProducts.slice(0, 12);
    } catch (fallbackError) {
      console.error('Fallback search also failed:', fallbackError);
      return getMockProducts(query);
    }
  }
}

function getMockProducts(query: string) {
  return [
    {
      id: 1,
      name: `Sample ${query} - Athletic Running Shoe`,
      price: 120,
      images: [{ url: '/placeholder-shoe.jpg' }],
      description: `High-quality ${query} designed for performance and comfort`,
      categories: ['Running', 'Athletic']
    },
    {
      id: 2,
      name: `Premium ${query} - Training Sneaker`,
      price: 95,
      images: [{ url: '/placeholder-shoe.jpg' }],
      description: `Versatile ${query} perfect for training and everyday wear`,
      categories: ['Training', 'Casual']
    }
  ];
}

async function findProductsForComparison(query: string) {
  const productNames = extractProductNames(query);
  const products = [];
  
  for (const name of productNames) {
    const results = await searchProducts(name);
    if (results.length > 0) {
      products.push(results[0]);
    }
  }
  
  return products.slice(0, 3);
}

async function findSpecificProduct(query: string) {
  const productName = extractProductName(query);
  const results = await searchProducts(productName);
  return results.length > 0 ? results[0] : null;
}

async function getCurrentProduct() {
  return null;
}

function extractProductNames(query: string): string[] {
  const words = query.toLowerCase().split(' ');
  const productNames = [];
  
  for (let i = 0; i < words.length; i++) {
    if (words[i].includes('run') || words[i].includes('speed') || words[i].includes('cloud')) {
      let name = words[i];
      if (i + 1 < words.length && words[i + 1].includes('pro')) {
        name += ' ' + words[i + 1];
      }
      productNames.push(name);
    }
  }
  
  return productNames.length > 0 ? productNames : ['running shoes'];
}

function extractProductName(query: string): string {
  const words = query.toLowerCase().split(' ');
  for (let i = 0; i < words.length; i++) {
    if (words[i].includes('run') || words[i].includes('speed') || words[i].includes('cloud')) {
      let name = words[i];
      if (i + 1 < words.length && words[i + 1].includes('pro')) {
        name += ' ' + words[i + 1];
      }
      return name;
    }
  }
  return query.replace(/tell me about|show me details|the/gi, '').trim();
}