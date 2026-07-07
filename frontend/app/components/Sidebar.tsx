'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Map, 
  Bot, 
  AlertOctagon, 
  Search, 
  Megaphone, 
  Bell, 
  FileText,
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface User {
  username: string;
  role: string;
  preferred_language: string;
}

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Command Center', icon: LayoutDashboard },
  { href: '/dashboard/crowd', label: 'Crowd Management', icon: Users },
  { href: '/dashboard/navigation', label: 'Indoor Navigation', icon: Map },
  { href: '/dashboard/copilot', label: 'Volunteer Copilot', icon: Bot },
  { href: '/dashboard/emergency', label: 'Emergency Center', icon: AlertOctagon },
  { href: '/dashboard/lost', label: 'Lost Person', icon: Search },
  { href: '/dashboard/announcements', label: 'Announcements', icon: Megaphone },
  { href: '/dashboard/notifications', label: 'Notifications', icon: Bell },
  { href: '/dashboard/reports', label: 'Incident Reports', icon: FileText },
];

export default function Sidebar({ unreadCount = 0 }: { unreadCount?: number }) {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const u = localStorage.getItem('airena_user');
    if (u) {
      try {
        setUser(JSON.parse(u));
      } catch {
        // Fallback
      }
    }
  }, []);

  return (
    <aside className={`flex flex-col bg-[#FFFDF5] border-r-4 border-black transition-all duration-200 ${collapsed ? 'w-20' : 'w-64'} min-h-screen shrink-0 relative z-20`}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b-4 border-black bg-[#FFD93D]">
        <div className="w-9 h-9 border-4 border-black bg-[#FF6B6B] flex items-center justify-center font-black text-lg text-white shadow-neo-sm">
          A
        </div>
        {!collapsed && (
          <div>
            <p className="font-black text-sm tracking-tight text-black">AIrena</p>
            <p className="text-[9px] uppercase tracking-wider text-black font-black">Tournament Ops</p>
          </div>
        )}
        <button 
          onClick={() => setCollapsed(p => !p)} 
          className="ml-auto w-8 h-8 border-4 border-black bg-white flex items-center justify-center font-black text-xs shadow-neo-sm active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer text-black"
        >
          {collapsed ? <ChevronRight size={14} strokeWidth={3} /> : <ChevronLeft size={14} strokeWidth={3} />}
        </button>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 p-3 space-y-2">
        {NAV_ITEMS.map(n => {
          const isActive = pathname === n.href;
          const Icon = n.icon;
          return (
            <Link 
              key={n.href} 
              href={n.href} 
              className={`flex items-center gap-3 px-3 py-2.5 transition-all text-xs font-black uppercase ${
                isActive 
                  ? 'bg-[#C4B5FD] border-4 border-black shadow-neo-sm translate-x-[-2px] translate-y-[-2px] text-black' 
                  : 'text-black border-4 border-transparent hover:border-black hover:bg-white hover:shadow-neo-sm hover:translate-x-[-2px] hover:translate-y-[-2px]'
              }`}
            >
              <Icon size={18} strokeWidth={2.5} className="shrink-0" />
              {!collapsed && <span>{n.label}</span>}
              {!collapsed && n.label === 'Notifications' && unreadCount > 0 && (
                <span className="ml-auto text-[9px] font-black bg-[#FF6B6B] text-white border-2 border-black rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                  {unreadCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Card */}
      {!collapsed && (
        <div className="p-3 border-t-4 border-black bg-white">
          <div className="flex items-center gap-2 p-2 border-4 border-black bg-[#FFD93D] shadow-neo-sm">
            <div className="w-8 h-8 border-2 border-black bg-white flex items-center justify-center text-xs font-black text-black uppercase shadow-neo-sm">
              {user?.username?.[0] || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-black text-black truncate uppercase tracking-tight">{user?.username || 'Guest User'}</p>
              <p className="text-[9px] text-black/60 font-bold truncate uppercase">{user?.role || 'Spectator'}</p>
            </div>
            <Link href="/" className="w-7 h-7 border-2 border-black bg-white hover:bg-red-400 flex items-center justify-center transition-colors shadow-neo-sm active:translate-x-[1px] active:translate-y-[1px] active:shadow-none text-black" title="Log Out">
              <LogOut size={12} strokeWidth={3} />
            </Link>
          </div>
        </div>
      )}
    </aside>
  );
}
