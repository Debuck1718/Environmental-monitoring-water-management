import React from 'react';
import { 
  LayoutDashboard, 
  Trees, 
  Droplets, 
  Zap, 
  Settings2, 
  ChevronLeft, 
  ChevronRight,
  Shield
} from 'lucide-react';
import { motion } from 'framer-motion';

export type ViewType = 'overview' | 'environmental' | 'water' | 'energy' | 'control';

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  isExpanded: boolean;
  toggleExpanded: () => void;
}

const navItems = [
  { id: 'overview' as ViewType, label: 'Overview', icon: LayoutDashboard },
  { id: 'environmental' as ViewType, label: 'Environmental', icon: Trees },
  { id: 'water' as ViewType, label: 'Water Infra', icon: Droplets },
  { id: 'energy' as ViewType, label: 'Energy Hub', icon: Zap },
  { id: 'control' as ViewType, label: 'Control Center', icon: Settings2 },
];

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange, isExpanded, toggleExpanded }) => {
  return (
    <motion.aside 
      animate={{ width: isExpanded ? 260 : 80 }}
      className="h-screen bg-slate-900/50 backdrop-blur-2xl border-r border-white/5 flex flex-col sticky top-0"
    >
      <div className="p-6 flex items-center gap-3 overflow-hidden">
        <div className="min-w-[32px] w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)]">
          <Shield className="text-white" size={20} />
        </div>
        {isExpanded && (
          <motion.span 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="font-black text-xl text-white tracking-tighter whitespace-nowrap"
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
                  ? 'bg-emerald-500/10 text-emerald-400' 
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
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

      <div className="p-4 border-t border-white/5">
        <button 
          onClick={toggleExpanded}
          className="w-full h-10 flex items-center justify-center rounded-lg bg-white/5 text-slate-400 hover:text-white transition-colors"
        >
          {isExpanded ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
