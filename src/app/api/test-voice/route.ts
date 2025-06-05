import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🧪 Testing voice-process endpoint...');
    
    // Test the voice processing with a simple query
    const testQuery = 'show me running shoes';
    
    const response = await fetch(`${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'}/api/voice-process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: testQuery })
    });

    if (!response.ok) {
      throw new Error(`Voice process API returned ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    return NextResponse.json({
      success: true,
      testQuery,
      voiceProcessResult: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Voice process test failed:', error);
    
    return NextResponse.json({
      error: error.message,
      errorType: error.constructor.name,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}