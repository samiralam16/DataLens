import { 
  BarChart, LineChart, PieChart, ScatterChart, Treemap,
  Bar, Line, Pie, Scatter, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer 
} from 'recharts';
import { ChartConfig } from '../../services/api';

interface ChartRendererProps {
  chart: ChartConfig;
  height?: number;
}

export function ChartRenderer({ chart, height = 300 }: ChartRendererProps) {
  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0'];

  if (!chart.data || chart.data.length === 0) {
    return <div className="flex items-center justify-center h-full text-muted-foreground">
      <div className="text-center"><div className="text-4xl mb-2">📊</div>
      <p className="text-sm">No data available</p></div></div>;
  }

  if (!chart.x || !chart.y) {
    return <div className="flex items-center justify-center h-full text-muted-foreground">
      <div className="text-center"><div className="text-4xl mb-2">⚙️</div>
      <p className="text-sm">Select X and Y columns to render this chart</p></div></div>;
  }

  const commonProps = { data: chart.data, margin: { top: 5, right: 30, left: 20, bottom: 5 } };
  const legendName = chart.legendLabel || chart.y; 
  switch (chart.type) {
    case 'bar':
      return (
        <ResponsiveContainer width="100%" height={height}>
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={chart.x} label={{ value: chart.x, position: "insideBottom", offset: -5 }} />
            <YAxis label={{ value: chart.y, angle: -90, position: "insideLeft" }} />
            <Tooltip />
            <Legend formatter={() => legendName} />
            <Bar dataKey={chart.y} fill="#8884d8" name={legendName} />
          </BarChart>
        </ResponsiveContainer>
      );

    case 'line':
      return (
        <ResponsiveContainer width="100%" height={height}>
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={chart.x} label={{ value: chart.x, position: "insideBottom", offset: -5 }} />
            <YAxis label={{ value: chart.y, angle: -90, position: "insideLeft" }} />
            <Tooltip />
            <Legend formatter={() => legendName} />
            <Line type="monotone" dataKey={chart.y} stroke="#8884d8" strokeWidth={2} dot={{ r: 4 }} name={legendName} />
          </LineChart>
        </ResponsiveContainer>
      );

    case 'pie':
      return (
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={chart.data.slice(0, 8)}
              cx="50%" cy="50%" labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={Math.min(height * 0.3, 100)}
              fill="#8884d8"
              dataKey={chart.y}
              nameKey={chart.x}
            >
              {chart.data.slice(0, 8).map((_, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend formatter={() => legendName} />
          </PieChart>
        </ResponsiveContainer>
      );

    case 'scatter':
      return (
        <ResponsiveContainer width="100%" height={height}>
          <ScatterChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" dataKey={chart.x} label={{ value: chart.x, position: "insideBottom", offset: -5 }} />
            <YAxis type="number" dataKey={chart.y} label={{ value: chart.y, angle: -90, position: "insideLeft" }} />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
            <Legend formatter={() => legendName} />
            <Scatter name={legendName} data={chart.data} fill="#8884d8" />
          </ScatterChart>
        </ResponsiveContainer>
      );

    case 'heatmap':
      return (
        <ResponsiveContainer width="100%" height={height}>
          <BarChart {...commonProps} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" dataKey="value" />
            <YAxis type="category" dataKey={chart.y} />
            <Tooltip />
            <Legend formatter={() => legendName} />
            <Bar dataKey="value" name={legendName}>
              {chart.data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={`rgba(255, ${180 - entry.value}, ${100 + index * 10}, 0.8)`}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      );

    case 'treemap':
      return (
        <ResponsiveContainer width="100%" height={height}>
          <Treemap
            data={chart.data}
            dataKey={chart.y}
            nameKey={chart.x}
            stroke="#fff"
            fill="#82ca9d"
            contentStyle={{ fontSize: 12 }}
          />
        </ResponsiveContainer>
      );
    default:
      return <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center"><div className="text-4xl mb-2">❓</div>
        <p className="text-sm">Unsupported chart type</p></div></div>;
  }
};