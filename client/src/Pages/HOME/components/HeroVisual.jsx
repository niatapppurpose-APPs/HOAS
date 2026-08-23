import React, { useEffect, useState } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";

import {
  LayoutDashboard,
  BedDouble,
  Users,
  MessageSquareText,
  Wallet,
  Bell,
  FileBarChart,
  Settings2,
} from "lucide-react";

import AppLogo from "../../../assets/AppLogo4k.webp";
import ThemeToggle from "../../../components/ThemeToggle/ThemeToggle";

/* =========================================================
   NAVIGATION
========================================================= */

const NAV = [
  { icon: LayoutDashboard, label: "Overview", active: true },
  { icon: BedDouble, label: "Rooms" },
  { icon: Users, label: "Students" },
  { icon: MessageSquareText, label: "Complaints" },
  { icon: Wallet, label: "Fees" },
  { icon: Bell, label: "Notices" },
  { icon: FileBarChart, label: "Reports" },
  { icon: Settings2, label: "Settings" },
];

/* =========================================================
   STATS
========================================================= */

const STATS = [
  { label: "Total Students", value: 512, delta: "+12%", tint: "#8B5CF6" },
  { label: "Occupied Rooms", value: 428, delta: "88%", tint: "#3B82F6" },
  { label: "Complaints", value: 23, delta: "-8%", tint: "#EF4444" },
  { label: "Pending Requests", value: 17, delta: "+5", tint: "#F59E0B" },
];

/* =========================================================
   COMPLAINTS
========================================================= */

const COMPLAINTS = [
  {
    title: "Wi-Fi not working in Block B",
    time: "10:32 AM",
    status: "Open",
    tint: "#EF4444",
  },
  {
    title: "Water leakage in washroom",
    time: "9:14 AM",
    status: "In Progress",
    tint: "#F59E0B",
  },
  {
    title: "Fan not working",
    time: "Yesterday",
    status: "Resolved",
    tint: "#10B981",
  },
];

/* =========================================================
   COUNT UP
========================================================= */

const useCountUp = (target, duration = 1600, decimals = 0) => {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let startTime = null;
    let frameId;

    const animate = (time) => {
      if (!startTime) startTime = time;

      const progress = Math.min((time - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = target * eased;

      setValue(
        decimals > 0 ? Number(current.toFixed(decimals)) : Math.floor(current),
      );

      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      }
    };

    frameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(frameId);
  }, [target, duration, decimals]);

  return value;
};

const AnimatedNumber = ({
  value,
  duration = 1600,
  decimals = 0,
  suffix = "",
}) => {
  const number = useCountUp(value, duration, decimals);

  return (
    <>
      {decimals > 0 ? number.toFixed(decimals) : number}
      {suffix}
    </>
  );
};

/* =========================================================
   OCCUPANCY CHART
========================================================= */

const Chart = ({ stroke = "#8B5CF6", isHovering = false }) => {
  const path =
    "M0,60 C25,55 35,40 55,42 C75,44 85,58 105,52 C125,46 135,22 155,26 C175,30 185,48 205,38 C225,28 240,18 260,14";

  const points = [
    [0, 60],
    [25, 55],
    [55, 42],
    [85, 58],
    [105, 52],
    [135, 22],
    [155, 26],
    [185, 48],
    [205, 38],
    [240, 18],
    [260, 14],
  ];

  return (
    <div className="relative">
      <svg
        viewBox="0 0 260 80"
        className="w-full h-20 overflow-visible"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="heroChartFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity="0.35" />
            <stop offset="100%" stopColor={stroke} stopOpacity="0" />
          </linearGradient>

          <filter id="chartGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <motion.path
          d={`${path} L260,80 L0,80 Z`}
          fill="url(#heroChartFill)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.5 }}
        />

        <motion.path
          d={path}
          fill="none"
          stroke={stroke}
          strokeWidth="2.5"
          strokeLinecap="round"
          filter="url(#chartGlow)"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{
            duration: 2.2,
            ease: "easeOut",
            delay: 0.4,
          }}
        />

        {points.map(([x, y], index) => (
          <motion.circle
            key={`${x}-${y}`}
            cx={x}
            cy={y}
            r="2"
            fill={stroke}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              delay: 0.6 + index * 0.08,
              duration: 0.3,
            }}
          />
        ))}

        {/* The graph dot pauses while the dashboard is hovered. */}
        {!isHovering && (
          <circle
            r="3.5"
            fill="#ffffff"
            stroke={stroke}
            strokeWidth="2"
            filter="url(#chartGlow)"
          >
            <animateMotion dur="4s" repeatCount="indefinite" path={path} />
          </circle>
        )}
      </svg>
    </div>
  );
};

