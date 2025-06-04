import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    hasLayercodeApiKey: !!process.env.LAYERCODE_API_KEY,
    layercodeApiKeyLength: process.env.LAYERCODE_API_KEY?.length || 0,
    layercodeApiKeyStart: process.env.LAYERCODE_API_KEY?.substring(0, 8) || 'undefined',
    allEnvKeys: Object.keys(process.env).filter(key => key.includes('LAYERCODE'))
  });
}