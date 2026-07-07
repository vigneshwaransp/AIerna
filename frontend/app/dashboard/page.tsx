'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Sidebar from '../components/Sidebar';
import { 
  Users, 
  AlertOctagon, 
  Activity, 
  Bell, 
  Flame, 
  Shield, 
  Search, 
  AlertTriangle,
  Brain,
  Check,
  MapPin,
  Map,
  Zap,
  Info
} from 'lucide-react';

const API = 'http://localhost:8000';
const WS_URL = 'ws://localhost:8000/ws/telemetry';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Zone { id: number; name: string; safe_capacity: number; current_capacity: number; risk_level: string; coordinate_x: number; coordinate_y: number; }
interface Incident { id: number; category: string; description: string; location_zone: string; severity: string; status: string; timestamp: string; reporter_name: string; assigned_responder?: string; ai_summary?: string; recommended_actions?: string; nearest_resources?: any[]; safe_routes?: any[]; }
interface Notification { id: number; title: string; message: string; type: string; recipient_role: string; is_read: boolean; timestamp: string; }

// ─── Utility ─────────────────────────────────────────────────────────────────
const severityBadgeColor = (s: string) => s === 'High' ? 'bg-[#FF6B6B] text-white border-2 border-black' : s === 'Medium' ? 'bg-[#FFD93D] text-black border-2 border-black' : 'bg-[#10b981] text-white border-2 border-black';

function CatIcon({ category, size = 18 }: { category: string; size?: number }) {
  const props = { size, strokeWidth: 2.5, className: "text-black shrink-0" };
  if (category === 'Medical') return <Activity {...props} />;
  if (category === 'Fire') return <Flame {...props} />;
  if (category === 'Security') return <Shield {...props} />;
  if (category === 'Lost Child') return <Search {...props} />;
  if (category === 'Evacuation') return <AlertOctagon {...props} />;
  return <AlertTriangle {...props} />;
}