/* =========================================================
   DONUT
========================================================= */

const Donut = () => {
  const total = useCountUp(23, 1400);
  const radius = 15.9;

  return (
    <div className="relative w-24 h-24 mx-auto">
      <svg viewBox="0 0 42 42" className="w-full h-full -rotate-90">
        <circle
          cx="21"
          cy="21"
          r={radius}
          fill="none"
          stroke="rgba(148,163,184,0.16)"
          strokeWidth="6"
        />

        <motion.circle
          cx="21"
          cy="21"
          r={radius}
          fill="none"
          stroke="#8B5CF6"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray="42 58"
          strokeDashoffset="25"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.5 }}
        />

        <motion.circle
          cx="21"
          cy="21"
          r={radius}
          fill="none"
          stroke="#F59E0B"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray="23 77"
          strokeDashoffset="-20"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.8 }}
        />

        <motion.circle
          cx="21"
          cy="21"
          r={radius}
          fill="none"
          stroke="#10B981"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray="27 73"
          strokeDashoffset="-45"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.2, delay: 1.1 }}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-extrabold">{total}</span>

        <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide">
          Total
        </span>
      </div>
    </div>
  );
};

/* =========================================================
   STAT CARD
========================================================= */

const StatCard = ({ stat, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 20, scale: 0.96 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{
      duration: 0.55,
      delay: 0.8 + index * 0.12,
      ease: [0.22, 1, 0.36, 1],
    }}
    whileHover={{
      y: -5,
      scale: 1.025,
    }}
    className="rounded-xl p-2 border cursor-default"
    style={{
      borderColor: "rgba(255,255,255,0.08)",
      background:
        "linear-gradient(145deg, rgba(255,255,255,0.055), rgba(255,255,255,0.018))",
    }}
  >
    <p className="text-[8px] font-semibold truncate ">
      {stat.label}
    </p>

    <div className="flex items-baseline justify-between mt-1">
      <span className="text-sm font-extrabold">
        <AnimatedNumber value={stat.value} />
      </span>

      <span className="text-[8px] font-bold" style={{ color: stat.tint }}>
        {stat.delta}
      </span>
    </div>
  </motion.div>
);

/* =========================================================
   SAFE 3D MOUSE PARALLAX
   - No React state on mousemove.
   - MotionValues are updated directly.
   - Spring smooths the movement.
========================================================= */

