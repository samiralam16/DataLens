import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Dataset, listDatasets, parseColumnsInfo, getDatasetPreview } from '../services/api';

export interface DataSource {
  id: string; // DB primary key
  name: string; // Friendly display name
  tableName: string; // ✅ Actual SQLite table name
  type: 'csv' | 'database' | 'api' | 'cloud';
  status: 'connected' | 'pending' | 'error';
  data: any[];
  columns: { name: string; type: 'string' | 'number' | 'date'; originalName: string }[];
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
  activeDatasetId: string | null; // ✅ always stores tableName now
  activeModule: 'sql' | 'web';
  setActiveDataset: (id: string | null) => void;
  setActiveModule: (m: 'sql' | 'web') => void;
  refreshDatasets: () => Promise<void>;
  setAnalyzedData: (data: AnalyzedData | null) => void;
}

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzedData, setAnalyzedData] = useState<AnalyzedData | null>(null);

  // persist across reloads
  const [activeDatasetId, setActiveDatasetId] = useState<string | null>(() =>
    localStorage.getItem("activeDatasetId")
  );
  const [activeModule, setActiveModuleState] = useState<'sql' | 'web'>(() =>
    (localStorage.getItem("activeModule") as 'sql' | 'web') || 'sql'
  );

  useEffect(() => {
    if (activeDatasetId) localStorage.setItem("activeDatasetId", activeDatasetId);
  }, [activeDatasetId]);

  useEffect(() => {
    localStorage.setItem("activeModule", activeModule);
  }, [activeModule]);

  // Load datasets
  useEffect(() => {
    refreshDatasets();
  }, []);

  const refreshDatasets = async () => {
    setLoading(true);
    try {
      const backendDatasets = await listDatasets();
      setDatasets(backendDatasets);

      const convertedSources: DataSource[] = await Promise.all(
        backendDatasets.map(async (dataset) => {
          const columns = parseColumnsInfo(dataset.columns_info);
          let rows: any[] = [];
          try {
            const preview = await getDatasetPreview(dataset.id, 20);
            rows = preview.rows || [];
          } catch (err) {
            console.warn("Preview fetch failed for", dataset.name, err);
          }

          return {
            id: dataset.id.toString(),
            name: dataset.name,
            tableName: dataset.name.replace(/\s+/g, "_").toLowerCase(), // ✅ normalized
            type: dataset.file_type as any,
            status: dataset.is_processed ? 'connected' : 'pending',
            data: rows,
            columns: columns.map(c => ({
              name: c,
              type: inferColumnType(c),
              originalName: c
            })),
            backendDataset: dataset
          };
        })
      );

      setDataSources(convertedSources);
    } catch (err) {
      console.error("Failed to refresh datasets", err);
    } finally {
      setLoading(false);
    }
  };

  const inferColumnType = (col: string): 'string' | 'number' | 'date' => {
    const lower = col.toLowerCase();
    if (lower.includes('date') || lower.includes('time')) return 'date';
    if (lower.includes('id') || lower.includes('count') || lower.includes('price')) return 'number';
    return 'string';
  };

  return (
    <DataContext.Provider value={{
      dataSources,
      analyzedData,
      datasets,
      loading,
      activeDatasetId,
      activeModule,
      setActiveDataset: setActiveDatasetId,
      setActiveModule: setActiveModuleState,
      refreshDatasets,
      setAnalyzedData
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData must be used inside DataProvider");
  return context;
}
