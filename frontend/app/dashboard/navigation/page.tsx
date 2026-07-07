'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '../../components/Sidebar';
import { 
  AlertTriangle, 
  Accessibility, 
  Compass, 
  Brain, 
  Route, 
  Info 
} from 'lucide-react';

const ZONES = [
  { id: 'gate_a', name: 'Gate A (North Entrance)', x: 50, y: 15, accessible: true },
  { id: 'gate_b', name: 'Gate B (East Entrance)', x: 85, y: 50, accessible: true },
  { id: 'gate_c', name: 'Gate C (South Entrance)', x: 50, y: 85, accessible: true },
  { id: 'gate_d', name: 'Gate D (West Entrance)', x: 15, y: 50, accessible: false },
  { id: 'gate_e', name: 'Gate E (Medical Bay / South East)', x: 75, y: 75, accessible: true },
  { id: 'main_concourse', name: 'Main Concourse', x: 50, y: 50, accessible: true },
  { id: 'food_court', name: 'Food Court Area', x: 65, y: 65, accessible: true },
  { id: 'north_stands', name: 'North Stands', x: 50, y: 30, accessible: false },
  { id: 'south_stands', name: 'South Stands', x: 50, y: 70, accessible: true },
];

export default function SmartNavigationPage() {
  const [fromNode, setFromNode] = useState('gate_a');
  const [toNode, setToNode] = useState('food_court');
  const [evacOverlay, setEvacOverlay] = useState(false);
  const [routeType, setRouteType] = useState<'fastest' | 'accessible' | 'congested'>('fastest');
  const [aiExplanation, setAiExplanation] = useState('Enter origin and destination points to view optimized paths.');

  const handleRouteCalc = () => {
    const fromName = ZONES.find(z => z.id === fromNode)?.name;
    const toName = ZONES.find(z => z.id === toNode)?.name;
    
    if (fromNode === toNode) {
      setAiExplanation("Origin and destination are in the same zone. No routing required.");
      return;
    }

    if (routeType === 'fastest') {
      setAiExplanation(`AI OPTIMIZED: Direct path from ${fromName} through the central concourse elevators. Avoid the ground-level corridors due to high crowd density. Estimated transit time: 4.5 minutes.`);
    } else if (routeType === 'accessible') {
      setAiExplanation(`ACCESSIBLE ROUTE: Routing from ${fromName} using North Stand lifts. This bypasses the structural staircase. Clear width is verified at 1.8 meters. Estimated transit time: 6.2 minutes.`);
    } else {
      setAiExplanation(`CONGESTION AWARE: Path diverted via the outer promenade ring to avoid the Food Court bottlenecks. 8 minutes total travel time, but with 90% less crowd interaction.`);
    }
  };

  const activeFrom = ZONES.find(z => z.id === fromNode);
  const activeTo = ZONES.find(z => z.id === toNode);

  return (
    <div className="flex min-h-screen bg-[#FFFDF5] text-black">
      <Sidebar />

      <main className="flex-1 p-6 space-y-6 overflow-y-auto max-h-screen relative z-10">
        <div className="absolute inset-0 bg-dot-pattern pointer-events-none opacity-[0.03]" />

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b-4 border-black pb-4">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight">Indoor Navigation</h1>
            <p className="text-xs text-slate-500 font-bold uppercase">Accessible paths, live bottlenecks avoidance, and evac routing</p>
          </div>
          <div className="mt-4 md:mt-0">
            <button 
              onClick={() => setEvacOverlay(p => !p)} 
              className={`px-4 py-2 border-4 border-black text-xs font-black uppercase shadow-neo-sm active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer flex items-center gap-1.5 ${
                evacOverlay ? 'bg-[#FF6B6B] text-white' : 'bg-white text-black'
              }`}
            >
              <AlertTriangle size={14} strokeWidth={3} />
              Evac Overlay: {evacOverlay ? 'ACTIVE' : 'OFF'}
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Map Blueprint */}
          <div className="lg:col-span-2 space-y-4">
            <div className="p-5 border-4 border-black bg-white shadow-neo-sm">
              <h3 className="text-xs font-black uppercase text-black mb-4">Interactive Venue Blueprint</h3>

              <div className="relative w-full aspect-[4/3] bg-[#FFFDF5] border-4 border-black overflow-hidden">
                <div className="absolute inset-0 bg-dot-pattern opacity-[0.06]" />

                <svg className="w-full h-full" viewBox="0 0 100 100">
                  {/* Outer boundaries */}
                  <rect x="5" y="5" width="90" height="90" fill="none" stroke="black" strokeWidth="3.5" />
                  <ellipse cx="50" cy="50" rx="35" ry="25" fill="none" stroke="black" strokeWidth="2.5" />
                  
                  {/* Promenade Ring */}
                  <rect x="15" y="15" width="70" height="70" fill="none" stroke="black" strokeWidth="1" strokeDasharray="3" opacity="0.3" />

                  {/* Evacuation Overlay */}
                  {evacOverlay && (
                    <>
                      <line x1="50" y1="50" x2="50" y2="15" stroke="#FF6B6B" strokeWidth="3" strokeDasharray="4,4" />
                      <line x1="50" y1="50" x2="50" y2="85" stroke="#FF6B6B" strokeWidth="3" strokeDasharray="4,4" />
                      <line x1="50" y1="50" x2="15" y2="50" stroke="#FF6B6B" strokeWidth="3" strokeDasharray="4,4" />
                      <line x1="50" y1="50" x2="85" y2="50" stroke="#FF6B6B" strokeWidth="3" strokeDasharray="4,4" />
                    </>
                  )}

                  {/* Active Route Draw */}
                  {!evacOverlay && activeFrom && activeTo && (
                    <motion.line 
                      x1={activeFrom.x} 
                      y1={activeFrom.y} 
                      x2={activeTo.x} 
                      y2={activeTo.y} 
                      stroke={routeType === 'congested' ? '#FFD93D' : routeType === 'accessible' ? '#C4B5FD' : '#3b82f6'} 
                      strokeWidth="4" 
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.5 }}
                    />
                  )}

                  {/* Nodes */}
                  {ZONES.map(z => {
                    const isOrigin = z.id === fromNode;
                    const isDest = z.id === toNode;
                    const fill = isOrigin ? '#3b82f6' : isDest ? '#10b981' : 'white';
                    return (
                      <g key={z.id} className="cursor-pointer" onClick={() => {
                        if (fromNode === z.id) return;
                        setToNode(z.id);
                      }}>
                        <circle cx={z.x} cy={z.y} r={isOrigin || isDest ? 4 : 3} fill={fill} stroke="black" strokeWidth="2.5" />
                        <text x={z.x} y={z.y - 5} fill="black" fontSize="2.5" textAnchor="middle" fontWeight="900" style={{ textTransform: 'uppercase' }}>
                          {z.id === 'gate_a' ? 'Gate A' : z.id === 'gate_b' ? 'Gate B' : z.id === 'gate_c' ? 'Gate C' : z.id === 'gate_d' ? 'Gate D' : z.id === 'gate_e' ? 'Gate E' : z.name.split(' ')[0]}
                        </text>
                      </g>
                    );
                  })}
                </svg>
                {evacOverlay && (
                  <div className="absolute top-3 left-3 bg-[#FF6B6B] border-4 border-black p-2.5 text-xs text-white font-black uppercase shadow-neo-sm animate-pulse flex items-center gap-1.5">
                    <AlertTriangle size={14} strokeWidth={3} />
                    <span>Emergency evacuation protocol active. Follow corridors.</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Controls Column */}
          <div className="space-y-6">
            {/* Router Card */}
            <div className="p-5 border-4 border-black bg-white shadow-neo-sm space-y-4">
              <h3 className="text-xs font-black uppercase text-black">Route Planner</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] uppercase font-black text-slate-500 block mb-1">Origin Point</label>
                  <select 
                    value={fromNode} 
                    onChange={e => setFromNode(e.target.value)}
                    className="w-full px-3 py-2 bg-white border-4 border-black text-xs font-bold focus:outline-none"
                  >
                    {ZONES.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-black text-slate-500 block mb-1">Destination Point</label>
                  <select 
                    value={toNode} 
                    onChange={e => setToNode(e.target.value)}
                    className="w-full px-3 py-2 bg-white border-4 border-black text-xs font-bold focus:outline-none"
                  >
                    {ZONES.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Preferences selector */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'fastest', label: 'Fastest' },
                  { id: 'accessible', label: 'Access' },
                  { id: 'congested', label: 'Avoid' },
                ].map(r => (
                  <button
                    key={r.id}
                    onClick={() => { setRouteType(r.id as any); }}
                    className={`py-2 text-[10px] font-black uppercase rounded-none border-2 border-black transition-all cursor-pointer ${
                      routeType === r.id ? 'bg-[#FFD93D] shadow-neo-sm translate-x-[-1px] translate-y-[-1px]' : 'bg-white hover:bg-slate-100 shadow-none'
                    }`}
                  >
                    {r.id === 'accessible' && <Accessibility size={10} className="inline mr-1" strokeWidth={3} />}
                    {r.label}
                  </button>
                ))}
              </div>

              <button 
                onClick={handleRouteCalc}
                className="w-full py-2.5 bg-[#FF6B6B] border-4 border-black text-white text-xs font-black uppercase shadow-neo-sm active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Compass size={14} strokeWidth={3} />
                Calculate Route
              </button>
            </div>

            {/* AI Explanation Result */}
            <div className="p-5 border-4 border-black bg-[#C4B5FD] shadow-neo-sm space-y-3">
              <div className="flex items-center gap-2">
                <Brain size={18} strokeWidth={2.5} className="text-black" />
                <h3 className="text-xs font-black uppercase text-black">AI Route Explainer</h3>
              </div>
              <p className="text-xs font-bold text-black leading-relaxed bg-white border-4 border-black p-3.5 shadow-inner">
                {aiExplanation}
              </p>
            </div>

            {/* Accessible specifications */}
            <div className="p-4 border-4 border-black bg-white text-xs font-bold text-slate-500 uppercase leading-snug flex items-center gap-2">
              <Accessibility size={16} strokeWidth={3} className="shrink-0 text-black" />
              <span>Lifts are certified operational. Access corridors are monitored for obstruction.</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