const use3DParallax = () => {
  const mouseX = useMotionValue(50);
  const mouseY = useMotionValue(50);

  const targetRotateX = useTransform(mouseY, [0, 100], [6, -6]);

  const targetRotateY = useTransform(mouseX, [0, 100], [-6, 6]);

  const rotateX = useSpring(targetRotateX, {
    stiffness: 180,
    damping: 22,
    mass: 0.6,
  });

  const rotateY = useSpring(targetRotateY, {
    stiffness: 180,
    damping: 22,
    mass: 0.6,
  });

  const scale = useMotionValue(1);
  const smoothScale = useSpring(scale, {
    stiffness: 220,
    damping: 25,
  });

  const reflectionX = useSpring(mouseX, {
    stiffness: 160,
    damping: 20,
  });

  const reflectionY = useSpring(mouseY, {
    stiffness: 160,
    damping: 20,
  });

  const reflection = useMotionTemplate`
    radial-gradient(
      circle at ${reflectionX}% ${reflectionY}%,
      rgba(255,255,255,0.13),
      rgba(139,92,246,0.06) 18%,
      transparent 46%
    )
  `;

  const handleMouseMove = (event) => {
    const element = event.currentTarget;
    const rect = element.getBoundingClientRect();

    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    mouseX.set(Math.max(0, Math.min(100, x)));
    mouseY.set(Math.max(0, Math.min(100, y)));
  };

  const handleMouseEnter = () => {
    scale.set(1.015);
  };

  const handleMouseLeave = () => {
    mouseX.set(50);
    mouseY.set(50);
    scale.set(1);
  };

  return {
    rotateX,
    rotateY,
    smoothScale,
    reflection,
    handleMouseMove,
    handleMouseEnter,
    handleMouseLeave,
  };
};

/* =========================================================
   MAIN HERO VISUAL
========================================================= */

