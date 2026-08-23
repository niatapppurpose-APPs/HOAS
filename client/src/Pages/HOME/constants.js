import FrontendDeveloper from '../../assets/DeveploersImages/FrontendDevloper.jpeg';
import BackendDeveloper from '../../assets/DeveploersImages/Backenddeveloper.webp';
import { Linkedin, Twitter, Github, Instagram, Mail } from 'lucide-react';

// ── Team Data (hoisted to module scope — never recreated) ──
export const teamData = {
    faziya: {
        name: 'Shaik Faziya Tasneem',
        role: 'FRONT-END DEVELOPER',
        location: 'AndhraPradesh: India',
        desc: 'Responsible for crafting a seamless and engaging user experience across the application. Focused on responsive design, intuitive user interfaces, and consistent visual behavior across devices, ensuring the product is both user friendly and visually professional.',
        initials: 'FD',
        image: FrontendDeveloper,
        gradient: 'from-slate-700 to-slate-500',
        socials: [
            { icon: Linkedin, href: 'https://www.linkedin.com/in/faziya-tasneem-shaik/', label: 'LinkedIn', hoverColor: '#0A66C2' },
            { icon: Github, href: '', label: 'GitHub', hoverColor: '#333333' },
            { icon: Instagram, href: '', label: 'Instagram', hoverColor: '#E4405F' },
            { icon: Mail, href: 'https://mail.google.com/mail/?view=cm&fs=1&to=niatapppurpose@gmail.com&su=' + encodeURIComponent('Contact - Frontend Developer (Shaik Faziya Tasneem)'), label: 'Email', hoverColor: '#7c3aed' },
        ],
    },
    hemanth: {
        name: 'Hemanth Atthuluri',
        role: 'BACK-END DEVELOPER',
        location: 'Andhra Pradesh, India',
        desc: 'Responsible for designing and implementing the core system architecture of HOAS. Specialized in building scalable, secure, and efficient backend services, managing data flow, authentication, and ensuring smooth coordination between system logic and user facing features.',
        initials: 'HA',
        image: BackendDeveloper,
        gradient: 'from-violet-500 to-indigo-600',
        socials: [
            { icon: Linkedin, href: 'https://www.linkedin.com/in/hemanth-atthuluri/', label: 'LinkedIn', hoverColor: '#0A66C2' },
            { icon: Github, href: '', label: 'GitHub', hoverColor: '#333333' },
            { icon: Instagram, href: '', label: 'Instagram', hoverColor: '#E4405F' },
            { icon: Mail, href: 'https://mail.google.com/mail/?view=cm&fs=1&to=niatapppurpose@gmail.com&su=' + encodeURIComponent('Contact - Backend Developer (Hemanth Atthuluri)'), label: 'Email', hoverColor: '#7c3aed' },
        ],
    },
};

export const APP_INFO = {
    name: 'HOAS',
    fullName: 'Hostel Operations Accountability System',
    version: 'v1.3.0',
    build: 'Build 2026.08.20',
    established: '2026',
};

// ── Animation Variants (hoisted — never recreated per render) ──
export const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2,
        },
    },
};

export const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
    },
};

export const scaleIn = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: { duration: 0.8, ease: 'easeOut' },
    },
};

export const slideInLeft = {
    hidden: { opacity: 0, x: -50 },
    visible: {
        opacity: 1,
        x: 0,
        transition: { duration: 0.8, ease: 'easeOut' },
    },
};

export const slideInRight = {
    hidden: { opacity: 0, x: 50 },
    visible: {
        opacity: 1,
        x: 0,
        transition: { duration: 0.8, ease: 'easeOut' },
    },
};

