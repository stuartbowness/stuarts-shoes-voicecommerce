import { NextResponse } from 'next/server';

// Declare global type for TypeScript
declare global {
  var latestTranscript: {
    text: string;
    timestamp: number;
    session_id: string;
    turn_id: string;
  } | undefined;
}

export async function GET() {
  try {
    const transcript = global.latestTranscript;
    
    if (!transcript) {
      return NextResponse.json({ transcript: null, timestamp: null });
    }
    
    // Only return transcripts from the last 10 seconds to avoid stale data
    const isRecent = Date.now() - transcript.timestamp < 10000;
    
    if (!isRecent) {
      return NextResponse.json({ transcript: null, timestamp: null });
    }
    
    console.log('📤 Serving latest transcript:', transcript.text);
    
    return NextResponse.json({
      transcript: transcript.text,
      timestamp: transcript.timestamp,
      session_id: transcript.session_id,
      turn_id: transcript.turn_id
    });
    
  } catch (error) {
    console.error('❌ Error getting latest transcript:', error);
    return NextResponse.json({ error: 'Failed to get transcript' }, { status: 500 });
  }
}