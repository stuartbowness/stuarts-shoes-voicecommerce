import { ShoppingCart } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  price: number;
  images?: { url: string }[];
}

interface HeaderProps {
  cartItems: Product[];
}

export function Header({ cartItems }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-40">
      <div className="flex justify-between items-center max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900">Stuart's Shoes</h1>
        <div className="bg-blue-600 text-white px-4 py-2 rounded-full flex items-center gap-2 hover:bg-blue-700 transition-colors cursor-pointer">
          <ShoppingCart className="w-4 h-4" />
          <span className="font-medium">Cart ({cartItems.length})</span>
        </div>
      </div>
    </header>
  );
}