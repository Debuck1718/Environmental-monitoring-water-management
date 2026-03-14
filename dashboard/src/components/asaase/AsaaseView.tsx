import React, { useState, useEffect } from 'react';
import { Bot, Waves, Map as MapIcon, AlertCircle, Layout, RefreshCcw } from 'lucide-react';
import RobotStatusBar from './RobotStatusBar';
import AsaaseMap from './AsaaseMap';
import WaypointEditor from './WaypointEditor';
import AlertList from './AlertList';
import ReportViewer from './ReportViewer';
import TelemetryTable from './TelemetryTable';
import * as api from '../../asaaseApi';

const AsaaseView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'rover' | 'boat' | 'alerts'>('overview');
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
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = async () => {
    setIsRefreshing(true);
    try {
      const [s, gl, al, gh, ah, alertsRes] = await Promise.all([
        api.fetchAsaaseStatus(),
        api.fetchGroundLatest(),
        api.fetchAquaLatest(),
        api.fetchGroundHeatmap(),
        api.fetchAquaHeatmap(),
        api.fetchAsaaseAlerts(alertPage, 10)
      ]);
      setStatus(s);
      setGroundLatest(gl);
      setAquaLatest(al);
      setGroundHeatmap(gh);
      setAquaHeatmap(ah);
      setAlerts(alertsRes);
    } catch (e) {
      console.error("Failed to fetch ASAASE data", e);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [alertPage]);

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
      alert(`Waypoints uploaded to ${robotId}`);
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

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter uppercase italic">
            ASAASE <span className="text-emerald-500">Defense System</span>
          </h1>
          <p className="text-slate-500 text-xs font-black uppercase tracking-widest mt-1">Autonomous Robot Control & Galamsey Monitoring Hub</p>
        </div>
        <button 
          onClick={fetchData} 
          className={`p-3 rounded-xl bg-slate-200/50 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:text-emerald-400 transition-all ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`}
        >
          <RefreshCcw size={20} />
        </button>
      </div>

      {status && <RobotStatusBar status={status} />}

      {/* Tabs */}
      <div className="flex gap-2 bg-slate-200/50 dark:bg-white/5 p-1.5 rounded-2xl w-fit">
        {[
          { id: 'overview', label: 'Overview', icon: Layout },
          { id: 'rover', label: 'GROUND Rover', icon: Bot },
          { id: 'boat', label: 'AQUA Boat', icon: Waves },
          { id: 'alerts', label: 'System Alerts', icon: AlertCircle },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                isActive 
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-white'
              }`}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-8">
          {activeTab === 'overview' && (
            <div className="space-y-8">
              <AsaaseMap 
                groundPos={groundLatest[0] ? [groundLatest[0].gps_lat, groundLatest[0].gps_lon] : [6.5, -1.5]}
                aquaPos={aquaLatest[0] ? [aquaLatest[0].gps_lat, aquaLatest[0].gps_lon] : [6.5, -1.6]}
                groundHeatmap={groundHeatmap}
                aquaHeatmap={aquaHeatmap}
                onMapClick={handleMapClick}
                waypoints={waypoints}
              />
              <AlertList 
                alerts={alerts} 
                page={alertPage} 
                setPage={setAlertPage} 
                onViewReport={handleViewReport} 
              />
            </div>
          )}

          {activeTab === 'rover' && (
            <div className="space-y-8">
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex items-center gap-3">
                 <Bot className="text-emerald-400" />
                 <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Live GROUND Telemetry Stream</span>
              </div>
              <TelemetryTable data={groundLatest} type="ground" />
            </div>
          )}

          {activeTab === 'boat' && (
            <div className="space-y-8">
              <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl flex items-center gap-3">
                 <Waves className="text-blue-400" />
                 <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Live AQUA Telemetry Stream</span>
              </div>
              <TelemetryTable data={aquaLatest} type="aqua" />
            </div>
          )}

          {activeTab === 'alerts' && (
             <AlertList 
                alerts={alerts} 
                page={alertPage} 
                setPage={setAlertPage} 
                onViewReport={handleViewReport} 
             />
          )}
        </div>

        {/* Sidebar / Editor Area */}
        <div className="space-y-8">
           <WaypointEditor 
             waypoints={waypoints}
             onClear={handleClearWaypoints}
             onUpload={handleUploadWaypoints}
             selectedRobot={selectedRobot}
             setSelectedRobot={setSelectedRobot}
           />
           
           <div className="bg-slate-800/50 border border-white/5 p-6 rounded-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                 <MapIcon size={80} />
              </div>
              <h3 className="font-bold text-slate-200 mb-2 uppercase tracking-tighter text-lg italic">System Stats</h3>
              <div className="space-y-4 relative z-10">
                 <div className="flex justify-between items-end border-b border-white/5 pb-2">
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">24h Alerts</span>
                    <span className="text-2xl font-black text-slate-200 tracking-tighter">{status?.alert_count_24h || 0}</span>
                 </div>
                 <div className="flex justify-between items-end border-b border-white/5 pb-2">
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">Critical Incidents</span>
                    <span className="text-2xl font-black text-red-400 tracking-tighter">{status?.critical_count_24h || 0}</span>
                 </div>
                 <div className="flex justify-between items-end">
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">Reports Generated</span>
                    <span className="text-2xl font-black text-emerald-400 tracking-tighter">{alerts.filter(a => a.report_generated).length}</span>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {selectedReport && (
        <ReportViewer 
          report={selectedReport} 
          onClose={() => setSelectedReport(null)} 
        />
      )}
    </div>
  );
};

export default AsaaseView;
