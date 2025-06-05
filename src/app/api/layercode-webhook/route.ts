import { NextResponse } from 'next/server';
import crypto from 'crypto';

const WEBHOOK_SECRET = 'nk1w6dt7i6jg2i8fk1yg79cq';

function verifySignature(body: string, signature: string): boolean {
  try {
    const [timestamp, hash] = signature.split(',').map(part => part.split('=')[1]);
    const expectedSignature = crypto
      .createHmac('sha256', WEBHOOK_SECRET)
      .update(timestamp + '.' + body)
      .digest('hex');
    
    return hash === expectedSignature;
  } catch (error) {
    console.error('❌ Signature verification failed:', error);
    return false;
  }
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('layercode-signature');
    const timestamp = new Date().toISOString();
    
    console.log(`🎯 LayerCode webhook received at ${timestamp}`);
    console.log('📝 Raw body length:', rawBody.length);
    console.log('📝 Raw body content:', rawBody);
    console.log('🔐 Signature:', signature);
    console.log('📊 Headers:', Object.fromEntries(request.headers.entries()));
    
    // Verify webhook signature
    if (signature && !verifySignature(rawBody, signature)) {
      console.error('❌ Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
    
    const body = JSON.parse(rawBody);
    console.log('✅ Parsed body:', body);
    
    // Extract transcript from LayerCode webhook
    if (body.text && body.type === 'message') {
      console.log('📝 User transcript:', body.text);
      
      // Store the transcript temporarily (in production, use Redis/database)
      // For now, we'll use a simple in-memory store
      global.latestTranscript = {
        text: body.text,
        timestamp: Date.now(),
        session_id: body.session_id || 'unknown',
        turn_id: body.turn_id || 'unknown'
      };
      
      console.log('💾 Stored transcript:', global.latestTranscript);
    }
    
    // Return success to LayerCode - this allows LayerCode to continue processing
    return NextResponse.json({ 
      received: true,
      processed: !!body.text 
    });
    
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