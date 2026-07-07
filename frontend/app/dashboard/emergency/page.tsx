'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../../components/Sidebar';
import { 
  Activity, 
  Flame, 
  Shield, 
  Search, 
  AlertOctagon, 
  AlertTriangle, 
  Brain, 
  Check, 
  MapPin, 
  Compass, 
  Megaphone, 
  X, 
  CheckCircle 
} from 'lucide-react';

interface Incident {
  id: number;
  category: string;
  description: string;
  location_zone: string;
  severity: string;
  status: string;
  timestamp: string;
  reporter_name: string;
  assigned_responder?: string;
  ai_summary?: string;
  recommended_actions?: string;
  nearest_resources?: any[];
  safe_routes?: any[];
}

const FLAGS: Record<string, string> = {
  English: '🇬🇧 English',
  Hindi: '🇮🇳 Hindi',
  French: '🇫🇷 French',
  Japanese: '🇯🇵 Japanese'
};

function CatIcon({ category, size = 18 }: { category: string; size?: number }) {
  const props = { size, strokeWidth: 2.5, className: "text-black shrink-0" };
  if (category === 'Medical') return <Activity {...props} />;
  if (category === 'Fire') return <Flame {...props} />;
  if (category === 'Security') return <Shield {...props} />;
  if (category === 'Lost Child') return <Search {...props} />;
  if (category === 'Evacuation') return <AlertOctagon {...props} />;
  return <AlertTriangle {...props} />;
}

