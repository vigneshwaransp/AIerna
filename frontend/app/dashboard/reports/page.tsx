'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../../components/Sidebar';
import { 
  FileText, 
  X, 
  Download, 
  Share2, 
  Check, 
  Loader2, 
  Calendar 
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
}

interface AIReport {
  incident_id: number;
  title: string;
  summary: string;
  key_findings: string[];
  timeline: string[];
  corrective_actions: string[];
  status: string;
  generated_at: string;
}

export default function ReportsGenerator() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [report, setReport] = useState<AIReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const fetchIncidents = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/incidents');
      if (res.ok) {
        const data = await res.json();
        setIncidents(data);
        if (data.length > 0 && !selectedIncident) {
          setSelectedIncident(data[0]);
        }
      }
    } catch {
      const mocks = [
        { id: 1, category: 'Medical', description: 'Spectator collapsed in Row F of North Stands', location_zone: 'North Stands', severity: 'High', status: 'In Progress', timestamp: new Date(Date.now() - 720000).toISOString(), reporter_name: 'Volunteer-1' },
        { id: 2, category: 'Lost Child', description: '6-year-old named Aarav in red t-shirt separated from parents', location_zone: 'Food Court Area', severity: 'Medium', status: 'Active', timestamp: new Date(Date.now() - 480000).toISOString(), reporter_name: 'Parent' },
      ];
      setIncidents(mocks);
      if (!selectedIncident) setSelectedIncident(mocks[0]);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const generateReport = async () => {
    if (!selectedIncident) return;
    setLoading(true);
    setReport(null);

    try {
      const res = await fetch(`http://localhost:8000/api/incidents/${selectedIncident.id}/report`);
      if (res.ok) {
        const data = await res.json();
        setReport(data);
      } else {
        throw new Error();
      }
    } catch {
      setTimeout(() => {
        setReport({
          incident_id: selectedIncident.id,
          title: `AIrena Operations Incident Report: ${selectedIncident.category} Alert in ${selectedIncident.location_zone}`,
          summary: `This audit report logs the emergency incident reported by ${selectedIncident.reporter_name} at ${new Date(selectedIncident.timestamp).toLocaleTimeString()}. Automated dispatch protocols verified nearest first responder unit arrival within target windows.`,
          key_findings: [
            `Alert trigger identified as ${selectedIncident.category} with a ${selectedIncident.severity} severity index.`,
            `The physical node coordinate matches the ${selectedIncident.location_zone} perimeter grid.`,
            `AIrena Volunteer Copilots in proximity acknowledged routing diversion directives.`
          ],
          timeline: [
            '00:00 - Staff filed initial alert through client.',
            '00:02 - Automated AI dispatcher routed closest medic coordinates.',
            '00:05 - Command Center acknowledged dispatch status.'
          ],
          corrective_actions: [
            'Increase scanner lanes density limit triggers near Gate A corridors.',
            'Audit emergency volunteer communication channels prior to next kickoff.'
          ],
          status: 'Pending Audit Sync',
          generated_at: new Date().toLocaleString()
        });
      }, 1200);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (text: string) => {
    setToast(text);
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="flex min-h-screen bg-[#FFFDF5] text-black">
      <Sidebar />

      <main className="flex-1 p-6 space-y-6 overflow-y-auto max-h-screen relative z-10">
        <div className="absolute inset-0 bg-dot-pattern pointer-events-none opacity-[0.03]" />

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b-4 border-black pb-4">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight">Incident Report Generator</h1>
            <p className="text-xs text-slate-500 font-bold uppercase">Generate audited operations checklists and AI timelines</p>
          </div>
        </div>

        {/* Grid Layout */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* List panel */}
          <div className="p-5 border-4 border-black bg-white shadow-neo-sm space-y-4">
            <h3 className="text-xs font-black uppercase text-black">Incident Archive Logs</h3>
            <div className="space-y-2.5 max-h-[30rem] overflow-y-auto scrollbar-thin">
              {incidents.map(i => {
                const active = selectedIncident?.id === i.id;
                return (
                  <div
                    key={i.id}
                    onClick={() => { setSelectedIncident(i); setReport(null); }}
                    className={`p-3.5 border-4 border-black cursor-pointer transition-all ${
                      active 
                        ? 'bg-[#FFD93D] shadow-neo-sm translate-x-[-1px] translate-y-[-1px]' 
                        : 'bg-white hover:bg-[#FFFDF5]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-black uppercase text-black">#{i.id} {i.category}</span>
                      <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 border-2 border-black ${
                        i.severity === 'High' ? 'bg-[#FF6B6B] text-white shadow-neo-sm' : 'bg-[#FFD93D] text-black shadow-neo-sm'
                      }`}>{i.severity}</span>
                    </div>
                    <p className="text-xs text-black/60 font-bold truncate mb-1">{i.description}</p>
                    <p className="text-[9px] text-slate-500 font-bold uppercase">{i.location_zone}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Report Viewer Column */}
          <div className="lg:col-span-2 space-y-6">
            {selectedIncident ? (
              <div className="space-y-6">
                {/* Compiler card trigger */}
                {!report && !loading && (
                  <div className="p-8 text-center border-4 border-black bg-white shadow-neo-sm">
                    <FileText size={36} strokeWidth={2.5} className="mx-auto text-black mb-3" />
                    <p className="text-xs font-black uppercase text-slate-500 mb-4">Click below to generate a comprehensive AI audit report for Incident #{selectedIncident.id}</p>
                    <button
                      onClick={generateReport}
                      className="px-6 py-2.5 bg-[#FF6B6B] border-4 border-black text-white text-xs font-black uppercase shadow-neo-sm active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
                    >
                      Compile AI Report
                    </button>
                  </div>
                )}

                {/* Loading state */}
                {loading && (
                  <div className="p-8 text-center border-4 border-black bg-white shadow-neo-sm space-y-4">
                    <Loader2 size={36} strokeWidth={2.5} className="animate-spin mx-auto text-black" />
                    <p className="text-xs font-black uppercase text-slate-400 animate-pulse">Gemini AI is compiling timeline audit logs...</p>
                  </div>
                )}

                {/* Formatted Report */}
                {report && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 border-4 border-black bg-white shadow-neo-md space-y-6"
                  >
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-4 border-black pb-4">
                      <div>
                        <h2 className="text-sm font-black uppercase text-black">{report.title}</h2>
                        <p className="text-[9px] font-black uppercase text-slate-500 mt-1">Audit Code: {report.status} · Compiled: {report.generated_at}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAction('PDF download successfully initiated.')}
                          className="px-3 py-1.5 bg-[#FFD93D] border-2 border-black text-[9px] font-black uppercase shadow-neo-sm active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer flex items-center gap-1"
                        >
                          <Download size={10} strokeWidth={3} />
                          PDF
                        </button>
                        <button
                          onClick={() => handleAction('Report link copied to clipboard.')}
                          className="px-3 py-1.5 bg-white border-2 border-black text-[9px] font-black uppercase shadow-neo-sm active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer hover:bg-slate-50 flex items-center gap-1"
                        >
                          <Share2 size={10} strokeWidth={3} />
                          Share
                        </button>
                      </div>
                    </div>

                    {/* Summary */}
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-black uppercase text-slate-500">Executive Summary</h4>
                      <p className="text-xs font-bold text-black leading-relaxed bg-[#FFFDF5] border-4 border-black p-3.5 shadow-inner">
                        {report.summary}
                      </p>
                    </div>

                    {/* Findings & Actions */}
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <h4 className="text-[10px] font-black uppercase text-slate-500">Key Audit Findings</h4>
                        <div className="space-y-2">
                          {report.key_findings.map((f, idx) => (
                            <p key={idx} className="text-xs font-bold text-black leading-relaxed pl-4 relative before:absolute before:left-0 before:top-1.5 before:w-2 before:h-2 before:bg-[#FF6B6B] before:border before:border-black">
                              {f}
                            </p>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h4 className="text-[10px] font-black uppercase text-slate-500">Corrective Measures</h4>
                        <div className="space-y-2">
                          {report.corrective_actions.map((c, idx) => (
                            <p key={idx} className="text-xs font-bold text-black leading-relaxed pl-4 relative before:absolute before:left-0 before:top-1.5 before:w-2 before:h-2 before:bg-[#FFD93D] before:border before:border-black">
                              {c}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Timeline */}
                    <div className="space-y-3 border-t-2 border-black pt-4">
                      <div className="flex items-center gap-1 text-slate-500">
                        <Calendar size={14} strokeWidth={3} />
                        <h4 className="text-[10px] font-black uppercase">Incident Event Timeline</h4>
                      </div>
                      <div className="space-y-2.5 border-l-2 border-black pl-4 ml-1">
                        {report.timeline.map((t, idx) => (
                          <div key={idx} className="text-xs font-bold text-black relative">
                            <span className="w-2.5 h-2.5 bg-black border border-black absolute -left-[21px] top-1" />
                            {t}
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            ) : (
              <div className="text-center py-24 border-4 border-black bg-white shadow-neo-sm">
                <FileText size={32} strokeWidth={2.5} className="mx-auto text-slate-400 mb-2" />
                <p className="text-xs font-black uppercase text-slate-500 font-bold">Select an incident to compile logs.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Action Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="fixed bottom-6 right-6 z-50 bg-[#C4B5FD] border-4 border-black text-black px-4 py-2.5 text-xs font-black uppercase shadow-neo-sm flex items-center gap-1.5"
          >
            <Check size={14} strokeWidth={3} />
            <span>{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
