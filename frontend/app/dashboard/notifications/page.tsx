'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../../components/Sidebar';
import { 
  Bell, 
  Smartphone, 
  Mail, 
  Megaphone, 
  Brain, 
  Check, 
  X 
} from 'lucide-react';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  recipient_role: string;
  is_read: boolean;
  timestamp: string;
}

function TypeIcon({ type, size = 18 }: { type: string; size?: number }) {
  const props = { size, strokeWidth: 2.5, className: "text-black shrink-0" };
  if (type === 'Push') return <Bell {...props} />;
  if (type === 'SMS') return <Smartphone {...props} />;
  if (type === 'Email') return <Mail {...props} />;
  return <Megaphone {...props} />;
}

export default function NotificationsCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [newNotif, setNewNotif] = useState({ title: '', message: '', type: 'Push', recipient_role: 'All' });

  const fetchNotifications = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch {
      setNotifications([
        { id: 1, title: 'Queue Peak Alert', message: 'Gate D is exceeding 95% capacity. Diverting traffic.', type: 'Push', recipient_role: 'Organizer', is_read: false, timestamp: new Date(Date.now() - 300000).toISOString() },
        { id: 2, title: 'Emergency Dispatched', message: 'Medical Team Med-A has acknowledged incident 1 in Row F.', type: 'Push', recipient_role: 'Medical', is_read: true, timestamp: new Date(Date.now() - 600000).toISOString() },
        { id: 3, title: 'System Heartbeat Nominal', message: 'CCTV analytics node 14 reported successfully online.', type: 'SMS', recipient_role: 'Admin', is_read: true, timestamp: new Date(Date.now() - 1800000).toISOString() }
      ]);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkRead = async (id: number) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:8000/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newNotif)
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(p => [data, ...p]);
        setShowModal(false);
        setNewNotif({ title: '', message: '', type: 'Push', recipient_role: 'All' });
      }
    } catch {
      const mock: Notification = {
        id: Date.now(),
        ...newNotif,
        is_read: false,
        timestamp: new Date().toISOString()
      };
      setNotifications(p => [mock, ...p]);
      setShowModal(false);
      setNewNotif({ title: '', message: '', type: 'Push', recipient_role: 'All' });
    }
  };

  const filteredNotifs = notifications.filter(n => {
    if (filter === 'All') return true;
    if (filter === 'Unread') return !n.is_read;
    return n.type === filter;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="flex min-h-screen bg-[#FFFDF5] text-black">
      <Sidebar unreadCount={unreadCount} />

      <main className="flex-1 p-6 space-y-6 overflow-y-auto max-h-screen relative z-10">
        <div className="absolute inset-0 bg-dot-pattern pointer-events-none opacity-[0.03]" />

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b-4 border-black pb-4">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight">Notification Center</h1>
            <p className="text-xs text-slate-500 font-bold uppercase">Targeted system alert logs, SMS push dispatches, and PA alerts</p>
          </div>
          <div className="mt-4 md:mt-0 flex gap-2">
            <button 
              onClick={handleMarkAllRead}
              className="px-4 py-2 bg-white border-4 border-black text-black text-xs font-black uppercase shadow-neo-sm active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer hover:bg-slate-55 flex items-center gap-1"
            >
              <Check size={12} strokeWidth={3} />
              Mark All Read
            </button>
            <button 
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-[#FFD93D] border-4 border-black text-black text-xs font-black uppercase shadow-neo-sm active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer hover:bg-yellow-400 flex items-center gap-1"
            >
              <Megaphone size={12} strokeWidth={3} />
              Create Dispatch
            </button>
          </div>
        </div>

        {/* Grid Layout */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* List column */}
          <div className="lg:col-span-2 space-y-4">
            {/* Filter Tabs */}
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
              {['All', 'Unread', 'Push', 'SMS', 'Email', 'Public'].map(t => (
                <button
                  key={t}
                  onClick={() => setFilter(t)}
                  className={`px-4 py-1.5 rounded-none text-xs font-black uppercase border-2 border-black transition-all cursor-pointer ${
                    filter === t 
                      ? 'bg-[#FFD93D] shadow-neo-sm translate-x-[-1px] translate-y-[-1px]' 
                      : 'bg-white hover:bg-slate-50'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* List */}
            <div className="space-y-2.5 max-h-[32rem] overflow-y-auto scrollbar-thin">
              {filteredNotifs.length === 0 ? (
                <div className="text-center py-20 border-4 border-black bg-white shadow-neo-sm">
                  <Bell size={32} strokeWidth={2.5} className="mx-auto text-slate-400 mb-2" />
                  <p className="text-xs font-black uppercase text-slate-500">No alerts found matching parameters.</p>
                </div>
              ) : (
                filteredNotifs.map(n => (
                  <div 
                    key={n.id} 
                    className={`flex items-start gap-4 p-4 border-4 border-black bg-white shadow-neo-sm ${
                      !n.is_read ? 'border-[#FF6B6B]' : 'border-black'
                    }`}
                  >
                    <div className="border-2 border-black bg-slate-100 p-2 shadow-neo-sm shrink-0">
                      <TypeIcon type={n.type} size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        <h4 className="text-xs font-black uppercase text-black">{n.title}</h4>
                        <span className="text-[9px] font-black uppercase bg-slate-150 border-2 border-black px-1.5 py-0.5 shadow-neo-sm">
                          To: {n.recipient_role}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-black/60 leading-normal mb-1">{n.message}</p>
                      <span className="text-[9px] font-bold text-slate-500">
                        {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {!n.is_read && (
                      <button 
                        onClick={() => handleMarkRead(n.id)}
                        className="px-2.5 py-1 bg-[#FFD93D] border-2 border-black text-[9px] font-black uppercase shadow-neo-sm active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer flex items-center gap-1"
                      >
                        <Check size={10} strokeWidth={3} />
                        Read
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* AI Guide (Right Column) */}
          <div className="space-y-6">
            <div className="p-5 border-4 border-black bg-[#C4B5FD] shadow-neo-sm space-y-4">
              <div className="flex items-center gap-2 border-b-2 border-black pb-2">
                <Brain size={18} strokeWidth={2.5} className="text-black" />
                <h3 className="text-xs font-black uppercase text-black">AI Queue Advisory</h3>
              </div>
              <p className="text-xs font-bold text-black leading-relaxed bg-white border-4 border-black p-3.5 shadow-inner">
                The operations dispatch engine prioritizes notification queues dynamically. Broadcast schedules are coordinated with stadium sensor telemetry thresholds to ensure real-time deliverability across all active volunteer cohorts.
              </p>
            </div>

            <div className="p-4 border-4 border-black bg-white text-xs font-bold text-slate-500 uppercase leading-snug">
              📊 System status: <span className="text-green-700">ONLINE</span>. Active nodes: <span className="text-green-700">42</span>. Channels clear.
            </div>
          </div>
        </div>
      </main>

      {/* Dispatch Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-none"
            onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-white border-4 border-black p-6 shadow-neo-lg"
            >
              <div className="flex items-center justify-between mb-5 border-b-4 border-black pb-3">
                <h3 className="font-black text-sm uppercase text-black">Create System Dispatch</h3>
                <button onClick={() => setShowModal(false)} className="font-black hover:text-red-500 cursor-pointer text-black">
                  <X size={16} strokeWidth={3} />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="dispatchTitle" className="text-[10px] uppercase font-black text-slate-500 block mb-1">Alert Title</label>
                  <input 
                    id="dispatchTitle"
                    required 
                    value={newNotif.title} 
                    onChange={e => setNewNotif(p => ({ ...p, title: e.target.value }))}
                    placeholder="Title" 
                    className="w-full px-3 py-2 bg-white border-4 border-black text-xs font-bold focus:outline-none focus:bg-[#FFD93D]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="dispatchType" className="text-[10px] uppercase font-black text-slate-500 block mb-1">Dispatch Type</label>
                    <select
                      id="dispatchType"
                      value={newNotif.type}
                      onChange={e => setNewNotif(p => ({ ...p, type: e.target.value }))}
                      className="w-full px-3 py-2 bg-white border-4 border-black text-xs font-bold focus:outline-none"
                    >
                      {['Push', 'SMS', 'Email', 'Public'].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="dispatchRole" className="text-[10px] uppercase font-black text-slate-500 block mb-1">Recipient Role</label>
                    <select
                      id="dispatchRole"
                      value={newNotif.recipient_role}
                      onChange={e => setNewNotif(p => ({ ...p, recipient_role: e.target.value }))}
                      className="w-full px-3 py-2 bg-white border-4 border-black text-xs font-bold focus:outline-none"
                    >
                      {['All', 'Fan', 'Volunteer', 'Security', 'Medical', 'Organizer', 'Admin'].map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="dispatchMessage" className="text-[10px] uppercase font-black text-slate-500 block mb-1">Alert Message</label>
                  <textarea 
                    id="dispatchMessage"
                    required 
                    value={newNotif.message} 
                    onChange={e => setNewNotif(p => ({ ...p, message: e.target.value }))}
                    rows={3}
                    placeholder="Alert message content..." 
                    className="w-full px-3 py-2 bg-white border-4 border-black text-xs font-bold focus:outline-none focus:bg-[#FFD93D] resize-none"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full py-2.5 bg-[#FF6B6B] border-4 border-black text-white text-xs font-black uppercase shadow-neo-sm active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Check size={14} strokeWidth={3} />
                  Dispatch Alert
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </ AnimatePresence>
    </div>
  );
}
