import React from 'react';
import { AlertCircle, FileText, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import type { AsaaseAlert } from '../../asaaseApi';

interface AlertListProps {
  alerts: AsaaseAlert[];
  page: number;
  setPage: (p: number) => void;
  onViewReport: (alertId: number) => void;
}

const AlertList: React.FC<AlertListProps> = ({ alerts, page, setPage, onViewReport }) => {
  return (
    <div className="bg-slate-800/50 border border-white/5 rounded-2xl overflow-hidden">
      <div className="p-6 border-b border-white/5 flex items-center justify-between">
        <h3 className="font-bold text-slate-200 flex items-center gap-2">
          <AlertCircle size={18} className="text-red-400" />
          System Alerts
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-900/50 text-slate-500 text-[10px] uppercase font-black tracking-widest">
            <tr>
              <th className="px-6 py-4">Timestamp</th>
              <th className="px-6 py-4">Robot</th>
              <th className="px-6 py-4">Severity</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">SMS Sent</th>
              <th className="px-6 py-4">Action</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-white/5">
            {alerts.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                  No alerts recorded in the system.
                </td>
              </tr>
            ) : (
              alerts.map((alert) => (
                <tr key={alert.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 text-slate-400">
                    {new Date(alert.ts * 1000).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-200">{alert.robot_id}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                      alert.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {alert.severity}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-400">{alert.alert_type}</td>
                  <td className="px-6 py-4">
                    {alert.sms_sent ? (
                      <div className="flex items-center gap-1 text-emerald-400">
                        <CheckCircle2 size={14} /> <span className="text-xs">Sent</span>
                      </div>
                    ) : (
                      <div className="text-slate-600 text-xs italic">Not sent</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {alert.report_generated ? (
                      <button 
                        onClick={() => onViewReport(alert.id)}
                        className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition-colors"
                      >
                        <FileText size={16} />
                        <span className="text-xs font-bold">View Report</span>
                      </button>
                    ) : (
                      <span className="text-slate-600 text-xs">-</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="p-4 bg-slate-900/50 border-t border-white/5 flex items-center justify-between">
         <button 
           disabled={page === 1}
           onClick={() => setPage(page - 1)}
           className="p-2 rounded-lg bg-slate-800 border border-white/5 text-slate-400 hover:text-white disabled:opacity-30"
         >
           <ChevronLeft size={18} />
         </button>
         <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">Page {page}</span>
         <button 
           onClick={() => setPage(page + 1)}
           className="p-2 rounded-lg bg-slate-800 border border-white/5 text-slate-400 hover:text-white"
         >
           <ChevronRight size={18} />
         </button>
      </div>
    </div>
  );
};

export default AlertList;
