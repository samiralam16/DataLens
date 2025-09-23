import { useState } from 'react';
import { Download, Copy, BarChart3, Table, FileJson, FileSpreadsheet } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Table as UITable, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { ScrollArea } from '../ui/scroll-area';
import { Skeleton } from '../ui/skeleton';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '../ui/dropdown-menu';
import { BarChart, LineChart, PieChart, Bar, Line, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner@2.0.3';

interface ResultsDisplayProps {
  results: any[];
  query: string;
  isLoading: boolean;
}

export function ResultsDisplay({ results, query, isLoading }: ResultsDisplayProps) {
  const [activeView, setActiveView] = useState<'table' | 'chart'>('table');

  const handleExport = (format: 'csv' | 'json' | 'excel') => {
    if (!results.length) {
      toast.error('No data to export');
      return;
    }

    let content: string;
    let mimeType: string;
    let filename: string;

    switch (format) {
      case 'csv':
        const headers = Object.keys(results[0]).join(',');
        const rows = results.map(row => Object.values(row).join(',')).join('\n');
        content = `${headers}\n${rows}`;
        mimeType = 'text/csv';
        filename = 'query_results.csv';
        break;
      
      case 'json':
        content = JSON.stringify(results, null, 2);
        mimeType = 'application/json';
        filename = 'query_results.json';
        break;
      
      case 'excel':
        // For simplicity, we'll export as CSV with .xlsx extension
        const excelHeaders = Object.keys(results[0]).join(',');
        const excelRows = results.map(row => Object.values(row).join(',')).join('\n');
        content = `${excelHeaders}\n${excelRows}`;
        mimeType = 'text/csv';
        filename = 'query_results.xlsx';
        break;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success(`Results exported as ${format.toUpperCase()}`);
  };

  const handleCopyResults = () => {
    if (!results.length) {
      toast.error('No data to copy');
      return;
    }

    const headers = Object.keys(results[0]).join('\t');
    const rows = results.map(row => Object.values(row).join('\t')).join('\n');
    const content = `${headers}\n${rows}`;
    
    navigator.clipboard.writeText(content);
    toast.success('Results copied to clipboard');
  };

  const generateChartData = () => {
    if (!results.length) return [];
    
    // Try to find appropriate columns for charting
    const keys = Object.keys(results[0]);
    const numericKeys = keys.filter(key => 
      results.some(row => typeof row[key] === 'number' && !isNaN(row[key]))
    );
    const dateKeys = keys.filter(key => 
      results.some(row => !isNaN(Date.parse(row[key])))
    );
    
    return results.slice(0, 20); // Limit to 20 items for better visualization
  };

  const getChartColumns = () => {
    if (!results.length) return { x: '', y: '' };
    
    const keys = Object.keys(results[0]);
    const numericKeys = keys.filter(key => 
      results.some(row => typeof row[key] === 'number' && !isNaN(row[key]))
    );
    
    // Try to find good x and y columns
    const xColumn = keys.find(key => 
      key.toLowerCase().includes('month') || 
      key.toLowerCase().includes('date') || 
      key.toLowerCase().includes('name') ||
      key.toLowerCase().includes('category') ||
      key.toLowerCase().includes('region')
    ) || keys[0];
    
    const yColumn = numericKeys[0] || keys[1];
    
    return { x: xColumn, y: yColumn };
  };

  const chartData = generateChartData();
  const { x: xColumn, y: yColumn } = getChartColumns();

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'];

  if (isLoading) {
    return (
      <div className="h-full flex flex-col bg-card">
        <div className="border-b border-border p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Query Results</h3>
            <Badge variant="secondary">Executing...</Badge>
          </div>
        </div>
        
        <div className="flex-1 p-4 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!results.length && query) {
    return (
      <div className="h-full flex flex-col bg-card">
        <div className="border-b border-border p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Query Results</h3>
            <Badge variant="secondary">No Results</Badge>
          </div>
        </div>
        
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Table className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium mb-2">No results found</h3>
            <p className="text-muted-foreground text-sm">
              Your query executed successfully but returned no data
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!query) {
    return (
      <div className="h-full flex flex-col bg-card">
        <div className="border-b border-border p-4">
          <h3 className="font-medium">Query Results</h3>
        </div>
        
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium mb-2">Ready to analyze</h3>
            <p className="text-muted-foreground text-sm">
              Execute a SQL query to see results here
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-card">
      <div className="border-b border-border p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium">Query Results</h3>
          <div className="flex items-center gap-2">
            <Badge variant="default">{results.length} rows</Badge>
            <Button variant="outline" size="sm" onClick={handleCopyResults}>
              <Copy className="h-4 w-4 mr-1" />
              Copy
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-1" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleExport('csv')}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('json')}>
                  <FileJson className="h-4 w-4 mr-2" />
                  Export as JSON
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('excel')}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Export as Excel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        <Tabs value={activeView} onValueChange={(value) => setActiveView(value as 'table' | 'chart')}>
          <TabsList>
            <TabsTrigger value="table">
              <Table className="h-4 w-4 mr-1" />
              Table View
            </TabsTrigger>
            <TabsTrigger value="chart">
              <BarChart3 className="h-4 w-4 mr-1" />
              Chart View
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      <div className="flex-1 overflow-hidden">
        {activeView === 'table' ? (
          <ScrollArea className="h-full">
            <UITable>
              <TableHeader>
                <TableRow>
                  {results.length > 0 && Object.keys(results[0]).map((column) => (
                    <TableHead key={column} className="font-medium">
                      {column}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((row, index) => (
                  <TableRow key={index}>
                    {Object.values(row).map((value, cellIndex) => (
                      <TableCell key={cellIndex} className="font-mono text-sm">
                        {value?.toString() || '—'}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </UITable>
          </ScrollArea>
        ) : (
          <div className="h-full p-4">
            {chartData.length > 0 ? (
              <Tabs defaultValue="bar" className="h-full flex flex-col">
                <TabsList className="mb-4">
                  <TabsTrigger value="bar">Bar Chart</TabsTrigger>
                  <TabsTrigger value="line">Line Chart</TabsTrigger>
                  <TabsTrigger value="pie">Pie Chart</TabsTrigger>
                </TabsList>
                
                <TabsContent value="bar" className="flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey={xColumn} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey={yColumn} fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </TabsContent>
                
                <TabsContent value="line" className="flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey={xColumn} />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey={yColumn} stroke="#8884d8" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </TabsContent>
                
                <TabsContent value="pie" className="flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData.slice(0, 6)} // Limit pie chart to 6 slices
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey={yColumn}
                        nameKey={xColumn}
                      >
                        {chartData.slice(0, 6).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium mb-2">No chartable data</h3>
                  <p className="text-muted-foreground text-sm">
                    Unable to generate charts from the current results
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}