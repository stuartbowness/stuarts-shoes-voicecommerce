import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { searchProducts } from '@/lib/bigcommerce';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const timestamp = new Date().toISOString();
    
    console.log(`🎯 LayerCode webhook received at ${timestamp}`, body);
    
    // Handle user messages
    if (body.type === 'user_message' && body.text) {
      const userQuery = body.text;
      console.log('🎙️ Processing user message:', userQuery);
      
      try {
        // Step 1: Use Claude to understand intent
        const intentResponse = await anthropic.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: `You are a voice shopping assistant for Stuart's Shoes, an online shoe store.

User said: "${userQuery}"

Analyze this and respond with a JSON object containing:
1. "search_query" - what to search for (if applicable)  
2. "intent" - the user's intent (search, greeting, help, etc.)
3. "response" - a natural, conversational response to speak back to the user

Example responses:
- For "show me running shoes": {"search_query": "running shoes", "intent": "search", "response": "I'll find some great running shoes for you!"}
- For "hello": {"search_query": null, "intent": "greeting", "response": "Hello! Welcome to Stuart's Shoes. How can I help you find the perfect pair today?"}

Respond with ONLY the JSON object, no other text.`
          }]
        });

        const claudeText = intentResponse.content[0].type === 'text' ? intentResponse.content[0].text : '';
        console.log('🤖 Claude intent response:', claudeText);

        let analysis;
        try {
          analysis = JSON.parse(claudeText);
        } catch (parseError) {
          console.error('❌ Failed to parse Claude response, using fallback');
          analysis = {
            search_query: userQuery,
            intent: 'search',
            response: `Let me search for ${userQuery} for you.`
          };
        }

        // Step 2: If search is needed, get products
        let searchResults = null;
        if (analysis.search_query && analysis.intent === 'search') {
          console.log('🔍 Searching for products:', analysis.search_query);
          try {
            searchResults = await searchProducts(analysis.search_query);
            console.log('📦 Found products:', searchResults?.length || 0);
            
            // Update response based on search results
            if (searchResults && searchResults.length > 0) {
              analysis.response = `Perfect! I found ${searchResults.length} ${analysis.search_query} for you. Let me show you the options.`;
            } else {
              analysis.response = `I couldn't find any ${analysis.search_query} right now. Would you like to try a different search?`;
            }
          } catch (searchError) {
            console.error('❌ Product search failed:', searchError);
            analysis.response = `I'm having trouble searching right now. Let me try to help you differently.`;
          }
        }

        // Step 3: Generate final enhanced response
        const finalResponse = await anthropic.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 300,
          messages: [{
            role: 'user',
            content: `You are a friendly voice shopping assistant for Stuart's Shoes.

User said: "${userQuery}"
Initial response: "${analysis.response}"
Products found: ${searchResults ? searchResults.length : 0}

Enhance this response to be more natural and conversational for voice. Keep it under 40 words and sound enthusiastic about helping with shoes.

Respond with ONLY the enhanced text, no JSON or other formatting.`
          }]
        });

        const finalText = finalResponse.content[0].type === 'text' ? finalResponse.content[0].text : analysis.response;
        console.log('🔊 Final TTS response:', finalText);

        // Return response in LayerCode format
        return NextResponse.json({
          type: 'agent_message',
          text: finalText,
          timestamp: Date.now()
        });

      } catch (error) {
        console.error('❌ Error processing message:', error);
        return NextResponse.json({
          type: 'agent_message', 
          text: "I'm sorry, I'm having trouble processing your request right now. Please try again.",
          timestamp: Date.now()
        });
      }
    }
    
    // For non-user messages, just acknowledge
    return NextResponse.json({ 
      received: true,
      processed: !!body.text 
    });
    
  } catch (error) {
    console.error('❌ LayerCode webhook error:', error);
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 });
  }
}