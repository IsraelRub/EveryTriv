import { useNavigate } from 'react-router-dom';
import { Home, AlertTriangle } from 'lucide-react';

export const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-500">
      <div className="bg-white p-8 rounded-lg shadow-xl text-center max-w-md mx-4">
        <div className="flex justify-center mb-6">
          <AlertTriangle className="w-16 h-16 text-yellow-500" />
        </div>
        <h1 className="text-4xl font-bold mb-4 text-gray-800">404</h1>
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">Page Not Found</h2>
        <p className="text-gray-600 mb-8">
          Oops! The page you're looking for seems to have vanished into the trivia void.
        </p>
        <button
          onClick={() => navigate('/')}
          className="flex items-center justify-center gap-2 mx-auto px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Home className="w-5 h-5" />
          <span>Return Home</span>
        </button>
      </div>
    </div>
  );
};