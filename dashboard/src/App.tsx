import { useState } from 'react';
import Sidebar from './components/Sidebar';
import type { ViewType } from './components/Sidebar';
import Dashboard from './components/Dashboard';
import EnvironmentalView from './components/EnvironmentalView';
import WaterView from './components/WaterView';
import EnergyView from './components/EnergyView';
import ControlCenter from './components/ControlCenter';

import { NotificationProvider } from './components/NotificationSystem';

// Main Application Hub
function App() {
  const [currentView, setCurrentView] = useState<ViewType>('overview');
  const [isSidebarExpanded, setSidebarExpanded] = useState(true);

  const renderContent = () => {
    switch (currentView) {
      case 'overview': return <Dashboard />;
      case 'environmental': return <EnvironmentalView />;
      case 'water': return <WaterView />;
      case 'energy': return <EnergyView />;
      case 'control': return <ControlCenter />;
      default: return <Dashboard />;
    }
  };

  return (
    <NotificationProvider>
      <div className="flex bg-[#0d1117] min-h-screen text-slate-200 selection:bg-emerald-500/30">
        <Sidebar 
          currentView={currentView} 
          onViewChange={setCurrentView} 
          isExpanded={isSidebarExpanded}
          toggleExpanded={() => setSidebarExpanded(!isSidebarExpanded)}
        />
        <main className="flex-1 h-screen overflow-y-auto overflow-x-hidden">
          {renderContent()}
        </main>
      </div>
    </NotificationProvider>
  );
}

export default App;
