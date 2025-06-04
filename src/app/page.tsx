'use client';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { ProductGrid } from '@/components/ProductGrid';
import { ProductDetail } from '@/components/ProductDetail';
import { ProductComparison } from '@/components/ProductComparison';
import { VoiceDebug } from '@/components/VoiceDebug';

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

  const handleVoiceCommand = async (transcript: string) => {
    try {
      const response = await fetch('/api/voice-process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: transcript })
      });
      
      const result = await response.json();
      
      switch (result.action) {
        case 'search':
          setProducts(result.products || []);
          setSearchQuery(result.query || transcript);
          setCurrentView('search');
          break;
        case 'show_product':
          setSelectedProduct(result.product);
          setCurrentView('detail');
          break;
        case 'compare':
          setCompareProducts(result.products || []);
          setCurrentView('compare');
          break;
        case 'add_to_cart':
          if (result.product) {
            setCart(prev => [...prev, result.product]);
          }
          break;
      }
    } catch (error) {
      console.error('Voice command processing error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header cartItems={cart} />
      
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

      <VoiceConsole onCommand={handleVoiceCommand} />
      <VoiceDebug />
    </div>
  );
}
