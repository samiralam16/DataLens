import { useState, useRef } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { SQLBuilder } from './components/SQLBuilder';
import { WebBuilder } from './components/WebBuilder';
import { DataProvider } from './components/DataContext';
import { Toaster } from './components/ui/sonner';

export default function App() {
  const [activeModule, setActiveModule] = useState<'sql' | 'web'>('sql');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const addChartRef = useRef<(() => void) | null>(null);

  const handleAIAssistantToggle = () => {
    setShowAIAssistant(!showAIAssistant);
  };

  const handleAddChart = () => {
    if (addChartRef.current) {
      addChartRef.current();
    }
  };

  return (
    <DataProvider>
      <div className="h-screen flex flex-col bg-background">
        <Header 
          activeModule={activeModule} 
          setActiveModule={setActiveModule}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />
        
        <div className="flex flex-1 overflow-hidden">
          <Sidebar 
            isOpen={sidebarOpen} 
            activeModule={activeModule}
            onModuleChange={setActiveModule}
            onAIAssistantClick={handleAIAssistantToggle}
            onAddChart={handleAddChart}
          />
          
          <main className="flex-1 overflow-hidden">
            {activeModule === 'sql' ? (
              <SQLBuilder showAIAssistant={showAIAssistant} setShowAIAssistant={setShowAIAssistant} />
            ) : (
              <WebBuilder addChartRef={addChartRef} />
            )}
          </main>
        </div>
        
        <Toaster />
      </div>
    </DataProvider>
  );
}