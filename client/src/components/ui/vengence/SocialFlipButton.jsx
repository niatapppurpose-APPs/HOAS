import { useState } from 'react';

export default function SocialFlipButton({
  frontText = 'Connect on LinkedIn',
  backText = 'Hemanth Atthuluri ↗',
  frontIcon,
  backIcon,
  onClick,
  href,
  className = '',
}) {
  const [isFlipped, setIsFlipped] = useState(false);

  const content = (
    <div
      onMouseEnter={() => setIsFlipped(true)}
      onMouseLeave={() => setIsFlipped(false)}
      className={`relative h-11 px-5 rounded-2xl overflow-hidden cursor-pointer select-none font-bold text-xs transition-transform duration-200 active:scale-95 shadow-md ${className}`}
      style={{ perspective: '1000px' }}
    >
      <div
        className="w-full h-full relative transition-transform duration-500"
        style={{
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateX(180deg)' : 'rotateX(0deg)',
        }}
      >
        {/* Front Face */}
        <div
          className="absolute inset-0 flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 text-white px-4"
          style={{ backfaceVisibility: 'hidden' }}
        >
          {frontIcon}
          <span>{frontText}</span>
        </div>

        {/* Back Face */}
        <div
          className="absolute inset-0 flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 text-white px-4"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateX(180deg)',
          }}
        >
          {backIcon}
          <span>{backText}</span>
        </div>
      </div>
    </div>
  );

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="inline-block">
        {content}
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} className="inline-block">
      {content}
    </button>
  );
}
