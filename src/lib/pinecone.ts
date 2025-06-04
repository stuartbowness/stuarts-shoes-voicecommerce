import { Pinecone } from '@pinecone-database/pinecone';

interface Product {
  id: number;
  name: string;
  price: number;
  description?: string;
  images?: { url: string }[];
  categories?: string[];
}

let pineconeClient: Pinecone | null = null;

function getPineconeClient() {
  if (!pineconeClient) {
    pineconeClient = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    });
  }
  return pineconeClient;
}

export async function vectorSearch(query: string) {
  try {
    const pinecone = getPineconeClient();
    const index = pinecone.index('stuarts-shoes');
    
    const embedding = await generateEmbedding(query);
    
    const results = await index.query({
      vector: embedding,
      topK: 12,
      includeMetadata: true,
    });

    return results.matches || [];
  } catch (error) {
    console.error('Pinecone search error:', error);
    return [];
  }
}

export async function upsertProductToPinecone(product: Product) {
  try {
    const pinecone = getPineconeClient();
    const index = pinecone.index('stuarts-shoes');
    
    const searchText = `${product.name} ${product.description || ''} ${product.categories?.join(' ') || ''}`;
    const embedding = await generateEmbedding(searchText);
    
    await index.upsert([{
      id: product.id.toString(),
      values: embedding,
      metadata: {
        name: product.name,
        description: product.description || '',
        price: product.price,
        image: product.images?.[0]?.url || '',
        categories: product.categories || [],
      }
    }]);
    
    console.log(`Upserted product ${product.id}: ${product.name}`);
  } catch (error) {
    console.error(`Failed to upsert product ${product.id}:`, error);
    throw error;
  }
}

async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await fetch(
      'https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: text,
          options: { wait_for_model: true }
        })
      }
    );
    
    if (!response.ok) {
      throw new Error(`Hugging Face API error: ${response.status}`);
    }
    
    const data = await response.json();
    return Array.isArray(data[0]) ? data[0] : data;
  } catch (error) {
    console.error('Hugging Face embedding error:', error);
    throw error;
  }
}

export async function initializePineconeIndex() {
  try {
    const pinecone = getPineconeClient();
    
    const indexName = 'stuarts-shoes';
    const indexList = await pinecone.listIndexes();
    
    if (!indexList.indexes?.find(index => index.name === indexName)) {
      console.log(`Creating Pinecone index: ${indexName}`);
      await pinecone.createIndex({
        name: indexName,
        dimension: 1536,
        metric: 'cosine',
        spec: {
          serverless: {
            cloud: 'aws',
            region: 'us-east-1'
          }
        }
      });
      
      console.log('Index created successfully. Waiting for initialization...');
      await new Promise(resolve => setTimeout(resolve, 60000));
    }
    
    console.log('Pinecone index ready');
    return pinecone.index(indexName);
  } catch (error) {
    console.error('Pinecone initialization error:', error);
    throw error;
  }
}