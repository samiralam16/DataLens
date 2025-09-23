import { useState } from 'react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Slider } from '../ui/slider';
import { Switch } from '../ui/switch';
import { ChartConfig } from '../WebBuilder';

interface ChartConfigPanelProps {
  chart: ChartConfig;
  onUpdateChart: (chartId: string, updates: Partial<ChartConfig>) => void;
}

export function ChartConfigPanel({ chart, onUpdateChart }: ChartConfigPanelProps) {
  const [localChart, setLocalChart] = useState(chart);

  const handleUpdate = (updates: Partial<ChartConfig>) => {
    const newChart = { ...localChart, ...updates };
    setLocalChart(newChart);
    onUpdateChart(chart.id, updates);
  };

  const availableColumns = chart.data.length > 0 ? Object.keys(chart.data[0]) : [];
  const numericColumns = availableColumns.filter(col => 
    chart.data.some(row => typeof row[col] === 'number' && !isNaN(row[col]))
  );
  const categoricalColumns = availableColumns.filter(col => 
    !numericColumns.includes(col)
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
    <div className="space-y-6 p-4">
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
              onChange={(e) => handleUpdate({ title: e.target.value })}
              placeholder="Enter chart title"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="chart-type">Chart Type</Label>
            <Select value={localChart.type} onValueChange={(value: ChartConfig['type']) => handleUpdate({ type: value })}>
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

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Data Mapping</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="x-axis">X-Axis {localChart.type === 'pie' ? '(Categories)' : ''}</Label>
            <Select value={localChart.x} onValueChange={(value) => handleUpdate({ x: value })}>
              <SelectTrigger id="x-axis">
                <SelectValue placeholder="Select column" />
              </SelectTrigger>
              <SelectContent>
                {availableColumns.map((column) => (
                  <SelectItem key={column} value={column}>
                    <div className="flex items-center justify-between w-full">
                      <span>{column}</span>
                      <Badge variant={numericColumns.includes(column) ? 'default' : 'secondary'} className="ml-2 text-xs">
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
            <Select value={localChart.y} onValueChange={(value) => handleUpdate({ y: value })}>
              <SelectTrigger id="y-axis">
                <SelectValue placeholder="Select column" />
              </SelectTrigger>
              <SelectContent>
                {availableColumns.map((column) => (
                  <SelectItem key={column} value={column}>
                    <div className="flex items-center justify-between w-full">
                      <span>{column}</span>
                      <Badge variant={numericColumns.includes(column) ? 'default' : 'secondary'} className="ml-2 text-xs">
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
                  handleUpdate({ size: { ...localChart.size, width } })
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
                  handleUpdate({ size: { ...localChart.size, height } })
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
                  handleUpdate({ 
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
                  handleUpdate({ 
                    position: { ...localChart.position, y: parseInt(e.target.value) || 0 } 
                  })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Data Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Data Points</span>
              <Badge variant="outline">{chart.data.length} rows</Badge>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm font-medium">Available Columns:</div>
              <div className="flex flex-wrap gap-1">
                {availableColumns.map((column) => (
                  <Badge 
                    key={column} 
                    variant={numericColumns.includes(column) ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {column}
                  </Badge>
                ))}
              </div>
            </div>
            
            {chart.data.length > 0 && (
              <div className="mt-3">
                <div className="text-sm font-medium mb-2">Sample Data:</div>
                <div className="bg-muted p-3 rounded text-xs font-mono overflow-x-auto">
                  <pre>{JSON.stringify(chart.data.slice(0, 3), null, 2)}</pre>
                  {chart.data.length > 3 && (
                    <p className="text-muted-foreground mt-2">
                      ... and {chart.data.length - 3} more rows
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2 pt-4">
        <Button onClick={() => handleUpdate({ ...chart })} className="flex-1">
          Apply Changes
        </Button>
        <Button variant="outline" onClick={() => setLocalChart(chart)}>
          Reset
        </Button>
      </div>
    </div>
  );
}