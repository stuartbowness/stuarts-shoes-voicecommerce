'use client';
import { useState } from 'react';

function AuthTest() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testAuth = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/authorize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pipeline_id: 'wimqdfes'
        })
      });

      const data = await response.json();
      setResult(`Status: ${response.status}\nResponse: ${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      setResult(`Error: ${error}`);
    }
    setLoading(false);
  };

  const testEnv = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/debug-env');
      const data = await response.json();
      setResult(`ENV Debug:\n${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      setResult(`ENV Error: ${error}`);
    }
    setLoading(false);
  };

  return (
    <div className="fixed bottom-20 right-4 bg-gray-800 text-white p-4 rounded text-sm font-mono z-50 max-w-md">
      <h3 className="font-bold mb-2">Auth Test</h3>
      <div className="flex gap-2 mb-2">
        <button 
          onClick={testAuth}
          disabled={loading}
          className="bg-blue-600 text-white px-2 py-1 rounded text-xs disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Auth'}
        </button>
        <button 
          onClick={testEnv}
          disabled={loading}
          className="bg-green-600 text-white px-2 py-1 rounded text-xs disabled:opacity-50"
        >
          Test ENV
        </button>
      </div>
      <pre className="text-xs bg-black p-2 rounded overflow-auto max-h-32">
        {result || 'Click to test auth endpoint'}
      </pre>
    </div>
  );
}

export { AuthTest };
export default AuthTest;