import { streamResponse } from '@layercode/node-server-sdk';
import Anthropic from '@anthropic-ai/sdk';
import { searchProducts } from '@/lib/bigcommerce';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const WELCOME_MESSAGE = "Hello! I'm your personal shoe shopping assistant at Stuart's Shoes. I can help you find the perfect pair of shoes. What are you looking for today?";

// Simple in-memory session tracking (in production, use Redis/database)
const welcomedSessions = new Set<string>();

// Clean up old sessions periodically to prevent memory leaks
setInterval(() => {
  if (welcomedSessions.size > 1000) {
    console.log('🧹 Cleaning up old session tracking...');
    welcomedSessions.clear();
  }
}, 60 * 60 * 1000); // Clean every hour

export async function POST(request: Request) {
  const requestBody = await request.json();
  
  return streamResponse(requestBody, async ({ stream }) => {
    console.log('🎯 LayerCode webhook received:', requestBody);
    
    // Handle session start
    if (requestBody.type === 'session.start') {
      const sessionId = requestBody.session_id || 'unknown';
      console.log('🎬 Session starting for:', sessionId);
      
      // Only send welcome if we haven't welcomed this session yet
      if (!welcomedSessions.has(sessionId)) {
        console.log('👋 Sending welcome message for new session');
        welcomedSessions.add(sessionId);
        stream.tts(WELCOME_MESSAGE);
      } else {
        console.log('⏭️ Session already welcomed, skipping welcome message');
      }
      
      stream.end();
      return;
    }
    
    // Handle user messages
    if (requestBody.type === 'message' && requestBody.text) {
      const userQuery = requestBody.text;
      console.log('🎙️ Processing user message:', userQuery);
      
      // Stream that we're thinking
      stream.data({ aiIsThinking: true });
      
      try {
        console.log('🤖 Step 1: Starting Claude intent analysis for:', userQuery);
        
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
- For "hello" or first greeting: {"search_query": null, "intent": "greeting", "response": "Hi there! How can I help you find the perfect pair today?"}
- For subsequent searches: {"search_query": "boots", "intent": "search", "response": "Let me search for boots for you!"}

IMPORTANT: Do NOT start responses with "Hello" unless the user is greeting you for the first time. For product searches and follow-up questions, jump straight into helping.

Respond with ONLY the JSON object, no other text.`
          }]
        });

        const claudeText = intentResponse.content[0].type === 'text' ? intentResponse.content[0].text : '';
        console.log('🤖 Step 1 complete - Claude intent response:', claudeText);

        let analysis;
        try {
          analysis = JSON.parse(claudeText);
          console.log('✅ Step 1 success - Parsed analysis:', analysis);
        } catch (parseError) {
          console.error('❌ Step 1 parse error - Failed to parse Claude response:', parseError);
          console.error('❌ Raw Claude response was:', claudeText);
          analysis = {
            search_query: userQuery,
            intent: 'search',
            response: `Let me search for ${userQuery} for you.`
          };
          console.log('🔄 Using fallback analysis:', analysis);
        }

        // Step 2: If search is needed, get products
        let searchResults = null;
        if (analysis.search_query && analysis.intent === 'search') {
          console.log('🔍 Step 2: Starting product search for:', analysis.search_query);
          
          // Stream search status
          stream.data({ searching: true, query: analysis.search_query });
          
          try {
            searchResults = await searchProducts(analysis.search_query);
            console.log('✅ Step 2 success - Found products:', searchResults?.length || 0);
            
            // Stream search results
            stream.data({ 
              searchComplete: true, 
              productsFound: searchResults?.length || 0,
              products: searchResults?.slice(0, 6) // Send first 6 products
            });
            
            // Update response based on search results
            if (searchResults && searchResults.length > 0) {
              analysis.response = `Perfect! I found ${searchResults.length} ${analysis.search_query} for you. Let me show you the options.`;
            } else {
              analysis.response = `I couldn't find any ${analysis.search_query} right now. Would you like to try a different search?`;
            }
          } catch (searchError) {
            console.error('❌ Step 2 error - Product search failed:', searchError);
            console.error('❌ Search error details:', {
              message: searchError.message,
              stack: searchError.stack,
              query: analysis.search_query
            });
            analysis.response = `I'm having trouble searching right now. Let me try to help you differently.`;
            stream.data({ searchError: true, searchErrorDetails: searchError.message });
          }
        } else {
          console.log('⏭️ Step 2 skipped - No search needed for intent:', analysis.intent);
        }

        console.log('🤖 Step 3: Starting final response enhancement');
        
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

IMPORTANT: Do NOT add "Hello" or greetings to the start of your response unless the initial response was specifically a greeting. For product searches, jump straight into the results or search action.

Respond with ONLY the enhanced text, no JSON or other formatting.`
          }]
        });

        const finalText = finalResponse.content[0].type === 'text' ? finalResponse.content[0].text : analysis.response;
        console.log('✅ Step 3 success - Final TTS response:', finalText);

        // Stream thinking is done
        stream.data({ aiIsThinking: false });
        
        console.log('🔊 Step 4: Streaming TTS response');
        
        // Stream the text-to-speech response
        stream.tts(finalText);
        
        console.log('✅ All steps completed successfully');

      } catch (error) {
        console.error('❌ Error processing message:', error);
        console.error('❌ Error details:', {
          message: error.message,
          stack: error.stack,
          userQuery,
          timestamp: new Date().toISOString()
        });
        
        stream.data({ aiIsThinking: false, error: true, errorDetails: error.message });
        
        // More specific error message based on error type
        let errorMessage = "I'm sorry, I'm having trouble processing your request right now. Please try again.";
        if (error.message?.includes('anthropic') || error.message?.includes('claude')) {
          errorMessage = "I'm having trouble with my AI processing. Please try again in a moment.";
        } else if (error.message?.includes('search') || error.message?.includes('products')) {
          errorMessage = "I'm having trouble searching for products right now. Please try again.";
        }
        
        stream.tts(errorMessage);
      }
      
      // End the stream
      stream.end();
      return;
    }
    
    // For other message types, just acknowledge
    console.log('⏭️ Unhandled message type:', requestBody.type);
    stream.end();
  });
}