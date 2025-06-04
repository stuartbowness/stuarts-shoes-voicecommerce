interface Product {
  id: number;
  name: string;
  price: number;
  images?: { url: string }[];
  description?: string;
}

interface ProductGridProps {
  products: Product[];
  query: string;
}

export function ProductGrid({ products, query }: ProductGridProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">&ldquo;{query}&rdquo;</h2>
        <p className="text-gray-600">Found {products.length} products</p>
      </div>
      
      {products.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No products found. Try a different search term.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <div key={product.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow border border-gray-200">
              <img 
                src={product.images?.[0]?.url || '/placeholder-shoe.jpg'} 
                alt={product.name}
                className="w-full h-48 object-cover bg-gray-100"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder-shoe.jpg';
                }}
              />
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{product.name}</h3>
                <p className="text-lg font-bold text-blue-600">${product.price}</p>
                {product.description && (
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">{product.description}</p>
                )}
                <button className="mt-3 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium">
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}