const HeroVisual = ({ isDark = true }) => {
  const [isHovering, setIsHovering] = useState(false);

  const {
    rotateX,
    rotateY,
    smoothScale,
    reflection,
    handleMouseMove,
    handleMouseEnter,
    handleMouseLeave,
  } = use3DParallax();

  const card = isDark ? "#0B1020" : "#FFFFFF";
  const border = isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.08)";
  const muted = isDark ? "#94A3B8" : "#64748B";
  const text = isDark ? "#F8FAFC" : "#0F172A";

  const onEnter = (event) => {
    setIsHovering(true);
    handleMouseEnter();
  };

  const onLeave = (event) => {
    setIsHovering(false);
    handleMouseLeave();
  };

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 50,
        rotateY: -8,
      }}
      animate={{
        opacity: 1,
        y: 0,
        rotateY: -4,
      }}
      transition={{
        duration: 1.1,
        delay: 0.35,
        ease: [0.22, 1, 0.36, 1],
      }}
      style={{ perspective: 1200 }}
      className="relative hidden lg:block"
    >
      {/* Background glow */}
      <motion.div
        animate={{
          opacity: [0.5, 0.8, 0.5],
          scale: [1, 1.06, 1],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute -inset-10 rounded-[3rem] blur-3xl pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(124,58,237,0.28), rgba(59,130,246,0.12), transparent 70%)",
        }}
      />

      {/* =====================================================
          INTERACTIVE DASHBOARD
      ===================================================== */}

      <motion.div
        onMouseMove={handleMouseMove}
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
        initial={{
          opacity: 0,
          y: 50,
          rotateY: -8,
        }}
        animate={{
          opacity: 1,
          y: isHovering ? 0 : [0, -10, 0],
        }}
        transition={{
          opacity: {
            duration: 1.1,
            delay: 0.35,
            ease: [0.22, 1, 0.36, 1],
          },
          y: isHovering
            ? {
                duration: 0.25,
              }
            : {
                duration: 7,
                repeat: Infinity,
                ease: "easeInOut",
              },
        }}
        style={{
          backgroundColor: card,
          borderColor: border,
          rotateX,
          rotateY,
          scale: smoothScale,
          transformStyle: "preserve-3d",
          transformPerspective: 1200,
          transformOrigin: "center center",
          willChange: "transform",
          boxShadow: isHovering
            ? "0 35px 100px rgba(124,58,237,0.35)"
            : "0 30px 80px rgba(76,29,149,0.25)",
        }}
        className="relative rounded-2xl overflow-hidden shadow-2xl border cursor-pointer"
      >
        {/* Mouse reflection */}
        <motion.div
          className="absolute inset-0 pointer-events-none z-50 rounded-2xl"
          style={{
            background: reflection,
            opacity: isHovering ? 1 : 0,
          }}
        />
        {/* Window chrome */}
        <div
          className="flex items-center gap-1.5 px-4 py-2.5 border-b"
          style={{ borderColor: border }}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />

          <div
            className="mx-auto px-6 py-0.5 rounded-md text-[10px] font-medium"
            style={{
              color: muted,
              backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#F1F5F9",
            }}
          >
            hoas-client.vercel.app
          </div>

          <ThemeToggle size="sm" />
        </div>

        {/* Dashboard body */}
        <div className="grid grid-cols-[130px_1fr]">
          {/* Sidebar */}
          <aside
            className="border-r p-3 space-y-1"
            style={{ borderColor: border }}
          >
            <div className="flex items-center gap-1.5 px-2 pb-3">
              <img
                src={AppLogo}
                alt="HOAS"
                className="w-5 h-5 rounded-full object-contain"
              />

              <span className="font-black text-xs" style={{ color: text }}>
                HOAS
              </span>
            </div>

            {NAV.map(({ icon: Icon, label, active }, index) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  delay: 0.45 + index * 0.06,
                }}
                whileHover={{ x: 3 }}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-[10px] font-semibold cursor-pointer"
                style={{
                  backgroundColor: active ? "#7C3AED" : "transparent",
                  color: active ? "#FFFFFF" : muted,
                }}
              >
                <Icon size={11} />
                {label}
              </motion.div>
            ))}
          </aside>

          {/* Main panel */}
          <main className="p-4">
            {/* Welcome */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65 }}
            >
              <p className="text-sm font-bold mb-0.5" style={{ color: text }}>
                Welcome back, Warden 👋
              </p>

              <p className="text-[10px] mb-3" style={{ color: muted }}>
                Here's what's happening in your hostel today.
              </p>
            </motion.div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-2 mb-3">
              {STATS.map((stat, index) => (
                <StatCard key={stat.label} stat={stat} index={index} />
              ))}
            </div>

            {/* Chart + donut */}
            <div className="grid grid-cols-[1.6fr_1fr] gap-2 mb-3 mt-">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.05 }}
                className="rounded-xl border p-2"
                style={{
                  borderColor: border,
                  background:
                    "linear-gradient(145deg, rgba(255,255,255,0.035), rgba(255,255,255,0.01))",
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[10px] font-bold" style={{ color: text }}>
                    Occupancy Overview
                  </p>

                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded-md text-white"
                    style={{ backgroundColor: "#10B981" }}
                  >
                    ↑ 88%
                  </span>
                </div>

                <Chart stroke="#8B5CF6" isHovering={isHovering} />

                <div
                  className="flex justify-between text-[7px] font-medium px-1"
                  style={{ color: muted }}
                >
                  {["Jan", "Feb", "Mar", "Apr", "May", "Jun"].map((month) => (
                    <span key={month}>{month}</span>
                  ))}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  delay: 1.15,
                  duration: 0.6,
                }}
                className="rounded-xl border p-2 flex flex-col items-center justify-center"
                style={{
                  borderColor: border,
                  background:
                    "linear-gradient(145deg, rgba(255,255,255,0.035), rgba(255,255,255,0.01))",
                }}
              >
                <p
                  className="text-[10px] font-bold self-start mb-1"
                  style={{ color: text }}
                >
                  Complaint Status
                </p>

                <Donut />

                <div
                  className="grid grid-cols-2 gap-x-2 mt-2 text-[7px] font-semibold"
                  style={{ color: muted }}
                >
                  <span>
                    <i
                      className="inline-block w-1.5 h-1.5 rounded-full mr-1"
                      style={{ background: "#8B5CF6" }}
                    />
                    Open · 10
                  </span>

                  <span>
                    <i
                      className="inline-block w-1.5 h-1.5 rounded-full mr-1"
                      style={{ background: "#F59E0B" }}
                    />
                    Prog · 6
                  </span>

                  <span>
                    <i
                      className="inline-block w-1.5 h-1.5 rounded-full mr-1"
                      style={{ background: "#10B981" }}
                    />
                    Done · 7
                  </span>
                </div>
              </motion.div>
            </div>

            {/* Recent complaints */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.35 }}
              className="rounded-xl border p-2"
              style={{
                borderColor: border,
                background:
                  "linear-gradient(145deg, rgba(255,255,255,0.035), rgba(255,255,255,0.01))",
              }}
            >
              <div className="flex justify-between items-center mb-1.5">
                <p className="text-[10px] font-bold" style={{ color: text }}>
                  Recent Complaints
                </p>

                <motion.span
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                  }}
                  className="text-[8px] font-semibold"
                  style={{ color: "#8B5CF6" }}
                >
                  Live
                </motion.span>
              </div>

              <div className="space-y-1">
                {COMPLAINTS.map((complaint, index) => (
                  <motion.div
                    key={complaint.title}
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      delay: 1.45 + index * 0.15,
                      duration: 0.45,
                    }}
                    whileHover={{ x: 4 }}
                    className="flex items-center justify-between rounded-lg px-2 py-1 cursor-pointer"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.025)",
                    }}
                  >
                    <div>
                      <p
                        className="text-[9px] font-bold"
                        style={{ color: text }}
                      >
                        {complaint.title}
                      </p>

                      <p className="text-[7px]" style={{ color: muted }}>
                        Block A · Room 207 · {complaint.time}
                      </p>
                    </div>

                    <span
                      className="text-[7px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{
                        backgroundColor: `${complaint.tint}1a`,
                        color: complaint.tint,
                      }}
                    >
                      {complaint.status}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </main>
        </div>
      </motion.div>

      {/* =====================================================
          FLOATING LEAVE CARD
      ===================================================== */}

      <motion.div
        animate={{ y: [0, -12, 0] }}
        transition={{
          duration: 5.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
        className="absolute -left-10 top-16 rounded-xl p-2.5 pr-4 shadow-xl border flex items-center gap-2"
        style={{
          backgroundColor: card,
          borderColor: border,
        }}
      >
        <span className="w-7 h-7 rounded-lg bg-emerald-500/15 flex items-center justify-center">
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#10B981"
            strokeWidth="3"
          >
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </span>

        <div>
          <p className="text-[10px] font-black" style={{ color: text }}>
            Leave Approved
          </p>

          <p className="text-[8px] font-medium" style={{ color: muted }}>
            Rohan Singh · 2 days
          </p>
        </div>
      </motion.div>

      {/* =====================================================
          EMERGENCY CARD
      ===================================================== */}

      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
        className="absolute -right-8 bottom-20 rounded-xl p-2.5 pr-4 shadow-xl border flex items-center gap-2"
        style={{
          backgroundColor: card,
          borderColor: border,
        }}
      >
        <motion.span
          animate={{ scale: [1, 1.1, 1] }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
          }}
          className="w-7 h-7 rounded-lg bg-red-500/15 flex items-center justify-center"
        >
          <Bell size={13} className="text-red-500" />
        </motion.span>

        <div>
          <p className="text-[10px] font-black" style={{ color: text }}>
            Emergency Alert
          </p>

          <p className="text-[8px] font-medium" style={{ color: muted }}>
            Live location shared · Block C
          </p>
        </div>
      </motion.div>

      {/* =====================================================
          OCCUPANCY FLOATING CARD
      ===================================================== */}

      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{
          duration: 4.6,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5,
        }}
        className="absolute -right-6 top-6 rounded-xl px-3 py-2 shadow-xl border"
        style={{
          backgroundColor: card,
          borderColor: border,
        }}
      >
        <p
          className="text-[8px] font-bold uppercase tracking-wide"
          style={{ color: muted }}
        >
          Occupancy
        </p>

        <p className="text-base font-black" style={{ color: "#8B5CF6" }}>
          <AnimatedNumber
            value={88.4}
            decimals={1}
            suffix="%"
            duration={1800}
          />
        </p>
      </motion.div>
    </motion.div>
  );
};

export default React.memo(HeroVisual);
