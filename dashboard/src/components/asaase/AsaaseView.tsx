import React, { useState, useEffect } from 'react';
import { Bot, AlertCircle, RefreshCcw, Zap, Clock, Terminal, MessageSquare, Activity, Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import AsaaseMap from './AsaaseMap';
import WaypointEditor from './WaypointEditor';
import AlertList from './AlertList';
import ReportViewer from './ReportViewer';
import ControlHub from './ControlHub';

import SensorLog from './SensorLog';
import * as api from '../../asaaseApi';

const AsaaseView: React.FC = () => {
  const [status, setStatus] = useState<api.RobotStatus | null>(null);
  const [groundLatest, setGroundLatest] = useState<api.GroundTelemetry[]>([]);
  const [aquaLatest, setAquaLatest] = useState<api.AquaTelemetry[]>([]);
  const [groundHeatmap, setGroundHeatmap] = useState<any>(null);
  const [aquaHeatmap, setAquaHeatmap] = useState<any>(null);
  const [alerts, setAlerts] = useState<api.AsaaseAlert[]>([]);
  const [alertPage, setAlertPage] = useState(1);
  const [selectedReport, setSelectedReport] = useState<api.RemediationReport | null>(null);
  const [waypoints, setWaypoints] = useState<{lat: number, lon: number}[]>([]);
  const [selectedRobot, setSelectedRobot] = useState<'GROUND_01' | 'AQUA_01'>('GROUND_01');
  const [robotSettings, setRobotSettings] = useState<api.RobotSettings | null>(null);
  const [baseSettings, setBaseSettings] = useState<api.BaseSettings | null>(null);
  const [approvals, setApprovals] = useState<api.PendingApproval[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [time, setTime] = useState(new Date());
  const [activeCategory, setActiveCategory] = useState<'OVERVIEW' | 'MISSION' | 'INTEL' | 'COMMAND' | 'LIVE'>('OVERVIEW');
  const [language, setLanguage] = useState<'EN' | 'TW' | 'GA' | 'EW' | 'FR'>('EN');

  const dict = {
    EN: {
      overview: "OVERVIEW", mission: "MISSION", intel: "INTEL", command: "COMMAND", live: "LIVE",
      system_ready: "SYSTEM READY", packet_stable: "PACKET STABLE",
      global_status: "GLOBAL NETWORK STATUS", live_feeds: "TACTICAL LIVE FEEDS",
      env_telemetry: "ENVIRONMENT TELEMETRY", emergency_stream: "EMERGENCY STREAM",
      waypoint_master: "WAYPOINT MASTER", sensor_log: "SENSOR LOG",
      gsm_log: "GSM/SMS BROADCAST LOG", system_health: "SYSTEM HEALTH",
      ground: "GROUND ROVER", aqua: "AQUA SCOUT", base: "BASE HUB",
      online: "ONLINE", offline: "OFFLINE", syncing: "SYNCING",
      remoting: "REMOTING", auto: "AUTO", manual: "MANUAL"
    },
    TW: {
      overview: "NHWƐSO", mission: "ADWUMA", intel: "NYANSA", command: "AHWƐFO", live: "MPREMPREN",
      system_ready: "MFIRI NO AYƐ KRADO", packet_stable: "NKRA NO GYINA YIE",
      global_status: "WIASE NYINAA NKƆMMƆBƆ GYINABƐA", live_feeds: "MPREMPREN VIDEO",
      env_telemetry: "MPƆTAM TEBEA", emergency_stream: "GYE ME TAATA NKRA",
      waypoint_master: "KWANKYERƐ PANYIN", sensor_log: "MMFIRI NKRA",
      gsm_log: "GSM/SMS NKRA AFƆTUBƐA", system_health: "MFIRI NO TEBEA",
      ground: "ASEƐ AFIRI", aqua: "NSUOM AFIRI", base: "GYINABƐA PANYIN",
      online: "ƐWƆ MPƆTAM", offline: "ƐNIM MPƆTAM", syncing: "ƐBOA NKRA",
      remoting: "WƆAKYIRƐ", auto: "ƐNƆANKASA", manual: "NSA ANO"
    },
    GA: {
      overview: "KWA", mission: "NITSUMƆ", intel: "NILE", command: "KWƐLƆI", live: "AGBƐNƐ",
      system_ready: "TSƆNE LƐ EFƐ GBƐƐ", packet_stable: "SANE LƐ ME GBƐ",
      global_status: "JE LƐ FƐƐ NITSUMƆ GBƐHE", live_feeds: "AGBƐNƐ VIDEO",
      env_telemetry: "HE LƐ TEEMƆ", emergency_stream: "YIWALAHERƐMƆ SANE",
      waypoint_master: "GBƐTSƆƆLƆ NYƆŊMODƆƆ", sensor_log: "TSƆNE SANE",
      gsm_log: "GSM/SMS SANE GBƐHE", system_health: "TSƆNE LƐ TEEMƆ",
      ground: "SHIKPƆŊ TSƆNE", aqua: "NU TSƆNE", base: "BASE GBƐHE",
      online: "KPAAKPA", offline: "EGBE", syncing: "EBOA",
      remoting: "SEKWE", auto: "LE TƆƆ", manual: "DƐŊ"
    },
    EW: {
      overview: "ETENAFE", mission: "DƆWƆNA", intel: "NUNYANYA", command: "DZIKPƆLA", live: "FIFI",
      system_ready: "MƆ̃A DZRAƉO", packet_stable: "NYA LIA",
      global_status: "XEXEAME KADODO TEƉOƉO", live_feeds: "KƐMƐRA KASESE",
      env_telemetry: "NUTOME TEFE", emergency_stream: "KPƆƉE NYIGBA",
      waypoint_master: "MƆFIA GÃ", sensor_log: "MƆ̃A ME NYAWO",
      gsm_log: "GSM/SMS NYAKATAKATA", system_health: "MƆ̃A ŊUTENƆMƐ",
      ground: "ANYIGBA MƆ̃", aqua: "TSIME MƆ̃", base: "TEFE GÃ",
      online: "ELE ME", offline: "MELE ME O", syncing: "EBOAM",
      remoting: "DIDIFE", auto: "EƉOKUI", manual: "ASI"
    },
    FR: {
      overview: "APERÇU", mission: "MISSION", intel: "RENS", command: "COMMANDE", live: "DIRECT",
      system_ready: "SYSTÈME PRÊT", packet_stable: "PAQUET STABLE",
      global_status: "STATUT RÉSEAU GLOBAL", live_feeds: "FLUX TACTIQUES DIRECTS",
      env_telemetry: "TÉLÉMÉTRIE ENV", emergency_stream: "FLUX D'URGENCE",
      waypoint_master: "MAÎTRE DE POINT", sensor_log: "LOG CAPTEURS",
      gsm_log: "LOG GSM/SMS", system_health: "SANTÉ SYSTÈME",
      ground: "ROVER SOL", aqua: "SCOUT AQUA", base: "HUB BASE",
      online: "EN LIGNE", offline: "HORS LIGNE", syncing: "SYNCHRO",
      remoting: "À DISTANCE", auto: "AUTO", manual: "MANUEL"
    }
  };

  const t = dict[language];

  const fetchData = async () => {
    setIsRefreshing(true);
    try {
      const [s, gl, al, gh, ah, alertsRes, settingsRes, baseRes, appRes] = await Promise.all([
        api.fetchAsaaseStatus(),
        api.fetchGroundLatest(),
        api.fetchAquaLatest(),
        api.fetchGroundHeatmap(),
        api.fetchAquaHeatmap(),
        api.fetchAsaaseAlerts(alertPage, 10),
        api.fetchControlSettings(selectedRobot),
        api.fetchBaseSettings(),
        api.fetchPendingApprovals()
      ]);
      setStatus(s);
      setGroundLatest(gl);
      setAquaLatest(al);
      setGroundHeatmap(gh);
      setAquaHeatmap(ah);
      setAlerts(alertsRes);
      setRobotSettings(settingsRes);
      setBaseSettings(baseRes);
      setApprovals(appRes);
    } catch (e) {
      console.error("Failed to fetch ASAASE data", e);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    const clock = setInterval(() => setTime(new Date()), 1000);
    return () => {
      clearInterval(interval);
      clearInterval(clock);
    };
  }, [alertPage, selectedRobot]);

  const handleMapClick = (lat: number, lon: number) => {
    setWaypoints([...waypoints, { lat, lon }]);
  };

  const handleClearWaypoints = () => setWaypoints([]);

  const handleUploadWaypoints = async (robotId: string) => {
    try {
      if (robotId.startsWith('GROUND')) {
        await api.uploadGroundWaypoints(robotId, waypoints);
      } else {
        await api.uploadAquaRoute(robotId, waypoints);
      }
      setWaypoints([]);
    } catch (e) {
      alert("Upload failed");
    }
  };

  const handleViewReport = async (alertId: number) => {
    try {
      const report = await api.fetchReport(alertId);
      setSelectedReport(report);
    } catch (e) {
      alert("Report not found");
    }
  };



  if (!status && isRefreshing) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
         <div className="flex flex-col items-center gap-6">
            <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <div className="flex flex-col items-center">
               <h2 className="text-xl font-black text-white uppercase tracking-widest animate-pulse">Initializing ASAASE Cockpit</h2>
               <p className="text-[10px] text-slate-500 uppercase tracking-[0.3em] mt-2">Connecting to Ghana Base Hub GH_01...</p>
            </div>
         </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-[#0f1115] flex flex-col font-sans animate-in fade-in duration-1000">
      
      {/* TACTICAL SUB-NAV BAR */}
      <div className="flex items-center justify-between px-8 py-4 bg-[#0d1117] border-b border-white/5 relative z-20">
         <div className="flex items-center gap-8">
            <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/5">
               {(['OVERVIEW', 'MISSION', 'INTEL', 'COMMAND', 'LIVE'] as const).map((cat) => (
                  <button
                     key={cat}
                     onClick={() => setActiveCategory(cat)}
                     className={`px-8 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all relative overflow-hidden group ${
                        activeCategory === cat ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                     }`}
                  >
                     {activeCategory === cat && (
                        <motion.div layoutId="nav-glow" className="absolute inset-0 bg-emerald-500/10 border border-emerald-500/20 rounded-xl" />
                     )}
                     <span className="relative z-10">{t[cat.toLowerCase() as keyof typeof t]}</span>
                  </button>
               ))}
            </div>
            <div className="h-6 w-px bg-white/5"></div>
            <div className="flex items-center gap-3">
               <Bot size={16} className="text-emerald-400" />
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic animate-pulse">
                  {t.system_ready}: {selectedRobot.replace('_', ' ')} :: {t.packet_stable}
               </span>
            </div>
         </div>

         <div className="flex items-center gap-6">
            <div className="flex bg-black/40 p-1 rounded-xl border border-white/5 mr-4">
               {(['EN', 'TW', 'GA', 'EW', 'FR'] as const).map((lang) => (
                  <button
                     key={lang}
                     onClick={() => setLanguage(lang)}
                     className={`px-3 py-1 rounded-lg text-[9px] font-black transition-all ${
                        language === lang ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-600 hover:text-slate-400'
                     }`}
                  >
                     {lang}
                  </button>
               ))}
            </div>
            <div className="flex items-center gap-2 text-emerald-400 font-mono text-sm font-black italic">
               <Clock size={16} />
               {time.toLocaleTimeString([], {hour12: false})}
            </div>
            <button 
               onClick={fetchData} 
               className={`p-2.5 rounded-xl bg-white/5 hover:bg-emerald-500/20 border border-white/10 transition-all ${isRefreshing ? 'animate-spin' : ''}`}
            >
               <RefreshCcw size={16} className="text-slate-400" />
            </button>
         </div>
      </div>

      <div className="flex-1 overflow-hidden relative">
        <div className="grid grid-cols-4 gap-6 p-8 items-start h-full overflow-y-auto custom-scrollbar">
          
          {/* OVERVIEW DECK: Global Status */}
          {activeCategory === 'OVERVIEW' && (
            <>
              <div className="col-span-4 mb-4">
                 <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase flex items-center gap-4">
                    <Globe size={28} className="text-emerald-500" />
                    {t.global_status}
                 </h2>
              </div>
              
              {[
                { id: 'ASA-GROUND-01', type: t.ground, status: t.online, battery: '88%', signal: 'STABLE', mode: t.auto, color: 'emerald' },
                { id: 'ASA-AQUA-07', type: t.aqua, status: t.online, battery: '64%', signal: 'WEAK', mode: t.manual, color: 'amber' },
                { id: 'ASA-BASE-ALPHA', type: t.base, status: t.online, battery: '100%', signal: 'LOCKED', mode: t.auto, color: 'blue' },
              ].map((robot, i) => (
                <div key={i} className="col-span-1 bg-[#1a1d23] border border-white/5 p-6 rounded-[2rem] shadow-xl hover:border-emerald-500/20 transition-all group relative overflow-hidden">
                   <div className={`absolute top-0 left-0 w-1 h-full bg-${robot.color}-500 opacity-50`}></div>
                   <div className="flex justify-between items-start mb-6">
                      <div>
                         <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{robot.type}</span>
                         <h3 className="text-xl font-black text-white italic truncate">{robot.id}</h3>
                      </div>
                      <div className={`px-2 py-1 rounded-md bg-white/5 border border-white/10 text-[8px] font-black text-white/50 uppercase`}>
                         {robot.status}
                      </div>
                   </div>
                   
                   <div className="space-y-4 font-mono">
                      <div className="flex justify-between text-[10px] border-b border-white/5 pb-2">
                         <span className="text-slate-500">BATTERY</span>
                         <span className="text-white font-black">{robot.battery}</span>
                      </div>
                      <div className="flex justify-between text-[10px] border-b border-white/5 pb-2">
                         <span className="text-slate-500">SIGNAL</span>
                         <span className="text-white font-black">{robot.signal}</span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                         <span className="text-slate-500">MODE</span>
                         <span className={`font-black uppercase text-sm`}>{robot.mode}</span>
                      </div>
                   </div>
                </div>
              ))}

              <div className="col-span-1 bg-black/40 border-2 border-dashed border-white/5 rounded-[2rem] flex flex-col items-center justify-center p-8 opacity-40 hover:opacity-100 transition-opacity cursor-pointer group h-full min-h-[220px]">
                 <Bot size={48} className="text-slate-500 group-hover:text-emerald-500 transition-colors mb-4" />
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{t.syncing}...</span>
              </div>
            </>
          )}

          {/* LIVE DECK: Camera Feeds */}
          {activeCategory === 'LIVE' && (
            <>
               <div className="col-span-4 mb-4">
                  <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase flex items-center gap-4">
                     <Activity size={28} className="text-rose-500" />
                     {t.live_feeds}
                  </h2>
               </div>
               
               {[
                 { title: t.ground, id: 'G-CAM-01', location: 'Section B-4' },
                 { title: t.aqua, id: 'A-CAM-07', location: 'Delta Basin' },
                 { title: t.base, id: 'B-CAM-MAIN', location: 'HQ Entry' },
                 { title: 'SOIL SCANNER', id: 'S-SCAN-01', location: 'Grid 12' }
               ].map((feed, i) => (
                 <div key={i} className="col-span-2 bg-[#1a1d23] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl relative group aspect-video">
                    <div className="absolute inset-0 bg-slate-900 flex items-center justify-center">
                       <div className="flex flex-col items-center gap-4">
                          <div className="w-12 h-12 rounded-full border-2 border-white/5 border-t-rose-500 animate-spin"></div>
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t.syncing} {feed.id}...</span>
                       </div>
                    </div>
                    <div className="absolute top-6 left-6 z-10 px-4 py-2 bg-black/80 backdrop-blur-md border border-white/10 rounded-xl">
                       <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
                          <span className="text-[10px] font-black text-white uppercase tracking-widest">{feed.title} :: {feed.id}</span>
                       </div>
                    </div>
                    <div className="absolute bottom-6 right-6 z-10 px-4 py-2 bg-black/40 backdrop-blur-md border border-white/5 rounded-xl text-[10px] font-mono text-slate-400">
                       {feed.location} :: 24.5 FPS :: {t.remoting}
                    </div>
                 </div>
               ))}
            </>
          )}

          {/* MISSION DECK: Visuals & Pathing */}
          {activeCategory === 'MISSION' && (
            <>
              <div className="col-span-2 flex flex-col gap-6 h-fit animate-in slide-in-from-left-4 duration-500">
                <div className="bg-[#1a1d23] border border-white/5 rounded-[2rem] overflow-hidden shadow-2xl h-[550px] relative group">
                   <AsaaseMap 
                     groundPos={groundLatest[0] ? [groundLatest[0].gps_lat, groundLatest[0].gps_lon] : [6.5, -1.5]}
                     aquaPos={aquaLatest[0] ? [aquaLatest[0].gps_lat, aquaLatest[0].gps_lon] : [6.5, -1.6]}
                     groundHeatmap={groundHeatmap}
                     aquaHeatmap={aquaHeatmap}
                     onMapClick={handleMapClick}
                     waypoints={waypoints}
                   />
                   <div className="absolute top-6 left-6 z-10 p-4 bg-black/80 backdrop-blur-md border border-white/10 rounded-2xl shadow-xl">
                      <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block mb-2">Live Coordination</span>
                      <div className="space-y-1 font-mono text-[10px] text-white/80">
                         <div className="flex justify-between gap-4"><span>LAT:</span> <span className="text-emerald-400">{groundLatest[0]?.gps_lat?.toFixed(6) || '---'}</span></div>
                         <div className="flex justify-between gap-4"><span>LON:</span> <span className="text-emerald-400">{groundLatest[0]?.gps_lon?.toFixed(6) || '---'}</span></div>
                      </div>
                   </div>
                </div>
              </div>

              <div className="col-span-1 flex flex-col gap-6 h-fit animate-in slide-in-from-bottom-4 duration-500 delay-75">
                <div className="bg-[#1a1d23] border border-white/5 p-8 rounded-[2rem] shadow-xl h-fit hover:border-emerald-500/20 transition-colors">
                   <div className="flex items-center gap-3 mb-6">
                      <Bot size={20} className="text-emerald-400" />
                      <h4 className="text-[12px] font-black text-white uppercase tracking-widest italic">Waypoint Master</h4>
                   </div>
                   <WaypointEditor 
                      waypoints={waypoints}
                      onClear={handleClearWaypoints}
                      onUpload={handleUploadWaypoints}
                      selectedRobot={selectedRobot}
                      setSelectedRobot={setSelectedRobot}
                   />
                </div>
              </div>

              <div className="col-span-1 flex flex-col gap-6 h-fit animate-in slide-in-from-right-4 duration-500 delay-150">
                <div className="h-[550px]">
                   <SensorLog />
                </div>
              </div>
            </>
          )}

          {/* INTELLIGENCE DECK: Data & Comm Logs */}
          {activeCategory === 'INTEL' && (
            <>
              <div className="col-span-1 flex flex-col gap-6 h-fit animate-in slide-in-from-left-4 duration-500">
                 <div className="bg-[#1a1d23] border border-white/5 p-8 rounded-[2rem] shadow-xl h-fit">
                    <div className="flex items-center justify-between mb-8">
                       <div className="flex items-center gap-3">
                          <Zap size={20} className="text-amber-500" />
                          <span className="text-[12px] font-black text-slate-300 uppercase tracking-widest italic">Env Telemetry</span>
                       </div>
                       <Activity size={18} className="text-slate-600" />
                    </div>
                    
                    <div className="space-y-6">
                       {[
                         { label: 'SOIL SCORE', value: '0.88', unit: 'CRIT', color: 'text-rose-500' },
                         { label: 'MERCURY MG/KG', value: '12.5', unit: 'SCAN', color: 'text-amber-400' },
                         { label: 'TURBIDITY NTU', value: '45.0', unit: 'STBL', color: 'text-emerald-400' },
                         { label: 'pH VALUE', value: '4.2', unit: 'ACID', color: 'text-rose-500' },
                       ].map((stat, i) => (
                         <div key={i} className="flex items-center justify-between border-b border-white/5 pb-4">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</span>
                            <div className="text-right font-mono">
                               <span className={`text-2xl font-black italic tracking-tighter ${stat.color}`}>{stat.value}</span>
                               <span className="text-[10px] font-black text-slate-700 ml-2 uppercase">{stat.unit}</span>
                            </div>
                         <               <div className="col-span-1 flex flex-col gap-6 h-fit animate-in slide-in-from-bottom-4 duration-500 delay-75">
                 <div className="bg-[#1a1d23] border border-rose-500/20 p-6 rounded-[2rem] shadow-xl h-fit relative group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 blur-[50px] group-hover:bg-rose-500/10 transition-colors"></div>
                    <div className="flex items-center justify-between mb-4 relative z-10">
                       <div className="flex items-center gap-3">
                          <AlertCircle size={20} className="text-rose-500 animate-pulse" />
                          <span className="text-[12px] font-black text-rose-500 uppercase tracking-widest italic">{t.emergency_stream}</span>
                       </div>
                       <div className="px-3 py-1 bg-rose-500/10 border border-rose-500/20 rounded-lg text-[10px] font-black text-rose-500 uppercase animate-pulse">{t.live}</div>
                    </div>
                    <div className="h-[400px] overflow-y-auto custom-scrollbar relative z-10 pr-2"></div>
                    <div className="h-[350px] overflow-y-auto custom-scrollbar relative z-10 pr-2">
                       <AlertList 
                          alerts={alerts} 
                          page={alertPage} 
                          setPage={setAlertPage} 
                          onViewReport={handleViewReport} 
                       />
                    </div>
                 </div>
              </div>

              <div className="col-span-2 flex flex-col gap-6 h-fit animate-in slide-in-from-right-4 duration-500 delay-150">
                 <div className="bg-[#1a1d23] border border-blue-500/20 p-8 rounded-[3rem] shadow-xl h-fit">
                    <div className="flex items-center gap-4 mb-8">
                       <MessageSquare size={24} className="text-blue-400" />
                       <h4 className="text-[14px] font-black text-blue-400 uppercase tracking-widest italic">GSM/SMS Broadcast Log</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-4 font-mono">
                       {[
                         { target: 'EPA_DISTRICT_R1', status: 'SENT', msg: 'CRITICAL ALERT: GH_LOC_001. Remediation initiated.', time: '12:45' },
                         { target: 'WATER_BOARD_GH', status: 'SENT', msg: 'AQUA_01: pH Critical (4.2). Slaked Lime deployed.', time: '12:48' },
                         { target: 'DISTRICT_CHIEF_V1', status: 'DONE', msg: 'Bilingual Remediation Report draft generated.', time: '13:02' },
                         { target: 'BASE_HUB_OPS', status: 'INFO', msg: 'Network parity maintained at 94% signal.', time: '13:10' }
                       ].map((log, i) => (
                         <div key={i} className="bg-black/40 p-5 rounded-2xl border border-white/5 space-y-3 hover:bg-black/60 transition-all group">
                            <div className="flex justify-between items-center text-[10px] font-black uppercase">
                               <span className="text-slate-500">{log.target}</span>
                               <span className={log.status === 'SENT' ? 'text-emerald-400' : 'text-blue-400'}>[{log.status}]</span>
                            </div>
                            <p className="text-[11px] text-slate-300 italic leading-relaxed group-hover:text-white transition-colors">&gt; {log.msg}</p>
                            <div className="text-right text-[9px] text-slate-600 font-bold">{log.time} GMT</div>
                         </div>
                       ))}
                    </div>
                 </div>
              </div>
            </>
          )}

          {/* COMMAND DECK: Actuation & Health */}
          {activeCategory === 'COMMAND' && (
            <>
              <div className="col-span-3 flex flex-col gap-6 h-fit animate-in slide-in-from-left-4 duration-500">
                 <div className="bg-[#1a1d23] border border-white/5 rounded-[3rem] shadow-2xl overflow-hidden h-fit">
                    <div className="p-8 border-b border-white/5 bg-black/20">
                       <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                             <Terminal size={24} className="text-emerald-400 animate-pulse" />
                             <h4 className="text-[16px] font-black text-white uppercase tracking-[0.3em] italic">Unit Direct Interface</h4>
                          </div>
                          <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                             <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]"></div>
                             <span className="text-[12px] font-black text-emerald-400 uppercase tracking-widest italic animate-pulse">Packet Stable</span>
                          </div>
                       </div>
                    </div>
                    
                    <div className="p-8 h-fit">
                       <ControlHub 
                          robotId={selectedRobot}
                          settings={robotSettings}
                          baseSettings={baseSettings}
                          approvals={approvals}
                          onSettingsUpdate={fetchData}
                          onRobotChange={setSelectedRobot}
                       />
                    </div>
                 </div>
              </div>

              <div className="col-span-1 flex flex-col gap-6 h-fit animate-in slide-in-from-right-4 duration-500 delay-75">
                 <div className="bg-[#1a1d23] border border-white/5 p-8 rounded-[2.5rem] shadow-xl h-fit">
                    <div className="flex justify-between items-center mb-6">
                       <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Base Hub GH_01</span>
                       <div className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-md text-[10px] font-black text-emerald-400">ONLINE</div>
                    </div>
                    <div className="space-y-4">
                       {[
                         { label: 'SIGNAL STR', value: '94%', sub: 'GSM-LINK' },
                         { label: 'BATT PARITY', value: '82%', sub: 'FLEET-AVG' },
                         { label: 'TEMP RANGE', value: '28°C', sub: 'NORMAL' },
                         { label: 'RADIO DISP', value: 'OK', sub: 'STABLE' },
                       ].map((item, i) => (
                         <div key={i} className="bg-black/20 p-5 rounded-2xl border border-white/5 group hover:border-emerald-500/30 transition-all">
                            <span className="text-[9px] font-black text-slate-500 uppercase block mb-2">{item.label}</span>
                            <div className="flex items-end justify-between">
                               <div className="text-emerald-400 font-black italic text-xl tracking-tighter">{item.value}</div>
                               <div className="text-[8px] font-black text-slate-700 uppercase tracking-widest italic">{item.sub}</div>
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>
              </div>
            </>
          )}

        </div>
      </div>

      {selectedReport && (
        <ReportViewer 
          report={selectedReport} 
          onClose={() => setSelectedReport(null)} 
        />
      )}
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #10b981; }
      `}</style>
    </div>
  );
};

export default AsaaseView;
