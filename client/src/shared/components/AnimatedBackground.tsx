import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const TOPICS = [
  'Science', 'Sports', 'History', 'Geography', 'Movies', 'Music', 
  'Technology', 'Art', 'Literature', 'Politics', 'Nature', 'Space', 
  'Food', 'Travel', 'Animals', 'Cars', 'Fashion', 'Health', 
  'Education', 'Business', 'Philosophy', 'Mathematics', 'Chemistry',
  'Biology', 'Physics', 'Astronomy', 'Psychology', 'Economics',
  'Architecture', 'Engineering', 'Medicine', 'Law', 'Religion',
  'Mythology', 'Folklore', 'Comics', 'Gaming', 'Cooking', 'Gardening',
  'Photography', 'Dance', 'Theater', 'Poetry', 'Novels', 'Painting',
  'Sculpture', 'Design', 'Fashion', 'Beauty', 'Fitness', 'Yoga'
];

const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD',
  '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9', '#F8C471', '#82E0AA',
  '#F1948A', '#85C1E9', '#D7BDE2', '#F9E79F', '#A9DFBF', '#FAD7A0'
];

interface FloatingWord {
  id: number;
  text: string;
  x: number;
  y: number;
  speed: number;
  color: string;
  opacity: number;
}

export default function AnimatedBackground() {
  const [words, setWords] = useState<FloatingWord[]>([]);

  useEffect(() => {
    // Initialize floating words
    const initialWords: FloatingWord[] = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      text: TOPICS[Math.floor(Math.random() * TOPICS.length)],
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      speed: 0.5 + Math.random() * 1.5,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      opacity: 0.1 + Math.random() * 0.3
    }));
    setWords(initialWords);

    // Animation loop
    const animate = () => {
      setWords(prevWords => 
        prevWords.map(word => ({
          ...word,
          y: word.y - word.speed,
          x: word.x + Math.sin(Date.now() * 0.001 + word.id) * 0.5,
          color: COLORS[Math.floor((Date.now() * 0.001 + word.id) % COLORS.length)],
          opacity: 0.1 + Math.sin(Date.now() * 0.002 + word.id) * 0.2
        }))
      );
    };

    const interval = setInterval(animate, 50);

    // Reset words that go off screen
    const resetWords = () => {
      setWords(prevWords => 
        prevWords.map(word => 
          word.y < -50 ? {
            ...word,
            y: window.innerHeight + 50,
            x: Math.random() * window.innerWidth,
            text: TOPICS[Math.floor(Math.random() * TOPICS.length)]
          } : word
        )
      );
    };

    const resetInterval = setInterval(resetWords, 2000);

    return () => {
      clearInterval(interval);
      clearInterval(resetInterval);
    };
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <AnimatePresence>
        {words.map(word => (
          <motion.div
            key={word.id}
            className="absolute text-2xl font-bold select-none"
            style={{
              left: `${word.x}px`,
              top: `${word.y}px`,
              color: word.color,
              opacity: word.opacity,
            }}
            initial={{ 
              scale: 0, 
              rotate: -180,
              opacity: 0 
            }}
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: Math.sin(Date.now() * 0.001 + word.id) * 10,
              opacity: word.opacity,
              y: word.y,
              x: word.x
            }}
            exit={{ 
              scale: 0, 
              opacity: 0,
              rotate: 180
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
              scale: {
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              },
              rotate: {
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }
            }}
            whileHover={{
              scale: 1.5,
              rotate: 0,
              filter: "brightness(1.5)",
              transition: { duration: 0.3 }
            }}
          >
            {word.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
} 