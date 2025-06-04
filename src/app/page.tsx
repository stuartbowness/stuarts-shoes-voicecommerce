'use client';
import { useState } from 'react';
import { VoiceConsole } from '@/components/VoiceConsole';
import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { ProductGrid } from '@/components/ProductGrid';
import { ProductDetail } from '@/components/ProductDetail';
import { ProductComparison } from '@/components/ProductComparison';

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
    </div>
  );
}