// ── Footer social links (hoisted — never recreated per render) ──
export const socialLinks = [
    { icon: Linkedin, href: 'https://linkedin.com', label: 'LinkedIn', hoverColor: '#0A66C2' },
    { icon: Twitter, href: 'https://twitter.com', label: 'Twitter', hoverColor: '#1DA1F2' },
    { icon: Github, href: 'https://github.com', label: 'GitHub', hoverColor: '#333333' },
    { icon: Instagram, href: 'https://instagram.com', label: 'Instagram', hoverColor: '#E4405F' },
    { icon: Mail, href: 'https://mail.google.com/mail/?view=cm&fs=1&to=niatapppurpose@gmail.com', label: 'Email', hoverColor: '#7c3aed' },
];

// ── Landing page section data ─────────────────────────────────
export const HERO_CHIPS = [
    { label: 'Role-Based Access' },
    { label: 'Real-time Analytics' },
    { label: 'Secure & Reliable' },
];

export const TRUST_STATS = [
    { value: 1000, suffix: '+', label: 'Students' },
    { value: 50, suffix: '+', label: 'Hostels' },
    { value: 99.9, suffix: '%', decimals: 1, label: 'Uptime' },
    { value: 4, suffix: '', label: 'Managed Roles' },
];

export const INSTITUTIONS = [
    'Sunrise Engineering College',
    'Metro University',
    'Oakridge Institute',
    'Lakeview University',
    'Pinnacle Polytechnic',
];

export const ROLE_CARDS = [
    {
        key: 'owner',
        title: 'Owner',
        color: '#7C3AED',
        bullets: ['Complete oversight & control', 'Analytics & decision insights', 'Manage multiple hostels'],
        tagline: 'Complete oversight across every campus',
        abilities: [
            'Create management accounts & onboard institutions',
            'Institution-wide analytics & exportable reports',
            'Global settings, capacity limits & audit logs',
            'Monitor every college from one console',
        ],
        previewStats: ['Colleges', 'Occupancy', 'Audit'],
    },
    {
        key: 'management',
        title: 'Management',
        color: '#3B82F6',
        bullets: ['Streamline daily operations', 'Reports & data management', 'Policy & rule enforcement'],
        tagline: 'Run daily operations effortlessly',
        abilities: [
            'Create wardens & bulk-upload students',
            'Verify fee payments (dual verification)',
            'Publish announcements & schedules',
            'Track capacity, occupancy & complaints',
        ],
        previewStats: ['Wardens', 'Fees', 'Notices'],
    },
    {
        key: 'warden',
        title: 'Warden',
        color: '#10B981',
        bullets: ['Hostel supervision & control', 'Student management', 'Complaints & maintenance'],
        tagline: 'Supervise students with confidence',
        abilities: [
            'Approve or reject leave & outing requests',
            'Resolve complaints before SLA deadlines',
            'Verify student details & room allocations',
            'Respond to live emergency alerts instantly',
        ],
        previewStats: ['Complaints', 'Outings', 'SOS'],
    },
    {
        key: 'student',
        title: 'Student',
        color: '#F59E0B',
        bullets: ['Easy communication', 'Raise complaints', 'Stay updated with notices'],
        tagline: 'Everything hostel life, in your pocket',
        abilities: [
            'Raise complaints with photo proof',
            'Apply for leave & track approval status',
            'View verified fee status & payment history',
            'One-tap emergency SOS with live location',
        ],
        previewStats: ['My Room', 'Fees', 'Notices'],
    },
];

export const FEATURE_CARDS = [
    { title: 'Room Management', desc: 'Manage rooms, blocks, beds, and occupancy in real time.', color: '#7C3AED' },
    { title: 'Student Management', desc: 'Maintain student records, allowances, and profiles.', color: '#3B82F6' },
    { title: 'Complaint System', desc: 'Raise, track, and resolve complaints efficiently.', color: '#10B981' },
    { title: 'Visitor Management', desc: 'Approve and log visitor entries with security.', color: '#8B5CF6' },
    { title: 'Notice Board', desc: 'Publish important notices and announcements.', color: '#F59E0B' },
    { title: 'Maintenance Tracking', desc: 'Track maintenance requests and ensure timely resolution.', color: '#EF4444' },
    { title: 'Analytics Dashboard', desc: 'Real-time insights and performance analytics.', color: '#06B6D4' },
    { title: 'Role-Based Access', desc: 'Secure access control for every user role.', color: '#EC4899' },
];

