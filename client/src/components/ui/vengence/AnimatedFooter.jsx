import { Heart, ShieldCheck, Github, Twitter, Linkedin, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AnimatedFooter({ className = '' }) {
  return (
    <footer
      className={`relative overflow-hidden border-t pt-16 pb-12 transition-colors ${className}`}
      style={{
        backgroundColor: '#050811',
        borderColor: 'rgba(255, 255, 255, 0.08)',
      }}
    >
      {/* Background Animated Gradient Mesh */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-b from-indigo-500/20 to-transparent rounded-full blur-3xl animate-pulse" />
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:24px_24px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-white/10">
          {/* Col 1: Brand & Mission */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-3">
              <img src="/Applogo.png" alt="HOAS Logo" className="w-9 h-9 rounded-xl shadow-lg" />
              <span className="text-xl font-black tracking-tight text-white">HOAS</span>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-slate-400">
              Hostel Operations & Administration System. Multi-campus hostel management, real-time emergency safety, and two-tier fee audit reconciliation.
            </p>
            <div className="mt-4 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                All Systems Operational
              </span>
            </div>
          </div>

          {/* Col 2: Dashboards */}
          <div>
            <h5 className="text-xs font-black uppercase tracking-widest text-slate-300 mb-4">
              Dashboards
            </h5>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <Link to="/dashboard/student" className="hover:text-white transition">
                  Student Portal
                </Link>
              </li>
              <li>
                <Link to="/dashboard/warden" className="hover:text-white transition">
                  Warden Portal
                </Link>
              </li>
              <li>
                <Link to="/dashboard/management" className="hover:text-white transition">
                  Management Dashboard
                </Link>
              </li>
              <li>
                <Link to="/dashboard/principal" className="hover:text-white transition">
                  Principal Executive Portal
                </Link>
              </li>
              <li>
                <Link to="/OwnersDashboard" className="hover:text-white transition">
                  Owner Super-Admin
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Safety & Features */}
          <div>
            <h5 className="text-xs font-black uppercase tracking-widest text-slate-300 mb-4">
              Core Capabilities
            </h5>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-red-400" />
                <span>Live SOS GPS Tracking</span>
              </li>
              <li>Two-Tier Fee Verification</li>
              <li>Digital Outing & Gate Passes</li>
              <li>Dynamic Room & Bed Matrix</li>
              <li>Automated Email Notifications</li>
            </ul>
          </div>

          {/* Col 4: Connect & Support */}
          <div>
            <h5 className="text-xs font-black uppercase tracking-widest text-slate-300 mb-4">
              Support & Contact
            </h5>
            <p className="text-xs text-slate-400 mb-3">
              Need assistance with your campus setup or credentials?
            </p>
            <a
              href="mailto:niatapppurpose@gmail.com"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold border border-white/10 transition"
            >
              <Mail className="w-4 h-4 text-indigo-400" />
              <span>niatapppurpose@gmail.com</span>
            </a>
          </div>
        </div>

        {/* Bottom credits */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} HOAS Cloud. Designed with precision for university campuses.</p>
          <div className="flex items-center gap-4">
            <Link to="/privacy" className="hover:text-slate-400 transition">Privacy</Link>
            <Link to="/terms" className="hover:text-slate-400 transition">Terms</Link>
            <Link to="/security" className="hover:text-slate-400 transition">Security</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
