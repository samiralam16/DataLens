import { useState, useMemo } from 'react';
import { Database, Edit, Hash, Type, Calendar, Eye, EyeOff } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { useData } from '../DataContext';
import { toast } from 'sonner@2.0.3';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '../ui/dialog';
import { Label } from '../ui/label';

export function ColumnsPanel() {
  const { analyzedData, dataSources, activeDatasetId, renameColumn } = useData();
  const [editingColumn, setEditingColumn] = useState<string | null>(null);
  const [newColumnName, setNewColumnName] = useState('');
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(new Set());

  const currentData = useMemo(() => {
    if (analyzedData) return analyzedData;

    if (activeDatasetId) {
      const ds = dataSources.find(d => d.tableName === activeDatasetId || d.id === activeDatasetId);
      if (ds) {
        return {
          sourceId: ds.id,
          query: 'SELECT * FROM data',
          results: ds.data,
          columns: ds.columns,
          timestamp: new Date()
        };
      }
    }
    return null;
  }, [analyzedData, activeDatasetId, dataSources]);

  const handleRenameColumn = () => {
    if (!editingColumn || !newColumnName.trim() || !currentData) {
      toast.error('Please enter a valid column name');
      return;
    }
    renameColumn(currentData.sourceId, editingColumn, newColumnName);
    setEditingColumn(null);
    setNewColumnName('');
    toast.success('Column renamed successfully');
  };

  const toggleColumnVisibility = (columnName: string) => {
    const next = new Set(hiddenColumns);
    next.has(columnName) ? next.delete(columnName) : next.add(columnName);
    setHiddenColumns(next);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'number': return <Hash className="h-4 w-4" />;
      case 'date':   return <Calendar className="h-4 w-4" />;
      default:       return <Type className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'number': return 'bg-blue-100 text-blue-800';
      case 'date':   return 'bg-green-100 text-green-800';
      default:       return 'bg-gray-100 text-gray-800';
    }
  };

  if (!currentData) {
    return (
      <div className="flex h-full min-h-0 flex-col bg-card border-l border-border">
        <div className="shrink-0 border-b border-border p-4">
          <div className="flex items-center gap-2 mb-3">
            <Database className="h-5 w-5" />
            <h3 className="font-medium">Data Columns</h3>
          </div>
          <p className="text-sm text-muted-foreground">No data available</p>
        </div>
        <div className="flex-1 min-h-0 flex items-center justify-center p-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Database className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium mb-2">No Data Source</h3>
            <p className="text-sm text-muted-foreground">
              Import data or select a dataset to see columns
            </p>
          </div>
        </div>
      </div>
    );
  }

  const visibleColumns = currentData.columns.filter(col => !hiddenColumns.has(col.name));
  const hiddenCount = currentData.columns.length - visibleColumns.length;

  return (
    <div className="flex h-full min-h-0 flex-col bg-card border-l border-border">
      {/* sticky header */}
      <div className="shrink-0 sticky top-0 z-10 bg-card border-b border-border p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            <h3 className="font-medium">Data Columns</h3>
          </div>
          <Badge variant="outline">{currentData.columns.length} total</Badge>
        </div>
        <div className="text-sm text-muted-foreground">
          <p>{currentData.results.length} rows available</p>
          {hiddenCount > 0 && <p className="text-orange-600">{hiddenCount} columns hidden</p>}
        </div>
      </div>

      {/* scrollable list */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4">
        <div className="space-y-3">
          {currentData.columns.map((column) => (
            <Card
              key={column.originalName}
              className={`transition-opacity ${hiddenColumns.has(column.name) ? 'opacity-50' : ''}`}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(column.type)}
                    <span className="font-medium">{column.name}</span>
                    {column.name !== column.originalName && (
                      <Badge variant="secondary" className="text-xs">renamed</Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => toggleColumnVisibility(column.name)}>
                      {hiddenColumns.has(column.name) ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    </Button>

                    <Dialog
                      open={editingColumn === column.originalName}
                      onOpenChange={(open) => {
                        if (open) {
                          setEditingColumn(column.originalName);
                          setNewColumnName(column.name);
                        } else {
                          setEditingColumn(null);
                          setNewColumnName('');
                        }
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-3 w-3" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Rename Column</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="original-name">Original Name</Label>
                            <Input id="original-name" value={column.originalName} disabled className="bg-muted" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="new-name">Display Name</Label>
                            <Input
                              id="new-name"
                              value={newColumnName}
                              onChange={(e) => setNewColumnName(e.target.value)}
                              placeholder="Enter new column name"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setEditingColumn(null)}>Cancel</Button>
                          <Button onClick={handleRenameColumn}>Rename</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Badge className={`text-xs ${getTypeColor(column.type)}`}>{column.type}</Badge>
                  <div className="text-xs text-muted-foreground">
                    {column.originalName !== column.name && <span>was: {column.originalName}</span>}
                  </div>
                </div>

                <div className="mt-2 text-xs text-muted-foreground">
                  <div className="flex flex-wrap gap-1">
                    {currentData.results.slice(0, 3).map((row, idx) => (
                      <span key={idx} className="bg-muted px-1 py-0.5 rounded">
                        {String(row[column.originalName]).length > 10
                          ? String(row[column.originalName]).substring(0, 10) + '...'
                          : String(row[column.originalName])}
                      </span>
                    ))}
                    {currentData.results.length > 3 && (
                      <span className="text-muted-foreground">+{currentData.results.length - 3} more</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {hiddenCount > 0 && (
        <div className="shrink-0 border-t border-border p-4">
          <Button variant="outline" size="sm" className="w-full" onClick={() => setHiddenColumns(new Set())}>
            Show All Columns ({hiddenCount} hidden)
          </Button>
        </div>
      )}
    </div>
  );
}
