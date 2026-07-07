'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '../../components/Sidebar';
import { 
  Zap, 
  TrendingUp, 
  Brain, 
  Shuffle, 
  MousePointerClick, 
  Activity 
} from 'lucide-react';

interface Zone {
  id: number;
  name: string;
  safe_capacity: number;
  current_capacity: number;
  risk_level: string;
  coordinate_x: number;
  coordinate_y: number;
}

export default function CrowdManagementPage() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiAdvice, setAiAdvice] = useState<string>('Select a congested zone to generate AI diversion recommendations.');
  const [alternateRoutes, setAlternateRoutes] = useState<string[]>([]);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);

  const fetchZones = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/zones');
      if (res.ok) {
        const data = await res.json();
        setZones(data);
      }
    } catch {
      setZones([
        { id: 1, name: 'Gate A (North Entrance)', safe_capacity: 2000, current_capacity: 1850, risk_level: 'Medium', coordinate_x: 20, coordinate_y: 15 },
        { id: 2, name: 'Gate B (East Entrance)', safe_capacity: 1500, current_capacity: 600, risk_level: 'Low', coordinate_x: 85, coordinate_y: 40 },
        { id: 3, name: 'Gate C (South Entrance)', safe_capacity: 2500, current_capacity: 800, risk_level: 'Low', coordinate_x: 50, coordinate_y: 90 },
        { id: 4, name: 'Gate D (West Entrance)', safe_capacity: 1200, current_capacity: 1180, risk_level: 'High', coordinate_x: 15, coordinate_y: 60 },
        { id: 5, name: 'Main Concourse', safe_capacity: 5000, current_capacity: 3400, risk_level: 'Low', coordinate_x: 50, coordinate_y: 50 },
        { id: 6, name: 'Food Court Area', safe_capacity: 1000, current_capacity: 950, risk_level: 'Medium', coordinate_x: 65, coordinate_y: 65 },
        { id: 7, name: 'North Stands (Row A-K)', safe_capacity: 3000, current_capacity: 2900, risk_level: 'Medium', coordinate_x: 50, coordinate_y: 25 },
        { id: 8, name: 'South Stands (Row A-K)', safe_capacity: 3000, current_capacity: 1200, risk_level: 'Low', coordinate_x: 50, coordinate_y: 75 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchZones();
    const interval = setInterval(fetchZones, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSimulate = async (zoneId: number, diff: number) => {
    const zone = zones.find(z => z.id === zoneId);
    if (!zone) return;
    const newVal = Math.max(0, zone.current_capacity + diff);
    
    setZones(prev => prev.map(z => z.id === zoneId ? {
      ...z,
      current_capacity: newVal,
      risk_level: (newVal / z.safe_capacity) >= 1.0 ? 'High' : (newVal / z.safe_capacity) >= 0.8 ? 'Medium' : 'Low'
    } : z));

    try {
      const res = await fetch(`http://localhost:8000/api/zones/${zoneId}/simulate?current_capacity=${newVal}`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        if (data.ai_recommendation) {
          setAiAdvice(data.ai_recommendation);
          setAlternateRoutes(data.alternate_routes || []);
          setSelectedZone(zones.find(z => z.id === zoneId) || null);
        }
      }
    } catch {
      const ratio = newVal / zone.safe_capacity;
      if (ratio >= 1.0) {
        setAiAdvice(`CRITICAL SURGE: Gate ${zone.name[5]} has exceeded capacity limits (${Math.round(ratio * 100)}%). Direct incoming flows to Gate C. Deploy 3 volunteers immediately to coordinate.`);
        setAlternateRoutes([`Reroute through East Corridor bypass`, `Direct outward to Muster Area B`]);
      } else if (ratio >= 0.8) {
        setAiAdvice(`WARNING: ${zone.name} capacity is rising. Slow down scanner entry and alert standby response units.`);
        setAlternateRoutes([`Use deck walkways instead of lower concourse`]);
      } else {
        setAiAdvice(`Normal operating flow in ${zone.name}. No active intervention required.`);
        setAlternateRoutes([]);
      }
      setSelectedZone(zone);
    }
  };

  const totalOccupancy = zones.reduce((a, z) => a + z.current_capacity, 0);
  const totalCapacity = zones.reduce((a, z) => a + z.safe_capacity, 0);
  const occupancyPct = totalCapacity ? Math.round((totalOccupancy / totalCapacity) * 100) : 0;

  return (
    <div className="flex min-h-screen bg-[#FFFDF5] text-black">
      <Sidebar />

      <main className="flex-1 p-6 space-y-6 overflow-y-auto max-h-screen relative z-10">
        <div className="absolute inset-0 bg-dot-pattern pointer-events-none opacity-[0.03]" />

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b-4 border-black pb-4">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight">Crowd Management</h1>
            <p className="text-xs text-slate-500 font-bold uppercase">Real-time density indices & automated queue diversions</p>
          </div>
          <div className="mt-4 md:mt-0 flex gap-2">
            <button 
              onClick={() => handleSimulate(4, 500)}
              className="px-4 py-2 border-4 border-black bg-[#FF6B6B] text-white text-xs font-black uppercase shadow-neo-sm active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Zap size={14} strokeWidth={3} />
              Surge Gate D (+500)
            </button>
            <button 
              onClick={() => handleSimulate(2, 500)}
              className="px-4 py-2 border-4 border-black bg-[#FFD93D] text-black text-xs font-black uppercase shadow-neo-sm active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer flex items-center gap-1.5"
            >
              <TrendingUp size={14} strokeWidth={3} />
              Surge Gate B (+500)
            </button>
          </div>
        </div>

        {/* Grid Layout */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Map & Chart Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* SVG Map Card */}
            <div className="p-5 border-4 border-black bg-white shadow-neo-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-black uppercase text-black">Venue Density Blueprint</h3>
                <div className="flex items-center gap-1 text-[10px] text-slate-500 font-black uppercase">
                  <MousePointerClick size={12} strokeWidth={3} />
                  <span>Click nodes to simulate traffic</span>
                </div>
              </div>
              
              <div className="relative w-full aspect-[4/3] bg-[#FFFDF5] border-4 border-black overflow-hidden flex items-center justify-center">
                {/* Grid Overlay */}
                <div className="absolute inset-0 bg-dot-pattern opacity-[0.06]" />
                
                <svg className="w-full h-full opacity-45 absolute inset-0" viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="Venue blueprint showing zone capacity nodes">
                  <title>Venue Density Blueprint</title>
                  <ellipse cx="50" cy="50" rx="40" ry="30" fill="none" stroke="black" strokeWidth="1" />
                  <ellipse cx="50" cy="50" rx="30" ry="20" fill="none" stroke="black" strokeWidth="0.75" />
                  <line x1="50" y1="10" x2="50" y2="90" stroke="black" strokeWidth="0.5" strokeDasharray="3" />
                  <line x1="10" y1="50" x2="90" y2="50" stroke="black" strokeWidth="0.5" strokeDasharray="3" />
                </svg>

                {/* Nodes */}
                {zones.map(z => {
                  const pct = z.current_capacity / z.safe_capacity;
                  const color = z.risk_level === 'High' ? 'fill-[#FF6B6B]' : z.risk_level === 'Medium' ? 'fill-[#FFD93D]' : 'fill-[#10b981]';
                  return (
                    <motion.div
                      key={z.id}
                      className="absolute group cursor-pointer"
                      style={{ left: `${z.coordinate_x}%`, top: `${z.coordinate_y}%` }}
                      whileHover={{ scale: 1.15 }}
                      onClick={() => handleSimulate(z.id, 200)}
                    >
                      <svg width="28" height="28" viewBox="0 0 24 24" className="overflow-visible" role="img" aria-label={`Density indicator for ${z.name}: ${z.risk_level} risk`}>
                        <title>{`Density Indicator for ${z.name}`}</title>
                        {z.risk_level === 'High' && (
                          <circle cx="12" cy="12" r="16" fill="none" className="stroke-[#FF6B6B] animate-ping opacity-70" strokeWidth="2" />
                        )}
                        <circle cx="12" cy="12" r="9" className={color} stroke="black" strokeWidth="3.5" />
                      </svg>
                      {/* Tooltip */}
                      <div className="absolute left-1/2 -translate-x-1/2 bottom-8 hidden group-hover:block bg-white border-4 border-black rounded-none p-2.5 text-[10px] font-black uppercase whitespace-nowrap z-30 shadow-neo-sm">
                        <p className="text-black">{z.name}</p>
                        <p className="text-slate-500">Cap: {z.current_capacity}/{z.safe_capacity} ({Math.round(pct * 100)}%)</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Custom SVG Forecast Chart */}
            <div className="p-5 border-4 border-black bg-white shadow-neo-sm">
              <div className="flex items-center justify-between mb-4 border-b-2 border-black pb-2">
                <div>
                  <h3 className="text-xs font-black uppercase text-black">24-Hour Queue Forecast</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase">Estimated capacity metrics based on match timelines</p>
                </div>
                <span className="text-[9px] font-black uppercase bg-[#C4B5FD] border-2 border-black px-2 py-0.5 shadow-neo-sm">Predictive Index</span>
              </div>

              <div className="w-full h-32">
                <svg className="w-full h-full" viewBox="0 0 100 40" preserveAspectRatio="none" role="img" aria-label="Line chart showing 24-hour crowd density forecast">
                  <title>24-Hour Queue Forecast Chart</title>
                  {/* Grid Lines */}
                  <line x1="0" y1="10" x2="100" y2="10" stroke="black" strokeWidth="0.25" opacity="0.2" />
                  <line x1="0" y1="20" x2="100" y2="20" stroke="black" strokeWidth="0.25" opacity="0.2" />
                  <line x1="0" y1="30" x2="100" y2="30" stroke="black" strokeWidth="0.25" opacity="0.2" />
                  
                  {/* Polyline block fill */}
                  <polygon
                    points="0,40 5,35 10,32 15,30 20,25 25,18 30,12 35,8 40,11 45,15 50,14 55,9 60,6 65,10 70,18 75,26 80,32 85,34 90,36 95,38 100,40"
                    fill="#FFD93D"
                    opacity="0.3"
                  />
                  {/* Polyline stroke */}
                  <polyline
                    points="0,40 5,35 10,32 15,30 20,25 25,18 30,12 35,8 40,11 45,15 50,14 55,9 60,6 65,10 70,18 75,26 80,32 85,34 90,36 95,38 100,40"
                    fill="none"
                    stroke="black"
                    strokeWidth="1.5"
                  />
                </svg>
              </div>
              <div className="flex justify-between text-[9px] font-black uppercase text-slate-500 mt-2 px-1">
                <span>06:00</span>
                <span>12:00 (Gates Open)</span>
                <span>15:00 (Kickoff)</span>
                <span>21:00</span>
                <span>00:00</span>
              </div>
            </div>
          </div>

          {/* AI Advisor Panel (Right Column) */}
          <div className="space-y-6">
            {/* Stats Card */}
            <div className="p-5 border-4 border-black bg-[#FFD93D] shadow-neo-sm text-black">
              <div className="flex items-center gap-1.5 mb-2">
                <Activity size={16} strokeWidth={3} />
                <h3 className="text-xs font-black uppercase text-black">Overall Capacity</h3>
              </div>
              <div className="flex items-end justify-between mb-2">
                <span className="text-4xl font-black text-black">{occupancyPct}%</span>
                <span className="text-[10px] uppercase font-black text-black/60">{totalOccupancy.toLocaleString()} / {totalCapacity.toLocaleString()}</span>
              </div>
              <div className="h-4 bg-white border-4 border-black overflow-hidden mb-3">
                <div className="h-full bg-[#FF6B6B]" style={{ width: `${occupancyPct}%` }} />
              </div>
              <p className="text-[10px] font-bold leading-normal uppercase">
                AI predicts capacity limits will hold. Peak ingress matches target templates.
              </p>
            </div>

            {/* AI Advisor Card */}
            <div className="p-5 border-4 border-black bg-white shadow-neo-sm space-y-4">
              <div className="flex items-center gap-2 border-b-2 border-black pb-2">
                <Brain size={18} strokeWidth={2.5} className="text-black" />
                <h3 className="text-xs font-black uppercase text-black">AI Crowd advisor</h3>
              </div>

              {selectedZone && (
                <div className="p-3 border-2 border-black bg-[#FFFDF5] text-[10px] font-black uppercase space-y-1">
                  <p className="text-black">Zone: {selectedZone.name}</p>
                  <p className="text-slate-500">Density: {selectedZone.current_capacity} ({Math.round(selectedZone.current_capacity/selectedZone.safe_capacity*100)}%)</p>
                </div>
              )}

              <p className="text-xs font-bold text-black leading-relaxed bg-[#C4B5FD]/20 border-4 border-black p-3.5 shadow-inner">
                {aiAdvice}
              </p>

              {alternateRoutes.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase text-slate-500">Diversion Pathways</p>
                  {alternateRoutes.map((r, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs font-black uppercase text-black bg-[#FFD93D] border-4 border-black px-3 py-2 shadow-neo-sm">
                      <Shuffle size={14} strokeWidth={3} />
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Zone List */}
            <div className="p-5 border-4 border-black bg-white shadow-neo-sm space-y-3">
              <h3 className="text-xs font-black uppercase text-black">Gate Capacities</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin">
                {zones.map(z => {
                  const pct = Math.round((z.current_capacity / z.safe_capacity) * 100);
                  const color = z.risk_level === 'High' ? 'bg-[#FF6B6B] text-white' : z.risk_level === 'Medium' ? 'bg-[#FFD93D] text-black' : 'bg-white text-black';
                  return (
                    <div 
                      key={z.id} 
                      onClick={() => handleSimulate(z.id, 0)}
                      className={`flex items-center justify-between p-2.5 border-2 border-black cursor-pointer shadow-neo-sm hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all ${color}`}
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <p className="text-[10px] font-black uppercase truncate">{z.name}</p>
                      </div>
                      <span className="text-[10px] font-black">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
