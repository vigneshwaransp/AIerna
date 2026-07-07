'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  Settings, 
  BarChart3, 
  Handshake, 
  Shield, 
  Activity, 
  Ticket,
  Brain,
  Compass,
  Users,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';

const ROLES = [
  { id: 'Admin', label: 'Administrator', icon: Settings, desc: 'Full platform control & configuration', color: 'bg-[#C4B5FD]' },
  { id: 'Organizer', label: 'Event Organizer', icon: BarChart3, desc: 'AI Decision Support & Operations Command', color: 'bg-[#FFD93D]' },
  { id: 'Volunteer', label: 'Volunteer', icon: Handshake, desc: 'AI Copilot, assignments & zone guidance', color: 'bg-white' },
  { id: 'Security', label: 'Security Team', icon: Shield, desc: 'Incident management & emergency response', color: 'bg-[#FF6B6B]' },
  { id: 'Medical', label: 'Medical Team', icon: Activity, desc: 'Medical incidents, resources & coordination', color: 'bg-[#3b82f6]' },
  { id: 'Fan', label: 'Fan / Visitor', icon: Ticket, desc: 'Navigation, announcements & assistance', color: 'bg-[#06b6d4]' },
];

const STATS = [
  { label: 'Live Attendees', value: '84,320', delta: '+2.3%' },
  { label: 'Active Zones', value: '9', delta: 'Secure' },
  { label: 'Open Incidents', value: '3', delta: 'Active' },
  { label: 'AI Alerts Logged', value: '7', delta: 'Analyzed' },
];

const FEATURES = [
  { icon: Brain, title: 'Generative AI Core', desc: 'Every workflow powered by Google Gemini — from crowd forecasts to emergency broadcasts.' },
  { icon: Compass, title: 'Smart Navigation', desc: 'Real-time indoor maps with congestion-aware routing and evacuation overlays.' },
  { icon: Users, title: 'Dynamic Crowd Ops', desc: 'Live density heatmaps, queue predictions, and automated diversion recommendations.' },
];

