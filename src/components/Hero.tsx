export function Hero() {
  return (
    <div className="text-center py-16">
      <h2 className="text-4xl font-bold text-gray-900 mb-4">
        Welcome to Stuart's Shoes
      </h2>
      <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
        Voice-powered shoe shopping made simple. Just speak to find your perfect pair from our collection of 10,000+ shoes.
      </p>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-md mx-auto">
        <h3 className="font-semibold text-blue-900 mb-3">Try saying:</h3>
        <ul className="text-blue-700 space-y-2 text-left">
          <li>"Show me running shoes under $150"</li>
          <li>"Tell me about the CloudRun Pro"</li>
          <li>"Compare running shoes"</li>
          <li>"Add this to my cart"</li>
        </ul>
      </div>
    </div>
  );
}