import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import {
  Dataset,
  listDatasets,
  parseColumnsInfo,
  getDatasetPreview,
  listSnapshots,
  getSnapshotPreview,
  ChartConfig,
} from '../services/api';

export interface DataSource {
  id: string;
  backendId: number;
  sourceType: 'dataset' | 'snapshot';
  name: string;
  tableName: string;
  type: 'csv' | 'database' | 'api' | 'cloud' | 'snapshot';
  status: 'connected' | 'pending' | 'error';
  data: any[];
  columns: { name: string; type: 'string' | 'number' | 'date'; originalName: string }[];
  backendDataset?: Dataset | null;
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
  snapshots: any[];
  loading: boolean;
  activeDatasetId: string | null;
  activeModule: 'sql' | 'web';
  setActiveDataset: (id: string | null) => void;
  setActiveModule: (m: 'sql' | 'web') => void;
  refreshDatasets: () => Promise<void>;
  setAnalyzedData: (data: AnalyzedData | null) => void;
  addDataSource: (src: DataSource) => void;
  updateDataSource: (id: string, partial: Partial<DataSource>) => void;
  removeDataSource: (id: string) => void;
  addDatasetAsSource: (dataset: Dataset) => void;
  getDashboard: (datasetId: string) => ChartConfig[];
  saveDashboard: (datasetId: string, charts: ChartConfig[]) => void;
  clearDashboard: (datasetId: string) => void;
}

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzedData, setAnalyzedData] = useState<AnalyzedData | null>(null);

  const [activeDatasetId, setActiveDatasetId] = useState<string | null>(null);
  const [activeModule, setActiveModuleState] = useState<'sql' | 'web'>(() =>
    (localStorage.getItem('activeModule') as 'sql' | 'web') || 'sql'
  );

  const [dashboards, setDashboards] = useState<Record<string, ChartConfig[]>>(() => {
    const saved = localStorage.getItem('dashboards');
    return saved ? JSON.parse(saved) : {};
  });

  // ✅ Persist dashboards between sessions
  useEffect(() => {
    localStorage.setItem('dashboards', JSON.stringify(dashboards));
  }, [dashboards]);

  // ✅ Reset dataset on switching to Web Builder
  useEffect(() => {
    localStorage.setItem('activeModule', activeModule);
    if (activeModule === 'web') {
      setActiveDatasetId(null);
      setAnalyzedData(null);
    }
  }, [activeModule]);

  useEffect(() => {
    refreshDatasets();
  }, []);

  const inferColumnType = (col: string, sampleRows: any[]): 'string' | 'number' | 'date' => {
    const values = sampleRows.map((r) => r[col]).filter(Boolean).slice(0, 5);
    if (values.length === 0) return 'string';
    if (values.every((v) => !isNaN(Number(v)))) return 'number';
    if (values.every((v) => !isNaN(Date.parse(v)))) return 'date';
    return 'string';
  };

  const refreshDatasets = async () => {
    setLoading(true);
    try {
      const backendDatasets = await listDatasets();
      const backendSnapshots = await listSnapshots();

      const datasetSources: DataSource[] = await Promise.all(
        backendDatasets.map(async (dataset) => {
          const columns = parseColumnsInfo(dataset.columns_info);
          let rows: any[] = [];
          try {
            const preview = await getDatasetPreview(dataset.id, 20);
            rows = preview.rows || [];
          } catch {}
          return {
            id: `dataset-${dataset.id}`,
            backendId: dataset.id,
            sourceType: 'dataset',
            name: dataset.name,
            tableName: dataset.name.replace(/\s+/g, '_').toLowerCase(),
            type: dataset.file_type as any,
            status: dataset.is_processed ? 'connected' : 'pending',
            data: rows,
            columns: columns.map((c) => ({
              name: c,
              type: inferColumnType(c, rows),
              originalName: c,
            })),
            backendDataset: dataset,
          };
        })
      );

      const snapshotSources: DataSource[] = await Promise.all(
        backendSnapshots.map(async (snap) => {
          let preview: any = { columns: [], preview: [], rows: 0 };
          try {
            preview = await getSnapshotPreview(snap.id, 20);
          } catch {}
          const rows = preview.preview || [];
          const cols = (preview.columns || []).map((c: any) =>
            typeof c === 'string'
              ? { name: c, type: inferColumnType(c, rows), originalName: c }
              : { name: c.name, type: inferColumnType(c.name, rows), originalName: c.name }
          );
          return {
            id: `snapshot-${snap.id}`,
            backendId: snap.id,
            sourceType: 'snapshot',
            name: snap.snapshot_name,
            tableName: snap.result_table,
            type: 'snapshot',
            status: 'connected',
            data: rows,
            columns: cols,
            backendDataset: null,
          };
        })
      );

      setDataSources([...datasetSources, ...snapshotSources]);
    } finally {
      setLoading(false);
    }
  };

  const addDataSource = (src: DataSource) => setDataSources((prev) => [...prev, src]);
  const updateDataSource = (id: string, partial: Partial<DataSource>) =>
    setDataSources((prev) => prev.map((ds) => (ds.id === id ? { ...ds, ...partial } : ds)));
  const removeDataSource = (id: string) => setDataSources((prev) => prev.filter((ds) => ds.id !== id));

  const addDatasetAsSource = (dataset: Dataset) => {
    const columns = parseColumnsInfo(dataset.columns_info);
    const newSource: DataSource = {
      id: `dataset-${dataset.id}`,
      backendId: dataset.id,
      sourceType: 'dataset',
      name: dataset.name,
      tableName: dataset.name.replace(/\s+/g, '_').toLowerCase(),
      type: dataset.file_type as any,
      status: dataset.is_processed ? 'connected' : 'pending',
      data: [],
      columns: columns.map((c) => ({ name: c, type: 'string', originalName: c })),
      backendDataset: dataset,
    };
    setDataSources((prev) => [...prev, newSource]);
  };

  const getDashboard = (datasetId: string) => dashboards[datasetId] || [];
  const saveDashboard = (datasetId: string, charts: ChartConfig[]) =>
    setDashboards((prev) => ({ ...prev, [datasetId]: charts }));
  const clearDashboard = (datasetId: string) =>
    setDashboards((prev) => {
      const { [datasetId]: _, ...rest } = prev;
      return rest;
    });

  return (
    <DataContext.Provider
      value={{
        dataSources,
        analyzedData,
        datasets,
        snapshots,
        loading,
        activeDatasetId,
        activeModule,
        setActiveDataset: setActiveDatasetId,
        setActiveModule: setActiveModuleState,
        refreshDatasets,
        setAnalyzedData,
        addDataSource,
        updateDataSource,
        removeDataSource,
        addDatasetAsSource,
        getDashboard,
        saveDashboard,
        clearDashboard,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used inside DataProvider');
  return context;
}
