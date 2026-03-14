import React from 'react';
import { 
  LayoutDashboard, 
  Trees, 
  Droplets, 
  Zap, 
  Settings2, 
  ChevronLeft, 
  ChevronRight,
  Shield,
  Sun,
  Moon,
  Bot
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from './ThemeContext';

export type ViewType = 'overview' | 'environmental' | 'water' | 'energy' | 'control' | 'asaase';

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  isExpanded: boolean;
  toggleExpanded: () => void;
  onLogout?: () => void;
}

const navItems = [
  { id: 'overview' as ViewType, label: 'Overview', icon: LayoutDashboard },
  { id: 'environmental' as ViewType, label: 'Environmental', icon: Trees },
  { id: 'water' as ViewType, label: 'Water Infra', icon: Droplets },
  { id: 'energy' as ViewType, label: 'Energy Hub', icon: Zap },
  { id: 'control' as ViewType, label: 'Control Center', icon: Settings2 },
  { id: 'asaase' as ViewType, label: 'ASAASE Robots', icon: Bot },
];

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange, isExpanded, toggleExpanded, onLogout }) => {
  const { theme, setTheme } = useTheme();

  return (
    <motion.aside 
      animate={{ width: isExpanded ? 260 : 80 }}
      className="h-screen bg-slate-100/50 dark:bg-slate-900/50 backdrop-blur-2xl border-r border-slate-200 dark:border-white/5 flex flex-col sticky top-0"
    >
      <div className="p-6 flex items-center gap-3 overflow-hidden">
        <div className="min-w-[32px] w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)]">
          <Shield className="text-white" size={20} />
        </div>
        {isExpanded && (
          <motion.span 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="font-black text-xl text-slate-800 dark:text-white tracking-tighter whitespace-nowrap"
          >
            ECOGUARD<span className="text-emerald-500">HQ</span>
          </motion.span>
        )}
      </div>

      <nav className="flex-1 px-4 py-8 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all duration-200 group relative ${
                isActive 
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon size={22} className={isActive ? 'text-emerald-400' : 'group-hover:scale-110 transition-transform'} />
              {isExpanded && (
                <motion.span 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="font-medium whitespace-nowrap"
                >
                  {item.label}
                </motion.span>
              )}
              {isActive && (
                <motion.div 
                  layoutId="active-pill"
                  className="absolute left-0 w-1 h-6 bg-emerald-500 rounded-r-full"
                />
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-200 dark:border-white/5 flex flex-col gap-2">
        <button 
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="w-full h-10 flex items-center justify-center rounded-lg bg-slate-200/50 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        {onLogout && (
          <button 
            onClick={onLogout}
            className="w-full h-10 flex items-center justify-center gap-2 rounded-lg bg-red-500/10 text-red-500 dark:text-red-400 hover:bg-red-500/20 transition-colors"
          >
            <Shield size={16} />
            {isExpanded && <span className="font-bold tracking-widest text-[10px] uppercase">Logout</span>}
          </button>
        )}
        <button 
          onClick={toggleExpanded}
          className="w-full h-10 flex items-center justify-center rounded-lg bg-slate-200/50 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          {isExpanded ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
