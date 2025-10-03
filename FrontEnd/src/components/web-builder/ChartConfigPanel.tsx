import { useState } from 'react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Slider } from '../ui/slider';
import { ChartConfig } from '../WebBuilder';

interface ChartConfigPanelProps {
  chart: ChartConfig;
  // mode = "preview" for live update, "apply" for commit, "cancel" to discard
  onUpdateChart: (mode: "preview" | "apply" | "cancel", updates: Partial<ChartConfig>) => void;
  onClose?: () => void;
}

export function ChartConfigPanel({ chart, onUpdateChart, onClose }: ChartConfigPanelProps) {
  const [localChart, setLocalChart] = useState(chart);

  const handlePreview = (updates: Partial<ChartConfig>) => {
    const newChart = { ...localChart, ...updates };
    setLocalChart(newChart);
    onUpdateChart("preview", updates);
  };

  const handleApply = () => {
    onUpdateChart("apply", localChart);
    if (onClose) onClose();
  };

  const handleReset = () => {
    setLocalChart(chart);
    onUpdateChart("preview", chart);
  };

  const handleCancel = () => {
    setLocalChart(chart);
    onUpdateChart("cancel", {}); 
    if (onClose) onClose();
  };

  const availableColumns = chart.data.length > 0 ? Object.keys(chart.data[0]) : [];
  const numericColumns = availableColumns.filter(col =>
    chart.data.some(row => typeof row[col] === 'number' && !isNaN(row[col]))
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
      {/* Scrollable content */}
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
                placeholder="Enter chart title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="chart-type">Chart Type</Label>
              <Select
                value={localChart.type}
                onValueChange={(value: ChartConfig['type']) => handlePreview({ type: value })}
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
              <Select value={localChart.x} onValueChange={(value) => handlePreview({ x: value })}>
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
              <Select value={localChart.y} onValueChange={(value) => handlePreview({ y: value })}>
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

            {localChart.type === 'scatter' && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  💡 For scatter plots, both X and Y axes should be numeric columns for best results.
                </p>
              </div>
            )}
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
                  onValueChange={([width]) =>
                    handlePreview({ size: { ...localChart.size, width } })
                  }
                  min={200}
                  max={800}
                  step={50}
                />
              </div>
              <div className="space-y-2">
                <Label>Height: {localChart.size.height}px</Label>
                <Slider
                  value={[localChart.size.height]}
                  onValueChange={([height]) =>
                    handlePreview({ size: { ...localChart.size, height } })
                  }
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
                  onChange={(e) =>
                    handlePreview({
                      position: { ...localChart.position, x: parseInt(e.target.value) || 0 }
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pos-y">Y Position</Label>
                <Input
                  id="pos-y"
                  type="number"
                  value={localChart.position.y}
                  onChange={(e) =>
                    handlePreview({
                      position: { ...localChart.position, y: parseInt(e.target.value) || 0 }
                    })
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sticky footer (always visible) */}
      <div className="flex gap-2 p-4 border-t bg-background shrink-0">
        <Button onClick={handleApply} className="flex-1">
          Apply Changes
        </Button>
        <Button variant="outline" onClick={handleReset}>
          Reset
        </Button>
        <Button variant="ghost" onClick={handleCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
