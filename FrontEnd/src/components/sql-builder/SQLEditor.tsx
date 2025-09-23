import { useState, useRef } from 'react';
import { Play, Save, Download, Copy, RotateCcw, Database } from 'lucide-react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';
import { Card } from '../ui/card';
import { toast } from 'sonner@2.0.3';
import { useData } from '../DataContext';

interface SQLEditorProps {
  onExecuteQuery: (query: string) => void;
  isExecuting: boolean;
}

export function SQLEditor({ onExecuteQuery, isExecuting }: SQLEditorProps) {
  const { datasets, loading } = useData();
  const [query, setQuery] = useState(`-- Welcome to DataViz Pro SQL Editor
-- Your available datasets are listed on the right
-- Click on a dataset to see its structure

SELECT * FROM your_dataset_name LIMIT 10;`);
  
  const [queryHistory, setQueryHistory] = useState<string[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleExecute = () => {
    if (!query.trim()) {
      toast.error('Please enter a SQL query');
      return;
    }

    setQueryHistory(prev => [query, ...prev.slice(0, 9)]); // Keep last 10 queries
    onExecuteQuery(query);
    toast.success('Query executed successfully');
  };

  const handleSave = () => {
    if (!query.trim()) {
      toast.error('Please enter a SQL query to save');
      return;
    }
    
    // In a real app, this would save to backend
    toast.success('Query saved successfully');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(query);
    toast.success('Query copied to clipboard');
  };

  const handleDownload = () => {
    const blob = new Blob([query], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'query.sql';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Query downloaded');
  };

  const insertDatasetQuery = (datasetName: string) => {
    const newQuery = `SELECT * FROM "${datasetName}" LIMIT 10;`;
    setQuery(newQuery);
    toast.success(`Query template inserted for ${datasetName}`);
  };

  return (
    <div className="h-full flex bg-card">
      {/* Main Editor */}
      <div className="flex-1 flex flex-col">
        <div className="border-b border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium">SQL Editor</h3>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">FastAPI Backend</Badge>
              <Badge variant="outline">Connected</Badge>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              onClick={handleExecute} 
              disabled={isExecuting}
              className="gap-2"
            >
              {isExecuting ? (
                <RotateCcw className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              {isExecuting ? 'Executing...' : 'Run Query'}
            </Button>
            
            <Separator orientation="vertical" className="h-6" />
            
            <Button variant="outline" size="sm" onClick={handleSave}>
              <Save className="h-4 w-4 mr-1" />
              Save
            </Button>
            
            <Button variant="outline" size="sm" onClick={handleCopy}>
              <Copy className="h-4 w-4 mr-1" />
              Copy
            </Button>
            
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
          </div>
        </div>
        
        <div className="flex-1 p-4">
          <Textarea
            ref={textareaRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter your SQL query here..."
            className="h-full font-mono text-sm resize-none border-0 focus-visible:ring-0 p-0"
            style={{ 
              background: 'transparent',
              minHeight: '300px'
            }}
          />
        </div>
        
        {queryHistory.length > 0 && (
          <div className="border-t border-border p-4">
            <h4 className="text-sm font-medium mb-2">Query History</h4>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {queryHistory.map((historicalQuery, index) => (
                <button
                  key={index}
                  onClick={() => setQuery(historicalQuery)}
                  className="block w-full text-left text-xs p-2 hover:bg-muted rounded text-muted-foreground truncate"
                >
                  {historicalQuery.split('\n')[0].replace(/^--/, '').trim() || 'Untitled Query'}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Available Datasets Sidebar */}
      <div className="w-80 border-l border-border bg-card">
        <div className="border-b border-border p-4">
          <h4 className="font-medium flex items-center gap-2">
            <Database className="h-4 w-4" />
            Available Datasets
          </h4>
          <p className="text-xs text-muted-foreground mt-1">
            Click on a dataset to insert a query template
          </p>
        </div>
        
        <ScrollArea className="h-full">
          <div className="p-4 space-y-3">
            {loading ? (
              <div className="text-center text-muted-foreground text-sm py-8">
                Loading datasets...
              </div>
            ) : datasets.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-8">
                No datasets available. Upload data files to get started.
              </div>
            ) : (
              datasets.map((dataset) => (
                <Card 
                  key={dataset.id} 
                  className={`p-3 cursor-pointer hover:bg-accent transition-colors ${
                    selectedDataset === dataset.name ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => {
                    setSelectedDataset(dataset.name);
                    insertDatasetQuery(dataset.name);
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h5 className="font-medium text-sm">{dataset.name}</h5>
                      <p className="text-xs text-muted-foreground mt-1">
                        {dataset.filename}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {dataset.file_type.toUpperCase()}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {dataset.row_count} rows
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  {selectedDataset === dataset.name && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <h6 className="text-xs font-medium mb-2">Columns:</h6>
                      <div className="grid grid-cols-1 gap-1">
                        {JSON.parse(dataset.columns_info.replace(/'/g, '"')).map((col: string, idx: number) => (
                          <div key={idx} className="text-xs text-muted-foreground font-mono">
                            {col}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}