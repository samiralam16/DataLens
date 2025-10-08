// src/App.tsx
import { useState, useRef, useEffect } from "react";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import SQLBuilder from "./components/SQLBuilder";
import { WebBuilder } from "./components/WebBuilder";
import { DataProvider } from "./components/DataContext";
import { Toaster } from "./components/ui/sonner";
import { SQLProvider } from "./components/sql-builder/SQLContext";

export default function App() {
  // 🧩 STEP 1: Initialize based on URL parameters
  const [activeModule, setActiveModule] = useState<"sql" | "web">(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    return tab === "webbuilder" ? "web" : "sql";
  });

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showAIAssistant, setShowAIAssistant] = useState(false);

  // 🔑 SQL and Web states
  const [activeTool, setActiveTool] = useState("editor");
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("tab") === "webbuilder" ? "export" : "dashboard";
  });

  const addChartRef = useRef<(() => void) | null>(null);

  const handleAIAssistantToggle = () => {
    setShowAIAssistant(!showAIAssistant);
    setActiveTool("ai");
  };

  // 🧩 STEP 2: Respond to query param changes dynamically
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (tab === "webbuilder") {
      setActiveModule("web");
      setActiveTab("export");
    } else {
      setActiveModule("sql");
    }
  }, []);

  return (
    <DataProvider>
      <SQLProvider>
        <div className="h-screen flex flex-col bg-background">
          {/* Header */}
          <Header
            activeModule={activeModule}
            setActiveModule={setActiveModule}
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
          />

          <div className="flex flex-1 min-h-0 overflow-hidden">
            {/* ✅ Global Sidebar */}
            <Sidebar
              isOpen={sidebarOpen}
              activeModule={activeModule}
              onModuleChange={setActiveModule}
              activeTool={activeTool}
              setActiveTool={setActiveTool}
              onAIAssistantClick={handleAIAssistantToggle}
              onAddChart={() => addChartRef.current?.()}
              onChangeTab={(tab) => {
                if (activeModule === "web") {
                  setActiveTab(tab);
                } else {
                  setActiveTool(tab);
                }
              }}
            />

            {/* Main content */}
            <main className="flex-1 min-h-0 flex flex-col">
              {activeModule === "sql" ? (
                <SQLBuilder
                  activeTool={activeTool}
                  setActiveTool={setActiveTool}
                  showAIAssistant={showAIAssistant}
                  setShowAIAssistant={setShowAIAssistant}
                />
              ) : (
                <WebBuilder
                  addChartRef={addChartRef}
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                />
              )}
            </main>
          </div>

          <Toaster />
        </div>
      </SQLProvider>
    </DataProvider>
  );
}
