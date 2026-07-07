'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../../components/Sidebar';
import { Megaphone, Brain, Volume2, Info } from 'lucide-react';

interface Announcement {
  id: number;
  message: string;
  category: string;
  target_role: string;
  original_lang: string;
  translations_json?: Record<string, string>;
  timestamp: string;
}

const LANG_LABELS: Record<string, { code: string; name: string }> = {
  English: { code: 'EN', name: 'English' },
  Hindi: { code: 'HI', name: 'Hindi' },
  Tamil: { code: 'TA', name: 'Tamil' },
  Telugu: { code: 'TE', name: 'Telugu' },
  Kannada: { code: 'KN', name: 'Kannada' },
  Malayalam: { code: 'ML', name: 'Malayalam' },
  French: { code: 'FR', name: 'French' },
  Japanese: { code: 'JA', name: 'Japanese' }
};

const LANG_COLORS: Record<string, string> = {
  English: 'bg-white',
  Hindi: 'bg-[#FFD93D]/20',
  Tamil: 'bg-[#C4B5FD]/20',
  Telugu: 'bg-[#06b6d4]/20',
  Kannada: 'bg-[#10b981]/20',
  Malayalam: 'bg-[#3b82f6]/20',
  French: 'bg-[#FF6B6B]/20',
  Japanese: 'bg-white'
};

