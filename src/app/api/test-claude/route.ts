import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export async function GET() {
  try {
    // Check if API key exists
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ 
        error: 'ANTHROPIC_API_KEY not found',
        hasKey: false 
      }, { status: 500 });
    }

    console.log('🧪 Testing Claude API with key:', process.env.ANTHROPIC_API_KEY?.substring(0, 20) + '...');

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    // Simple test request
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 100,
      messages: [{
        role: 'user',
        content: 'Say "Hello from Claude! The API is working correctly." and nothing else.'
      }]
    });

    const responseText = response.content[0].type === 'text' ? response.content[0].text : '';

    return NextResponse.json({
      success: true,
      hasKey: true,
      claudeResponse: responseText,
      usage: response.usage,
      model: response.model
    });

  } catch (error) {
    console.error('❌ Claude API test failed:', error);
    
    return NextResponse.json({
      error: error.message,
      hasKey: !!process.env.ANTHROPIC_API_KEY,
      errorType: error.constructor.name
    }, { status: 500 });
  }
}