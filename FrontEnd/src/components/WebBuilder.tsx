// src/components/WebBuilder.tsx
import { useState } from "react";
import { DashboardBuilder } from "./web-builder/DashboardBuilder";
import { FilterPanel } from "./web-builder/FilterPanel";
import { ExportShare } from "./web-builder/ExportShare";
import { ColumnsPanel } from "./web-builder/ColumnsPanel";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "./ui/resizable";
import { useData } from "./DataContext";

export interface ChartConfig {
  id: string;
  type: "bar" | "line" | "pie" | "scatter" | "heatmap" | "treemap" | "geo";
  title: string;
  data: any[];
  x: string; // leave empty until user picks
  y: string; // leave empty until user picks
  position: { x: number; y: number };
  size: { width: number; height: number };
  filters: Record<string, any>;
}

export interface FilterConfig {
  id: string;
  type: "slider" | "select" | "checkbox" | "radio" | "date";
  label: string;
  column: string;
  options?: string[];
  range?: { min: number; max: number };
  value: any;
}

interface WebBuilderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  addChartRef?: React.MutableRefObject<(() => void) | null>;
}

export function WebBuilder({ activeTab, setActiveTab, addChartRef }: WebBuilderProps) {
  const { dataSources, activeDatasetId, setActiveDataset } = useData();
  const [charts, setCharts] = useState<ChartConfig[]>([]);
  const [filters, setFilters] = useState<FilterConfig[]>([]);
  const [selectedChart, setSelectedChart] = useState<string | null>(null);

  // ✅ Only pick dataset if user explicitly selected one
  const currentSource = activeDatasetId
    ? dataSources.find((ds) => ds.tableName === activeDatasetId)
    : null;

  const currentData = currentSource
    ? {
        sourceId: currentSource.tableName,
        query: currentSource.query ?? "SELECT * FROM data",
        results: currentSource.data ?? currentSource.results ?? [],
        columns: currentSource.columns ?? [],
        timestamp: new Date(),
      }
    : null;

  // ✅ Add Chart without pre-selecting columns
  const handleAddChart = (chartType: ChartConfig["type"]) => {
    if (!currentData) {
      alert("Please select a dataset before adding charts.");
      return;
    }

    const results = currentData.results ?? [];

    const newChart: ChartConfig = {
      id: `chart-${Date.now()}`,
      type: chartType,
      title: `${chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart`,
      data: results,
      x: "", // user will pick later
      y: "", // user will pick later
      position: { x: charts.length * 48, y: charts.length * 48 },
      size: { width: 420, height: 300 },
      filters: {},
    };

    setCharts((p) => [...p, newChart]);
    setSelectedChart(newChart.id);
    setActiveTab("dashboard");
  };

  // expose addChart so sidebar button can call it
  if (addChartRef) {
    addChartRef.current = () => handleAddChart("bar");
  }

  const renderContent = () => {
    if (!currentData) {
      return (
        <div className="h-full flex items-center justify-center text-muted-foreground">
          Please select a dataset to start building your dashboard.
        </div>
      );
    }

    switch (activeTab) {
      case "export":
        return <ExportShare charts={charts} filters={filters} />;

      case "filters":
        return (
          <ResizablePanelGroup direction="horizontal" className="h-full">
            <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
              <FilterPanel
                filters={filters}
                onAddFilter={(cfg) =>
                  setFilters((p) => [...p, { ...cfg, id: `filter-${Date.now()}` }])
                }
                onUpdateFilter={(fid, updates) =>
                  setFilters((prev) =>
                    prev.map((f) => (f.id === fid ? { ...f, ...updates } : f))
                  )
                }
                onDeleteFilter={(fid) =>
                  setFilters((prev) => prev.filter((f) => f.id !== fid))
                }
              />
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel defaultSize={75} minSize={40}>
              <DashboardBuilder
                charts={charts}
                selectedChart={selectedChart}
                onSelectChart={setSelectedChart}
                onAddChart={handleAddChart}
                onUpdateChart={(id, updates) =>
                  setCharts((prev) =>
                    prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
                  )
                }
                onDeleteChart={(id) =>
                  setCharts((prev) => prev.filter((c) => c.id !== id))
                }
                filters={filters}
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        );

      case "settings":
        return <div className="p-4">⚙️ Settings (coming soon)</div>;

      default:
        return (
          <ResizablePanelGroup direction="horizontal" className="h-full">
            <ResizablePanel defaultSize={80} minSize={60}>
              <DashboardBuilder
                charts={charts}
                selectedChart={selectedChart}
                onSelectChart={setSelectedChart}
                onAddChart={handleAddChart}
                onUpdateChart={(id, updates) =>
                  setCharts((prev) =>
                    prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
                  )
                }
                onDeleteChart={(id) =>
                  setCharts((prev) => prev.filter((c) => c.id !== id))
                }
                filters={filters}
              />
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
              <ColumnsPanel />
            </ResizablePanel>
          </ResizablePanelGroup>
        );
    }
  };

  return (
    <div className="h-full flex flex-col">
      {dataSources.length > 0 && (
        <div className="p-2 border-b flex items-center gap-2">
          <label className="text-sm">Dataset:</label>
          <select
            className="border rounded px-2 py-1 text-sm"
            value={activeDatasetId ?? ""}
            onChange={(e) => setActiveDataset(e.target.value)}
          >
            <option value="">-- Select Dataset --</option>
            {dataSources.map((ds) => (
              <option key={ds.id} value={ds.tableName}>
                {ds.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex-1">{renderContent()}</div>
    </div>
  );
}