export default function AnnouncementsCenter() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('Info');
  const [targetRole, setTargetRole] = useState('All');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/announcements');
      if (res.ok) {
        const data = await res.json();
        setAnnouncements(data);
      }
    } catch {
      setAnnouncements([
        {
          id: 1,
          message: 'Attention visitors: Gate A is currently experiencing high queue wait times. Please use Gate B or Gate C for faster entry.',
          category: 'Alert',
          target_role: 'Fan',
          original_lang: 'English',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          translations_json: {
            English: 'Attention visitors: Gate A is currently experiencing high queue wait times. Please use Gate B or Gate C for faster entry.',
            Hindi: 'सभी आगंतुकों का ध्यान दें: गेट ए पर वर्तमान में कतार का समय अधिक है। कृपया त्वरित प्रवेश के लिए गेट बी या गेट सी का उपयोग करें।',
            Tamil: 'பார்வையாளர்கள் கவனத்திற்கு: கேட் ஏ பகுதிக்குச் செல்வதைத் தவிக்கவும், கேட் பி அல்லது சி ஐப் பயன்படுத்தவும்.',
            French: 'Attention aux visiteurs: La porte A connaît actuellement de longs temps d\'attente. Veuillez utiliser la porte B ou la porte C pour une entrée plus rapide.',
            Japanese: '来場者の皆様にご案内いたします：ゲートAは現在、待ち時間が長くなっています。スムーズな入場のタメに、ゲートBまたはゲートCをご利用ください。'
          }
        }
      ]);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setLoading(true);

    try {
      const res = await fetch('http://localhost:8000/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          category,
          target_role: targetRole,
          original_lang: 'English'
        })
      });
      if (res.ok) {
        const data = await res.json();
        setAnnouncements(p => [data, ...p]);
        setMessage('');
      }
    } catch {
      const mock: Announcement = {
        id: Date.now(),
        message,
        category,
        target_role: targetRole,
        original_lang: 'English',
        timestamp: new Date().toISOString(),
        translations_json: {
          English: message,
          Hindi: `[हिन्दी अनुवाद] ${message}`,
          French: `[French Translation] ${message}`,
          Japanese: `[日本語訳] ${message}`
        }
      };
      setAnnouncements(p => [mock, ...p]);
      setMessage('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#FFFDF5] text-black">
      <Sidebar />

      <main className="flex-1 p-6 space-y-6 overflow-y-auto max-h-screen relative z-10">
        <div className="absolute inset-0 bg-dot-pattern pointer-events-none opacity-[0.03]" />

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b-4 border-black pb-4">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight">AI Broadcast Center</h1>
            <p className="text-xs text-slate-500 font-bold uppercase">Distribute translated announcements across 8 target languages in real-time</p>
          </div>
          <div className="mt-4 md:mt-0 flex gap-4 text-xs font-black uppercase text-black bg-white border-4 border-black px-4 py-2 shadow-neo-sm">
            <span>🌍 Languages: 8</span>
            <span>📢 Total Sent: {announcements.length}</span>
          </div>
        </div>

        {/* Grid Layout */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Form & List */}
          <div className="lg:col-span-2 space-y-6">
            {/* Draft panel */}
            <div className="p-5 border-4 border-black bg-white shadow-neo-sm space-y-4">
              <h3 className="text-xs font-black uppercase text-black">Draft Broadcast</h3>
              
              <form onSubmit={handleBroadcast} className="space-y-4">
                <div>
                  <textarea
                    required
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    rows={4}
                    placeholder="Enter announcement text to broadcast..."
                    className="w-full px-4 py-3 bg-white border-4 border-black text-xs font-bold text-black placeholder:text-slate-500 focus:outline-none focus:bg-[#FFD93D]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase font-black text-slate-500 block mb-1">Category</label>
                    <select
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-white border-4 border-black text-xs font-bold focus:outline-none"
                    >
                      {['Info', 'Alert', 'Emergency'].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-black text-slate-500 block mb-1">Target Audience</label>
                    <select
                      value={targetRole}
                      onChange={e => setTargetRole(e.target.value)}
                      className="w-full px-3 py-2 bg-white border-4 border-black text-xs font-bold focus:outline-none"
                    >
                      {['All', 'Fan', 'Volunteer', 'Security', 'Medical', 'Organizer'].map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-[#FF6B6B] border-4 border-black text-white text-xs font-black uppercase shadow-neo-sm active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Megaphone size={14} strokeWidth={3} />
                  {loading ? 'AI Translating...' : 'Broadcast with AI Translation'}
                </button>
              </form>
            </div>

            {/* History logs */}
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase text-black">Broadcast History</h3>
              <div className="space-y-3.5">
                {announcements.map(ann => {
                  const expanded = expandedId === ann.id;
                  return (
                    <div key={ann.id} className="p-4 border-4 border-black bg-white shadow-neo-sm">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 border-2 border-black ${
                            ann.category === 'Emergency' ? 'bg-[#FF6B6B] text-white' : ann.category === 'Alert' ? 'bg-[#FFD93D]' : 'bg-white'
                          }`}>
                            {ann.category}
                          </span>
                          <span className="text-[9px] font-black uppercase bg-slate-100 border-2 border-black px-2 py-0.5">
                            To: {ann.target_role}
                          </span>
                        </div>
                        <span className="text-[9px] font-bold text-slate-500">
                          {new Date(ann.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      
                      <p className="text-xs font-bold text-black leading-relaxed mb-3">{ann.message}</p>
                      
                      <button
                        onClick={() => setExpandedId(expanded ? null : ann.id)}
                        className="text-[10px] font-black uppercase text-blue-600 hover:underline cursor-pointer"
                      >
                        {expanded ? 'Hide translations ▲' : 'View AI Translations (8 Languages) ▼'}
                      </button>

                      <AnimatePresence>
                        {expanded && ann.translations_json && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="mt-3 grid sm:grid-cols-2 gap-2 overflow-hidden border-t-2 border-black pt-3"
                          >
                            {Object.entries(ann.translations_json).map(([lang, val]) => {
                              const meta = LANG_LABELS[lang] || { code: lang.substring(0, 2).toUpperCase(), name: lang };
                              return (
                                <div key={lang} className={`p-2 border-2 border-black shadow-neo-sm ${LANG_COLORS[lang] || 'bg-white'} flex items-start gap-2.5`}>
                                  <span className="text-[9px] font-black uppercase bg-black text-white border border-black px-1 py-0.5 shrink-0 select-none">
                                    {meta.code}
                                  </span>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-[9px] font-black text-black mb-0.5 uppercase tracking-wide">{meta.name}</p>
                                    <p className="text-[10px] font-bold text-black/80">{val}</p>
                                  </div>
                                </div>
                              );
                            })}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* AI Guide (Right Column) */}
          <div className="space-y-6">
            <div className="p-5 border-4 border-black bg-[#C4B5FD] shadow-neo-sm space-y-4">
              <div className="flex items-center gap-2 border-b-2 border-black pb-2">
                <Brain size={18} strokeWidth={2.5} className="text-black" />
                <h3 className="text-xs font-black uppercase text-black">Translation Guide</h3>
              </div>
              <p className="text-xs font-bold text-black leading-relaxed bg-white border-4 border-black p-3.5 shadow-inner">
                AIrena handles multi-lingual announcements through dynamic translation loops. Specific terminology (gate letters, muster sectors) are protected during translation to prevent visitor routing errors.
              </p>
            </div>

            <div className="p-4 border-4 border-black bg-white text-xs font-bold text-slate-500 uppercase leading-snug flex items-center gap-2">
              <Volume2 size={16} strokeWidth={3} className="shrink-0 text-black" />
              <span>Public speaker arrays are synced dynamically. Audio outputs match target zone profiles.</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
