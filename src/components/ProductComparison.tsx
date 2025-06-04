import { ShoppingCart, ArrowLeft } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  price: number;
  images?: { url: string }[];
  description?: string;
  categories?: string[];
}

interface ProductComparisonProps {
  products: Product[];
}

export function ProductComparison({ products }: ProductComparisonProps) {
  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No products to compare. Try saying "Compare [shoe name] and [another shoe name]"</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <button className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back to Search
      </button>
      
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Product Comparison</h2>
        <p className="text-gray-600">Comparing {products.length} products</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <div key={product.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <img 
              src={product.images?.[0]?.url || '/placeholder-shoe.jpg'} 
              alt={product.name}
              className="w-full h-48 object-cover bg-gray-100"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder-shoe.jpg';
              }}
            />
            
            <div className="p-6 space-y-4">
              <div>
                <h3 className="font-bold text-lg text-gray-900 mb-2">{product.name}</h3>
                <p className="text-xl font-bold text-blue-600">${product.price}</p>
              </div>
              
              {product.categories && product.categories.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-700 text-sm mb-2">Categories</h4>
                  <div className="flex flex-wrap gap-1">
                    {product.categories.slice(0, 3).map((category, index) => (
                      <span 
                        key={index}
                        className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs"
                      >
                        {category}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {product.description && (
                <div>
                  <h4 className="font-semibold text-gray-700 text-sm mb-2">Description</h4>
                  <p className="text-gray-600 text-sm line-clamp-3">{product.description}</p>
                </div>
              )}
              
              <div className="space-y-2 pt-4 border-t border-gray-100">
                <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium flex items-center justify-center gap-2">
                  <ShoppingCart className="w-4 h-4" />
                  Add to Cart
                </button>
                <button className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium">
                  View Details
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-3">Quick Comparison</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <h4 className="font-medium text-blue-800 mb-2">Price Range</h4>
            <p className="text-blue-700">
              ${Math.min(...products.map(p => p.price))} - ${Math.max(...products.map(p => p.price))}
            </p>
          </div>
          <div>
            <h4 className="font-medium text-blue-800 mb-2">Products</h4>
            <p className="text-blue-700">{products.length} items selected</p>
          </div>
          <div>
            <h4 className="font-medium text-blue-800 mb-2">Voice Commands</h4>
            <p className="text-blue-700 text-sm">"Add [shoe name] to cart"</p>
          </div>
        </div>
      </div>
    </div>
  );
}