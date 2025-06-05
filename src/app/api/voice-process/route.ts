import { NextResponse } from 'next/server';
import { searchProducts } from '@/lib/bigcommerce';
import { vectorSearch } from '@/lib/pinecone';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

interface PriceFilter {
  min?: number;
  max?: number;
}

export async function POST(request: Request) {
  try {
    const { query } = await request.json();
    
    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    console.log('🎙️ Processing voice query with Claude:', query);

    // Use Claude to understand the user's intent
    const claudeResponse = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: `You are a voice shopping assistant for Stuart's Shoes, an online shoe store. 
        
Analyze this customer voice command and determine the intent: "${query}"

Respond with ONLY a JSON object (no other text) with this structure:
{
  "action": "search" | "show_product" | "compare" | "add_to_cart" | "help" | "greeting",
  "intent": "brief description of what user wants",
  "keywords": "search terms to use for product lookup",
  "price_min": number or null,
  "price_max": number or null,
  "specific_product": "product name if asking about specific item" or null,
  "comparison_items": ["item1", "item2"] or null,
  "response_tone": "friendly" | "helpful" | "enthusiastic"
}

Examples:
- "show me running shoes under 100 dollars" → action: "search", keywords: "running shoes", price_max: 100
- "tell me about the Nike Air Max" → action: "show_product", specific_product: "Nike Air Max"
- "compare Nike and Adidas running shoes" → action: "compare", comparison_items: ["Nike running shoes", "Adidas running shoes"]
- "add this to my cart" → action: "add_to_cart"
- "hello" or "help me" → action: "greeting"`
      }]
    });

    const claudeText = claudeResponse.content[0].type === 'text' ? claudeResponse.content[0].text : '';
    console.log('🤖 Claude response:', claudeText);
    
    let intent;
    try {
      intent = JSON.parse(claudeText);
    } catch (parseError) {
      console.error('❌ Failed to parse Claude response, falling back to search');
      intent = { action: 'search', keywords: query, intent: 'search products' };
    }

    console.log('🎯 Parsed intent:', intent);

    // Execute the appropriate action based on Claude's understanding
    switch (intent.action) {
      case 'search':
        const searchResults = await searchProductsWithVector(intent.keywords || query, intent.price_min, intent.price_max);
        return NextResponse.json({ 
          action: 'search', 
          products: searchResults, 
          query: intent.keywords || query,
          intent: intent.intent,
          response_tone: intent.response_tone 
        });

      case 'show_product':
        const product = await findSpecificProduct(intent.specific_product || intent.keywords || query);
        return NextResponse.json({ 
          action: 'show_product', 
          product,
          intent: intent.intent,
          response_tone: intent.response_tone 
        });

      case 'compare':
        const compareProducts = await findProductsForComparison(intent.comparison_items || [intent.keywords || query]);
        return NextResponse.json({ 
          action: 'compare', 
          products: compareProducts,
          intent: intent.intent,
          response_tone: intent.response_tone 
        });

      case 'add_to_cart':
        const currentProduct = await getCurrentProduct();
        return NextResponse.json({ 
          action: 'add_to_cart', 
          product: currentProduct,
          intent: intent.intent,
          response_tone: intent.response_tone 
        });

      case 'greeting':
      case 'help':
        return NextResponse.json({ 
          action: 'greeting',
          intent: intent.intent,
          response_tone: intent.response_tone 
        });

      default:
        // Fallback to search
        const fallbackResults = await searchProductsWithVector(query);
        return NextResponse.json({ 
          action: 'search', 
          products: fallbackResults, 
          query,
          intent: 'search products',
          response_tone: 'helpful' 
        });
    }
    
  } catch (error) {
    console.error('Voice processing error:', error);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}

function extractPriceFilter(query: string): PriceFilter {
  const lowerQuery = query.toLowerCase();
  const priceFilter: PriceFilter = {};
  
  // Look for patterns like "under 150", "below 200", "less than 100"
  const underMatch = lowerQuery.match(/(?:under|below|less than)\s*\$?(\d+)/);
  if (underMatch) {
    priceFilter.max = parseInt(underMatch[1]);
  }
  
  // Look for patterns like "over 50", "above 100", "more than 75"
  const overMatch = lowerQuery.match(/(?:over|above|more than)\s*\$?(\d+)/);
  if (overMatch) {
    priceFilter.min = parseInt(overMatch[1]);
  }
  
  // Look for range patterns like "between 50 and 150", "from 100 to 200"
  const rangeMatch = lowerQuery.match(/(?:between|from)\s*\$?(\d+)\s*(?:and|to)\s*\$?(\d+)/);
  if (rangeMatch) {
    priceFilter.min = parseInt(rangeMatch[1]);
    priceFilter.max = parseInt(rangeMatch[2]);
  }
  
  return priceFilter;
}

