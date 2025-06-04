import { ShoppingCart, ArrowLeft } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  price: number;
  images?: { url: string }[];
  description?: string;
  categories?: string[];
}

interface ProductDetailProps {
  product: Product;
}

export function ProductDetail({ product }: ProductDetailProps) {
  return (
    <div className="max-w-6xl mx-auto">
      <button className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back to Search
      </button>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <img 
            src={product.images?.[0]?.url || '/placeholder-shoe.jpg'} 
            alt={product.name}
            className="w-full h-96 object-cover rounded-lg bg-gray-100"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/placeholder-shoe.jpg';
            }}
          />
          {product.images && product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {product.images.slice(1, 5).map((image, index) => (
                <img 
                  key={index}
                  src={image.url} 
                  alt={`${product.name} view ${index + 2}`}
                  className="w-full h-20 object-cover rounded border cursor-pointer hover:border-blue-500"
                />
              ))}
            </div>
          )}
        </div>
        
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
            <p className="text-2xl font-bold text-blue-600">${product.price}</p>
          </div>
          
          {product.categories && product.categories.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Categories</h3>
              <div className="flex flex-wrap gap-2">
                {product.categories.map((category, index) => (
                  <span 
                    key={index}
                    className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                  >
                    {category}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {product.description && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-gray-600 leading-relaxed">{product.description}</p>
            </div>
          )}
          
          <div className="space-y-3">
            <button className="w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Add to Cart
            </button>
            <button className="w-full border border-gray-300 text-gray-700 py-3 px-6 rounded-md hover:bg-gray-50 transition-colors font-medium">
              Add to Comparison
            </button>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Voice Commands</h4>
            <ul className="text-blue-700 text-sm space-y-1">
              <li>"Add this to my cart"</li>
              <li>"Compare this with [other shoe]"</li>
              <li>"Show me similar shoes"</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}