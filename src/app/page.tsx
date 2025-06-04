'use client';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { ProductGrid } from '@/components/ProductGrid';
import { ProductDetail } from '@/components/ProductDetail';
import { ProductComparison } from '@/components/ProductComparison';
// Dynamically import VoiceDebug to avoid SSR issues  
const VoiceDebug = dynamic(() => import('@/components/VoiceDebug').then(mod => ({ default: mod.VoiceDebug })), {
  ssr: false
});

const AuthTest = dynamic(() => import('@/components/AuthTest').then(mod => ({ default: mod.AuthTest })), {
  ssr: false
});

// Dynamically import VoiceConsole to avoid SSR issues
const VoiceConsole = dynamic(() => import('@/components/VoiceConsole'), {
  ssr: false,
  loading: () => (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-white rounded-full shadow-lg border border-gray-200 px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 bg-gray-300 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-gray-700">Loading voice...</span>
        </div>
      </div>
    </div>
  )
});

type View = 'home' | 'search' | 'detail' | 'compare';

interface Product {
  id: number;
  name: string;
  price: number;
  images?: { url: string }[];
  description?: string;
  categories?: string[];
}

export default function Home() {
  const [currentView, setCurrentView] = useState<View>('home');
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [compareProducts, setCompareProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sendMessage, setSendMessage] = useState<((message: string) => void) | null>(null);
  const [hasGreeted, setHasGreeted] = useState(false);

  const handleVoiceCommand = async (transcript: string) => {
    console.log('🎙️ Voice command received:', transcript);
    console.log('📊 Current view before processing:', currentView);
    
    try {
      const response = await fetch('/api/voice-process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: transcript })
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('🔄 Voice processing result:', result);
      
      // Generate voice response based on action
      let voiceResponse = '';
      
      switch (result.action) {
        case 'search':
          console.log('🔍 Setting search view with products:', result.products?.length || 0);
          setProducts(result.products || []);
          setSearchQuery(result.query || transcript);
          setCurrentView('search');
          const productCount = result.products?.length || 0;
          voiceResponse = `I found ${productCount} products for ${result.query || transcript}. Let me show you the results.`;
          console.log('✅ Search view set');
          break;
        case 'show_product':
          if (result.product) {
            console.log('📱 Setting detail view for product:', result.product.name);
            setSelectedProduct(result.product);
            setCurrentView('detail');
            voiceResponse = `Here are the details for ${result.product.name}. It's priced at $${result.product.price}.`;
          }
          break;
        case 'compare':
          console.log('⚖️ Setting compare view with products:', result.products?.length || 0);
          setCompareProducts(result.products || []);
          setCurrentView('compare');
          const compareCount = result.products?.length || 0;
          voiceResponse = `I'm comparing ${compareCount} products for you. Let me show you the differences.`;
          break;
        case 'add_to_cart':
          if (result.product) {
            console.log('🛒 Adding to cart:', result.product.name);
            setCart(prev => [...prev, result.product]);
            voiceResponse = `I've added ${result.product.name} to your cart.`;
          }
          break;
        default:
          console.log('🔍 Default search for:', transcript);
          setProducts(result.products || []);
          setSearchQuery(transcript);
          setCurrentView('search');
          voiceResponse = `Let me search for ${transcript}.`;
          console.log('✅ Default search view set');
      }
      
      // Send response back through LayerCode for voice output
      if (sendMessage && voiceResponse) {
        console.log('🔊 Sending voice response:', voiceResponse);
        sendMessage(voiceResponse);
      }
      
      // Force re-render check
      setTimeout(() => {
        console.log('📊 Current view after processing:', currentView);
      }, 100);
      
    } catch (error) {
      console.error('❌ Voice command processing error:', error);
      console.log('🔄 Fallback: treating as search query');
      setSearchQuery(transcript);
      setCurrentView('search');
    }
  };

  // Send initial greeting when sendMessage becomes available
  const handleSendMessageReady = (sendMessageFn: (message: string) => void) => {
    setSendMessage(() => sendMessageFn);
    
    // Send greeting after a short delay to ensure connection is ready
    if (!hasGreeted) {
      setTimeout(() => {
        console.log('🎙️ Sending initial greeting');
        sendMessageFn("Hello! I'm your voice shopping assistant for Stuart's Shoes. How can I help you find the perfect pair today?");
        setHasGreeted(true);
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header cartItems={cart} />
      
      {/* Debug info */}
      <div className="fixed top-4 right-4 bg-black text-white p-2 rounded text-xs z-40">
        View: {currentView} | Products: {products.length} | Query: {searchQuery}
        <br />
        <button 
          onClick={() => handleVoiceCommand("show me running shoes")}
          className="bg-blue-500 text-white px-2 py-1 rounded mt-1 text-xs"
        >
          Test Voice Command
        </button>
      </div>
      
      <main className="max-w-7xl mx-auto px-6 py-8">
        {currentView === 'home' && <Hero />}
        {currentView === 'search' && (
          <ProductGrid products={products} query={searchQuery} />
        )}
        {currentView === 'detail' && selectedProduct && (
          <ProductDetail product={selectedProduct} />
        )}
        {currentView === 'compare' && (
          <ProductComparison products={compareProducts} />
        )}
      </main>

      <VoiceConsole 
        onCommand={handleVoiceCommand} 
        onSendMessageReady={handleSendMessageReady}
      />
    </div>
  );
}
