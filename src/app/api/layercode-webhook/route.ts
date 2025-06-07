import { NextRequest } from 'next/server';
import { handleLayerCodeWebhook } from '@layercode/node-server-sdk';
import Anthropic from '@anthropic-ai/sdk';
import { searchProducts } from '@/lib/bigcommerce';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// LayerCode webhook handler
export async function POST(request: NextRequest) {
  return handleLayerCodeWebhook(
    request,
    process.env.LAYERCODE_API_KEY!,
    async (message) => {
      console.log('🎯 LayerCode message received:', message);
      
      if (message.type !== 'user_message') {
        console.log('⏭️ Skipping non-user message:', message.type);
        return null;
      }

      const userQuery = message.text;
      console.log('🎙️ Processing user query:', userQuery);

      try {
        // Step 1: Use Claude to understand intent and generate search
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
              analysis.response = `Great! I found ${searchResults.length} ${analysis.search_query} for you. Let me show you the options.`;
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
          max_tokens: 500,
          messages: [{
            role: 'user',
            content: `You are a friendly voice shopping assistant for Stuart's Shoes.

User said: "${userQuery}"
Initial response: "${analysis.response}"
Products found: ${searchResults ? searchResults.length : 0}

Enhance this response to be more natural and conversational for voice. Keep it under 50 words and sound enthusiastic about helping with shoes.

Respond with ONLY the enhanced text, no JSON or other formatting.`
          }]
        });

        const finalText = finalResponse.content[0].type === 'text' ? finalResponse.content[0].text : analysis.response;
        console.log('🔊 Final TTS response:', finalText);

        // Return the response that LayerCode will convert to speech
        return finalText;

      } catch (error) {
        console.error('❌ Error processing LayerCode message:', error);
        return "I'm sorry, I'm having trouble processing your request right now. Please try again.";
      }
    }
  );
}