import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface SearchResult {
  id: string;
  type: 'topic' | 'history' | 'user';
  title: string;
  subtitle?: string;
  icon: string;
  path: string;
}

interface SearchBarProps {
  onClose?: () => void;
  className?: string;
}

export default function SearchBar({ onClose, className = '' }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Sample search data - in real app, this would come from API
  const sampleResults: SearchResult[] = [
    { id: '1', type: 'topic', title: 'Science', subtitle: 'Physics, Chemistry, Biology', icon: '🔬', path: '/game?topic=Science' },
    { id: '2', type: 'topic', title: 'History', subtitle: 'World History, Ancient Civilizations', icon: '📚', path: '/game?topic=History' },
    { id: '3', type: 'topic', title: 'Geography', subtitle: 'Countries, Capitals, Landmarks', icon: '🌍', path: '/game?topic=Geography' },
    { id: '4', type: 'topic', title: 'Sports', subtitle: 'Football, Basketball, Olympics', icon: '⚽', path: '/game?topic=Sports' },
    { id: '5', type: 'history', title: 'Recent Games', subtitle: 'Your game history', icon: '📊', path: '/history' },
    { id: '6', type: 'user', title: 'Leaderboard', subtitle: 'Top players', icon: '🏆', path: '/leaderboard' },
  ];

  const searchTopics = async (searchQuery: string): Promise<SearchResult[]> => {
    if (!searchQuery.trim()) return [];
    
    setIsLoading(true);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Filter sample results based on query
      const filtered = sampleResults.filter(
        result => 
          result.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (result.subtitle && result.subtitle.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      
      return filtered;
    } catch (error) {
      console.error('Search error:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const delayedSearch = setTimeout(async () => {
      if (query.length > 0) {
        const searchResults = await searchTopics(query);
        setResults(searchResults);
        setSelectedIndex(-1);
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        onClose?.();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : results.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          handleResultClick(results[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        onClose?.();
        break;
    }
  };

  const handleResultClick = (result: SearchResult) => {
    navigate(result.path);
    setQuery('');
    setResults([]);
    setIsOpen(false);
    onClose?.();
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setIsOpen(true);
  };

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder="Search topics, history..."
          className="w-full px-4 py-2 pl-10 pr-4 bg-slate-800/50 backdrop-blur-sm border border-slate-600 
                     rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 
                     focus:ring-blue-500 focus:border-transparent transition-all"
        />
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {isLoading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          ) : (
            <span className="text-slate-400">🔍</span>
          )}
        </div>
      </div>

      {/* Search Results */}
      <AnimatePresence>
        {isOpen && (query.length > 0 || results.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-2 bg-slate-800/95 backdrop-blur-lg 
                       border border-slate-600 rounded-lg shadow-xl max-h-80 overflow-y-auto z-50"
          >
            {results.length > 0 ? (
              <div className="py-2">
                {results.map((result, index) => (
                  <motion.button
                    key={result.id}
                    onClick={() => handleResultClick(result)}
                    className={`w-full px-4 py-3 text-left hover:bg-slate-700/50 transition-colors
                               flex items-center space-x-3 ${
                                 index === selectedIndex ? 'bg-slate-700/50' : ''
                               }`}
                    whileHover={{ backgroundColor: 'rgba(51, 65, 85, 0.5)' }}
                  >
                    <span className="text-xl">{result.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-medium">{result.title}</div>
                      {result.subtitle && (
                        <div className="text-slate-400 text-sm truncate">{result.subtitle}</div>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 uppercase tracking-wide">
                      {result.type}
                    </div>
                  </motion.button>
                ))}
              </div>
            ) : query.length > 0 && !isLoading ? (
              <div className="px-4 py-6 text-center text-slate-400">
                <span className="text-2xl mb-2 block">🔍</span>
                <p>No results found for "{query}"</p>
                <p className="text-sm mt-1">Try searching for topics like "Science", "History", or "Sports"</p>
              </div>
            ) : query.length === 0 ? (
              <div className="px-4 py-6 text-center text-slate-400">
                <span className="text-2xl mb-2 block">💡</span>
                <p className="font-medium mb-2">Quick Search</p>
                <div className="text-sm space-y-1">
                  <p>• Search for trivia topics</p>
                  <p>• Find your game history</p>
                  <p>• Navigate to different sections</p>
                </div>
              </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
