import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export async function GET() {
  try {
    // Check if API key exists and log details
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ 
        error: 'ANTHROPIC_API_KEY not found',
        hasKey: false 
      }, { status: 500 });
    }

    console.log('🧪 Testing Claude API');
    console.log('🔑 Key length:', apiKey.length);
    console.log('🔑 Key starts with:', apiKey.substring(0, 15));
    console.log('🔑 Key ends with:', apiKey.substring(-10));

    // Try direct fetch first to get better error details
    try {
      const directResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 100,
          messages: [{
            role: 'user',
            content: 'Say "Hello from Claude! The API is working correctly." and nothing else.'
          }]
        })
      });

      const directResult = await directResponse.text();
      console.log('🔄 Direct API response status:', directResponse.status);
      console.log('🔄 Direct API response:', directResult);

      if (!directResponse.ok) {
        return NextResponse.json({
          error: `Direct API call failed: ${directResponse.status}`,
          details: directResult,
          hasKey: true,
          keyFormat: `${apiKey.substring(0, 15)}...${apiKey.substring(-5)}`
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        method: 'direct_fetch',
        hasKey: true,
        result: JSON.parse(directResult)
      });

    } catch (directError) {
      console.log('❌ Direct API failed, trying SDK...', directError.message);
      
      const anthropic = new Anthropic({
        apiKey: apiKey,
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
        method: 'sdk',
        hasKey: true,
        claudeResponse: responseText,
        usage: response.usage,
        model: response.model
      });
    }

  } catch (error) {
    console.error('❌ Claude API test failed:', error);
    
    return NextResponse.json({
      error: error.message,
      hasKey: !!process.env.ANTHROPIC_API_KEY,
      errorType: error.constructor.name,
      keyFormat: process.env.ANTHROPIC_API_KEY ? 
        `${process.env.ANTHROPIC_API_KEY.substring(0, 15)}...${process.env.ANTHROPIC_API_KEY.substring(-5)}` : 
        'no key'
    }, { status: 500 });
  }
}