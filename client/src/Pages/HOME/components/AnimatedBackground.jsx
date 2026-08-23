import React, { useMemo } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

// Deterministic pseudo-random particle field (stable across renders)
const useParticles = (count) =>
    useMemo(
        () =>
            Array.from({ length: count }, (_, i) => ({
                id: i,
                left: (i * 37 + 13) % 100,
                top: (i * 53 + 29) % 100,
                size: 3 + ((i * 7) % 5),
                duration: 9 + ((i * 11) % 8),
                delay: (i * 0.7) % 6,
            })),
        [count]
    );

const AnimatedBackground = ({ isDark }) => {
    const particles = useParticles(18);

    // Mouse parallax
    const mx = useMotionValue(0);
    const my = useMotionValue(0);
    const sx = useSpring(mx, { stiffness: 40, damping: 20 });
    const sy = useSpring(my, { stiffness: 40, damping: 20 });
    const blobX = useTransform(sx, [-1, 1], [-30, 30]);
    const blobY = useTransform(sy, [-1, 1], [-20, 20]);
    const partX = useTransform(sx, [-1, 1], [12, -12]);
    const partY = useTransform(sy, [-1, 1], [10, -10]);

    React.useEffect(() => {
        const onMove = (e) => {
            mx.set((e.clientX / window.innerWidth) * 2 - 1);
            my.set((e.clientY / window.innerHeight) * 2 - 1);
        };
        window.addEventListener('mousemove', onMove);
        return () => window.removeEventListener('mousemove', onMove);
    }, [mx, my]);

    return (
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden="true">
            {/* Aurora blobs */}
            <motion.div
                style={{ x: blobX, y: blobY }}
                className="absolute w-full h-full"
            >
                <div
                    className="absolute -top-40 left-[10%] w-[42rem] h-[42rem] rounded-full blur-[110px] opacity-40"
                    style={{ background: 'radial-gradient(circle, #7C3AED 0%, transparent 65%)' }}
                />
                <div
                    className="absolute top-[15%] right-[-10%] w-[36rem] h-[36rem] rounded-full blur-[120px] opacity-30"
                    style={{ background: 'radial-gradient(circle, #3B82F6 0%, transparent 65%)' }}
                />
                <div
                    className="absolute bottom-[-20%] left-[35%] w-[34rem] h-[34rem] rounded-full blur-[130px] opacity-25"
                    style={{ background: 'radial-gradient(circle, #9333EA 0%, transparent 65%)' }}
                />
            </motion.div>

            {/* Floating particles */}
            <motion.div style={{ x: partX, y: partY }} className="absolute w-full h-full">
                {particles.map((p) => (
                    <motion.span
                        key={p.id}
                        className="absolute rounded-full"
                        style={{
                            left: `${p.left}%`,
                            top: `${p.top}%`,
                            width: p.size,
                            height: p.size,
                            backgroundColor: isDark ? 'rgba(167,139,250,0.5)' : 'rgba(124,58,237,0.35)',
                        }}
                        animate={{ y: [0, -26, 0], opacity: [0.25, 0.9, 0.25] }}
                        transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
                    />
                ))}
            </motion.div>
        </div>
    );
};

export default React.memo(AnimatedBackground);
