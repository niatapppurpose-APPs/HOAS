import FrontendDeveloper from '../../assets/DeveploersImages/FrontendDevloper.jpeg';
import BackendDeveloper from '../../assets/DeveploersImages/Backenddeveloper.png';
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
    },
    hemanth: {
        name: 'Hemanth Atthuluri',
        role: 'BACK-END DEVELOPER',
        location: 'Andhra Pradesh, India',
        desc: 'Responsible for designing and implementing the core system architecture of HOAS. Specialized in building scalable, secure, and efficient backend services, managing data flow, authentication, and ensuring smooth coordination between system logic and user facing features.',
        initials: 'HA',
        image: BackendDeveloper,
        gradient: 'from-indigo-500 to-purple-600',
    },
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
    { icon: Mail, href: 'mailto:support@hoas.app', label: 'Email', hoverColor: '#6366f1' },
];
