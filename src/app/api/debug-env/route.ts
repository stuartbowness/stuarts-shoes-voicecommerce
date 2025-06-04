import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    // LayerCode
    hasLayercodeApiKey: !!process.env.LAYERCODE_API_KEY,
    hasLayercodePipelineId: !!process.env.NEXT_PUBLIC_LAYERCODE_PIPELINE_ID,
    
    // BigCommerce  
    hasBigCommerceStoreHash: !!process.env.BIGCOMMERCE_STORE_HASH,
    hasBigCommerceAccessToken: !!process.env.BIGCOMMERCE_ACCESS_TOKEN,
    
    // Pinecone
    hasPineconeApiKey: !!process.env.PINECONE_API_KEY,
    
    // HuggingFace
    hasHuggingFaceApiKey: !!process.env.HUGGINGFACE_API_KEY,
    
    // Environment summary
    envKeysFound: Object.keys(process.env).filter(key => 
      key.includes('LAYERCODE') || 
      key.includes('BIGCOMMERCE') || 
      key.includes('PINECONE') ||
      key.includes('HUGGINGFACE')
    )
  });
}