import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('🎯 LayerCode webhook received:', body);
    
    // Extract transcript from LayerCode webhook
    if (body.text && body.type === 'message') {
      console.log('📝 User transcript:', body.text);
      
      // Store the transcript temporarily (in production, use Redis/database)
      // For now, we'll use a simple in-memory store
      global.latestTranscript = {
        text: body.text,
        timestamp: Date.now(),
        session_id: body.session_id,
        turn_id: body.turn_id
      };
      
      console.log('💾 Stored transcript:', global.latestTranscript);
    }
    
    // Return success to LayerCode
    return NextResponse.json({ received: true });
    
  } catch (error) {
    console.error('❌ LayerCode webhook error:', error);
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 });
  }
}

// Handle preflight OPTIONS request
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, layercode-signature',
    },
  });
}