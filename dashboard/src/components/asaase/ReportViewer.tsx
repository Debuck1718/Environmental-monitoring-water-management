import React from 'react';
import { Printer, X, ShieldAlert, Globe, ExternalLink } from 'lucide-react';
import type { RemediationReport } from '../../asaaseApi';

interface ReportViewerProps {
  report: RemediationReport | null;
  onClose: () => void;
}

const ReportViewer: React.FC<ReportViewerProps> = ({ report, onClose }) => {
  if (!report) return null;

  const en = JSON.parse(report.report_en);
  const tw = JSON.parse(report.report_tw);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0d1117]/90 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-white/10 w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-3xl shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-slate-800/50">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-red-500/20 rounded-lg">
                <ShieldAlert size={20} className="text-red-400" />
             </div>
             <div>
                <h2 className="font-black text-xl text-slate-200 tracking-tighter uppercase italic">
                  Remediation <span className="text-emerald-500">Report</span>
                </h2>
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">
                  Incident ID: {report.alert_id} | Ref: {new Date(report.generated_at * 1000).toISOString()}
                </div>
             </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handlePrint}
              className="p-3 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
            >
              <Printer size={20} />
            </button>
            <button 
              onClick={onClose}
              className="p-3 rounded-xl bg-slate-800 text-slate-300 hover:bg-red-500/20 hover:text-red-400 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 print:block">
            {/* English Column */}
            <div className="space-y-8">
              <div className="flex items-center gap-2 mb-4">
                <Globe size={16} className="text-emerald-400" />
                <span className="text-xs font-black uppercase tracking-widest text-emerald-400">English Language</span>
              </div>
              
              <section>
                 <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Incident Summary</h4>
                 <div className="bg-slate-800/30 p-4 rounded-xl border border-white/5 space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-slate-500">Robot ID:</span> <span className="text-slate-200 font-mono">{en.incident_summary.robot}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Location:</span> <span className="text-slate-200">{en.incident_summary.location}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Timestamp:</span> <span className="text-slate-200">{en.incident_summary.timestamp}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Severity:</span> <span className="text-red-400 font-bold uppercase">{en.incident_summary.severity}</span></div>
                 </div>
              </section>

              <section>
                 <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Detected Contaminants</h4>
                 <p className="text-slate-300 text-sm leading-relaxed">{en.detected_contaminants}</p>
              </section>

              <section>
                 <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Robot Actions</h4>
                 <p className="text-slate-300 text-sm leading-relaxed">{en.robot_actions_taken}</p>
              </section>

              <section>
                 <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Phytoremediation Recommendation</h4>
                 <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                   <p className="text-emerald-400 text-sm italic">{en.phytoremediation_species}</p>
                 </div>
              </section>

              <section>
                 <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Soil/Water Treatment</h4>
                 <p className="text-slate-300 text-sm leading-relaxed">{en.soil_treatment || en.water_safety}</p>
              </section>
            </div>

            {/* Twi Column */}
            <div className="space-y-8 bg-slate-800/10 p-6 rounded-3xl border border-white/5 md:block print:block hidden">
              <div className="flex items-center gap-2 mb-4">
                <Globe size={16} className="text-amber-400" />
                <span className="text-xs font-black uppercase tracking-widest text-amber-400">Twi (Akan) Language</span>
              </div>
              
              <section>
                 <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Mpomantwitwaa</h4>
                 <p className="text-slate-300 text-sm leading-relaxed">{tw.incident_summary_tw}</p>
              </section>

              <section>
                 <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Nneɛma a yɛahu a ɛntene</h4>
                 <p className="text-slate-400 italic text-sm italic">{tw.detected_contaminants_tw}</p>
              </section>

              <section>
                 <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Robot no dwumadie</h4>
                 <p className="text-slate-400 italic text-sm italic">{tw.robot_actions_taken_tw}</p>
              </section>

              <section>
                 <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Nnuadewa a mosi firi ayare hwɛ</h4>
                 <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                   <p className="text-amber-400 text-sm italic">{tw.phytoremediation_species_tw}</p>
                 </div>
              </section>

              <section>
                 <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Nsuo/Dɔteɛ siesie</h4>
                 <p className="text-slate-300 text-sm leading-relaxed">{tw.soil_treatment_tw || tw.water_safety_tw}</p>
              </section>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/5 bg-slate-800/50 flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase tracking-widest">
           <div>&copy; 2026 ASAASE Environmental Defense</div>
           <div className="flex items-center gap-1 text-emerald-500">
             <ExternalLink size={12} /> Verification Status: SECURE
           </div>
        </div>
      </div>
    </div>
  );
};

export default ReportViewer;
