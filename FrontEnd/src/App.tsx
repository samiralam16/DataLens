import { useState, useRef } from "react";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import SQLBuilder from "./components/SQLBuilder";
import { WebBuilder } from "./components/WebBuilder";
import { DataProvider } from "./components/DataContext";
import { Toaster } from "./components/ui/sonner";
import { SQLProvider } from "./components/sql-builder/SQLContext";

export default function App() {
  const [activeModule, setActiveModule] = useState<"sql" | "web">("sql");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [activeTool, setActiveTool] = useState("editor");

  const addChartRef = useRef<(() => void) | null>(null);

  const handleAIAssistantToggle = () => {
    setShowAIAssistant(!showAIAssistant);
    setActiveTool("ai");
  };

  return (
    <DataProvider>
      <SQLProvider>
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
              activeTool={activeTool}
              setActiveTool={setActiveTool}
              onAIAssistantClick={handleAIAssistantToggle}
              onAddChart={() => addChartRef.current?.()}
            />

            <main className="flex-1 overflow-hidden">
              {activeModule === "sql" ? (
                <SQLBuilder
                  activeTool={activeTool}
                  setActiveTool={setActiveTool}
                  showAIAssistant={showAIAssistant}
                  setShowAIAssistant={setShowAIAssistant}
                />
              ) : (
                <WebBuilder addChartRef={addChartRef} />
              )}
            </main>
          </div>

          <Toaster />
        </div>
      </SQLProvider>
    </DataProvider>
  );
}