export default function LandingPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRoleSelect = (roleId: string) => {
    setSelectedRole(roleId);
    setShowLogin(true);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginError('');
    try {
      const res = await fetch('http://localhost:8000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        if (username && password) {
          localStorage.setItem('airena_user', JSON.stringify({ username, role: selectedRole, preferred_language: 'English' }));
          router.push('/dashboard');
          return;
        }
        throw new Error('Invalid credentials');
      }
      const user = await res.json();
      localStorage.setItem('airena_user', JSON.stringify(user));
      router.push('/dashboard');
    } catch {
      if (username && password) {
        localStorage.setItem('airena_user', JSON.stringify({ username, role: selectedRole, preferred_language: 'English' }));
        router.push('/dashboard');
      } else {
        setLoginError('Credentials required. (Demo: any username/password)');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const activeRoleData = ROLES.find(r => r.id === selectedRole);
  const ActiveRoleIcon = activeRoleData?.icon;

  return (
    <div className="min-h-screen bg-[#FFFDF5] text-black overflow-x-hidden relative">
      {/* Background Dot pattern */}
      <div className="absolute inset-0 bg-dot-pattern pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5 border-b-4 border-black bg-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 border-4 border-black bg-[#FF6B6B] flex items-center justify-center text-xl font-black text-white shadow-neo-sm">
            A
          </div>
          <div>
            <span className="text-xl font-black uppercase tracking-tight">AIrena</span>
            <p className="text-[10px] text-black font-black uppercase tracking-wider -mt-1">Tournament Ops</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 text-xs font-black uppercase bg-[#FFD93D] px-3.5 py-2 border-4 border-black shadow-neo-sm">
            <ShieldCheck size={14} strokeWidth={3} className="text-black" />
            Live Hub Online
          </div>
          <a 
            href="/dashboard" 
            className="px-4 py-2 border-4 border-black bg-[#C4B5FD] text-xs font-black uppercase shadow-neo-sm active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all text-black no-underline"
          >
            Dashboard
          </a>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 max-w-6xl mx-auto px-6 py-12 space-y-12">
        <section className="text-center space-y-6">
          <div className="inline-flex items-center gap-2 text-xs font-black uppercase text-black bg-[#FFD93D] border-4 border-black px-4 py-2 shadow-neo-sm">
            👑 AIrena Smart Operations System
          </div>
          
          <h1 className="text-5xl md:text-8xl font-black tracking-tight leading-none uppercase">
            Generative AI
            <br />
            <span className="bg-[#FF6B6B] text-white px-4 border-4 border-black inline-block my-2 shadow-neo-md rotate-[-1deg]">
              Tournament
            </span>
            <br />
            Operations
          </h1>
          
          <p className="text-lg md:text-xl font-bold max-w-3xl mx-auto leading-relaxed border-4 border-black bg-white p-6 shadow-neo-md">
            AIrena coordinates international tournament logistics in real-time. Powered by Gemini AI, the platform optimizes crowd flow, navigates stadium layouts, and translates emergency operations across 8 languages.
          </p>
        </section>

        {/* Stats grid */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {STATS.map(stat => (
            <div key={stat.label} className="p-4 border-4 border-black bg-white shadow-neo-sm text-center">
              <p className="text-3xl font-black text-black">{stat.value}</p>
              <p className="text-xs uppercase font-black text-black/50 mt-1">{stat.label}</p>
              <span className="inline-block mt-2 text-[9px] font-black uppercase bg-[#C4B5FD] border-2 border-black px-2 py-0.5 rounded-full">{stat.delta}</span>
            </div>
          ))}
        </section>

        {/* Role Portal Selection */}
        <section className="space-y-6">
          <h2 className="text-2xl font-black text-center uppercase tracking-tight">Select Portal to Initialize Session</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {ROLES.map(role => {
              const RoleIcon = role.icon;
              return (
                <button
                  key={role.id}
                  onClick={() => handleRoleSelect(role.id)}
                  className="group p-5 border-4 border-black bg-white text-left shadow-neo-sm hover:shadow-neo-md hover:-translate-y-1 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer relative"
                >
                  <div className={`w-12 h-12 border-4 border-black ${role.color} flex items-center justify-center mb-3 shadow-neo-sm text-black`}>
                    <RoleIcon size={24} strokeWidth={2.5} />
                  </div>
                  <p className="font-black text-black text-sm uppercase tracking-tight">{role.label}</p>
                  <p className="text-xs text-black/60 font-bold mt-1 leading-snug">{role.desc}</p>
                  <div className="absolute top-4 right-4 text-xs font-black">
                    <ArrowRight size={16} strokeWidth={3} className="text-black" />
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Features List */}
        <section className="grid md:grid-cols-3 gap-5 border-4 border-black bg-[#FFD93D] p-6 shadow-neo-md">
          {FEATURES.map(f => {
            const FeatureIcon = f.icon;
            return (
              <div key={f.title} className="p-4 border-4 border-black bg-white shadow-neo-sm text-black">
                <div className="w-10 h-10 border-2 border-black bg-[#C4B5FD] flex items-center justify-center mb-2 shadow-neo-sm">
                  <FeatureIcon size={20} strokeWidth={2.5} />
                </div>
                <h3 className="font-black text-xs uppercase tracking-tight mb-1">{f.title}</h3>
                <p className="text-xs text-black/60 font-bold leading-normal">{f.desc}</p>
              </div>
            );
          })}
        </section>
      </main>

      {/* Login Modal */}
      <AnimatePresence>
        {showLogin && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-none"
            onClick={(e) => { if (e.target === e.currentTarget) setShowLogin(false); }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-white border-4 border-black p-6 shadow-neo-lg"
            >
              <div className="flex items-center gap-3 mb-5 border-b-4 border-black pb-4">
                <div className={`w-10 h-10 border-4 border-black ${activeRoleData?.color} flex items-center justify-center shadow-neo-sm text-black`}>
                  {ActiveRoleIcon && <ActiveRoleIcon size={20} strokeWidth={2.5} />}
                </div>
                <div>
                  <h3 className="font-black text-sm uppercase text-black">{activeRoleData?.label}</h3>
                  <p className="text-[9px] uppercase tracking-wider text-black/60 font-bold">Authorized Staff Access</p>
                </div>
                <button onClick={() => setShowLogin(false)} className="ml-auto text-sm font-black hover:text-red-500 cursor-pointer">✕</button>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label htmlFor="username" className="block text-[10px] uppercase font-black tracking-wider text-black mb-1">Username</label>
                  <input
                    id="username"
                    type="text"
                    required
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder={`Try: ${selectedRole?.toLowerCase() || 'admin'}`}
                    className="w-full px-3 py-2 bg-white border-4 border-black text-xs font-bold focus:outline-none focus:bg-[#FFD93D] focus:shadow-neo-sm transition-all"
                  />
                </div>
                <div>
                  <label htmlFor="password" className="block text-[10px] uppercase font-black tracking-wider text-black mb-1">Password</label>
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="password"
                    className="w-full px-3 py-2 bg-white border-4 border-black text-xs font-bold focus:outline-none focus:bg-[#FFD93D] focus:shadow-neo-sm transition-all"
                  />
                </div>
                {loginError && (
                  <p className="text-xs text-red-500 bg-red-100 border-2 border-red-500 px-3 py-2 font-black uppercase">{loginError}</p>
                )}
                <div className="text-[10px] text-black font-black uppercase bg-[#C4B5FD] border-2 border-black p-2.5">
                  💡 Sandbox Credentials: use username `<span className="text-[#FF6B6B]">{selectedRole?.toLowerCase()}</span>` and password `password`.
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 bg-gradient-to-r from-[#FF6B6B] to-[#FFD93D] border-4 border-black text-xs font-black uppercase text-black shadow-neo-sm active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isLoading ? 'Processing...' : `Enter ${selectedRole} Operations →`}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
