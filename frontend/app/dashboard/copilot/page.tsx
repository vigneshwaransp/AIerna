'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../../components/Sidebar';
import { 
  Bot, 
  Check, 
  AlertTriangle, 
  Shuffle, 
  Send, 
  Clock, 
  Users, 
  Activity 
} from 'lucide-react';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  actions?: string[];
}

export default function VolunteerCopilotPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'ai',
      text: 'Hello! I am your AIrena Operations Copilot. How can I assist you with your volunteer shift today?',
      timestamp: '09:00 AM',
      actions: ['What is my next assignment?', 'Where should I help?', 'Generate today\'s duty summary']
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim()) return;
    
    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:8000/api/volunteers/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          role: 'Volunteer',
          preferred_language: 'English'
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: data.response,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          actions: data.suggested_actions || []
        };
        setMessages(prev => [...prev, aiMsg]);
      } else {
        throw new Error();
      }
    } catch {
      setTimeout(() => {
        let txt = '';
        let acts: string[] = [];
        const msgLower = textToSend.toLowerCase();
        
        if (msgLower.includes('assignment') || msgLower.includes('help') || msgLower.includes('duty')) {
          txt = 'Your current sector assignment is Gate C Entrance. Crowd flows are stable, but ticket scan wait times are rising. Report to Sector Lead John at Gate C.';
          acts = ['Acknowledge Duty', 'Report Bottleneck', 'Request Zone Transfer'];
        } else if (msgLower.includes('incidents') || msgLower.includes('zone')) {
          txt = 'There is 1 active medical incident in your quadrant (North Stands). Emergency responder Med-A has been deployed. Standby to keep corridors clear.';
          acts = ['View Incident Details', 'Mark Corridor Clear'];
        } else {
          txt = 'I have logged your request. Let me know if you need specific guidance on shift timelines, ticketing processes, or emergency evacuation paths.';
          acts = ['Check Active Incidents', 'Emergency Broadcasts'];
        }

        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: txt,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          actions: acts
        };
        setMessages(prev => [...prev, aiMsg]);
      }, 1000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#FFFDF5] text-black">
      <Sidebar />

      <main className="flex-1 p-6 flex flex-col md:flex-row gap-6 overflow-hidden max-h-screen relative z-10">
        <div className="absolute inset-0 bg-dot-pattern pointer-events-none opacity-[0.03]" />

        {/* Chat Area */}
        <div className="flex-1 flex flex-col border-4 border-black bg-white shadow-neo-sm relative z-10">
          {/* Header */}
          <div className="p-4 border-b-4 border-black bg-[#FFD93D] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="border-2 border-black bg-white p-1.5 shadow-neo-sm text-black">
                <Bot size={20} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase text-black">AI Operations Copilot</h3>
                <p className="text-[9px] uppercase font-black text-[#10b981]">Connection Online</p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 scrollbar-thin">
            {messages.map(m => (
              <div key={m.id} className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[80%] p-3.5 border-4 border-black text-xs font-bold ${
                  m.sender === 'user'
                    ? 'bg-[#FFD93D] text-black shadow-neo-sm'
                    : 'bg-[#C4B5FD]/20 text-black shadow-neo-sm'
                }`}>
                  <p>{m.text}</p>
                </div>
                
                {/* Actions */}
                {m.sender === 'ai' && m.actions && m.actions.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2 max-w-[80%]">
                    {m.actions.map(act => (
                      <button
                        key={act}
                        onClick={() => handleSend(act)}
                        className="text-[9px] font-black uppercase text-black bg-white border-2 border-black px-2 py-1 hover:bg-[#FFD93D] shadow-neo-sm active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
                      >
                        {act}
                      </button>
                    ))}
                  </div>
                )}

                <span className="text-[8px] text-slate-500 uppercase font-black mt-1 px-1">{m.timestamp}</span>
              </div>
            ))}

            {loading && (
              <div className="flex flex-col items-start">
                <div className="bg-white border-4 border-black p-3.5 shadow-neo-sm">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 bg-black rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-black rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-black rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Questions */}
          <div className="px-4 py-2 border-t-2 border-black bg-[#FFFDF5] flex gap-1.5 overflow-x-auto no-scrollbar shrink-0">
            {['Where should I help?', 'My next assignment', 'Duty Summary', 'Incidents near me'].map(q => (
              <button
                key={q}
                onClick={() => handleSend(q)}
                className="text-[9px] font-black uppercase text-black bg-white border-2 border-black px-2.5 py-1 hover:bg-[#FFD93D] shadow-neo-sm active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all whitespace-nowrap cursor-pointer"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="p-3 border-t-4 border-black bg-white flex gap-2">
            <input
              id="copilotInput"
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSend(input); }}
              placeholder="Ask the AI Copilot..."
              aria-label="Ask the AI Copilot"
              className="flex-1 px-4 py-2.5 bg-white border-4 border-black text-xs font-bold text-black focus:outline-none focus:bg-[#FFD93D]"
            />
            <button
              onClick={() => handleSend(input)}
              className="px-4 py-2.5 bg-[#FF6B6B] border-4 border-black text-white text-xs font-black uppercase shadow-neo-sm active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Send size={12} strokeWidth={3} />
              Send
            </button>
          </div>
        </div>

        {/* Right Info Column */}
        <div className="w-full md:w-80 flex flex-col gap-6 shrink-0 overflow-y-auto scrollbar-thin relative z-10">
          {/* Active assignment card */}
          <div className="p-5 border-4 border-black bg-[#10b981] text-white shadow-neo-sm">
            <div className="flex items-center justify-between mb-3 border-b-2 border-black pb-2">
              <span className="text-[9px] font-black uppercase text-white bg-black border-2 border-black px-2 py-0.5 shadow-neo-sm">Active Assignment</span>
              <span className="text-[10px] font-black uppercase text-black">Gate C</span>
            </div>
            <h3 className="font-black text-sm uppercase text-black mb-1">Queue Control & Scanners</h3>
            <p className="text-xs font-bold text-black leading-relaxed mb-4">
              Direct incoming arrivals at entry lines. Guide VIP/Accessibility arrivals into the marked priority ramp corridor.
            </p>
            <button 
              onClick={() => handleSend('Mark Task Complete')}
              className="w-full py-2 bg-white border-4 border-black text-black text-xs font-black uppercase shadow-neo-sm active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Check size={14} strokeWidth={3} />
              Complete Assignment
            </button>
          </div>

          {/* Shift Timeline */}
          <div className="p-5 border-4 border-black bg-white shadow-neo-sm space-y-4">
            <div className="flex items-center gap-1.5 text-black">
              <Clock size={16} strokeWidth={3} />
              <h3 className="text-xs font-black uppercase tracking-wider text-black">Shift Timeline</h3>
            </div>
            <div className="space-y-3.5 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-1 before:bg-black">
              {[
                { time: '09:00 AM', label: 'Briefing Session Complete', active: true },
                { time: '09:30 AM', label: 'Assigned: Gate C Scanner Lines', active: true },
                { time: '12:00 PM', label: 'Scheduled Break (30 Mins)', active: false },
                { time: '03:00 PM', label: 'End of Shift Operations', active: false },
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-4 relative pl-6">
                  <span className={`w-4 h-4 border-2 border-black absolute left-0 top-1 flex items-center justify-center ${
                    item.active ? 'bg-[#FFD93D] shadow-neo-sm' : 'bg-white'
                  }`} />
                  <div>
                    <p className={`text-xs font-black uppercase ${item.active ? 'text-black' : 'text-slate-400'}`}>{item.label}</p>
                    <p className="text-[9px] text-slate-500 font-bold uppercase">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Zone Telemetry */}
          <div className="p-5 border-4 border-black bg-white shadow-neo-sm space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-black">Zone Telemetry</h3>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 border-2 border-black bg-[#C4B5FD]/20 shadow-neo-sm">
                <p className="text-xl font-black text-black">85%</p>
                <p className="text-[8px] font-black uppercase text-slate-500 mt-1">Capacity</p>
              </div>
              <div className="p-3 border-2 border-black bg-[#C4B5FD]/20 shadow-neo-sm">
                <p className="text-xl font-black text-blue-600">9 Mins</p>
                <p className="text-[8px] font-black uppercase text-slate-500 mt-1">Queue Time</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => handleSend('Report Bottleneck')}
                className="flex-1 py-2 bg-[#FF6B6B] border-2 border-black text-white text-[9px] font-black uppercase shadow-neo-sm active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-1"
              >
                <AlertTriangle size={10} strokeWidth={3} />
                Report Bottleneck
              </button>
              <button 
                onClick={() => handleSend('Request Zone Transfer')}
                className="flex-1 py-2 bg-white border-2 border-black text-black text-[9px] font-black uppercase shadow-neo-sm active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer hover:bg-slate-100 flex items-center justify-center gap-1"
              >
                <Shuffle size={10} strokeWidth={3} />
                Swap Sector
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
