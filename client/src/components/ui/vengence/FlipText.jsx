import { useState } from 'react';
import { motion } from 'framer-motion';

export default function FlipText({
  text = 'HOAS Campus Cloud',
  className = 'text-3xl sm:text-5xl font-black',
  letterClassName = '',
}) {
  const [isHovered, setIsHovered] = useState(false);
  const words = text.split(' ');

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`inline-flex flex-wrap items-center gap-x-2 cursor-default ${className}`}
    >
      {words.map((word, wIdx) => (
        <span key={wIdx} className="inline-flex whitespace-nowrap">
          {word.split('').map((char, cIdx) => {
            const delay = (wIdx * 5 + cIdx) * 0.03;
            return (
              <motion.span
                key={cIdx}
                animate={isHovered ? { rotateX: [0, 360], y: [0, -4, 0] } : { rotateX: 0, y: 0 }}
                transition={{ duration: 0.5, delay, ease: 'easeInOut' }}
                className={`inline-block origin-center transform-gpu ${letterClassName}`}
              >
                {char}
              </motion.span>
            );
          })}
        </span>
      ))}
    </div>
  );
}
