import { useState } from 'react';
import { Upload, Database, Cloud, FileText, CheckCircle, AlertCircle, Plus, Trash2, Edit, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { useData } from '../DataContext';
import { uploadFiles } from '../../services/api';
import { toast } from 'sonner@2.0.3';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '../ui/dialog';

export function DataImport() {
  const { dataSources, addDataSource, updateDataSource, removeDataSource, refreshDatasets, addDatasetAsSource, loading } = useData();
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isAddingSource, setIsAddingSource] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [newSourceConfig, setNewSourceConfig] = useState({
    name: '',
    type: 'csv' as 'csv' | 'database' | 'api' | 'cloud',
    connectionInfo: {}
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setSelectedFiles(files);
      toast.success(`${files.length} file(s) selected for upload`);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFiles || selectedFiles.length === 0) {
      toast.error('Please select files to upload');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const filesArray = Array.from(selectedFiles);
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 20, 90));
      }, 500);

      const response = await uploadFiles(filesArray);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Add uploaded datasets as data sources
      response.datasets.forEach(dataset => {
        addDatasetAsSource(dataset);
      });
      
      // Refresh the datasets list
      await refreshDatasets();
      
      toast.success(`Successfully uploaded ${response.datasets.length} file(s)`);
      setSelectedFiles(null);
      
      // Reset file input
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
      
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const generateMockDataFromFile = (file: File) => {
    // Generate mock data based on file name
    return Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      value: Math.floor(Math.random() * 1000),
      category: ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)],
      date: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString()
    }));
  };

  const handleAddMultipleSource = () => {
    if (!newSourceConfig.name) {
      toast.error('Please enter a source name');
      return;
    }

    addDataSource({
      name: newSourceConfig.name,
      type: newSourceConfig.type,
      status: 'connected',
      data: generateMockDataFromType(newSourceConfig.type),
      columns: getColumnsForType(newSourceConfig.type)
    });

    setNewSourceConfig({ name: '', type: 'csv', connectionInfo: {} });
    setIsAddingSource(false);
    toast.success('Data source added successfully');
  };

  const generateMockDataFromType = (type: string) => {
    switch (type) {
      case 'database':
        return Array.from({ length: 15 }, (_, i) => ({
          user_id: i + 1,
          email: `user${i + 1}@example.com`,
          created_at: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString(),
          status: Math.random() > 0.5 ? 'active' : 'inactive'
        }));
      case 'api':
        return Array.from({ length: 25 }, (_, i) => ({
          transaction_id: i + 1,
          amount: Math.floor(Math.random() * 1000),
          currency: 'USD',
          timestamp: new Date().toISOString()
        }));
      default:
        return Array.from({ length: 10 }, (_, i) => ({
          id: i + 1,
          name: `Item ${i + 1}`,
          value: Math.floor(Math.random() * 100),
          created: new Date().toISOString()
        }));
    }
  };

  const getColumnsForType = (type: string) => {
    switch (type) {
      case 'database':
        return [
          { name: 'user_id', type: 'number' as const, originalName: 'user_id' },
          { name: 'email', type: 'string' as const, originalName: 'email' },
          { name: 'created_at', type: 'date' as const, originalName: 'created_at' },
          { name: 'status', type: 'string' as const, originalName: 'status' }
        ];
      case 'api':
        return [
          { name: 'transaction_id', type: 'number' as const, originalName: 'transaction_id' },
          { name: 'amount', type: 'number' as const, originalName: 'amount' },
          { name: 'currency', type: 'string' as const, originalName: 'currency' },
          { name: 'timestamp', type: 'date' as const, originalName: 'timestamp' }
        ];
      default:
        return [
          { name: 'id', type: 'number' as const, originalName: 'id' },
          { name: 'name', type: 'string' as const, originalName: 'name' },
          { name: 'value', type: 'number' as const, originalName: 'value' },
          { name: 'created', type: 'date' as const, originalName: 'created' }
        ];
    }
  };

  return (
    <div className="h-full p-6 overflow-auto">
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Data Import</h2>
        <p className="text-muted-foreground">
          Connect to various data sources or upload files to get started with your analysis.
        </p>
      </div>

      <Tabs defaultValue="upload" className="space-y-6">
        <TabsList>
          <TabsTrigger value="upload">File Upload</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="api">APIs</TabsTrigger>
          <TabsTrigger value="cloud">Cloud Storage</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Upload Files
              </CardTitle>
              <CardDescription>
                Upload CSV, Excel, or JSON files for analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground mb-4">
                  Drag and drop your files here, or click to browse
                </p>
                <Input 
                  type="file" 
                  accept=".csv,.xlsx,.json"
                  onChange={handleFileSelect}
                  multiple
                  className="hidden"
                  id="file-upload"
                />
                <Label htmlFor="file-upload" className="cursor-pointer">
                  <Button variant="outline" asChild>
                    <span>Choose Files</span>
                  </Button>
                </Label>
              </div>
              
              {selectedFiles && selectedFiles.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Selected Files:</h4>
                  <div className="space-y-1">
                    {Array.from(selectedFiles).map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                        <span className="text-sm">{file.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                    ))}
                  </div>
                  <Button 
                    onClick={handleFileUpload} 
                    disabled={isUploading}
                    className="w-full gap-2"
                  >
                    {isUploading ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    {isUploading ? 'Uploading...' : `Upload ${selectedFiles.length} file(s)`}
                  </Button>
                </div>
              )}
              
              {isUploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Uploading to backend...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} />
                </div>
              )}
              
              <p className="text-xs text-muted-foreground">
                Supported formats: CSV, Excel (.xlsx), JSON (max 100MB per file)
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Database Connection
              </CardTitle>
              <CardDescription>
                Connect to PostgreSQL, MySQL, SQLite, or other databases
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="db-type">Database Type</Label>
                  <Select>
                    <SelectTrigger id="db-type">
                      <SelectValue placeholder="Select database type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="postgresql">PostgreSQL</SelectItem>
                      <SelectItem value="mysql">MySQL</SelectItem>
                      <SelectItem value="sqlite">SQLite</SelectItem>
                      <SelectItem value="mssql">SQL Server</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="db-host">Host</Label>
                  <Input id="db-host" placeholder="localhost" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="db-port">Port</Label>
                  <Input id="db-port" placeholder="5432" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="db-name">Database Name</Label>
                  <Input id="db-name" placeholder="my_database" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="db-user">Username</Label>
                  <Input id="db-user" placeholder="username" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="db-password">Password</Label>
                  <Input id="db-password" type="password" placeholder="password" />
                </div>
              </div>
              <div className="flex gap-2">
                <Button>Test Connection</Button>
                <Button variant="outline">Save Connection</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cloud className="h-5 w-5" />
                API Connections
              </CardTitle>
              <CardDescription>
                Connect to REST APIs, GraphQL endpoints, or third-party services
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                {['Google Analytics', 'Stripe', 'Salesforce', 'HubSpot', 'Custom API'].map((service) => (
                  <div key={service} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-muted rounded flex items-center justify-center">
                        <Cloud className="h-4 w-4" />
                      </div>
                      <span>{service}</span>
                    </div>
                    <Button variant="outline" size="sm">Connect</Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cloud" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cloud className="h-5 w-5" />
                Cloud Storage
              </CardTitle>
              <CardDescription>
                Connect to AWS S3, Google Cloud Storage, or Azure Blob Storage
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                {['AWS S3', 'Google Cloud Storage', 'Azure Blob Storage', 'Dropbox', 'OneDrive'].map((service) => (
                  <div key={service} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-muted rounded flex items-center justify-center">
                        <Cloud className="h-4 w-4" />
                      </div>
                      <span>{service}</span>
                    </div>
                    <Button variant="outline" size="sm">Connect</Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Connected Data Sources ({dataSources.length})</CardTitle>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={refreshDatasets}
                disabled={loading}
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-1" />
                )}
                Refresh
              </Button>
              <Dialog open={isAddingSource} onOpenChange={setIsAddingSource}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Source
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Data Source</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="source-name">Source Name</Label>
                      <Input
                        id="source-name"
                        value={newSourceConfig.name}
                        onChange={(e) => setNewSourceConfig({ ...newSourceConfig, name: e.target.value })}
                        placeholder="e.g., Customer Database"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="source-type">Source Type</Label>
                      <Select
                        value={newSourceConfig.type}
                        onValueChange={(value: 'csv' | 'database' | 'api' | 'cloud') => 
                          setNewSourceConfig({ ...newSourceConfig, type: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="csv">CSV File</SelectItem>
                          <SelectItem value="database">Database</SelectItem>
                          <SelectItem value="api">API</SelectItem>
                          <SelectItem value="cloud">Cloud Storage</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddingSource(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddMultipleSource}>
                      Add Source
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {dataSources.map((source) => (
              <div key={source.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-muted rounded flex items-center justify-center">
                    {source.type === 'database' && <Database className="h-4 w-4" />}
                    {source.type === 'csv' && <FileText className="h-4 w-4" />}
                    {(source.type === 'api' || source.type === 'cloud') && <Cloud className="h-4 w-4" />}
                  </div>
                  <div>
                    <p className="font-medium">{source.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {source.type} • {source.backendDataset?.row_count || source.data.length} rows • {source.columns.length} columns
                    </p>
                    {source.backendDataset && (
                      <p className="text-xs text-muted-foreground">
                        {source.backendDataset.filename} • {(source.backendDataset.file_size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={source.status === 'connected' ? 'default' : 'secondary'}>
                    {source.status === 'connected' ? (
                      <CheckCircle className="h-3 w-3 mr-1" />
                    ) : (
                      <AlertCircle className="h-3 w-3 mr-1" />
                    )}
                    {source.status}
                  </Badge>
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => removeDataSource(source.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}