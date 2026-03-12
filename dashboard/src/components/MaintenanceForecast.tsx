import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, AlertCircle, ShieldCheck } from 'lucide-react';
import type { FiltrationStatus } from '../api';

interface MaintenanceForecastProps {
    data: FiltrationStatus | null;
}

const MaintenanceForecast: React.FC<MaintenanceForecastProps> = ({ data }) => {
    if (!data) return null;

    const clog = data.telemetry.bottle_clog_pct;
    const net = data.telemetry.net_load_pct;
    
    // Simple predictive logic for demonstration
    // Assume 100% capacity is the limit
    const remainingClogCap = 100 - clog;
    const remainingNetCap = 100 - net;
    
    // Estimated hours (simulated)
    // If clog is high, hours are low
    const estHoursClog = Math.max(0, Math.floor((remainingClogCap / 10) * 12));
    const estHoursNet = Math.max(0, Math.floor((remainingNetCap / 10) * 8));
    
    const minHours = Math.min(estHoursClog, estHoursNet);
    const urgency = minHours < 24 ? 'CRITICAL' : minHours < 72 ? 'WARNING' : 'STABLE';

    return (
        <div className="glass-card p-6 border-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 blur-3xl" />
            
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <Calendar className="text-emerald-400" size={18} />
                Maintenance Forecast
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${urgency === 'STABLE' ? 'bg-emerald-500/10 text-emerald-400' : urgency === 'WARNING' ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-500'}`}>
                            <Clock size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest leading-none mb-1">Estimated Window</p>
                            <p className="text-xl font-black text-white">{minHours} Hours</p>
                        </div>
                    </div>
                    
                    <div className="p-4 bg-white/2 rounded-2xl border border-white/5">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] text-slate-500 font-bold uppercase">Confidence Score</span>
                            <span className="text-[10px] text-emerald-400 font-bold">94%</span>
                        </div>
                        <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                            <motion.div 
                                className="h-full bg-emerald-500"
                                initial={{ width: 0 }}
                                animate={{ width: '94%' }}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex flex-col justify-center">
                    <div className={`flex items-center gap-2 mb-2 ${urgency === 'STABLE' ? 'text-emerald-400' : urgency === 'WARNING' ? 'text-amber-400' : 'text-red-400'}`}>
                        {urgency === 'STABLE' ? <ShieldCheck size={14} /> : <AlertCircle size={14} />}
                        <span className="text-xs font-bold uppercase tracking-widest">{urgency} STATUS</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                        {urgency === 'STABLE' 
                            ? 'System performance is optimal. No immediate maintenance required within the next 72 hours.' 
                            : urgency === 'WARNING'
                            ? 'Minor performance degradation detected. Schedule a backwash cycle within the next 48 hours.'
                            : 'Critical clogging threshold approaching. Manual override recommended immediately.'}
                    </p>
                </div>
            </div>

            <div className="mt-6 pt-6 border-t border-white/5">
                <div className="flex gap-2">
                    <button className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-[10px] font-bold text-white transition-all border border-white/5 uppercase tracking-widest">
                        Schedule Service
                    </button>
                    <button className="flex-1 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-[10px] font-bold text-emerald-400 transition-all border border-emerald-500/20 uppercase tracking-widest">
                        Export Projections
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MaintenanceForecast;
