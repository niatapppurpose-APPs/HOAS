import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Search, UserPlus, ArrowRight } from 'lucide-react';

const EmptyState = ({
  title,
  subtitle,
  description,
  ctaLabel,
  onCta,
  videoSrc,
  videoAlt = 'Empty state animation',
  ctaVariant = 'primary',
  secondaryCta,
  icon: CustomIcon,
  className = ''
}) => {
  const { isDark } = useTheme();
  const [mounted, setMounted] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    // Entrance animation trigger
    const id = setTimeout(() => setMounted(true), 30);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    // Try autoplay and show controls if blocked
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    v.playsInline = true;

    const tryPlay = async () => {
      try {
        const p = v.play();
        if (p !== undefined) await p;
      } catch (err) {
        // if blocked, show controls so user can play
        v.controls = true;
      } finally {
        setTimeout(() => { if (v.paused) v.controls = true; }, 700);
      }
    };

    tryPlay();

    const onError = () => { v.controls = true; };
    v.addEventListener('error', onError);
    return () => v.removeEventListener('error', onError);
  }, [videoSrc]);

  // Determine icon based on CTA label
  const getCtaIcon = () => {
    if (CustomIcon) return <CustomIcon className="w-5 h-5" />;
    if (ctaLabel?.toLowerCase().includes('search')) return <Search className="w-5 h-5" />;
    if (ctaLabel?.toLowerCase().includes('assign') || ctaLabel?.toLowerCase().includes('add')) return <UserPlus className="w-5 h-5" />;
    return <ArrowRight className="w-5 h-5" />;
  };

  return (
    <div
      className={`w-full min-h-[60vh] flex items-center justify-center ${className}`}
    >
      <div className="w-full max-w-5xl px-4 md:px-8">
        <div className="flex flex-col lg:flex-row items-center lg:items-center gap-10 lg:gap-16">

          {/* Left Column - Animated Illustration */}
          <div
            className={`flex-shrink-0 flex items-center justify-center ${mounted ? 'empty-state-anim-left' : 'opacity-0'}`}
          >
            <div
              className="relative w-64 md:w-80 lg:w-96"
              style={{
                filter: isDark ? 'none' : 'saturate(1.1)',
              }}
            >
              {/* Subtle glow effect behind video */}
              <div
                className="absolute inset-0 rounded-2xl"
                style={{
                  background: isDark
                    ? 'radial-gradient(circle at center, rgba(139, 92, 246, 0.2) 0%, transparent 70%)'
                    : 'radial-gradient(circle at center, rgba(99, 102, 241, 0.12) 0%, transparent 70%)',
                  filter: 'blur(40px)',
                  transform: 'scale(1.3)',
                }}
              />

              {/* Video container */}
              <div
                className="relative rounded-2xl overflow-hidden"
                style={{
                  boxShadow: isDark
                    ? '0 8px 32px rgba(0, 0, 0, 0.3)'
                    : '0 8px 32px rgba(99, 102, 241, 0.12)',
                }}
              >
                <video
                  ref={videoRef}
                  src={videoSrc}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="auto"
                  aria-label={videoAlt}
                  className="w-full h-auto block"
                  style={{
                    display: 'block',
                    objectFit: 'contain',
                    borderRadius: 16,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Vertical Divider */}
          <div className="hidden lg:flex items-center justify-center">
            <div
              className="h-48"
              style={{
                width: '1px',
                background: isDark
                  ? 'linear-gradient(180deg, transparent 0%, rgba(139, 92, 246, 0.4) 20%, rgba(99, 102, 241, 0.6) 50%, rgba(139, 92, 246, 0.4) 80%, transparent 100%)'
                  : 'linear-gradient(180deg, transparent 0%, rgba(99, 102, 241, 0.2) 20%, rgba(99, 102, 241, 0.35) 50%, rgba(99, 102, 241, 0.2) 80%, transparent 100%)',
              }}
            />
          </div>

          {/* Horizontal Divider for mobile */}
          <div className="lg:hidden w-full flex justify-center">
            <div
              style={{
                height: '1px',
                width: '50%',
                background: isDark
                  ? 'linear-gradient(90deg, transparent 0%, rgba(139, 92, 246, 0.4) 20%, rgba(99, 102, 241, 0.6) 50%, rgba(139, 92, 246, 0.4) 80%, transparent 100%)'
                  : 'linear-gradient(90deg, transparent 0%, rgba(99, 102, 241, 0.2) 20%, rgba(99, 102, 241, 0.35) 50%, rgba(99, 102, 241, 0.2) 80%, transparent 100%)',
              }}
            />
          </div>

          {/* Right Column - Content Panel */}
          <div
            className={`flex-1 flex flex-col items-center lg:items-start text-center lg:text-left ${mounted ? 'empty-state-anim-right' : 'opacity-0'}`}
          >
            {/* Eyebrow text */}
           

            {/* Title */}
            <h3
              className="text-3xl md:text-4xl lg:text-[43px] font-bold leading-tight"
              style={{
                color: 'var(--text-primary)',
                lineHeight: 1.15,
              }}
            >
              {title}
            </h3>

            {/* Subtitle */}
            {subtitle && (
              <p
                className="mt-4 text-base md:text-lg font-medium"
                style={{ color: 'var(--text-secondary)' }}
              >
                {subtitle}
              </p>
            )}

            {/* Description */}
            {description && (
              <p
                className="mt-4 text-sm md:text-base leading-relaxed"
                style={{
                  color: 'var(--text-muted)',
                  maxWidth: '420px',
                  lineHeight: 1.7,
                }}
              >
                {description}
              </p>
            )}

            {/* CTA Buttons */}
            <div className="mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-4">
              {ctaLabel && (
                <button
                  onClick={onCta}
                  className="group inline-flex items-center gap-3 px-7 py-3.5 rounded-xl font-semibold text-base transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0"
                  style={{
                    background: 'linear-gradient(135deg, #6D28D9 0%, #6366F1 50%, #8B5CF6 100%)',
                    backgroundSize: '200% 100%',
                    color: '#ffffff',
                    boxShadow: isDark
                      ? '0 6px 24px rgba(99, 102, 241, 0.4), 0 2px 8px rgba(0, 0, 0, 0.2)'
                      : '0 6px 24px rgba(99, 102, 241, 0.3), 0 2px 8px rgba(0, 0, 0, 0.1)',
                    border: 'none',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundPosition = '100% 0';
                    e.currentTarget.style.boxShadow = isDark
                      ? '0 10px 32px rgba(99, 102, 241, 0.5), 0 4px 12px rgba(0, 0, 0, 0.25)'
                      : '0 10px 32px rgba(99, 102, 241, 0.4), 0 4px 12px rgba(0, 0, 0, 0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundPosition = '0% 0';
                    e.currentTarget.style.boxShadow = isDark
                      ? '0 6px 24px rgba(99, 102, 241, 0.4), 0 2px 8px rgba(0, 0, 0, 0.2)'
                      : '0 6px 24px rgba(99, 102, 241, 0.3), 0 2px 8px rgba(0, 0, 0, 0.1)';
                  }}
                  aria-label={ctaLabel}
                >
                  {getCtaIcon()}
                  <span>{ctaLabel}</span>
                  <ArrowRight className="w-4 h-4 opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" />
                </button>
              )}

              {secondaryCta && (
                <button
                  onClick={secondaryCta.onClick}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-medium text-base transition-all duration-300"
                  style={{
                    background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(99, 102, 241, 0.08)',
                    border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(99, 102, 241, 0.15)',
                    color: 'var(--text-primary)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(99, 102, 241, 0.12)';
                    e.currentTarget.style.borderColor = isDark ? 'rgba(139, 92, 246, 0.3)' : 'rgba(99, 102, 241, 0.25)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(99, 102, 241, 0.08)';
                    e.currentTarget.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(99, 102, 241, 0.15)';
                  }}
                >
                  {secondaryCta.label}
                </button>
              )}
            </div>

            {/* Decorative element */}
            <div
              className="mt-8 flex items-center gap-2"
              style={{ opacity: 0.5 }}
            >
              <div
                style={{
                  width: 48,
                  height: 3,
                  borderRadius: 2,
                  background: isDark
                    ? 'linear-gradient(90deg, rgba(139, 92, 246, 0.8), transparent)'
                    : 'linear-gradient(90deg, rgba(99, 102, 241, 0.6), transparent)',
                }}
              />
              <div
                style={{
                  width: 24,
                  height: 3,
                  borderRadius: 2,
                  background: isDark
                    ? 'rgba(139, 92, 246, 0.4)'
                    : 'rgba(99, 102, 241, 0.3)',
                }}
              />
              <div
                style={{
                  width: 10,
                  height: 3,
                  borderRadius: 2,
                  background: isDark
                    ? 'rgba(139, 92, 246, 0.2)'
                    : 'rgba(99, 102, 241, 0.15)',
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmptyState;
