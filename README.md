# Stuart's Shoes - VoiceCommerce MVP

A voice-first shopping interface for Stuart's Shoes BigCommerce store, featuring 10,000+ shoe SKUs with voice search, comparison, and cart functionality.

## Tech Stack

- **Frontend:** Next.js 14 + React + Tailwind CSS
- **Voice:** LayerCode (hosted backend with Gemini)
- **Search:** Pinecone vector search + BigCommerce API
- **Hosting:** Vercel

## Features

- 🎤 Voice-first shopping interface
- 🔍 AI-powered product search
- 📊 Product comparison
- 🛒 Real-time cart updates
- 📱 Responsive design

## Getting Started

### 1. Environment Setup

Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
cp .env.example .env.local
```

Required environment variables:
- `NEXT_PUBLIC_LAYERCODE_PIPELINE_ID` - Your LayerCode pipeline ID
- `LAYERCODE_API_KEY` - LayerCode API key
- `BIGCOMMERCE_CLIENT_ID` - Your BigCommerce store client ID
- `BIGCOMMERCE_ACCESS_TOKEN` - BigCommerce API access token
- `BIGCOMMERCE_STORE_HASH` - Your BigCommerce store hash
- `PINECONE_API_KEY` - Pinecone API key
- `PINECONE_ENVIRONMENT` - Pinecone environment
- `HUGGINGFACE_API_KEY` - Hugging Face API key for embeddings

### 2. Install Dependencies

```bash
npm install
```

### 3. Initialize Vector Search (One-time setup)

```bash
npm run sync-catalog
```

This will:
- Create a Pinecone index called "stuarts-shoes"
- Sync all BigCommerce products to Pinecone for vector search
- Generate embeddings for enhanced search capabilities

### 4. Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your voice-powered shoe store.

## Voice Commands

Try these voice commands:

- **Search:** "Show me running shoes under $150"
- **Product Details:** "Tell me about the CloudRun Pro"
- **Comparison:** "Compare the CloudRun and SpeedFlex"
- **Add to Cart:** "Add this to my cart"
- **Browse:** "Show me hiking boots"

## UI Layout

- **Large visual area** (80% of screen) for product display
- **Voice console** at bottom center showing listening/processing states
- **Cart indicator** in top-right corner
- **4 main screens:** Home → Search Results → Product Detail → Comparison

## Deployment

### Deploy to Vercel

1. Push to GitHub:
```bash
git add .
git commit -m "Initial VoiceCommerce implementation"
git push origin main
```

2. Deploy with Vercel CLI:
```bash
npx vercel
```

3. Add environment variables in Vercel dashboard
4. Configure custom domain (optional)

## Architecture

```
src/
├── app/
│   ├── api/
│   │   ├── authorize/         # LayerCode auth
│   │   └── voice-process/     # Voice command processing
│   └── page.tsx              # Main app component
├── components/
│   ├── VoiceConsole.tsx      # Voice interface
│   ├── Header.tsx            # Site header with cart
│   ├── Hero.tsx              # Landing page
│   ├── ProductGrid.tsx       # Search results
│   ├── ProductDetail.tsx     # Single product view
│   └── ProductComparison.tsx # Product comparison
├── lib/
│   ├── bigcommerce.ts        # BigCommerce API integration
│   └── pinecone.ts           # Vector search functionality
└── scripts/
    └── sync-catalog.ts       # One-time catalog sync
```

## LayerCode System Prompt

Configure your LayerCode pipeline with this system prompt:

```
You are a helpful shoe store assistant for Stuart's Shoes. You help customers find shoes through natural conversation.

When customers make requests:
- For searches: Help them find products and describe what you're showing
- For product details: Provide helpful information about specific shoes  
- For comparisons: Explain key differences between products
- For cart additions: Confirm what was added

Keep responses conversational and brief since they'll be spoken aloud.

Examples:
"I found 8 running shoes under $150. Let me show you the top options."
"The CloudRun Pro is great for daily training with maximum cushioning."  
"I've added the CloudRun Pro to your cart. Would you like to continue shopping?"
```

## Development Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run sync-catalog # Sync BigCommerce catalog to Pinecone
```

## Troubleshooting

1. **Voice not working:** Check LayerCode credentials and pipeline ID
2. **No search results:** Verify BigCommerce API credentials
3. **Vector search issues:** Run `npm run sync-catalog` to re-sync products
4. **Build errors:** Check all environment variables are set

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request
