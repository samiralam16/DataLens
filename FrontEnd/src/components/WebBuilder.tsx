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
  Dashboard
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
    refreshDatasets,
    getActiveFilteredRows,
  } = useData();

  const [charts, setCharts] = useState<ChartConfig[]>([]);
  const [filters, setFilters] = useState<FilterConfig[]>([]);
  const [selectedChart, setSelectedChart] = useState<string | null>(null);

  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [newDashboardName, setNewDashboardName] = useState('');

  // Fetch datasets on mount
  useEffect(() => {
    refreshDatasets();
  }, [refreshDatasets]);

  const currentDataset = dataSources.find((ds) => ds.id === activeDatasetId) || null;
  const filteredRows = getActiveFilteredRows();
  const currentData = {
  ...((analyzedData || currentDataset) ?? {}),
  results: filteredRows.length > 0 ? filteredRows : (analyzedData?.results || currentDataset?.data || []),
  };
  // ✅ Keep analyzedData in sync with the selected dataset
  useEffect(() => {
    if (currentDataset && (!analyzedData || analyzedData.sourceId !== currentDataset.id)) {
      setAnalyzedData({
        sourceId: currentDataset.id,
        query: 'SELECT * FROM data',
        results: currentDataset.data,
        columns: currentDataset.columns,
        timestamp: new Date(),
      });
    }
  }, [currentDataset, analyzedData, setAnalyzedData]);

  // Reset only if no dataset is selected
  useEffect(() => {
    if (!activeDatasetId) {
      setCharts([]);
      // setFilters([]);   
      setSelectedChart(null);
      setAnalyzedData(null);
      setDashboards([]);
      return;
    }

    const ds = dataSources.find((d) => d.id === activeDatasetId);
    if (ds) {
      setAnalyzedData({
        sourceId: ds.id,
        query: 'SELECT * FROM data',
        results: ds.data,
        columns: ds.columns,
        timestamp: new Date(),
      });
      setCharts(getDashboard(ds.id));
      fetchDashboards(ds.backendId);
    }
  }, [activeDatasetId, dataSources]);

  // Persist dashboard in memory
  useEffect(() => {
    if (activeDatasetId) saveDashboard(activeDatasetId, charts);
  }, [charts, activeDatasetId, saveDashboard]);

  // Handle dataset change
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

    const restoredCharts = getDashboard(ds.id);
    setCharts(restoredCharts);

    // Restore filters from the selected chart (if any)
    if (selectedChart) {
      const chart = restoredCharts.find((c) => c.id === selectedChart);
      if (chart?.filters) {
        setFilters(
          Object.entries(chart.filters).map(([col, value]) => ({
            id: `filter-${col}`,
            type: 'slider', 
            label: col,
            column: col,
            value,
          }))
        );
      } else {
        setFilters([]);
      }
    } else {
      setFilters([]);
    }

    setSelectedChart(null);
    fetchDashboards(ds.backendId);
  };

  // Fetch dashboards from backend
  const fetchDashboards = async (datasetId: number) => {
    try {
      const list = await listDashboards(datasetId);
      setDashboards(list.length > 0 ? list : []);
    } catch (err) {
      console.error('Failed to fetch dashboards:', err);
      setDashboards([]);
    }
  };

  // Save dashboard to backend
  const handleSaveToDB = async () => {
    if (!currentDataset || charts.length === 0 || !newDashboardName.trim()) {
      alert('⚠️ Please select a dataset, name your dashboard, and add charts.');
      return;
    }
    try {
      const saved = await apiSaveDashboard(currentDataset.backendId, newDashboardName, charts);
      alert(`Saved dashboard "${saved.name}"`);
      setNewDashboardName('');
      fetchDashboards(currentDataset.backendId);
    } catch (err) {
      console.error('Save failed:', err);
      alert('Failed to save dashboard');
    }
  };

  // Load dashboard
  const handleLoadFromDB = async (id: number) => {
    try {
      const dbDashboard = await loadDashboard(id);
      setCharts(dbDashboard.config);
      alert(`Loaded dashboard "${dbDashboard.name}"`);
    } catch (err) {
      console.error('Load failed:', err);
      alert('Failed to load dashboard');
    }
  };

  // Chart handlers
  const handleAddChart = (chartType: ChartConfig['type']) => {
    const dataRows = (currentData as any)?.results || (currentData as any)?.data;

    if (!dataRows || !dataRows.length) {
      alert('⚠️ Please select a dataset before adding a chart.');
      return;
    }

    const newChart: ChartConfig = {
      id: `chart-${Date.now()}`,
      type: chartType,
      title: `${chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart`,
      data: dataRows,
      x: '',
      y: '',
      position: { x: charts.length * 50, y: charts.length * 50 },
      size: { width: 400, height: 300 },
      filters: {},
    };

    setCharts((prev) => [...prev, newChart]);
    setSelectedChart(newChart.id);
    setActiveTab('dashboard');
  };

  const handleUpdateChart = (chartId: string, updates: Partial<ChartConfig>) => {
    setCharts((prev) =>
      prev.map((chart) => (chart.id === chartId ? { ...chart, ...updates } : chart))
    );
  };

  const handleDeleteChart = (chartId: string) => {
    setCharts((prev) => prev.filter((c) => c.id !== chartId));
    if (selectedChart === chartId) setSelectedChart(null);
  };

  // Filter handlers
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

  // Render content
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
      return (
        <div className="h-full w-full relative">
          {/* 👇 Hidden but mounted dashboard (for html2canvas to capture) */}
          <div
            id="dashboard-export-wrapper"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              opacity: 0.01, // invisible but keeps layout
              pointerEvents: "none",
              zIndex: -10,
              minHeight: "100vh",
            }}
          >
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

          {/* Visible export UI */}
          <ExportShare charts={charts} filters={filters} />
        </div>
      );
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
            <ResizablePanel defaultSize={75} minSize={50}>
              <div className="h-full min-h-0 overflow-y-auto p-4 bg-white">
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
              <div className="h-full min-h-0">
                <ColumnsPanel />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        );
      default:
        return (
          <ResizablePanelGroup direction="horizontal" className="h-full">
            <ResizablePanel defaultSize={75} minSize={50}>
              <div className="h-full min-h-0 overflow-y-auto p-4 bg-white">
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
              <div className="h-full min-h-0">
                <ColumnsPanel />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        );
    }
  };

  return (
    <div className="h-full min-h-0 flex flex-col overflow-hidden">
      {/* Dataset selector */}
      <div className="border-b border-border p-4 flex items-center gap-3">
        <span className="text-sm font-medium">Dataset:</span>
        <Select onValueChange={handleDatasetChange} value={activeDatasetId ?? undefined}>
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

      <div className="flex-1 min-h-0 overflow-hidden">{renderContent()}</div>
    </div>
  );
}