function extractSearchKeywords(query: string): string {
  // Remove price-related terms to get clean keywords
  return query
    .replace(/(?:under|below|less than|over|above|more than|between|from)\s*\$?\d+(?:\s*(?:and|to)\s*\$?\d+)?/gi, '')
    .replace(/\$\d+/g, '')
    .trim();
}

async function searchProductsWithVector(query: string, priceMin?: number | null, priceMax?: number | null) {
  try {
    console.log('🔍 Starting search for:', query);
    
    // Use provided price filters or extract from query
    let finalPriceMin = priceMin;
    let finalPriceMax = priceMax;
    
    if (!finalPriceMin && !finalPriceMax) {
      const priceFilter = extractPriceFilter(query);
      finalPriceMin = priceFilter.min;
      finalPriceMax = priceFilter.max;
    }
    
    const keywords = extractSearchKeywords(query);
    
    console.log('💰 Price filter:', { min: finalPriceMin, max: finalPriceMax });
    console.log('🔤 Keywords:', keywords);
    
    const searchOptions = {
      keyword: keywords,
      priceMin: finalPriceMin,
      priceMax: finalPriceMax
    };
    
    console.log('📋 Search options:', searchOptions);
    
    // Try vector search and BigCommerce search in parallel
    console.log('🚀 Starting parallel searches...');
    const [vectorResults, bcProducts] = await Promise.all([
      vectorSearch(keywords).catch(err => {
        console.error('❌ Vector search failed:', err);
        return [];
      }),
      searchProducts(keywords, searchOptions).catch(err => {
        console.error('❌ BigCommerce search failed:', err);
        return [];
      })
    ]);
    
    console.log('📊 Vector results:', vectorResults?.length || 0);
    console.log('📊 BigCommerce results:', bcProducts?.length || 0);
    
    if (bcProducts && bcProducts.length > 0) {
      console.log('✅ Returning BigCommerce products');
      return bcProducts.slice(0, 12);
    }
    
    console.log('⚠️ No products found, falling back to mock');
    return getMockProducts(query);
    
  } catch (error) {
    console.error('💥 Major search error:', error);
    console.log('🔄 Attempting fallback search...');
    
    try {
      const keywords = extractSearchKeywords(query);
      const priceFilter = extractPriceFilter(query);
      const searchOptions = {
        keyword: keywords,
        priceMin: priceFilter.min,
        priceMax: priceFilter.max
      };
      
      console.log('🔄 Fallback search with options:', searchOptions);
      const fallbackProducts = await searchProducts(keywords, searchOptions);
      console.log('📊 Fallback products:', fallbackProducts.length);
      
      if (fallbackProducts && fallbackProducts.length > 0) {
        return fallbackProducts.slice(0, 12);
      }
      
      console.log('🎭 Using mock products as final fallback');
      return getMockProducts(query);
      
    } catch (fallbackError) {
      console.error('💥 Fallback search also failed:', fallbackError);
      console.log('🎭 Using mock products');
      return getMockProducts(query);
    }
  }
}

function getMockProducts(query: string) {
  const priceFilter = extractPriceFilter(query);
  const keywords = extractSearchKeywords(query);
  
  const allMockProducts = [
    {
      id: 1,
      name: `Athletic Running Shoe - ${keywords}`,
      price: 120,
      images: [{ url: '/placeholder-shoe.jpg' }],
      description: `High-quality running shoe designed for performance and comfort`,
      categories: ['Running', 'Athletic']
    },
    {
      id: 2,
      name: `Premium Training Sneaker - ${keywords}`,
      price: 95,
      images: [{ url: '/placeholder-shoe.jpg' }],
      description: `Versatile training shoe perfect for workouts and everyday wear`,
      categories: ['Training', 'Casual']
    },
    {
      id: 3,
      name: `Budget-Friendly Running Shoe - ${keywords}`,
      price: 65,
      images: [{ url: '/placeholder-shoe.jpg' }],
      description: `Affordable running shoe with great comfort`,
      categories: ['Running', 'Budget']
    },
    {
      id: 4,
      name: `Professional Running Shoe - ${keywords}`,
      price: 180,
      images: [{ url: '/placeholder-shoe.jpg' }],
      description: `Premium running shoe for serious athletes`,
      categories: ['Running', 'Professional']
    }
  ];
  
  // Filter by price if specified
  let filteredProducts = allMockProducts;
  if (priceFilter.min !== undefined) {
    filteredProducts = filteredProducts.filter(p => p.price >= priceFilter.min!);
  }
  if (priceFilter.max !== undefined) {
    filteredProducts = filteredProducts.filter(p => p.price <= priceFilter.max!);
  }
  
  return filteredProducts;
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