import { useState } from 'react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Slider } from '../ui/slider';
import { ChartConfig } from '../../services/api';

interface ChartConfigPanelProps {
  chart: ChartConfig;
  onUpdateChart: (mode: "preview" | "apply" | "cancel", updates: Partial<ChartConfig>) => void;
  onClose?: () => void;
}

const normalizeChart = (chart: Partial<ChartConfig>): ChartConfig => ({
  id: chart.id || `chart-${Date.now()}`,
  type: chart.type || "bar",
  title: chart.title || "Untitled Chart",
  data: chart.data || [],
  x: chart.x || "",
  y: chart.y || "",
  position: chart.position || { x: 0, y: 0 },
  size: chart.size || { width: 400, height: 300 },
  filters: chart.filters || {},
  legendLabel: chart.legendLabel || ""
});

export function ChartConfigPanel({ chart, onUpdateChart, onClose }: ChartConfigPanelProps) {
  const [localChart, setLocalChart] = useState<ChartConfig>(normalizeChart(chart));

  const handlePreview = (updates: Partial<ChartConfig>) => {
    setLocalChart(prev => normalizeChart({ ...prev, ...updates }));
    onUpdateChart('preview', updates);
  };

  const handleApply = () => {
    const normalized = normalizeChart(localChart);
    onUpdateChart('apply', normalized);
    if (onClose) onClose();
  };

  const handleReset = () => {
    const reset = normalizeChart(chart);
    setLocalChart(reset);
    onUpdateChart('preview', {});
  };

  const handleCancel = () => {
    const reset = normalizeChart(chart);
    setLocalChart(reset);
    onUpdateChart('cancel', {});
    if (onClose) onClose();
  };

  const availableColumns = localChart.data.length > 0 ? Object.keys(localChart.data[0]) : [];
  const numericColumns = availableColumns.filter(col =>
    localChart.data.some(row => typeof row[col] === 'number' && !isNaN(row[col]))
  );

  const chartTypeOptions = [
    { value: 'bar', label: 'Bar Chart', icon: '📊' },
    { value: 'line', label: 'Line Chart', icon: '📈' },
    { value: 'pie', label: 'Pie Chart', icon: '🥧' },
    { value: 'scatter', label: 'Scatter Plot', icon: '🔘' },
    { value: 'heatmap', label: 'Heatmap', icon: '🔥' },
    { value: 'treemap', label: 'Treemap', icon: '🌳' },
    { value: 'geo', label: 'Geographic', icon: '🗺️' }
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-6 p-4">

        {/* Basic Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Basic Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="chart-title">Chart Title</Label>
              <Input
                id="chart-title"
                value={localChart.title}
                onChange={(e) => handlePreview({ title: e.target.value })}
                onBlur={(e) => onUpdateChart("apply", { title: e.target.value })}
                placeholder="Enter chart title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="chart-type">Chart Type</Label>
              <Select
                value={localChart.type}
                onValueChange={(value: ChartConfig['type']) => handlePreview({ type: value })}
                onBlur={() => onUpdateChart("apply", { type: localChart.type })}
              >
                <SelectTrigger id="chart-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {chartTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <span>{option.icon}</span>
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="legend-label">Legend Label</Label>
              <Input
                id="legend-label"
                value={localChart.legendLabel || ""}
                onChange={(e) => handlePreview({ legendLabel: e.target.value })}
                onBlur={(e) => onUpdateChart("apply", { legendLabel: e.target.value })}
                placeholder="Enter legend label (optional)"
              />
            </div>
          </CardContent>
        </Card>

        {/* Data Mapping */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Data Mapping</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="x-axis">X-Axis {localChart.type === 'pie' ? '(Categories)' : ''}</Label>
              <Select
                value={localChart.x}
                onValueChange={(value: string) => handlePreview({ x: value })}
                onBlur={() => onUpdateChart("apply", { x: localChart.x })}
              >
                <SelectTrigger id="x-axis">
                  <SelectValue placeholder="Select column" />
                </SelectTrigger>
                <SelectContent>
                  {availableColumns.map((column) => (
                    <SelectItem key={column} value={column}>
                      <div className="flex items-center justify-between w-full">
                        <span>{column}</span>
                        <Badge
                          variant={numericColumns.includes(column) ? 'default' : 'secondary'}
                          className="ml-2 text-xs"
                        >
                          {numericColumns.includes(column) ? 'Number' : 'Text'}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="y-axis">Y-Axis {localChart.type === 'pie' ? '(Values)' : ''}</Label>
              <Select
                value={localChart.y}
                onValueChange={(value: string) => handlePreview({ y: value })}
                onBlur={() => onUpdateChart("apply", { y: localChart.y })}
              >
                <SelectTrigger id="y-axis">
                  <SelectValue placeholder="Select column" />
                </SelectTrigger>
                <SelectContent>
                  {availableColumns.map((column) => (
                    <SelectItem key={column} value={column}>
                      <div className="flex items-center justify-between w-full">
                        <span>{column}</span>
                        <Badge
                          variant={numericColumns.includes(column) ? 'default' : 'secondary'}
                          className="ml-2 text-xs"
                        >
                          {numericColumns.includes(column) ? 'Number' : 'Text'}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Size & Position */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Size & Position</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Width: {localChart.size.width}px</Label>
                <Slider
                  value={[localChart.size.width]}
                  onValueChange={(value: number[]) => handlePreview({ size: { ...localChart.size, width: value[0] } })}
                  min={200}
                  max={800}
                  step={50}
                />
              </div>
              <div className="space-y-2">
                <Label>Height: {localChart.size.height}px</Label>
                <Slider
                  value={[localChart.size.height]}
                  onValueChange={(value: number[]) => handlePreview({ size: { ...localChart.size, height: value[0] } })}
                  onValueCommit={(value: number[]) => onUpdateChart("apply", { size: { ...localChart.size, height: value[0] } })}
                  min={200}
                  max={600}
                  step={50}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pos-x">X Position</Label>
                <Input
                  id="pos-x"
                  type="number"
                  value={localChart.position.x}
                  onChange={(e) => handlePreview({ position: { ...localChart.position, x: parseInt(e.target.value) || 0 } })}
                  onBlur={(e) => onUpdateChart("apply", { position: { ...localChart.position, x: parseInt(e.target.value) || 0 } })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pos-y">Y Position</Label>
                <Input
                  id="pos-y"
                  type="number"
                  value={localChart.position.y}
                  onChange={(e) => handlePreview({ position: { ...localChart.position, y: parseInt(e.target.value) || 0 } })}
                  onBlur={(e) => onUpdateChart("apply", { position: { ...localChart.position, y: parseInt(e.target.value) || 0 } })}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="flex gap-2 p-4 border-t bg-background shrink-0">
        <Button onClick={handleApply} className="flex-1">Apply Changes</Button>
        <Button variant="outline" onClick={handleReset}>Reset</Button>
        <Button variant="ghost" onClick={handleCancel}>Cancel</Button>
      </div>
    </div>
  );
}
