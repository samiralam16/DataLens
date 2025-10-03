// WebBuilder.tsx
import { useState, useRef, useEffect, MutableRefObject } from 'react';
import { DashboardBuilder } from './web-builder/DashboardBuilder';
import { ChartLibrary } from './web-builder/ChartLibrary';
import { FilterPanel } from './web-builder/FilterPanel';
import { ExportShare } from './web-builder/ExportShare';
import { ColumnsPanel } from './web-builder/ColumnsPanel';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from './ui/resizable';
import { useData } from './DataContext';

export interface ChartConfig {
  id: string;
  type: 'bar' | 'line' | 'pie' | 'scatter' | 'heatmap' | 'treemap' | 'geo';
  title: string;
  data: any[];
  x: string;
  y: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  filters: Record<string, any>;
}

export interface FilterConfig {
  id: string;
  type: 'slider' | 'select' | 'checkbox' | 'radio' | 'date';
  label: string;
  column: string;
  options?: string[];
  range?: { min: number; max: number };
  value: any;
}

interface WebBuilderProps {
  addChartRef: MutableRefObject<(() => void) | null>;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function WebBuilder({ addChartRef, activeTab, setActiveTab }: WebBuilderProps) {
  const { analyzedData, dataSources } = useData();
  const [charts, setCharts] = useState<ChartConfig[]>([]);
  const [filters, setFilters] = useState<FilterConfig[]>([]);
  const [selectedChart, setSelectedChart] = useState<string | null>(null);

  // Get current data
  const currentData = analyzedData || (dataSources.length > 0 ? {
    sourceId: dataSources[0].id,
    query: 'SELECT * FROM data',
    results: dataSources[0].data,
    columns: dataSources[0].columns,
    timestamp: new Date()
  } : null);

  const handleAddChart = (chartType: ChartConfig['type']) => {
    if (!currentData || currentData.results.length === 0) return;

    const numericColumns = currentData.columns.filter(col => col.type === 'number');
    const categoricalColumns = currentData.columns.filter(col => col.type === 'string');

    const xColumn = categoricalColumns[0]?.name || currentData.columns[0]?.name;
    const yColumn = numericColumns[0]?.name || currentData.columns[1]?.name || currentData.columns[0]?.name;

    const newChart: ChartConfig = {
      id: `chart-${Date.now()}`,
      type: chartType,
      title: `${chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart`,
      data: currentData.results,
      x: xColumn,
      y: yColumn,
      position: { x: charts.length * 50, y: charts.length * 50 },
      size: { width: 400, height: 300 },
      filters: {}
    };

    setCharts(prev => [...prev, newChart]);
    setSelectedChart(newChart.id);
  };

  const handleUpdateChart = (chartId: string, updates: Partial<ChartConfig>) => {
    setCharts(prev => prev.map(chart => chart.id === chartId ? { ...chart, ...updates } : chart));
  };

  const handleDeleteChart = (chartId: string) => {
    setCharts(prev => prev.filter(chart => chart.id !== chartId));
    if (selectedChart === chartId) setSelectedChart(null);
  };

  const handleAddFilter = (filterConfig: Omit<FilterConfig, 'id'>) => {
    const newFilter: FilterConfig = { ...filterConfig, id: `filter-${Date.now()}` };
    setFilters(prev => [...prev, newFilter]);
  };

  const handleUpdateFilter = (filterId: string, updates: Partial<FilterConfig>) => {
    setFilters(prev => prev.map(filter => filter.id === filterId ? { ...filter, ...updates } : filter));
    const filter = filters.find(f => f.id === filterId);
    if (filter) {
      setCharts(prev => prev.map(chart => ({
        ...chart,
        filters: { ...chart.filters, [filter.column]: updates.value }
      })));
    }
  };

  const handleDeleteFilter = (filterId: string) => {
    setFilters(prev => prev.filter(filter => filter.id !== filterId));
  };

  // Main content rendering
  const renderContent = () => {
      switch (activeTab) {
        case 'charts':
          return (
            <ChartLibrary
              onAddChart={handleAddChart}
              existingCharts={charts}
              onUpdateChart={handleUpdateChart}
            />
          );

        case 'export':
          return (
            <ExportShare
              charts={charts}
              filters={filters}
            />
          );

        case 'filters':
          return (
            <ResizablePanelGroup direction="horizontal" className="h-full">
              {/* Left: Filters */}
              <ResizablePanel defaultSize={25} minSize={20} maxSize={35}>
                <FilterPanel
                  filters={filters}
                  onAddFilter={handleAddFilter}
                  onUpdateFilter={handleUpdateFilter}
                  onDeleteFilter={handleDeleteFilter}
                />
              </ResizablePanel>
              <ResizableHandle />
              {/* Right: Columns */}
              <ResizablePanel defaultSize={75} minSize={40}>
                <ColumnsPanel />
              </ResizablePanel>
            </ResizablePanelGroup>
          );

        case 'settings':
          return (
            <div className="p-6 text-sm text-muted-foreground">
              <h3 className="text-lg font-semibold mb-2">Settings</h3>
              <p>Settings panel coming soon…</p>
            </div>
          );

        default: // dashboard
          return (
            <ResizablePanelGroup direction="horizontal" className="h-full">
              {/* Main dashboard builder */}
              <ResizablePanel defaultSize={75} minSize={50}>
                <DashboardBuilder
                  charts={charts}
                  selectedChart={selectedChart}
                  onSelectChart={setSelectedChart}
                  onAddChart={handleAddChart}
                  onUpdateChart={handleUpdateChart}
                  onDeleteChart={handleDeleteChart}
                  filters={filters}
                />
              </ResizablePanel>
              <ResizableHandle />
              {/* Right: Columns */}
              <ResizablePanel defaultSize={25} minSize={20} maxSize={35}>
                <ColumnsPanel />
              </ResizablePanel>
            </ResizablePanelGroup>
          );
      }
    };


  return (
    <div className="h-full flex flex-col">
      <div className="flex-1">{renderContent()}</div>
    </div>
  );
}
