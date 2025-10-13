import { useState } from 'react';
import { useData } from '../DataContext';
import { Plus, Move, Maximize2, Grid3X3 } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '../ui/dropdown-menu';
import { FilterConfig } from '../WebBuilder';
import { ResizableChart } from './ResizableChart';
import { ChartConfig } from '../../services/api';

interface DashboardBuilderProps {
  charts: ChartConfig[];
  selectedChart: string | null;
  onSelectChart: (chartId: string | null) => void;
  onAddChart: (type: ChartConfig['type']) => void;
  onUpdateChart: (chartId: string, updates: Partial<ChartConfig>, mode?: 'preview' | 'apply' | 'cancel') => void;
  onDeleteChart: (chartId: string) => void;
  filters: FilterConfig[];
}

export function DashboardBuilder({
  charts,
  selectedChart,
  onSelectChart,
  onAddChart,
  onUpdateChart,
  onDeleteChart,
  filters
}: DashboardBuilderProps) {
  const [isGridMode, setIsGridMode] = useState(true);
  const [gridCols, setGridCols] = useState(2);
  const { getActiveFilteredRows } = useData();
  const globalFilteredRows = getActiveFilteredRows();

  const [tempEdits, setTempEdits] = useState<Record<string, Partial<ChartConfig>>>({});
  const [lastApplied, setLastApplied] = useState<Record<string, ChartConfig>>({});

  const chartTypes: { type: ChartConfig['type']; label: string; icon: string }[] = [
    { type: 'bar', label: 'Bar Chart', icon: '📊' },
    { type: 'line', label: 'Line Chart', icon: '📈' },
    { type: 'pie', label: 'Pie Chart', icon: '🥧' },
    { type: 'scatter', label: 'Scatter Plot', icon: '🔘' },
    { type: 'heatmap', label: 'Heatmap', icon: '🔥' },
    { type: 'treemap', label: 'Treemap', icon: '🌳' },
    { type: 'geo', label: 'Geographic', icon: '🗺️' }
  ];

  const applyFiltersToData = (chartData: any[], chartFilters: Record<string, any>) => {
    if (!Array.isArray(chartData) || chartData.length === 0) return chartData;

    let filteredData = [...chartData];
    filters.forEach(filter => {
      const filterValue =
        chartFilters[filter.column] !== undefined
          ? chartFilters[filter.column]
          : (filter as any).value;

      if (filterValue === undefined || filterValue === null) return;
      if (!Object.prototype.hasOwnProperty.call(chartData[0], filter.column)) return;

      filteredData = filteredData.filter(row => {
        switch (filter.type) {
          case 'select':
            return row[filter.column] === filterValue;
          case 'checkbox':
            return Array.isArray(filterValue)
              ? filterValue.includes(row[filter.column])
              : row[filter.column] === filterValue;
          case 'slider':
            const value = Number(row[filter.column]);
            return (
              typeof filterValue === 'object' &&
              value >= (filterValue.min ?? Number.MIN_VALUE) &&
              value <= (filterValue.max ?? Number.MAX_VALUE)
            );
          case 'date':
            const date = new Date(row[filter.column]);
            const start = filterValue.start ? new Date(filterValue.start) : null;
            const end = filterValue.end ? new Date(filterValue.end) : null;
            return (!start || date >= start) && (!end || date <= end);
          default:
            return true;
        }
      });
    });

    return filteredData;
  };

  const getGridColsClass = () => {
    switch (gridCols) {
      case 1: return 'grid-cols-1';
      case 2: return 'grid-cols-1 lg:grid-cols-2';
      case 3: return 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3';
      case 4: return 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-4';
      default: return 'grid-cols-1 lg:grid-cols-2';
    }
  };

  const handleChartUpdate = (
    chartId: string,
    updates: Partial<ChartConfig>,
    mode?: 'preview' | 'apply' | 'cancel'
  ) => {
    if (mode === 'preview') {
      // Only update tempEdits for preview
      setTempEdits(prev => ({ ...prev, [chartId]: { ...prev[chartId], ...updates } }));
    } else if (mode === 'apply') {
      // Apply changes: update main chart, clear tempEdits, update lastApplied
      const finalUpdates = { ...tempEdits[chartId], ...updates };
      onUpdateChart(chartId, finalUpdates, 'apply');
      setLastApplied(prev => ({
        ...prev,
        [chartId]: { ...charts.find(c => c.id === chartId)!, ...finalUpdates }
      }));
      setTempEdits(prev => {
        const { [chartId]: _, ...rest } = prev;
        return rest;
      });
    } else if (mode === 'cancel' || mode === 'reset') {
      // Restore last applied state, clear tempEdits
      if (lastApplied[chartId]) {
        setTempEdits(prev => {
          const { [chartId]: _, ...rest } = prev;
          return rest;
        });
        onUpdateChart(chartId, lastApplied[chartId], mode);
      }
    }
  };

  if (charts.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-muted/10">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <Plus className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-3">Build Your First Dashboard</h3>
          <p className="text-muted-foreground mb-6">
            Start by adding charts to create interactive visualizations and dashboards.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {chartTypes.slice(0, 4).map(chartType => (
              <Button
                key={chartType.type}
                variant="outline"
                className="h-20 flex flex-col gap-2"
                onClick={() => onAddChart(chartType.type)}
              >
                <span className="text-2xl">{chartType.icon}</span>
                <span className="text-sm">{chartType.label}</span>
              </Button>
            ))}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="mt-4">
                More Chart Types
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {chartTypes.slice(4).map(chartType => (
                <DropdownMenuItem
                  key={chartType.type}
                  onClick={() => onAddChart(chartType.type)}
                >
                  <span className="mr-2">{chartType.icon}</span>
                  {chartType.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full min-h-0 flex flex-col bg-background">
      {/* Toolbar */}
      <div className="border-b border-border p-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Dashboard Builder</h2>
          <p className="text-sm text-muted-foreground">
            {isGridMode ? `Grid layout (${gridCols} columns)` : 'Free-form drag and drop view'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            {charts.length} chart{charts.length !== 1 ? 's' : ''}
          </Badge>
          {isGridMode && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Grid3X3 className="h-4 w-4 mr-1" />
                  {gridCols} Cols
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {[1, 2, 3, 4].map(cols => (
                  <DropdownMenuItem
                    key={cols}
                    onClick={() => setGridCols(cols)}
                    className={gridCols === cols ? 'bg-accent' : ''}
                  >
                    {cols} Column{cols !== 1 ? 's' : ''}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Chart
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {chartTypes.map(chartType => (
                <DropdownMenuItem
                  key={chartType.type}
                  onClick={() => onAddChart(chartType.type)}
                >
                  <span className="mr-2">{chartType.icon}</span>
                  {chartType.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsGridMode(!isGridMode)}
          >
            {isGridMode ? <Move className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            {isGridMode ? 'Free Form' : 'Grid View'}
          </Button>
        </div>
      </div>

      {/* ✅ Dashboard content with exportable ID */}
      <div id="dashboard-preview" className="flex-1 min-h-0 overflow-y-auto scroll-smooth bg-white p-6">
        {isGridMode ? (
          <div className={`grid ${getGridColsClass()} gap-6`}>
            {charts.map(chart => {
              const baseData = globalFilteredRows.length > 0 ? globalFilteredRows : chart.data;
              const filteredData = applyFiltersToData(baseData, chart.filters);
              const preview = tempEdits[chart.id] || {};
              const previewChart = { ...chart, ...preview, data: filteredData };
              return (
                <ResizableChart
                  key={chart.id}
                  chart={previewChart}
                  isSelected={selectedChart === chart.id}
                  onSelect={() => onSelectChart(chart.id)}
                  onUpdate={(updates, mode) => handleChartUpdate(chart.id, updates, mode)}
                  onDelete={() => onDeleteChart(chart.id)}
                  isGridMode={true}
                />
              );
            })}
          </div>
        ) : (
          <div
            className="relative w-full h-full min-h-[800px] bg-grid-pattern p-4"
            onClick={() => onSelectChart(null)}
          >
            {charts.map(chart => {
              const baseData = globalFilteredRows.length > 0 ? globalFilteredRows : chart.data;
              const filteredData = applyFiltersToData(baseData, chart.filters);
              const preview = tempEdits[chart.id] || {};
              const previewChart = { ...chart, ...preview, data: filteredData };
              return (
                <ResizableChart
                  key={chart.id}
                  chart={previewChart}
                  isSelected={selectedChart === chart.id}
                  onSelect={() => onSelectChart(chart.id)}
                  onUpdate={(updates, mode) => handleChartUpdate(chart.id, updates, mode)}
                  onDelete={() => onDeleteChart(chart.id)}
                  isGridMode={false}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
