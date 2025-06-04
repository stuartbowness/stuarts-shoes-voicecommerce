# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
npm run dev          # Start development server with Turbopack
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run sync-catalog # Sync BigCommerce catalog to Pinecone (one-time setup)
npm run test-bigcommerce # Test BigCommerce API connection
```

## Architecture Overview

This is a voice-first e-commerce application built with Next.js that integrates multiple APIs for a complete shopping experience:

### Core Integration Pattern
The app follows a **voice → API processing → UI update** flow:
1. **VoiceConsole** captures voice input via LayerCode SDK or Web Speech API
2. **voice-process API route** processes commands and determines actions (search/compare/details/cart)
3. **Main page component** updates UI state based on API response actions

### Key Integrations

**Voice Processing (LayerCode + Fallbacks)**
- Primary: LayerCode pipeline with hosted Gemini backend
- Fallback 1: Web Speech API for Chrome users
- Fallback 2: Webhook polling via `/api/latest-transcript`
- Authorization handled via `/api/authorize` route

**Product Search (Hybrid Approach)**
- Vector search via Pinecone with sentence-transformers embeddings
- Direct BigCommerce API search as fallback
- Mock product generation for testing when APIs fail
- Price filtering extracted from natural language ("under $150", "between $50 and $200")

**State Management**
- Single page app with view switching: `home | search | detail | compare`
- Products array holds search results
- Voice commands trigger view transitions via the `handleVoiceCommand` function

### Environment Variables Required

**LayerCode (Voice)**
- `NEXT_PUBLIC_LAYERCODE_PIPELINE_ID` - Public pipeline ID
- `LAYERCODE_API_KEY` - Server-side API key

**BigCommerce (Product Data)**
- `BIGCOMMERCE_STORE_HASH` - Store identifier
- `BIGCOMMERCE_ACCESS_TOKEN` - API access token
- `BIGCOMMERCE_CLIENT_ID` - App client ID

**Pinecone (Vector Search)**
- `PINECONE_API_KEY` - API key
- `PINECONE_ENVIRONMENT` - Environment name

**Hugging Face (Embeddings)**
- `HUGGINGFACE_API_KEY` - For sentence-transformers/all-MiniLM-L6-v2

## Voice Command Processing

The `/api/voice-process` route handles natural language parsing:
- **Search patterns**: Default behavior, returns `{action: 'search', products: []}`
- **Comparison**: "compare X and Y" → `{action: 'compare', products: []}`
- **Product details**: "tell me about X" → `{action: 'show_product', product: {}}`
- **Cart actions**: "add to cart" → `{action: 'add_to_cart', product: {}}`

Price extraction regex patterns handle: "under $X", "over $X", "between $X and $Y"

## Component Structure

**VoiceConsole**: Manages all voice input methods with extensive logging and test buttons
**ProductGrid**: Displays search results with query context
**ProductDetail**: Single product view with full details
**ProductComparison**: Side-by-side product comparison

## Development Setup

1. Run `npm run sync-catalog` once to populate Pinecone index with BigCommerce products
2. Use `npm run test-bigcommerce` to verify API connectivity
3. The app includes debug UI (top-right corner) showing current view state and test buttons

## Debugging Voice Issues

The VoiceConsole component includes extensive console logging with emoji prefixes:
- 🎤 Web Speech API events
- 🔊 LayerCode data reception
- 🎯 Transcript processing
- ❌ Error conditions

Check browser console and use the "Test Voice" and "Force Search" buttons for debugging.