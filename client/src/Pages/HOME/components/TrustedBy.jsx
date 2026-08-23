// import React, { useEffect, useRef, useState } from 'react';
// import { motion, useInView, animate } from 'framer-motion';
// import { ShieldCheck, TrendingUp, Lock } from 'lucide-react';
// import { TRUST_STATS, INSTITUTIONS, itemVariants } from '../constants';

// const Counter = ({ value, suffix, decimals = 0 }) => {
//     const ref = useRef(null);
//     const inView = useInView(ref, { once: true, margin: '-60px' });
//     const [display, setDisplay] = useState('0');

//     useEffect(() => {
//         if (!inView) return;
//         const controls = animate(0, value, {
//             duration: 1.8,
//             ease: [0.22, 1, 0.36, 1],
//             onUpdate: (v) => setDisplay(v.toFixed(decimals)),
//         });
//         return () => controls.stop();
//     }, [inView, value, decimals]);

//     return (
//         <span ref={ref} className="text-3xl md:text-4xl font-black tracking-tight">
//             {Number(display).toLocaleString()}{suffix}
//         </span>
//     );
// };

// const TRUST_CHIPS = [
//     { icon: ShieldCheck, label: 'Enterprise Security' },
//     { icon: TrendingUp, label: 'Real-time Analytics' },
//     { icon: Lock, label: 'Role-Based Access' },
// ];

// const TrustedBy = ({ isDark }) => {
//     const card = isDark ? 'rgba(255,255,255,0.04)' : '#ffffff';
//     const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)';
//     const muted = isDark ? '#94A3B8' : '#64748B';

//     return (
//         <section className="relative py-14 md:py-20 px-4">
//             <div className="max-w-6xl mx-auto">
//                 {/* Stats */}
//                 <motion.div
//                     initial="hidden"
//                     whileInView="visible"
//                     viewport={{ once: true, margin: '-80px' }}
//                     variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.12 } } }}
//                     className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10"
//                 >
//                     {TRUST_STATS.map((s) => (
//                         <motion.div
//                             key={s.label}
//                             variants={itemVariants}
//                             className="rounded-2xl border p-5 text-center backdrop-blur-sm"
//                             style={{ backgroundColor: card, borderColor: border }}
//                         >
//                             <span className="bg-gradient-to-r from-violet-600 to-blue-500 bg-clip-text text-transparent">
//                                 <Counter value={s.value} suffix={s.suffix} decimals={s.decimals || 0} />
//                             </span>
//                             <p className="text-xs md:text-sm font-semibold mt-1" style={{ color: muted }}>{s.label}</p>
//                         </motion.div>
//                     ))}
//                 </motion.div>

//                 {/* Institutions strip */}
//                 <motion.div
//                     initial={{ opacity: 0, y: 20 }}
//                     whileInView={{ opacity: 1, y: 0 }}
//                     viewport={{ once: true }}
//                     transition={{ duration: 0.7 }}
//                     className="rounded-2xl border p-6 text-center"
//                     style={{ backgroundColor: card, borderColor: border }}
//                 >
//                     <p className="text-xs font-bold uppercase tracking-[0.2em] mb-5" style={{ color: muted }}>
//                         Trusted by forward-thinking institutions
//                     </p>
//                     <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
//                         {INSTITUTIONS.map((name) => (
//                             <span key={name} className="flex items-center gap-2 font-bold text-sm md:text-base opacity-70 hover:opacity-100 transition-opacity" style={{ color: isDark ? '#E2E8F0' : '#334155' }}>
//                                 <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-white text-[10px] font-black">
//                                     {name.split(' ').map((w) => w[0]).slice(0, 2).join('')}
//                                 </span>
//                                 {name}
//                             </span>
//                         ))}
//                       </div>
//                       {/* Sample-data disclosure */}
//                       <p className="mt-4 text-[10px] italic" style={{ color: muted }}>
//                           Sample institutions shown for demonstration.
//                       </p>
//                 </motion.div>
//             </div>
//         </section>
//     );
// };

// export default React.memo(TrustedBy);
