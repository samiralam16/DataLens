import { useState, useEffect, MutableRefObject } from 'react';
import { DashboardBuilder } from './web-builder/DashboardBuilder';
import { ChartLibrary } from './web-builder/ChartLibrary';
import { FilterPanel } from './web-builder/FilterPanel';
import { ExportShare } from './web-builder/ExportShare';
import { ColumnsPanel } from './web-builder/ColumnsPanel';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from './ui/resizable';
import { useData } from './DataContext';

// ✅ UI select components
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from './ui/select';

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
  const { analyzedData, dataSources, setAnalyzedData, setActiveDataset, activeDatasetId, getDashboard, saveDashboard } = useData();

  // ✅ initialize charts from context once
  const [charts, setCharts] = useState<ChartConfig[]>(
    () => (activeDatasetId ? getDashboard(activeDatasetId) : [])
  );
  const [filters, setFilters] = useState<FilterConfig[]>([]);
  const [selectedChart, setSelectedChart] = useState<string | null>(null);

  // ✅ derive current dataset
  const currentData =
    analyzedData ||
    (dataSources.length > 0 && activeDatasetId
      ? dataSources.find((ds) => ds.id === activeDatasetId)
      : dataSources[0] || null);

  // ✅ auto-select latest dataset when new one added
  useEffect(() => {
    if (dataSources.length > 0 && !activeDatasetId) {
      const lastDataset = dataSources[dataSources.length - 1];
      setActiveDataset(lastDataset.id);
      setAnalyzedData({
        sourceId: lastDataset.id,
        query: 'SELECT * FROM data',
        results: lastDataset.data,
        columns: lastDataset.columns,
        timestamp: new Date(),
      });
      setCharts(getDashboard(lastDataset.id)); // restore charts if any
    }
  }, [dataSources, activeDatasetId, setActiveDataset, setAnalyzedData, getDashboard]);

  // ✅ save to context whenever charts change
  useEffect(() => {
    if (activeDatasetId) {
      saveDashboard(activeDatasetId, charts);
    }
  }, [charts, activeDatasetId, saveDashboard]);

  // ✅ handle dataset selection change
  const handleDatasetChange = (datasetId: string) => {
    setActiveDataset(datasetId);
    const ds = dataSources.find((d) => d.id === datasetId);
    if (ds) {
      setAnalyzedData({
        sourceId: ds.id,
        query: 'SELECT * FROM data',
        results: ds.data,
        columns: ds.columns,
        timestamp: new Date(),
      });
      setCharts(getDashboard(datasetId)); // ✅ restore dashboard
      setFilters([]);
      setSelectedChart(null); // ✅ clear selection when switching dataset
    }
  };

  const handleAddChart = (chartType: ChartConfig['type']) => {
    if (!currentData || currentData.results.length === 0) return;

    const newChart: ChartConfig = {
      id: `chart-${Date.now()}`,
      type: chartType,
      title: `${chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart`,
      data: currentData.results,
      x: '',
      y: '',
      position: { x: charts.length * 50, y: charts.length * 50 },
      size: { width: 400, height: 300 },
      filters: {},
    };

    setCharts((prev) => [...prev, newChart]);
    setSelectedChart(newChart.id);
  };

  const handleUpdateChart = (
    chartId: string,
    updates: Partial<ChartConfig>,
    mode: 'preview' | 'apply' = 'apply'
  ) => {
    setCharts((prev) =>
      prev.map((chart) =>
        chart.id === chartId ? { ...chart, ...updates } : chart
      )
    );

    if (mode === 'apply') {
      console.log(`Chart ${chartId} saved with updates:`, updates);
    }
  };

  const handleDeleteChart = (chartId: string) => {
    setCharts((prev) => prev.filter((chart) => chart.id !== chartId));
    if (selectedChart === chartId) setSelectedChart(null);
  };

  const handleAddFilter = (filterConfig: Omit<FilterConfig, 'id'>) => {
    const newFilter: FilterConfig = { ...filterConfig, id: `filter-${Date.now()}` };
    setFilters((prev) => [...prev, newFilter]);
  };

  const handleUpdateFilter = (filterId: string, updates: Partial<FilterConfig>) => {
    setFilters((prev) =>
      prev.map((filter) => (filter.id === filterId ? { ...filter, ...updates } : filter))
    );
    const filter = filters.find((f) => f.id === filterId);
    if (filter) {
      setCharts((prev) =>
        prev.map((chart) => ({
          ...chart,
          filters: { ...chart.filters, [filter.column]: updates.value },
        }))
      );
    }
  };

  const handleDeleteFilter = (filterId: string) => {
    setFilters((prev) => prev.filter((filter) => filter.id !== filterId));
  };

  // ✅ content rendering
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
        return <ExportShare charts={charts} filters={filters} />;

      case 'filters':
        return (
          <ResizablePanelGroup direction="horizontal" className="h-full">
            <ResizablePanel defaultSize={25} minSize={20} maxSize={35}>
              <FilterPanel
                filters={filters}
                onAddFilter={handleAddFilter}
                onUpdateFilter={handleUpdateFilter}
                onDeleteFilter={handleDeleteFilter}
              />
            </ResizablePanel>
            <ResizableHandle />
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
            <ResizablePanel defaultSize={25} minSize={20} maxSize={35}>
              <ColumnsPanel />
            </ResizablePanel>
          </ResizablePanelGroup>
        );
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* ✅ Dataset selector at the top */}
      <div className="border-b border-border p-4 flex items-center gap-3">
        <span className="text-sm font-medium">Dataset:</span>
        <Select
          onValueChange={handleDatasetChange}
          value={activeDatasetId || ''}
        >
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Choose dataset" />
          </SelectTrigger>
          <SelectContent>
            {dataSources.length === 0 ? (
              <SelectItem value="__none" disabled>
                No datasets available
              </SelectItem>
            ) : (
              dataSources.map((ds) => (
                <SelectItem key={ds.id} value={ds.id}>
                  {ds.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Main content */}
      <div className="flex-1">{renderContent()}</div>
    </div>
  );
}
