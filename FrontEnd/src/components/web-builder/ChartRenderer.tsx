import { 
  BarChart, 
  LineChart, 
  PieChart, 
  ScatterChart,
  Bar, 
  Line, 
  Pie, 
  Scatter,
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer 
} from 'recharts';
import { ChartConfig } from '../WebBuilder';

interface ChartRendererProps {
  chart: ChartConfig;
  height?: number;
}

export function ChartRenderer({ chart, height = 300 }: ChartRendererProps) {
  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0'];

  if (!chart.data || chart.data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center">
          <div className="text-4xl mb-2">📊</div>
          <p className="text-sm">No data available</p>
        </div>
      </div>
    );
  }

  const commonProps = {
    data: chart.data,
    margin: { top: 5, right: 30, left: 20, bottom: 5 }
  };

  switch (chart.type) {
    case 'bar':
      return (
        <ResponsiveContainer width="100%" height={height}>
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={chart.x} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey={chart.y} fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      );

    case 'line':
      return (
        <ResponsiveContainer width="100%" height={height}>
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={chart.x} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line 
              type="monotone" 
              dataKey={chart.y} 
              stroke="#8884d8" 
              strokeWidth={2}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      );

    case 'pie':
      return (
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={chart.data.slice(0, 8)} // Limit to 8 slices for readability
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={Math.min(height * 0.3, 100)}
              fill="#8884d8"
              dataKey={chart.y}
              nameKey={chart.x}
            >
              {chart.data.slice(0, 8).map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      );

    case 'scatter':
      return (
        <ResponsiveContainer width="100%" height={height}>
          <ScatterChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" dataKey={chart.x} />
            <YAxis type="number" dataKey={chart.y} />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
            <Legend />
            <Scatter name={chart.title} data={chart.data} fill="#8884d8" />
          </ScatterChart>
        </ResponsiveContainer>
      );

    case 'heatmap':
      // Simple heatmap implementation using a grid
      const heatmapData = chart.data.reduce((acc, item) => {
        const x = item[chart.x];
        const y = item[chart.y];
        const key = `${x}-${y}`;
        acc[key] = (acc[key] || 0) + (typeof item.value === 'number' ? item.value : 1);
        return acc;
      }, {} as Record<string, number>);

      const maxValue = Math.max(...Object.values(heatmapData));
      const uniqueX = [...new Set(chart.data.map(item => item[chart.x]))];
      const uniqueY = [...new Set(chart.data.map(item => item[chart.y]))];

      return (
        <div className="p-4 overflow-auto" style={{ height }}>
          <div className="grid gap-1" style={{ 
            gridTemplateColumns: `repeat(${uniqueX.length}, 1fr)`,
            minHeight: height - 32
          }}>
            {uniqueY.map(y => 
              uniqueX.map(x => {
                const value = heatmapData[`${x}-${y}`] || 0;
                const intensity = value / maxValue;
                return (
                  <div
                    key={`${x}-${y}`}
                    className="flex items-center justify-center text-xs rounded"
                    style={{
                      backgroundColor: `rgba(136, 132, 216, ${intensity})`,
                      color: intensity > 0.5 ? 'white' : 'black',
                      minHeight: '30px',
                      minWidth: '30px'
                    }}
                    title={`${x}, ${y}: ${value}`}
                  >
                    {value > 0 && value}
                  </div>
                );
              })
            )}
          </div>
        </div>
      );

    case 'treemap':
      // Simple treemap using flexbox
      const total = chart.data.reduce((sum, item) => sum + (item[chart.y] || 0), 0);
      
      return (
        <div className="flex flex-wrap gap-1 p-2" style={{ height }}>
          {chart.data.map((item, index) => {
            const size = (item[chart.y] / total) * 100;
            return (
              <div
                key={index}
                className="flex items-center justify-center text-xs text-white rounded p-2 overflow-hidden"
                style={{
                  backgroundColor: COLORS[index % COLORS.length],
                  flexBasis: `${Math.max(size, 5)}%`,
                  minHeight: '60px'
                }}
                title={`${item[chart.x]}: ${item[chart.y]}`}
              >
                <div className="text-center">
                  <div className="font-medium truncate">{item[chart.x]}</div>
                  <div className="text-xs opacity-90">{item[chart.y]}</div>
                </div>
              </div>
            );
          })}
        </div>
      );

    case 'geo':
      // Placeholder for geographic visualization
      return (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <div className="text-center">
            <div className="text-4xl mb-2">🗺️</div>
            <p className="text-sm">Geographic Chart</p>
            <p className="text-xs">Integration with mapping service required</p>
          </div>
        </div>
      );

    default:
      return (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <div className="text-center">
            <div className="text-4xl mb-2">❓</div>
            <p className="text-sm">Unsupported chart type</p>
          </div>
        </div>
      );
  }
}