export const WORKFLOW_STEPS = [
    { step: 'Step 1', title: 'Onboard', desc: 'Add hostel, blocks, rooms & users.', color: '#7C3AED' },
    { step: 'Step 2', title: 'Manage', desc: 'Allocate rooms, manage students & roles.', color: '#3B82F6' },
    { step: 'Step 3', title: 'Operate', desc: 'Handle complaints, visitors, notices & more.', color: '#10B981' },
    { step: 'Step 4', title: 'Analyze', desc: 'Get insights, reports & make better decisions.', color: '#F59E0B' },
];

export const TECH_STACK = [
    { name: 'React', slug: 'react', tint: '#61DAFB' },
    { name: 'Firebase Auth', slug: 'firebase', tint: '#FFCA28' },
    { name: 'Node.js', slug: 'nodedotjs', tint: '#5FA04E' },
    { name: 'Express', slug: 'express', tint: '#94A3B8', mono: true },
    { name: 'MongoDB', slug: 'mongodb', tint: '#47A248' },
    { name: 'Cloudinary', slug: 'cloudinary', tint: '#3448C5' },
    { name: 'Render', slug: 'render', tint: '#46E3B7' },
    { name: 'Tailwind CSS', slug: 'tailwindcss', tint: '#38BDF8' },
    { name: 'Socket.IO', slug: 'socketdotio', tint: '#FFFFFF', mono: true },
    { name: 'Framer Motion', slug: 'framer', tint: '#F06292' },
];

// Sample testimonials — clearly placeholders for demo purposes
export const TESTIMONIALS = [
    {
        quote: 'HOAS has transformed the way we manage our hostel. The system is intuitive, powerful, and saves us countless hours every week.',
        name: 'Dr. Rajesh Kumar',
        title: 'Chief Warden (Sample)',
        initials: 'RK',
        tint: '#7C3AED',
    },
    {
        quote: 'The complaint system and real-time analytics help us maintain discipline and transparency like never before.',
        name: 'Prof. Meera Iyer',
        title: 'Dean of Student Affairs (Sample)',
        initials: 'MI',
        tint: '#3B82F6',
    },
    {
        quote: 'As a student, HOAS makes everything so easy — from raising complaints to getting important notices.',
        name: 'Arjun Sharma',
        title: '3rd Year, CSE (Sample)',
        initials: 'AS',
        tint: '#10B981',
    },
];

export const FAQS = [
    { q: 'What is HOAS?', a: 'HOAS (Hostel Operations Accountability System) is an enterprise platform that digitizes hostel administration — complaints, fees, leave, outings, emergency response, and announcements — with full audit trails.' },
    { q: 'Is my data secure with HOAS?', a: 'Yes. HOAS uses Firebase Authentication, role-based server-side authorization, encrypted connections, and strict data scoping so users only ever see what they are permitted to.' },
    { q: 'Can HOAS be customized for our institution?', a: 'Absolutely. Colleges, hostels, blocks, rooms, roles, workflows, and SLA policies are all configurable from the management and owner dashboards.' },
    { q: 'How does the complaint system work?', a: 'Students raise complaints with optional photos. Wardens resolve them within SLA deadlines; unresolved tickets auto-escalate, and students can accept or dispute resolutions.' },
    { q: 'Can students use HOAS on mobile?', a: 'Yes. HOAS is a fully responsive Progressive Web App (PWA) that can be installed on any phone and supports push notifications.' },
    { q: 'Is training provided for new users?', a: 'Built-in guided tours are included for every role, and the support team provides onboarding assistance for institutions.' },
    { q: 'What happens during emergencies?', a: 'Students can share their live location with wardens in one tap. Wardens monitor all active emergency sessions in realtime until they are resolved.' },
    { q: 'How are fees handled?', a: 'Students upload payment proofs, which require dual verification by both management and wardens — everyone always sees the same verified status.' },
];
