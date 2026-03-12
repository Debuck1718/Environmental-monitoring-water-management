import React, { useEffect, useState } from 'react';
import { Trees, Activity, Map, AlertTriangle, Scan, Camera } from 'lucide-react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { fetchLatestStats, fetchHistory } from '../api';
import type { DashboardData } from '../api';

const EnvironmentalView: React.FC = () => {
    const [data, setData] = useState<DashboardData | null>(null);
    const [history, setHistory] = useState<any[]>([]);

    useEffect(() => {
        const load = async () => {
            const [latest, hist] = await Promise.all([fetchLatestStats(), fetchHistory()]);
            setData(latest);
            setHistory(hist.env || []);
        };
        load();
        const interval = setInterval(load, 2000);
        return () => clearInterval(interval);
    }, []);

    const chartData = [...history].reverse().map(e => ({
        time: new Date(e.ts * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        green: (e.green_ratio * 100).toFixed(1),
    }));

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            <header className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-black text-white flex items-center gap-3">
                        <Scan className="text-emerald-400" size={32} />
                        Environmental Intelligence
                    </h2>
                    <p className="text-slate-400 mt-2 uppercase tracking-widest text-xs">Computer Vision & Satellite Analysis</p>
                </div>
                <div className="flex gap-4">
                     <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3">
                        <Camera size={18} className="text-slate-400" />
                        <span className="text-sm font-bold text-white">Live Feed: ACTIVE</span>
                     </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* CV Canvas Mockup/Indicator */}
                <div className="lg:col-span-2 relative aspect-video bg-slate-900 rounded-[32px] border-2 border-slate-800 overflow-hidden group shadow-2xl">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent" />
                    <div className="absolute top-6 left-6 flex gap-4">
                        <div className="px-3 py-1 bg-black/50 backdrop-blur-md rounded-lg text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                            MODE: VEGETATION_INDEX
                        </div>
                        <div className="px-3 py-1 bg-black/50 backdrop-blur-md rounded-lg text-[10px] font-bold text-blue-400 border border-blue-500/30">
                            FPS: 28.4
                        </div>
                    </div>
                    {/* Simplified ROI visualization */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none">
                        <rect x="20%" y="20%" width="30%" height="40%" fill="none" stroke="rgba(16,185,129,0.3)" strokeWidth="2" strokeDasharray="5 5" />
                        <text x="20%" y="18%" className="fill-emerald-400 text-[10px] font-bold">ROI_FOREST_A</text>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-sm">
                        <div className="text-center">
                            <Activity className="text-emerald-500 mx-auto mb-2 animate-bounce" />
                            <p className="text-white font-bold">Deep Neural Network Analyzing...</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="glass-card p-6 border-emerald-500/20">
                        <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-tighter mb-4 flex items-center gap-2">
                             <Map size={16} />
                             Site Statistics
                        </h4>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400 text-sm">Cover Ratio</span>
                                <span className="text-xl font-black text-white">{data?.env ? (data.env.green_ratio * 100).toFixed(1) : '--'}%</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-500">Deviation</span>
                                <span className={`font-bold ${data?.env && data.env.cover_change_pct < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                    {data?.env ? data.env.cover_change_pct.toFixed(2) : '0.00'}%
                                </span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
                                <motion.div 
                                    className="h-full bg-emerald-500"
                                    animate={{ width: `${(data?.env?.green_ratio || 0) * 100}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="glass-card p-6 border-amber-500/20">
                        <h4 className="text-sm font-bold text-amber-400 uppercase tracking-tighter mb-4 flex items-center gap-2">
                             <AlertTriangle size={16} />
                             Anomalies Detected
                        </h4>
                        <div className="space-y-3">
                             <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                                <span className="text-xs text-slate-300">Excavation Hits</span>
                                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded text-[10px] font-black">{data?.env?.excavation_count || 0}</span>
                             </div>
                             <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                                <span className="text-xs text-slate-300">Movement Alerts</span>
                                <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-[10px] font-black">{data?.env?.activity_count || 0}</span>
                             </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="glass-card p-8 h-[400px]">
                <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-2">
                    <Trees className="text-emerald-400" size={20} />
                    Historical Canopy Performance
                </h3>
                <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="envGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <XAxis dataKey="time" stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} />
                            <YAxis stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} domain={[0, 100]} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)' }}
                                itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
                            />
                            <Area type="monotone" dataKey="green" stroke="#10b981" strokeWidth={3} fill="url(#envGrad)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default EnvironmentalView;
