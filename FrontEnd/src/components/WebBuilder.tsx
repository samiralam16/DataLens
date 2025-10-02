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
}

export function WebBuilder({ addChartRef }: WebBuilderProps) {
  const { analyzedData, dataSources } = useData();
  const [charts, setCharts] = useState<ChartConfig[]>([]);
  const [filters, setFilters] = useState<FilterConfig[]>([]);
  const [selectedChart, setSelectedChart] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'charts' | 'export'>('dashboard');

  // Get current data from context (analyzed data takes priority)
  const currentData = analyzedData || (dataSources.length > 0 ? {
    sourceId: dataSources[0].id,
    query: 'SELECT * FROM data',
    results: dataSources[0].data,
    columns: dataSources[0].columns,
    timestamp: new Date()
  } : null);

  const handleAddChart = (chartType: ChartConfig['type']) => {
    if (!currentData || currentData.results.length === 0) {
      return;
    }

    // Find appropriate columns for the chart
    const numericColumns = currentData.columns.filter(col => col.type === 'number');
    const categoricalColumns = currentData.columns.filter(col => col.type === 'string');
    
    const xColumn = categoricalColumns.length > 0 ? categoricalColumns[0].name : currentData.columns[0]?.name;
    const yColumn = numericColumns.length > 0 ? numericColumns[0].name : currentData.columns[1]?.name || currentData.columns[0]?.name;

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

  // Connect sidebar Add Chart button to default bar chart
  const handleSidebarAddChart = () => {
    handleAddChart('bar');
  };

  // Set up the ref so sidebar can call the function
  useEffect(() => {
    addChartRef.current = handleSidebarAddChart;
  }, [addChartRef, handleSidebarAddChart]);

  const handleUpdateChart = (chartId: string, updates: Partial<ChartConfig>) => {
    setCharts(prev => prev.map(chart => 
      chart.id === chartId ? { ...chart, ...updates } : chart
    ));
  };

  const handleDeleteChart = (chartId: string) => {
    setCharts(prev => prev.filter(chart => chart.id !== chartId));
    if (selectedChart === chartId) {
      setSelectedChart(null);
    }
  };

  const handleAddFilter = (filterConfig: Omit<FilterConfig, 'id'>) => {
    const newFilter: FilterConfig = {
      ...filterConfig,
      id: `filter-${Date.now()}`
    };
    setFilters(prev => [...prev, newFilter]);
  };

  const handleUpdateFilter = (filterId: string, updates: Partial<FilterConfig>) => {
    setFilters(prev => prev.map(filter => 
      filter.id === filterId ? { ...filter, ...updates } : filter
    ));
    
    // Apply filter to all charts
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
      default:
        return (
          <ResizablePanelGroup direction="horizontal" className="h-full">
            <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
              <FilterPanel
                filters={filters}
                onAddFilter={handleAddFilter}
                onUpdateFilter={handleUpdateFilter}
                onDeleteFilter={handleDeleteFilter}
              />
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel defaultSize={60} minSize={40}>
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
            <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
              <ColumnsPanel />
            </ResizablePanel>
          </ResizablePanelGroup>
        );
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Tab Navigation */}
      <div className="border-b border-border p-4">
        <div className="flex items-center gap-1">
          {[
            { key: 'dashboard', label: 'Dashboard' },
            { key: 'charts', label: 'Chart Library' },
            { key: 'export', label: 'Export & Share' }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                activeTab === key 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1">
        {renderContent()}
      </div>
    </div>
  );
}