export default function EmergencyDashboardPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [multilingualBroadcasts, setMultilingualBroadcasts] = useState<Record<string, string>>({});
  const [newIncident, setNewIncident] = useState({ category: 'Medical', description: '', location_zone: '', severity: 'High', reporter_name: 'Command Center' });
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});

  const fetchIncidents = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/incidents');
      if (res.ok) {
        const data = await res.json();
        const emergencies = data.filter((i: Incident) => 
          ['Medical', 'Fire', 'Security', 'Evacuation'].includes(i.category)
        );
        setIncidents(emergencies);
        if (emergencies.length > 0 && !selectedIncident) {
          setSelectedIncident(emergencies[0]);
        }
      }
    } catch {
      const mocks = [
        {
          id: 1,
          category: 'Medical',
          description: 'Spectator collapsed in Row F of North Stands, complaining of chest pain and breathing difficulties.',
          location_zone: 'North Stands (Row A-K)',
          status: 'In Progress',
          severity: 'High',
          timestamp: new Date(Date.now() - 720000).toISOString(),
          reporter_name: 'Volunteer-1 (John)',
          assigned_responder: 'Med-A',
          ai_summary: 'Cardiac warning alert in North Stands. Emergency access corridor activated.',
          recommended_actions: '1. Med-A dispatched to North Stands Row F.\n2. Keep seating rows clear.\n3. Prepare medical transport via lift to Gate E.',
          nearest_resources: [{ name: 'Med-A', type: 'Medical Unit', eta: '2 mins' }],
          safe_routes: [{ from: 'North Stands', to: 'Gate E (Medical Bay)', path: 'Take lift down to level 0, follow Corridor 3.' }]
        },
        {
          id: 2,
          category: 'Fire',
          description: 'Smoke reported in vendor booth 4B in the main West Concourse.',
          location_zone: 'Gate D (West Entrance)',
          status: 'Active',
          severity: 'High',
          timestamp: new Date(Date.now() - 300000).toISOString(),
          reporter_name: 'Vendor Lead',
          assigned_responder: 'Fire-Team 1',
          ai_summary: 'Electrical fire hazard suspected in Concourse Section 4B. Emergency evacuation required.',
          recommended_actions: '1. Sound localized alarms.\n2. Deploy perimeter guard to secure Gate D exit routes.\n3. Instruct volunteers to divert crowds to Gate C.',
          nearest_resources: [{ name: 'Fire-Team 1', type: 'Fire Patrol', eta: '4 mins' }],
          safe_routes: [{ from: 'Gate D', to: 'Gate C (South Entrance)', path: 'Route visitors along perimeter fence to Gate C.' }]
        }
      ];
      setIncidents(mocks);
      if (!selectedIncident) setSelectedIncident(mocks[0]);
    }
  };

  useEffect(() => {
    fetchIncidents();
    const interval = setInterval(fetchIncidents, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:8000/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newIncident),
      });
      if (res.ok) {
        const data = await res.json();
        setIncidents(p => [data, ...p]);
        setSelectedIncident(data);
        setNewIncident({ category: 'Medical', description: '', location_zone: '', severity: 'High', reporter_name: 'Command Center' });
      }
    } catch {
      const mock: Incident = {
        id: Date.now(),
        ...newIncident,
        status: 'Active',
        timestamp: new Date().toISOString(),
        ai_summary: `AI analyzed the ${newIncident.category} alert. Dispatched closest teams.`,
        recommended_actions: '1. Establish 10-meter perimeter.\n2. Guide emergency team to site.\n3. Standby for status updates.',
        nearest_resources: [{ name: 'Med-A', type: 'First Responder', eta: '3 mins' }],
        safe_routes: []
      };
      setIncidents(p => [mock, ...p]);
      setSelectedIncident(mock);
      setNewIncident({ category: 'Medical', description: '', location_zone: '', severity: 'High', reporter_name: 'Command Center' });
    }
  };

  const handleUpdateStatus = async (status: string) => {
    if (!selectedIncident) return;
    try {
      await fetch(`http://localhost:8000/api/incidents/${selectedIncident.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
    } catch {}
    setIncidents(prev => prev.map(i => i.id === selectedIncident.id ? { ...i, status } : i));
    setSelectedIncident(prev => prev ? { ...prev, status } : null);
  };

  const triggerBroadcast = () => {
    if (!selectedIncident) return;
    const msg = `Attention all visitors. An active ${selectedIncident.category.toLowerCase()} incident is reported in ${selectedIncident.location_zone}. Please follow staff routing coordinates.`;
    
    setMultilingualBroadcasts({
      "English": msg,
      "Hindi": `सभी आगंतुकों का ध्यान दें। ${selectedIncident.location_zone} में एक सक्रिय ${selectedIncident.category.toLowerCase()} घटना की सूचना मिली है। कृपया स्टाफ के निर्देशों का पालन करें।`,
      "French": `Attention à tous les visiteurs. Un incident de type ${selectedIncident.category.toLowerCase()} est signalé dans ${selectedIncident.location_zone}. Veuillez suivre les consignes du personnel.`,
      "Japanese": `来場者の皆様にご案内いたします。${selectedIncident.location_zone}で${selectedIncident.category}に関する事態が報告されています。係員の誘導に従ってください。`
    });
    setShowBroadcastModal(true);
  };

  const activeCount = incidents.filter(i => i.status === 'Active').length;
  const inProgressCount = incidents.filter(i => i.status === 'In Progress').length;

  return (
    <div className="flex min-h-screen bg-[#FFFDF5] text-black">
      <Sidebar />

      <main className="flex-1 p-6 space-y-6 overflow-y-auto max-h-screen relative z-10">
        <div className="absolute inset-0 bg-dot-pattern pointer-events-none opacity-[0.03]" />

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b-4 border-black pb-4">
          <div>
            <h1 className="text-2xl font-black bg-gradient-to-r from-red-600 to-[#FF6B6B] bg-clip-text text-transparent uppercase tracking-tight">
              Emergency Center
            </h1>
            <p className="text-xs text-slate-500 font-bold uppercase">AI crisis coordination, dispatcher allocation, and instant translation broadcasts</p>
          </div>
          <div className="mt-4 md:mt-0 flex gap-4 text-xs font-black uppercase">
            <span className="px-3 py-1.5 bg-[#FF6B6B] border-4 border-black text-white shadow-neo-sm">
              Active: {activeCount}
            </span>
            <span className="px-3 py-1.5 bg-[#FFD93D] border-4 border-black text-black shadow-neo-sm">
              Responding: {inProgressCount}
            </span>
            <span className="px-3 py-1.5 bg-white border-4 border-black text-black shadow-neo-sm">
              SLA Target: 2.5 mins
            </span>
          </div>
        </div>

        {/* Panels */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Active alerts list */}
          <div className="space-y-4">
            <div className="p-5 border-4 border-black bg-white shadow-neo-sm">
              <h3 className="text-xs font-black uppercase text-black mb-4">Active Crises</h3>
              <div className="space-y-3 max-h-[30rem] overflow-y-auto scrollbar-thin">
                {incidents.map(i => {
                  const active = selectedIncident?.id === i.id;
                  return (
                    <div
                      key={i.id}
                      onClick={() => setSelectedIncident(i)}
                      className={`p-3.5 border-4 border-black cursor-pointer transition-all ${
                        active 
                          ? 'bg-[#FF6B6B]/25 shadow-neo-sm translate-x-[-1px] translate-y-[-1px]' 
                          : 'bg-white hover:bg-[#FFFDF5]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-black text-black uppercase">{i.category}</span>
                        <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 border-2 border-black ${
                          i.status === 'Active' ? 'bg-[#FF6B6B] text-white animate-pulse' : 'bg-[#FFD93D] text-black'
                        }`}>{i.status}</span>
                      </div>
                      <p className="text-xs text-black/60 font-bold truncate mb-1">{i.description}</p>
                      <div className="flex justify-between text-[9px] text-slate-500 font-bold uppercase">
                        <span>{i.location_zone}</span>
                        <span>{new Date(i.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick alert creator */}
            <form onSubmit={handleCreate} className="p-5 border-4 border-black bg-white shadow-neo-sm space-y-3">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider">File Rapid Alert</h3>
              <div className="grid grid-cols-2 gap-2">
                <select 
                  id="emerCategory"
                  value={newIncident.category} 
                  onChange={e => setNewIncident(p => ({ ...p, category: e.target.value }))}
                  aria-label="Alert Category"
                  className="px-2 py-2 bg-white border-4 border-black text-xs font-bold focus:outline-none"
                >
                  {['Medical', 'Fire', 'Security', 'Evacuation'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <input 
                  id="emerLocation"
                  required
                  value={newIncident.location_zone} 
                  onChange={e => setNewIncident(p => ({ ...p, location_zone: e.target.value }))}
                  placeholder="Zone Location"
                  aria-label="Zone Location"
                  className="px-2 py-2 bg-white border-4 border-black text-xs font-bold focus:outline-none placeholder:text-slate-400"
                />
              </div>
              <textarea 
                id="emerDesc"
                required
                value={newIncident.description}
                onChange={e => setNewIncident(p => ({ ...p, description: e.target.value }))}
                rows={2}
                placeholder="Alert description details..."
                aria-label="Alert details"
                className="w-full px-2 py-2 bg-white border-4 border-black text-xs font-bold focus:outline-none placeholder:text-slate-400 resize-none"
              />
              <button type="submit" className="w-full py-2.5 bg-[#FF6B6B] border-4 border-black text-white text-xs font-black uppercase shadow-neo-sm active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <AlertTriangle size={14} strokeWidth={3} />
                Dispatch & Route
              </button>
            </form>
          </div>

          {/* Details Column */}
          <div className="lg:col-span-2 space-y-6">
            {selectedIncident ? (
              <div className="grid md:grid-cols-2 gap-6">
                {/* Protocol Checklist */}
                <div className="space-y-6">
                  {/* AI Summary */}
                  <div className="p-5 border-4 border-black bg-[#FF6B6B]/10 shadow-neo-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <Brain size={18} strokeWidth={2.5} className="text-[#FF6B6B]" />
                      <h3 className="text-xs font-black uppercase text-red-700">AI Threat Summary</h3>
                    </div>
                    <p className="text-xs font-bold text-black leading-relaxed bg-white border-4 border-black p-3 shadow-inner">
                      {selectedIncident.ai_summary}
                    </p>
                  </div>

                  {/* Checklist */}
                  <div className="p-5 border-4 border-black bg-white shadow-neo-sm space-y-3">
                    <h3 className="text-xs font-black uppercase text-black">Crisis Protocol Checklist</h3>
                    <div className="space-y-2.5">
                      {selectedIncident.recommended_actions?.split('\n').map((act, idx) => (
                        <div key={idx} className="flex items-start gap-3">
                          <input 
                            type="checkbox" 
                            checked={checklist[`${selectedIncident.id}-${idx}`] || false}
                            onChange={e => setChecklist(p => ({ ...p, [`${selectedIncident.id}-${idx}`]: e.target.checked }))}
                            aria-label={act}
                            className="mt-0.5 accent-black border-2 border-black" 
                          />
                          <p className={`text-xs font-bold ${checklist[`${selectedIncident.id}-${idx}`] ? 'text-slate-400 line-through' : 'text-black'}`}>
                            {act.startsWith('1.') || act.startsWith('2.') || act.startsWith('3.') ? act.substring(3) : act}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Dispatch & Maps */}
                <div className="space-y-6">
                  {/* Resource dispatch list */}
                  <div className="p-5 border-4 border-black bg-white shadow-neo-sm space-y-3">
                    <div className="flex items-center gap-1.5 text-black">
                      <MapPin size={16} strokeWidth={3} />
                      <h3 className="text-xs font-black uppercase text-black">Nearest Resource Dispatch</h3>
                    </div>
                    {selectedIncident.nearest_resources?.map((r, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 border-2 border-black bg-[#FFFDF5]">
                        <div>
                          <p className="text-xs font-black text-black">{r.name}</p>
                          <p className="text-[9px] uppercase text-slate-500 font-bold">{r.type}</p>
                        </div>
                        <span className="text-xs font-black text-green-700 bg-white border-2 border-black px-2 py-0.5 shadow-neo-sm">{r.eta}</span>
                      </div>
                    ))}
                    <div className="flex gap-2 pt-2 border-t-2 border-black">
                      <button 
                        onClick={() => handleUpdateStatus('In Progress')}
                        className="flex-1 py-2 bg-[#FFD93D] border-4 border-black text-black text-xs font-black uppercase shadow-neo-sm active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-1"
                      >
                        <Activity size={10} strokeWidth={3} />
                        Deploy
                      </button>
                      <button 
                        onClick={() => handleUpdateStatus('Resolved')}
                        className="flex-1 py-2 bg-[#10b981] border-4 border-black text-white text-xs font-black uppercase shadow-neo-sm active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-1"
                      >
                        <CheckCircle size={10} strokeWidth={3} />
                        Resolve
                      </button>
                    </div>
                  </div>

                  {/* Evac route controls */}
                  <div className="p-5 border-4 border-black bg-white shadow-neo-sm space-y-4">
                    <div className="flex items-center gap-1.5 text-black">
                      <Compass size={16} strokeWidth={3} />
                      <h3 className="text-xs font-black uppercase text-black">Action Control</h3>
                    </div>
                    
                    {selectedIncident.safe_routes && selectedIncident.safe_routes.length > 0 && (
                      <div className="text-xs font-bold text-black bg-[#C4B5FD]/20 border-2 border-black p-3">
                        <span className="font-black uppercase block mb-1">Evac corridor:</span>
                        {selectedIncident.safe_routes[0].path}
                      </div>
                    )}

                    <button 
                      onClick={triggerBroadcast}
                      className="w-full py-3 bg-gradient-to-r from-[#FF6B6B] to-[#FFD93D] border-4 border-black text-black text-xs font-black uppercase shadow-neo-sm active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Megaphone size={14} strokeWidth={3} />
                      Broadcast Multilingual Announcement
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-24 border-4 border-black bg-white shadow-neo-sm">
                <AlertTriangle size={32} strokeWidth={2.5} className="mx-auto text-slate-400 mb-2" />
                <p className="text-xs font-black uppercase text-slate-500">No active emergency alerts selected.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Multilingual Modal */}
      <AnimatePresence>
        {showBroadcastModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-none"
            onClick={() => setShowBroadcastModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-lg bg-white border-4 border-black p-6 shadow-neo-lg"
            >
              <div className="flex items-center justify-between mb-5 border-b-4 border-black pb-3">
                <h3 className="font-black text-sm uppercase text-black">AI Translated Broadcasts</h3>
                <button onClick={() => setShowBroadcastModal(false)} className="font-black hover:text-red-500 cursor-pointer text-black">
                  <X size={16} strokeWidth={3} />
                </button>
              </div>
              
              <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-thin">
                {Object.entries(multilingualBroadcasts).map(([lang, text]) => (
                  <div key={lang} className="p-3 bg-[#FFFDF5] border-2 border-black shadow-neo-sm text-xs">
                    <span className="font-black text-[#FF6B6B] uppercase mb-1 block">
                      {FLAGS[lang] || lang}
                    </span>
                    <p className="text-black font-bold leading-relaxed">{text}</p>
                  </div>
                ))}
              </div>

              <button 
                onClick={() => setShowBroadcastModal(false)}
                className="w-full py-2.5 bg-black text-white border-4 border-black text-xs font-black uppercase shadow-neo-sm mt-4 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
              >
                ✓ Complete Broadcast Dispatch
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