// ─── Zone Heatmap Card ────────────────────────────────────────────────────────
function ZoneCard({ zone, onSimulate }: { zone: Zone; onSimulate: (id: number, val: number) => void }) {
  const pct = Math.min(100, Math.round((zone.current_capacity / zone.safe_capacity) * 100));
  const barColor = zone.risk_level === 'High' ? 'bg-[#FF6B6B]' : zone.risk_level === 'Medium' ? 'bg-[#FFD93D]' : 'bg-[#10b981]';

  return (
    <motion.div
      layout
      className={`p-4 border-4 border-black bg-white shadow-neo-sm hover:shadow-neo-md hover:-translate-y-0.5 transition-all`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0 pr-2">
          <p className="font-black text-black text-xs uppercase truncate leading-tight">{zone.name}</p>
          <span className={`inline-block text-[9px] font-black uppercase mt-1 px-1.5 py-0.5 border-2 border-black ${
            zone.risk_level === 'High' ? 'bg-[#FF6B6B] text-white shadow-neo-sm' : zone.risk_level === 'Medium' ? 'bg-[#FFD93D] text-black shadow-neo-sm' : 'bg-[#10b981] text-white shadow-neo-sm'
          }`}>{zone.risk_level} Risk · {pct}%</span>
        </div>
        <span className="text-[10px] font-black px-2 py-1 bg-white border-4 border-black shadow-neo-sm text-black">
          {zone.current_capacity}/{zone.safe_capacity}
        </span>
      </div>
      <div className="h-4 bg-white border-4 border-black overflow-hidden mb-3">
        <motion.div
          className={`h-full ${barColor}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onSimulate(zone.id, Math.min(zone.safe_capacity, zone.current_capacity + 200))}
          className="flex-1 py-1 bg-white border-2 border-black font-black text-[10px] shadow-neo-sm active:translate-x-[1px] active:translate-y-[1px] active:shadow-none hover:bg-[#FFD93D] transition-colors cursor-pointer"
        >+200</button>
        <button
          onClick={() => onSimulate(zone.id, Math.max(0, zone.current_capacity - 200))}
          className="flex-1 py-1 bg-white border-2 border-black font-black text-[10px] shadow-neo-sm active:translate-x-[1px] active:translate-y-[1px] active:shadow-none hover:bg-[#FFD93D] transition-colors cursor-pointer"
        >-200</button>
      </div>
    </motion.div>
  );
}

// ─── Incident Card ────────────────────────────────────────────────────────────
function IncidentCard({ incident, onClick }: { incident: Incident; onClick: () => void }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className="flex items-start gap-3 p-4 border-4 border-black bg-white hover:bg-[#FFFDF5] hover:shadow-neo-sm hover:translate-x-[-1px] hover:translate-y-[-1px] cursor-pointer transition-all"
    >
      <div className="border-2 border-black bg-[#C4B5FD] p-2 shadow-neo-sm shrink-0">
        <CatIcon category={incident.category} size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-black uppercase text-black">#{incident.id} {incident.category}</span>
          <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full ${severityBadgeColor(incident.severity)}`}>{incident.severity}</span>
          <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 border-2 border-black ${
            incident.status === 'Active' ? 'bg-[#FF6B6B] text-white' : incident.status === 'In Progress' ? 'bg-[#FFD93D]' : 'bg-[#10b981] text-white'
          }`}>{incident.status}</span>
        </div>
        <p className="text-xs text-black/60 font-bold mt-1 truncate">{incident.description}</p>
        <p className="text-[9px] text-slate-500 font-bold uppercase mt-1.5">{incident.location_zone} · {new Date(incident.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
      </div>
    </motion.div>
  );
}

// ─── Incident Detail Panel ────────────────────────────────────────────────────
function IncidentDetail({ incident, onClose, onUpdateStatus }: { incident: Incident; onClose: () => void; onUpdateStatus: (id: number, status: string) => void }) {
  return (
    <motion.div
      initial={{ x: 50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 50, opacity: 0 }}
      className="fixed right-0 top-0 h-full w-full max-w-md bg-white border-l-8 border-black z-40 overflow-y-auto p-6 shadow-neo-xl"
    >
      <div className="flex items-center justify-between mb-6 border-b-4 border-black pb-4">
        <div className="flex items-center gap-3">
          <div className="border-4 border-black bg-[#C4B5FD] p-2 shadow-neo-sm shrink-0">
            <CatIcon category={incident.category} size={24} />
          </div>
          <div>
            <p className="font-black text-sm uppercase text-black">Incident Detail #{incident.id}</p>
            <p className="text-[10px] text-slate-500 uppercase font-black">{incident.category} · {incident.severity} Severity</p>
          </div>
        </div>
        <button onClick={onClose} className="w-8 h-8 border-4 border-black bg-white flex items-center justify-center font-black text-sm hover:bg-red-400 shadow-neo-sm active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer">✕</button>
      </div>

      <div className="space-y-4">
        <div className="p-4 border-4 border-black bg-[#FFFDF5]">
          <p className="text-[10px] uppercase font-black text-slate-500 mb-1">Details & Location</p>
          <p className="text-xs font-bold text-black">{incident.description}</p>
          <p className="text-[9px] uppercase font-black text-slate-400 mt-2">Zone: {incident.location_zone}</p>
        </div>

        {incident.ai_summary && (
          <div className="p-4 border-4 border-black bg-[#C4B5FD]/30 shadow-neo-sm">
            <div className="flex items-center gap-2 mb-2">
              <Brain size={18} strokeWidth={2.5} className="text-indigo-800" />
              <p className="text-xs font-black uppercase text-indigo-700">AI Safety Analysis</p>
            </div>
            <p className="text-xs font-bold text-black leading-relaxed">{incident.ai_summary}</p>
          </div>
        )}

        {incident.recommended_actions && (
          <div className="p-4 border-4 border-black bg-white shadow-neo-sm">
            <div className="flex items-center gap-2 mb-2">
              <Check size={18} strokeWidth={3} className="text-black" />
              <p className="text-xs font-black uppercase text-black">AI Response Protocol</p>
            </div>
            <pre className="text-xs text-black font-bold whitespace-pre-wrap font-sans leading-relaxed">{incident.recommended_actions}</pre>
          </div>
        )}

        {incident.nearest_resources && incident.nearest_resources.length > 0 && (
          <div className="p-4 border-4 border-black bg-white shadow-neo-sm">
            <div className="flex items-center gap-2 mb-2">
              <MapPin size={18} strokeWidth={2.5} className="text-black" />
              <p className="text-xs font-black uppercase text-black">Nearest Dispatch Coordinates</p>
            </div>
            {incident.nearest_resources.map((r: any, i: number) => (
              <div key={i} className="flex items-center justify-between py-2 border-b-2 border-black last:border-0">
                <div>
                  <p className="text-xs font-black text-black">{r.name}</p>
                  <p className="text-[9px] uppercase text-slate-500 font-bold">{r.type}</p>
                </div>
                <span className="text-xs text-green-600 font-black uppercase bg-green-100 border-2 border-black px-2 py-0.5 shadow-neo-sm">{r.eta}</span>
              </div>
            ))}
          </div>
        )}

        {incident.safe_routes && incident.safe_routes.length > 0 && (
          <div className="p-4 border-4 border-black bg-white shadow-neo-sm">
            <div className="flex items-center gap-2 mb-2">
              <Map size={18} strokeWidth={2.5} className="text-black" />
              <p className="text-xs font-black uppercase text-black">Evacuation Corridor</p>
            </div>
            {incident.safe_routes.map((r: any, i: number) => (
              <div key={i} className="text-xs text-black font-bold py-1">
                <span className="text-slate-500 font-black uppercase block">{r.from} → {r.to}</span>
                <p className="text-slate-700 mt-1">{r.path}</p>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2 border-t-4 border-black pt-4">
          {incident.status !== 'In Progress' && (
            <button onClick={() => onUpdateStatus(incident.id, 'In Progress')} className="flex-1 py-2 text-xs font-black bg-[#FFD93D] border-4 border-black shadow-neo-sm active:translate-x-[2px] active:translate-y-[2px] active:shadow-none hover:bg-yellow-400 uppercase transition-all cursor-pointer">
              Deploy Responder
            </button>
          )}
          {incident.status !== 'Resolved' && (
            <button onClick={() => onUpdateStatus(incident.id, 'Resolved')} className="flex-1 py-2 text-xs font-black bg-[#10b981] border-4 border-black text-white shadow-neo-sm active:translate-x-[2px] active:translate-y-[2px] active:shadow-none hover:bg-green-600 uppercase transition-all cursor-pointer">
              Mark Resolved
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── AI Insights Panel ────────────────────────────────────────────────────────
function AIInsightsPanel({ zones, incidents }: { zones: Zone[]; incidents: Incident[] }) {
  const criticalZones = zones.filter(z => z.risk_level === 'High');
  const activeIncidents = incidents.filter(i => i.status === 'Active');
  const totalOccupancy = zones.reduce((a, z) => a + z.current_capacity, 0);
  const totalCapacity = zones.reduce((a, z) => a + z.safe_capacity, 0);
  const overallPct = totalCapacity ? Math.round((totalOccupancy / totalCapacity) * 100) : 0;

  return (
    <div className="p-5 border-4 border-black bg-[#C4B5FD] shadow-neo-md space-y-4 text-black">
      <div className="flex items-center gap-2 border-b-4 border-black pb-3">
        <Brain size={22} strokeWidth={2.5} />
        <p className="font-black text-sm uppercase text-black">AI Operations Advisory</p>
        <span className="ml-auto text-[9px] font-black text-white bg-black border-2 border-black px-2 py-0.5 uppercase">Live</span>
      </div>
      <div className="space-y-3 text-xs font-bold text-black">
        <div className="p-3 border-4 border-black bg-white shadow-neo-sm">
          <p className="font-black uppercase text-[10px] text-slate-500 mb-1">Total Venue Utilization</p>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 h-4 bg-white border-2 border-black overflow-hidden">
              <div className={`h-full ${overallPct > 85 ? 'bg-[#FF6B6B]' : 'bg-[#FFD93D]'}`} style={{ width: `${overallPct}%` }} />
            </div>
            <span className="font-black text-xs">{overallPct}%</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1 uppercase font-black">{totalOccupancy.toLocaleString()} / {totalCapacity.toLocaleString()} attendees</p>
        </div>

        {criticalZones.length > 0 && (
          <div className="p-3 border-4 border-black bg-[#FF6B6B] text-white shadow-neo-sm">
            <div className="flex items-center gap-1 mb-1">
              <AlertTriangle size={14} strokeWidth={3} />
              <p className="font-black text-xs uppercase">Congestion Warning ({criticalZones.length})</p>
            </div>
            {criticalZones.map(z => (
              <p key={z.id} className="text-[10px]">• {z.name}: {Math.round((z.current_capacity / z.safe_capacity) * 100)}% capacity</p>
            ))}
            <p className="text-[10px] font-bold mt-2 uppercase border-t-2 border-black pt-2">AI Recommendation: Open backup exit corridors. Direct volunteers to divert flow.</p>
          </div>
        )}

        {activeIncidents.length > 0 && (
          <div className="p-3 border-4 border-black bg-[#FFD93D] text-black shadow-neo-sm">
            <div className="flex items-center gap-1 mb-1">
              <AlertTriangle size={14} strokeWidth={3} />
              <p className="font-black text-xs uppercase">Active Alerts ({activeIncidents.length})</p>
            </div>
            {activeIncidents.map(i => (
              <p key={i.id} className="text-[10px]">• {i.category} reported in {i.location_zone}</p>
            ))}
          </div>
        )}

        {criticalZones.length === 0 && activeIncidents.length === 0 && (
          <div className="p-3 border-4 border-black bg-white shadow-neo-sm">
            <p className="font-black text-xs text-green-700 uppercase">✓ All Systems Secure</p>
            <p className="text-[10px] text-slate-600 mt-1 font-bold">Venue operations stable. Grid density index is well balanced.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Dashboard Page ──────────────────────────────────────────────────────
export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [zones, setZones] = useState<Zone[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [liveAlert, setLiveAlert] = useState<string | null>(null);
  const [newIncident, setNewIncident] = useState({ category: 'Medical', description: '', location_zone: '', severity: 'Medium', reporter_name: '' });
  const [showNewIncident, setShowNewIncident] = useState(false);
  const [loading, setLoading] = useState(true);
  const [wsStatus, setWsStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');

  // Load user from localStorage
  useEffect(() => {
    const u = localStorage.getItem('airena_user');
    if (u) setUser(JSON.parse(u));
  }, []);

  // Fetch data
  const fetchAll = useCallback(async () => {
    try {
      const [z, i, n] = await Promise.all([
        fetch(`${API}/api/zones`).then(r => r.ok ? r.json() : []),
        fetch(`${API}/api/incidents`).then(r => r.ok ? r.json() : []),
        fetch(`${API}/api/notifications`).then(r => r.ok ? r.json() : []),
      ]);
      setZones(z);
      setIncidents(i);
      setNotifications(n);
    } catch {
      setZones([
        { id: 1, name: 'Gate A (North Entrance)', safe_capacity: 2000, current_capacity: 1850, risk_level: 'Medium', coordinate_x: 20, coordinate_y: 15 },
        { id: 2, name: 'Gate B (East Entrance)', safe_capacity: 1500, current_capacity: 600, risk_level: 'Low', coordinate_x: 85, coordinate_y: 40 },
        { id: 3, name: 'Gate C (South Entrance)', safe_capacity: 2500, current_capacity: 800, risk_level: 'Low', coordinate_x: 50, coordinate_y: 90 },
        { id: 4, name: 'Gate D (West Entrance)', safe_capacity: 1200, current_capacity: 1180, risk_level: 'High', coordinate_x: 15, coordinate_y: 60 },
        { id: 5, name: 'Main Concourse', safe_capacity: 5000, current_capacity: 3400, risk_level: 'Low', coordinate_x: 50, coordinate_y: 50 },
        { id: 6, name: 'Food Court Area', safe_capacity: 1000, current_capacity: 950, risk_level: 'Medium', coordinate_x: 65, coordinate_y: 65 },
      ]);
      setIncidents([
        { id: 1, category: 'Medical', description: 'Spectator collapsed in Row F of North Stands', location_zone: 'North Stands', severity: 'High', status: 'In Progress', timestamp: new Date(Date.now() - 720000).toISOString(), reporter_name: 'Volunteer-1', ai_summary: 'Cardiac warning alert in North Stands. Emergency access protocol engaged.', recommended_actions: '1. Med-A dispatched to North Stands Row F.\n2. Keep seating rows clear.\n3. Prepare medical transport via lift to Gate E.', nearest_resources: [{ name: 'Med-A', type: 'Medical Unit', eta: '2 mins' }], safe_routes: [{ from: 'North Stands', to: 'Gate E', path: 'Take lift down to level 0, follow Corridor 3.' }] },
        { id: 2, category: 'Lost Child', description: '6-year-old named Aarav in red t-shirt separated from parents', location_zone: 'Food Court Area', severity: 'Medium', status: 'Active', timestamp: new Date(Date.now() - 480000).toISOString(), reporter_name: 'Parent', ai_summary: 'Missing child Aarav (6yo, red t-shirt) reported in Food Court quadrant.', recommended_actions: '1. Notify all gate security.\n2. Deploy volunteer patrol.\n3. CCTV sweep of Food Court exits.', nearest_resources: [{ name: 'Sec-Team 3', type: 'Security Patrol', eta: '1 min' }], safe_routes: [] },
      ]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); const t = setInterval(fetchAll, 10000); return () => clearInterval(t); }, [fetchAll]);

  // WebSocket
  useEffect(() => {
    let ws: WebSocket;
    let reconnectTimer: ReturnType<typeof setTimeout>;

    const connect = () => {
      try {
        setWsStatus('connecting');
        ws = new WebSocket(WS_URL);
        ws.onopen = () => setWsStatus('connected');
        ws.onclose = () => { setWsStatus('disconnected'); reconnectTimer = setTimeout(connect, 5000); };
        ws.onerror = () => ws.close();
        ws.onmessage = (e) => {
          try {
            const data = JSON.parse(e.data);
            if (data.type === 'CROWD_UPDATE') {
              setZones(prev => prev.map(z => z.id === data.zone_id ? { ...z, current_capacity: data.current_capacity, risk_level: data.risk_level } : z));
              if (data.risk_level === 'High') setLiveAlert(data.ai_alert || `${data.zone_name} has reached critical capacity!`);
            } else if (data.type === 'NEW_INCIDENT') {
              setIncidents(prev => [data.incident, ...prev]);
              setLiveAlert(`New Incident: ${data.incident.category} in ${data.incident.location_zone}`);
            } else if (data.type === 'NEW_ANNOUNCEMENT') {
              setLiveAlert(`📢 ${data.announcement.message.substring(0, 80)}...`);
            }
          } catch {}
        };
      } catch { setWsStatus('disconnected'); }
    };

    connect();
    return () => { clearTimeout(reconnectTimer); ws?.close(); };
  }, []);

  // Auto-dismiss alert
  useEffect(() => {
    if (liveAlert) { const t = setTimeout(() => setLiveAlert(null), 6000); return () => clearTimeout(t); }
  }, [liveAlert]);

  const handleSimulate = async (zoneId: number, val: number) => {
    try {
      await fetch(`${API}/api/zones/${zoneId}/simulate?current_capacity=${val}`, { method: 'POST' });
    } catch {}
    setZones(prev => prev.map(z => {
      if (z.id !== zoneId) return z;
      const ratio = val / z.safe_capacity;
      return { ...z, current_capacity: val, risk_level: ratio >= 1 ? 'High' : ratio >= 0.8 ? 'Medium' : 'Low' };
    }));
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      await fetch(`${API}/api/incidents/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    } catch {}
    setIncidents(prev => prev.map(i => i.id === id ? { ...i, status } : i));
    if (selectedIncident?.id === id) setSelectedIncident(prev => prev ? { ...prev, status } : null);
  };

  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API}/api/incidents`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newIncident) });
      const data = await res.json();
      setIncidents(prev => [data, ...prev]);
    } catch {
      const mock: Incident = { id: Date.now(), ...newIncident, status: 'Active', timestamp: new Date().toISOString(), ai_summary: `AI is analyzing this ${newIncident.category} incident...` };
      setIncidents(prev => [mock, ...prev]);
    }
    setShowNewIncident(false);
    setNewIncident({ category: 'Medical', description: '', location_zone: '', severity: 'Medium', reporter_name: '' });
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const activeIncidentCount = incidents.filter(i => i.status === 'Active').length;
  const highRiskZones = zones.filter(z => z.risk_level === 'High').length;

  return (
    <div className="flex min-h-screen bg-[#FFFDF5] text-black">
      <Sidebar unreadCount={unreadCount} />

      <div className="flex-1 overflow-auto max-h-screen">
        {/* Top Bar */}
        <header className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-white border-b-4 border-black">
          <div>
            <h1 className="text-xl font-black uppercase tracking-tight">Command Center</h1>
            <p className="text-xs text-slate-500 font-bold uppercase">Real-time venue telemetry & live AI coordinating advisor</p>
          </div>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 text-xs font-black uppercase px-3 py-1.5 border-4 border-black shadow-neo-sm ${wsStatus === 'connected' ? 'bg-[#FFD93D]' : 'bg-[#FF6B6B] text-white'}`}>
              <span className={`w-2.5 h-2.5 rounded-full border-2 border-black ${wsStatus === 'connected' ? 'bg-[#10b981] animate-pulse' : 'bg-red-400'}`} />
              {wsStatus === 'connected' ? 'Live Data Feed' : 'Local Sandbox Mode'}
            </div>
            <button onClick={() => setShowNewIncident(true)} className="px-4 py-2 bg-[#FF6B6B] border-4 border-black text-xs font-black uppercase shadow-neo-sm active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer">
              🚨 File Alert
            </button>
          </div>
        </header>

        {/* Live Alert Banner */}
        <AnimatePresence>
          {liveAlert && (
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="mx-6 mt-4 p-4 border-4 border-black bg-[#FFD93D] shadow-neo-sm flex items-center gap-3 text-xs"
            >
              <Zap size={16} strokeWidth={3} className="text-black shrink-0" />
              <p className="text-black font-black uppercase flex-1">{liveAlert}</p>
              <button onClick={() => setLiveAlert(null)} className="font-black cursor-pointer">✕</button>
            </motion.div>
          )}
        </AnimatePresence>

        <main className="p-6 space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Occupancy', value: zones.reduce((a, z) => a + z.current_capacity, 0).toLocaleString(), icon: Users, color: 'bg-white', sub: 'Active attendees' },
              { label: 'Open Incidents', value: activeIncidentCount, icon: AlertOctagon, color: 'bg-[#FF6B6B]', sub: 'Requires dispatch' },
              { label: 'Critical Zones', value: highRiskZones, icon: AlertTriangle, color: 'bg-[#FFD93D]', sub: 'Over-capacity' },
              { label: 'Notifications', value: unreadCount, icon: Bell, color: 'bg-[#C4B5FD]', sub: 'System alerts' },
            ].map((kpi, i) => {
              const IconComponent = kpi.icon;
              return (
                <motion.div
                  key={kpi.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`p-5 border-4 border-black ${kpi.color} shadow-neo-sm`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="border-4 border-black bg-white p-1.5 shadow-neo-sm text-black">
                      <IconComponent size={24} strokeWidth={2.5} />
                    </div>
                    <span className="text-3xl font-black text-black">{kpi.value}</span>
                  </div>
                  <p className="text-xs font-black uppercase text-black">{kpi.label}</p>
                  <p className="text-[9px] text-black/50 font-bold uppercase mt-0.5">{kpi.sub}</p>
                </motion.div>
              );
            })}
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Zones Panel */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between border-b-4 border-black pb-2">
                <h2 className="font-black text-sm uppercase text-black">Zone Gate monitors</h2>
                <Link href="/dashboard/crowd" className="text-xs font-black uppercase text-blue-600 hover:underline">View Heatmap →</Link>
              </div>
              {loading ? (
                <div className="grid sm:grid-cols-2 gap-3">
                  {[1,2,3,4].map(i => <div key={i} className="h-28 border-4 border-black bg-white animate-pulse" />)}
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-3">
                  {zones.map(z => <ZoneCard key={z.id} zone={z} onSimulate={handleSimulate} />)}
                </div>
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <AIInsightsPanel zones={zones} incidents={incidents} />
            </div>
          </div>

          {/* Incidents Timeline */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b-4 border-black pb-2">
              <h2 className="font-black text-sm uppercase text-black">Active Operations Log</h2>
              <Link href="/dashboard/reports" className="text-xs font-black uppercase text-blue-600 hover:underline">All Reports →</Link>
            </div>
            <div className="space-y-2.5">
              {incidents.length === 0 ? (
                <div className="text-center py-10 border-4 border-black bg-white shadow-neo-sm">
                  <p className="text-3xl mb-2">✓</p>
                  <p className="text-xs font-black uppercase">No active operations</p>
                </div>
              ) : (
                incidents.slice(0, 5).map(inc => (
                  <IncidentCard key={inc.id} incident={inc} onClick={() => setSelectedIncident(inc)} />
                ))
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Incident Detail Slide-in */}
      <AnimatePresence>
        {selectedIncident && (
          <IncidentDetail
            incident={selectedIncident}
            onClose={() => setSelectedIncident(null)}
            onUpdateStatus={handleUpdateStatus}
          />
        )}
      </AnimatePresence>

      {/* New Incident Modal */}
      <AnimatePresence>
        {showNewIncident && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-none"
            onClick={e => { if (e.target === e.currentTarget) setShowNewIncident(false); }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-white border-4 border-black p-6 shadow-neo-lg"
            >
              <div className="flex items-center justify-between mb-5 border-b-4 border-black pb-3">
                <h3 className="font-black text-sm uppercase text-black">File Rapid Alert</h3>
                <button onClick={() => setShowNewIncident(false)} className="font-black hover:text-red-500 cursor-pointer">✕</button>
              </div>
              <form onSubmit={handleCreateIncident} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="incCategory" className="text-[10px] uppercase font-black text-slate-500 mb-1 block">Category</label>
                    <select id="incCategory" value={newIncident.category} onChange={e => setNewIncident(p => ({ ...p, category: e.target.value }))} className="w-full px-3 py-2 bg-white border-4 border-black text-xs font-bold focus:outline-none">
                      {['Medical', 'Fire', 'Security', 'Lost Child', 'Evacuation', 'Info'].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="incSeverity" className="text-[10px] uppercase font-black text-slate-500 mb-1 block">Severity</label>
                    <select id="incSeverity" value={newIncident.severity} onChange={e => setNewIncident(p => ({ ...p, severity: e.target.value }))} className="w-full px-3 py-2 bg-white border-4 border-black text-xs font-bold focus:outline-none">
                      {['Low', 'Medium', 'High'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label htmlFor="incLocation" className="text-[10px] uppercase font-black text-slate-500 mb-1 block">Location Zone</label>
                  <input id="incLocation" required value={newIncident.location_zone} onChange={e => setNewIncident(p => ({ ...p, location_zone: e.target.value }))} placeholder="e.g. North Stands" className="w-full px-3 py-2 bg-white border-4 border-black text-xs font-bold focus:outline-none" />
                </div>
                <div>
                  <label htmlFor="incDesc" className="text-[10px] uppercase font-black text-slate-500 mb-1 block">Description</label>
                  <textarea id="incDesc" required value={newIncident.description} onChange={e => setNewIncident(p => ({ ...p, description: e.target.value }))} rows={3} placeholder="Describe threat parameters..." className="w-full px-3 py-2 bg-white border-4 border-black text-xs font-bold focus:outline-none resize-none" />
                </div>
                <div>
                  <label htmlFor="incReporter" className="text-[10px] uppercase font-black text-slate-500 mb-1 block">Reporter Code</label>
                  <input id="incReporter" required value={newIncident.reporter_name} onChange={e => setNewIncident(p => ({ ...p, reporter_name: e.target.value }))} placeholder="e.g. Staff-04" className="w-full px-3 py-2 bg-white border-4 border-black text-xs font-bold focus:outline-none" />
                </div>
                <button type="submit" className="w-full py-2.5 bg-[#FF6B6B] border-4 border-black text-xs font-black uppercase text-white shadow-neo-sm active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer">
                  🚨 Broadcast Alert — AI Triggered
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
