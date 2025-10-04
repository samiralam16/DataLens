import { useState, useEffect, MutableRefObject } from 'react';
import { DashboardBuilder } from './web-builder/DashboardBuilder';
import { ChartLibrary } from './web-builder/ChartLibrary';
import { FilterPanel } from './web-builder/FilterPanel';
import { ExportShare } from './web-builder/ExportShare';
import { ColumnsPanel } from './web-builder/ColumnsPanel';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from './ui/resizable';
import { useData } from './DataContext';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from './ui/select';
import {
  ChartConfig,
  saveDashboard as apiSaveDashboard,
  listDashboards,
  loadDashboard,
  Dashboard,
} from '../services/api';
import { Button } from './ui/button';
import { Input } from './ui/input';

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
  const {
    analyzedData,
    dataSources,
    setAnalyzedData,
    setActiveDataset,
    activeDatasetId,
    getDashboard,
    saveDashboard,
  } = useData();

  const [charts, setCharts] = useState<ChartConfig[]>([]);
  const [filters, setFilters] = useState<FilterConfig[]>([]);
  const [selectedChart, setSelectedChart] = useState<string | null>(null);

  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [newDashboardName, setNewDashboardName] = useState('');

  // ✅ Current dataset
  const currentDataset = dataSources.find((ds) => ds.id === activeDatasetId) || null;
  const currentData = analyzedData || currentDataset;

  // ✅ Reset UI if no dataset selected
  useEffect(() => {
    if (!activeDatasetId) {
      setCharts([]);
      setFilters([]);
      setSelectedChart(null);
      setAnalyzedData(null);
      setDashboards([]);
      return;
    }

    // ✅ Restore charts for selected dataset (if saved)
    const ds = dataSources.find((d) => d.id === activeDatasetId);
    if (ds) {
      setAnalyzedData({
        sourceId: ds.id,
        query: 'SELECT * FROM data',
        results: ds.data,
        columns: ds.columns,
        timestamp: new Date(),
      });
      setCharts(getDashboard(ds.id)); // restore local memory charts
      fetchDashboards(ds.backendId);
    }
  }, [activeDatasetId, dataSources]);

  // ✅ Persist dashboard in memory
  useEffect(() => {
    if (activeDatasetId) saveDashboard(activeDatasetId, charts);
  }, [charts, activeDatasetId, saveDashboard]);

  // ✅ Handle dataset selection
  const handleDatasetChange = (datasetId: string) => {
    if (!datasetId || datasetId === '__none') return;

    setActiveDataset(datasetId);
    const ds = dataSources.find((d) => d.id === datasetId);
    if (!ds) return;

    setAnalyzedData({
      sourceId: ds.id,
      query: 'SELECT * FROM data',
      results: ds.data,
      columns: ds.columns,
      timestamp: new Date(),
    });

    setCharts(getDashboard(ds.id));
    setFilters([]);
    setSelectedChart(null);

    fetchDashboards(ds.backendId);
  };

  // ✅ Fetch dashboards from backend
  const fetchDashboards = async (datasetId: number) => {
    try {
      const list = await listDashboards(datasetId);
      if (list.length > 0) {
        setDashboards(list);
        // don’t auto-load dashboard, let user pick manually
      } else {
        setDashboards([]);
      }
    } catch (err) {
      console.error('Failed to fetch dashboards:', err);
      setDashboards([]);
    }
  };

  // ✅ Save dashboard to backend
  const handleSaveToDB = async () => {
    if (!currentDataset || charts.length === 0 || !newDashboardName.trim()) {
      alert('⚠️ Please select a dataset, name your dashboard, and add charts.');
      return;
    }
    try {
      const saved = await apiSaveDashboard(currentDataset.backendId, newDashboardName, charts);
      alert(`✅ Saved dashboard "${saved.name}"`);
      setNewDashboardName('');
      fetchDashboards(currentDataset.backendId);
    } catch (err) {
      console.error('Save failed:', err);
      alert('❌ Failed to save dashboard');
    }
  };

  // ✅ Load dashboard
  const handleLoadFromDB = async (id: number) => {
    try {
      const dbDashboard = await loadDashboard(id);
      setCharts(dbDashboard.config);
      alert(`✅ Loaded dashboard "${dbDashboard.name}"`);
    } catch (err) {
      console.error('Load failed:', err);
      alert('❌ Failed to load dashboard');
    }
  };

  // ✅ Chart handlers
  const handleAddChart = (chartType: ChartConfig['type']) => {
    if (!currentData || !currentData.results?.length) return;

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
      prev.map((chart) => (chart.id === chartId ? { ...chart, ...updates } : chart))
    );
  };

  const handleDeleteChart = (chartId: string) => {
    setCharts((prev) => prev.filter((c) => c.id !== chartId));
    if (selectedChart === chartId) setSelectedChart(null);
  };

  // ✅ Filter handlers
  const handleAddFilter = (filter: Omit<FilterConfig, 'id'>) =>
    setFilters((prev) => [...prev, { ...filter, id: `filter-${Date.now()}` }]);

  const handleUpdateFilter = (filterId: string, updates: Partial<FilterConfig>) => {
    setFilters((prev) => prev.map((f) => (f.id === filterId ? { ...f, ...updates } : f)));

    const filter = filters.find((f) => f.id === filterId);
    if (!filter) return;

    setCharts((prev) =>
      prev.map((chart) => ({
        ...chart,
        filters: { ...chart.filters, [filter.column]: updates.value },
      }))
    );
  };

  const handleDeleteFilter = (filterId: string) =>
    setFilters((prev) => prev.filter((f) => f.id !== filterId));

  // ✅ Render content
  const renderContent = () => {
    if (!activeDatasetId) {
      return (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          Please select a dataset to start building a dashboard.
        </div>
      );
    }

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
            <ResizablePanel defaultSize={25} minSize={20} maxSize={30}>
              <FilterPanel
                filters={filters}
                onAddFilter={handleAddFilter}
                onUpdateFilter={handleUpdateFilter}
                onDeleteFilter={handleDeleteFilter}
                charts={charts}
                selectedChart={selectedChart}
                onSelectChart={setSelectedChart}
                onAddChart={handleAddChart}
                onUpdateChart={handleUpdateChart}
                onDeleteChart={handleDeleteChart}
              />
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel defaultSize={50} minSize={30}>
              <div id="dashboard-area" className="flex-1 p-4 bg-white">
                <DashboardBuilder
                  charts={charts}
                  selectedChart={selectedChart}
                  onSelectChart={setSelectedChart}
                  onAddChart={handleAddChart}
                  onUpdateChart={handleUpdateChart}
                  onDeleteChart={handleDeleteChart}
                  filters={filters}
                />
              </div>
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel defaultSize={25} minSize={20} maxSize={35}>
              <ColumnsPanel />
            </ResizablePanel>
          </ResizablePanelGroup>
        );
      default:
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
      {/* Dataset selector */}
      <div className="border-b border-border p-4 flex items-center gap-3">
        <span className="text-sm font-medium">Dataset:</span>
        <Select
          onValueChange={handleDatasetChange}
          value={activeDatasetId ?? undefined}
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
                <SelectItem key={ds.id} value={String(ds.id)}>
                  {ds.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>

        {/* Save / Load controls */}
        <div className="flex items-center gap-2 ml-auto">
          <Input
            placeholder="Dashboard name"
            value={newDashboardName}
            onChange={(e) => setNewDashboardName(e.target.value)}
            className="w-48"
          />
          <Button type="button" onClick={handleSaveToDB}>
            Save
          </Button>

          <Select onValueChange={(val) => handleLoadFromDB(Number(val))}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Load Dashboard" />
            </SelectTrigger>
            <SelectContent>
              {dashboards.length === 0 ? (
                <SelectItem value="__none" disabled>
                  No saved dashboards
                </SelectItem>
              ) : (
                dashboards.map((db) => (
                  <SelectItem key={db.id} value={db.id.toString()}>
                    {db.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex-1">{renderContent()}</div>
    </div>
  );
}
