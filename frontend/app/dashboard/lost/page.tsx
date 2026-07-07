'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../../components/Sidebar';
import { 
  Search, 
  Brain, 
  CheckCircle, 
  Video, 
  X, 
  Check, 
  Calendar 
} from 'lucide-react';

interface Sighting {
  time: string;
  event: string;
}

interface LostPerson {
  id: number;
  name: string;
  age: number;
  description: string;
  clothing: string;
  last_seen_location: string;
  last_seen_time: string;
  status: string;
  reported_at: string;
  timeline_json?: Sighting[];
  search_recommendations?: string;
}

export default function LostPersonPage() {
  const [persons, setPersons] = useState<LostPerson[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<LostPerson | null>(null);
  const [newPerson, setNewPerson] = useState({ name: '', age: 6, description: '', clothing: '', last_seen_location: 'Main Concourse', last_seen_time: '10 mins ago' });
  const [showForm, setShowForm] = useState(false);

  const fetchPersons = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/lost-persons');
      if (res.ok) {
        const data = await res.json();
        setPersons(data);
        if (data.length > 0 && !selectedPerson) {
          setSelectedPerson(data[0]);
        }
      }
    } catch {
      const mocks: LostPerson[] = [
        {
          id: 1,
          name: 'Aarav Kumar',
          age: 6,
          description: 'Dark curly hair, speaking Hindi and English, holding a small toy car.',
          clothing: 'Bright red t-shirt, blue jeans, white sneakers.',
          last_seen_location: 'Food Court Area',
          last_seen_time: '11:20 AM',
          status: 'Missing',
          reported_at: new Date(Date.now() - 1200000).toISOString(),
          search_recommendations: '1. Establish visual sweep at all exits in Sector C.\n2. Dispatch Volunteer 3 to patrol Food Court seating lines.\n3. Search camera indices 4, 12, and 15.',
          timeline_json: [
            { time: '0 Mins', event: 'Missing child report filed at Food Court Info Desk.' },
            { time: '5 Mins', event: 'CCTV scan initiated for red clothing metadata.' },
            { time: '12 Mins', event: 'Volunteer deployed to perimeter gates to monitor children leaving.' }
          ]
        },
        {
          id: 2,
          name: 'Emma Watson',
          age: 72,
          description: 'Speaks French, wearing thick glasses, carries a beige shoulder bag.',
          clothing: 'Beige cardigan, white trousers.',
          last_seen_location: 'Gate A (North Entrance)',
          last_seen_time: '10:45 AM',
          status: 'Found',
          reported_at: new Date(Date.now() - 3600000).toISOString(),
          search_recommendations: 'Re-route search teams. Clear checkpoints.',
          timeline_json: [
            { time: '0 Mins', event: 'Spouse reported separation near ticket turnstiles.' },
            { time: '18 Mins', event: 'Located by Medical team near Gate A lift, experiencing dehydration.' }
          ]
        }
      ];
      setPersons(mocks);
      if (!selectedPerson) setSelectedPerson(mocks[0]);
    }
  };

  useEffect(() => {
    fetchPersons();
    const interval = setInterval(fetchPersons, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:8000/api/lost-persons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPerson),
      });
      if (res.ok) {
        const data = await res.json();
        setPersons(p => [data, ...p]);
        setSelectedPerson(data);
        setShowForm(false);
        setNewPerson({ name: '', age: 6, description: '', clothing: '', last_seen_location: 'Main Concourse', last_seen_time: '10 mins ago' });
      }
    } catch {
      const mock: LostPerson = {
        id: Date.now(),
        ...newPerson,
        status: 'Missing',
        reported_at: new Date().toISOString(),
        search_recommendations: `1. Check info desk in ${newPerson.last_seen_location}.\n2. Alert surrounding security checkpoint loops.\n3. Run CCTV color matcher search.`,
        timeline_json: [
          { time: '0 Mins', event: 'Alert logged in command center.' },
          { time: '5 Mins', event: 'AI scanner filters launched.' }
        ]
      };
      setPersons(p => [mock, ...p]);
      setSelectedPerson(mock);
      setShowForm(false);
      setNewPerson({ name: '', age: 6, description: '', clothing: '', last_seen_location: 'Main Concourse', last_seen_time: '10 mins ago' });
    }
  };

  const handleMarkFound = async () => {
    if (!selectedPerson) return;
    try {
      await fetch(`http://localhost:8000/api/lost-persons/${selectedPerson.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Found' })
      });
    } catch {}
    setPersons(prev => prev.map(p => p.id === selectedPerson.id ? { ...p, status: 'Found' } : p));
    setSelectedPerson(prev => prev ? { ...prev, status: 'Found' } : null);
  };

  return (
    <div className="flex min-h-screen bg-[#FFFDF5] text-black">
      <Sidebar />

      <main className="flex-1 p-6 space-y-6 overflow-y-auto max-h-screen relative z-10">
        <div className="absolute inset-0 bg-dot-pattern pointer-events-none opacity-[0.03]" />

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b-4 border-black pb-4">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight">Lost Person Search</h1>
            <p className="text-xs text-slate-500 font-bold uppercase">AI Search Recommendations & CCTV checkpoint timelines</p>
          </div>
          <div className="mt-4 md:mt-0">
            <button 
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-[#06b6d4] border-4 border-black text-black text-xs font-black uppercase shadow-neo-sm active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Search size={14} strokeWidth={3} />
              Report Missing Person
            </button>
          </div>
        </div>

        {/* Grid Layout */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Missing list */}
          <div className="space-y-4">
            <div className="p-5 border-4 border-black bg-white shadow-neo-sm">
              <h3 className="text-xs font-black uppercase text-black mb-4">Active Search Operations</h3>
              <div className="space-y-3 max-h-[30rem] overflow-y-auto scrollbar-thin">
                {persons.map(p => {
                  const active = selectedPerson?.id === p.id;
                  const isMissing = p.status === 'Missing';
                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPerson(p)}
                      className={`p-3.5 border-4 border-black cursor-pointer transition-all ${
                        active 
                          ? 'bg-[#06b6d4]/20 shadow-neo-sm translate-x-[-1px] translate-y-[-1px]' 
                          : 'bg-white hover:bg-[#FFFDF5]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-black text-black uppercase">{p.name} ({p.age}yo)</span>
                        <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 border-2 border-black ${
                          isMissing ? 'bg-[#FF6B6B] text-white animate-pulse' : 'bg-[#10b981] text-white'
                        }`}>{p.status}</span>
                      </div>
                      <p className="text-xs text-black/60 font-bold truncate mb-1">{p.clothing}</p>
                      <div className="flex justify-between text-[9px] text-slate-500 font-bold uppercase">
                        <span>Last: {p.last_seen_location}</span>
                        <span>{p.last_seen_time}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Details & Checkpoints */}
          <div className="lg:col-span-2 space-y-6">
            {selectedPerson ? (
              <div className="grid md:grid-cols-2 gap-6">
                {/* Search checklists */}
                <div className="space-y-6">
                  {/* Recommendations */}
                  <div className="p-5 border-4 border-black bg-[#06b6d4]/10 shadow-neo-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <Brain size={18} strokeWidth={2.5} className="text-cyan-800" />
                      <h3 className="text-xs font-black uppercase text-cyan-800">AI Search Recommendations</h3>
                    </div>
                    <pre className="text-xs font-bold text-black whitespace-pre-wrap font-sans leading-relaxed bg-white border-4 border-black p-3.5 shadow-inner">
                      {selectedPerson.search_recommendations}
                    </pre>
                  </div>

                  {/* Sighting Timeline */}
                  <div className="p-5 border-4 border-black bg-white shadow-neo-sm space-y-3">
                    <div className="flex items-center gap-1.5 text-black mb-1">
                      <Calendar size={16} strokeWidth={3} />
                      <h3 className="text-xs font-black uppercase text-black">CCTV Sighting Timeline</h3>
                    </div>
                    <div className="space-y-3 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-1 before:bg-black">
                      {selectedPerson.timeline_json?.map((t, idx) => (
                        <div key={idx} className="flex items-start gap-4 relative pl-6 text-xs font-bold text-black">
                          <span className="w-4 h-4 rounded-full bg-[#06b6d4] border-2 border-black absolute left-0 top-1 shadow-neo-sm" />
                          <div>
                            <p className="text-black uppercase">{t.event}</p>
                            <p className="text-[9px] text-slate-500 font-bold uppercase">{t.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Operations Control */}
                <div className="p-5 border-4 border-black bg-white shadow-neo-sm space-y-4">
                  <h3 className="text-xs font-black uppercase text-black">Active Search Profile</h3>
                  
                  <div className="text-xs font-bold text-black space-y-2 p-3.5 border-2 border-black bg-[#FFFDF5]">
                    <p><span className="text-slate-500 font-black uppercase">Physical:</span> {selectedPerson.description}</p>
                    <p><span className="text-slate-500 font-black uppercase">Clothing:</span> {selectedPerson.clothing}</p>
                    <p><span className="text-slate-500 font-black uppercase">Last Seen:</span> {selectedPerson.last_seen_location} ({selectedPerson.last_seen_time})</p>
                  </div>

                  <div className="space-y-2">
                    {selectedPerson.status === 'Missing' && (
                      <button 
                        onClick={handleMarkFound}
                        className="w-full py-2.5 bg-[#10b981] border-4 border-black text-white text-xs font-black uppercase shadow-neo-sm active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle size={14} strokeWidth={3} />
                        Mark Person as Found
                      </button>
                    )}
                    <button 
                      onClick={() => alert(`CCTV tracker set for target: ${selectedPerson.clothing}`)}
                      className="w-full py-2.5 bg-white border-4 border-black text-black text-xs font-black uppercase shadow-neo-sm active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer hover:bg-slate-50 flex items-center justify-center gap-1.5"
                    >
                      <Video size={14} strokeWidth={3} />
                      CCTV Color Filter Matcher
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-24 border-4 border-black bg-white shadow-neo-sm">
                <Search size={32} strokeWidth={2.5} className="mx-auto text-slate-400 mb-2" />
                <p className="text-xs font-black uppercase text-slate-500 font-bold">No active search operations selected.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Report Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-none"
            onClick={e => { if (e.target === e.currentTarget) setShowForm(false); }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-white border-4 border-black p-6 shadow-neo-lg"
            >
              <div className="flex items-center justify-between mb-5 border-b-4 border-black pb-3">
                <h3 className="font-black text-sm uppercase text-black">Report Missing Person</h3>
                <button onClick={() => setShowForm(false)} className="font-black hover:text-red-500 cursor-pointer text-black">
                  <X size={16} strokeWidth={3} />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="missingName" className="text-[10px] uppercase font-black text-slate-500 block mb-1">Full Name</label>
                    <input 
                      id="missingName"
                      required 
                      value={newPerson.name} 
                      onChange={e => setNewPerson(p => ({ ...p, name: e.target.value }))}
                      placeholder="Name" 
                      className="w-full px-3 py-2 bg-white border-4 border-black text-xs font-bold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="missingAge" className="text-[10px] uppercase font-black text-slate-500 block mb-1">Age</label>
                    <input 
                      id="missingAge"
                      required 
                      type="number"
                      value={newPerson.age} 
                      onChange={e => setNewPerson(p => ({ ...p, age: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 bg-white border-4 border-black text-xs font-bold focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="missingClothing" className="text-[10px] uppercase font-black text-slate-500 block mb-1">Clothing Details</label>
                  <input 
                    id="missingClothing"
                    required 
                    value={newPerson.clothing} 
                    onChange={e => setNewPerson(p => ({ ...p, clothing: e.target.value }))}
                    placeholder="e.g. Blue hat, red t-shirt" 
                    className="w-full px-3 py-2 bg-white border-4 border-black text-xs font-bold focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="missingLocation" className="text-[10px] uppercase font-black text-slate-500 block mb-1">Last Seen Location</label>
                  <select 
                    id="missingLocation"
                    value={newPerson.last_seen_location}
                    onChange={e => setNewPerson(p => ({ ...p, last_seen_location: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border-4 border-black text-xs font-bold focus:outline-none"
                  >
                    {['Main Concourse', 'Food Court Area', 'Gate A', 'Gate B', 'Gate C', 'Gate D'].map(l => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="missingDesc" className="text-[10px] uppercase font-black text-slate-500 block mb-1">Physical Description</label>
                  <textarea 
                    id="missingDesc"
                    required 
                    value={newPerson.description} 
                    onChange={e => setNewPerson(p => ({ ...p, description: e.target.value }))}
                    rows={2}
                    placeholder="Physical details, languages, items..." 
                    className="w-full px-3 py-2 bg-white border-4 border-black text-xs font-bold focus:outline-none resize-none"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full py-2.5 bg-[#06b6d4] border-4 border-black text-black text-xs font-black uppercase shadow-neo-sm active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Check size={14} strokeWidth={3} />
                  Submit Missing Report
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
