import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Dataset, listDatasets, parseColumnsInfo } from '../services/api';

export interface DataSource {
  id: string;
  name: string;
  type: 'csv' | 'database' | 'api' | 'cloud';
  status: 'connected' | 'pending' | 'error';
  data: any[];
  columns: { name: string; type: 'string' | 'number' | 'date'; originalName: string }[];
  connectionInfo?: any;
  backendDataset?: Dataset;
}

export interface AnalyzedData {
  sourceId: string;
  query: string;
  results: any[];
  columns: { name: string; type: 'string' | 'number' | 'date'; originalName: string }[];
  timestamp: Date;
}

interface DataContextType {
  dataSources: DataSource[];
  analyzedData: AnalyzedData | null;
  datasets: Dataset[];
  loading: boolean;
  addDataSource: (source: Omit<DataSource, 'id'>) => void;
  updateDataSource: (id: string, updates: Partial<DataSource>) => void;
  removeDataSource: (id: string) => void;
  setAnalyzedData: (data: AnalyzedData) => void;
  renameColumn: (sourceId: string, originalName: string, newName: string) => void;
  refreshDatasets: () => Promise<void>;
  addDatasetAsSource: (dataset: Dataset) => void;
}

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzedData, setAnalyzedDataState] = useState<AnalyzedData | null>(null);

  // Load datasets from backend on mount
  useEffect(() => {
    refreshDatasets();
  }, []);

  const refreshDatasets = async () => {
    setLoading(true);
    try {
      const backendDatasets = await listDatasets();
      setDatasets(backendDatasets);
      
      // Convert datasets to data sources for compatibility
      const convertedSources: DataSource[] = backendDatasets.map(dataset => {
        const columns = parseColumnsInfo(dataset.columns_info);
        return {
          id: dataset.id.toString(),
          name: dataset.name,
          type: dataset.file_type as 'csv' | 'database' | 'api' | 'cloud',
          status: dataset.is_processed ? 'connected' : 'pending',
          data: [], // Will be populated when query is executed
          columns: columns.map(col => ({
            name: col,
            type: inferColumnType(col),
            originalName: col
          })),
          backendDataset: dataset
        };
      });
      
      setDataSources(convertedSources);
    } catch (error) {
      console.error('Failed to load datasets:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to infer column type from name
  const inferColumnType = (columnName: string): 'string' | 'number' | 'date' => {
    const lowerName = columnName.toLowerCase();
    if (lowerName.includes('date') || lowerName.includes('time')) {
      return 'date';
    }
    if (lowerName.includes('id') || lowerName.includes('count') || lowerName.includes('price') || lowerName.includes('amount')) {
      return 'number';
    }
    return 'string';
  };

  const addDatasetAsSource = (dataset: Dataset) => {
    const columns = parseColumnsInfo(dataset.columns_info);
    const newSource: DataSource = {
      id: dataset.id.toString(),
      name: dataset.name,
      type: dataset.file_type as 'csv' | 'database' | 'api' | 'cloud',
      status: dataset.is_processed ? 'connected' : 'pending',
      data: [],
      columns: columns.map(col => ({
        name: col,
        type: inferColumnType(col),
        originalName: col
      })),
      backendDataset: dataset
    };
    
    setDataSources(prev => {
      // Check if already exists
      const exists = prev.some(source => source.id === newSource.id);
      if (exists) {
        return prev.map(source => source.id === newSource.id ? newSource : source);
      }
      return [...prev, newSource];
    });
  };

  const addDataSource = (source: Omit<DataSource, 'id'>) => {
    const newSource: DataSource = {
      ...source,
      id: Date.now().toString()
    };
    setDataSources(prev => [...prev, newSource]);
  };

  const updateDataSource = (id: string, updates: Partial<DataSource>) => {
    setDataSources(prev => prev.map(source => 
      source.id === id ? { ...source, ...updates } : source
    ));
  };

  const removeDataSource = (id: string) => {
    setDataSources(prev => prev.filter(source => source.id !== id));
  };

  const setAnalyzedData = (data: AnalyzedData) => {
    setAnalyzedDataState(data);
  };

  const renameColumn = (sourceId: string, originalName: string, newName: string) => {
    // Update data source columns
    setDataSources(prev => prev.map(source => {
      if (source.id === sourceId) {
        return {
          ...source,
          columns: source.columns.map(col => 
            col.originalName === originalName ? { ...col, name: newName } : col
          )
        };
      }
      return source;
    }));

    // Update analyzed data if it matches
    if (analyzedData?.sourceId === sourceId) {
      setAnalyzedDataState(prev => prev ? {
        ...prev,
        columns: prev.columns.map(col => 
          col.originalName === originalName ? { ...col, name: newName } : col
        )
      } : null);
    }
  };

  return (
    <DataContext.Provider value={{
      dataSources,
      analyzedData,
      datasets,
      loading,
      addDataSource,
      updateDataSource,
      removeDataSource,
      setAnalyzedData,
      renameColumn,
      refreshDatasets,
      addDatasetAsSource
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}