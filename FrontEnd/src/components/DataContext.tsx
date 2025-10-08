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

export interface ColumnInfo {
  name: string;
  type: 'string' | 'number' | 'date';
  originalName: string;
  values?: any[];
  range?: { min: number | string; max: number | string };
}

export interface DataSource {
  id: string;
  backendId: number;
  sourceType: 'dataset' | 'snapshot';
  name: string;
  tableName: string;
  type: 'csv' | 'database' | 'api' | 'cloud' | 'snapshot';
  status: 'connected' | 'pending' | 'error';
  data: any[];
  columns: ColumnInfo[];
  backendDataset?: Dataset | null;
}

export interface AnalyzedData {
  sourceId: string;
  query: string;
  results: any[];
  columns: ColumnInfo[];
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
  setDataSources: (sources: DataSource[]) => void;
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

  // ✅ Added filter support
  filters: any[];
  setFilters: (filters: any[]) => void;
  getActiveFilteredRows: () => any[];
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

  const [filters, setFilters] = useState<any[]>([]); // ✅ new
  const [dashboards, setDashboards] = useState<Record<string, ChartConfig[]>>(() => {
    const saved = localStorage.getItem('dashboards');
    return saved ? JSON.parse(saved) : {};
  });

  // ✅ Persist dashboards
  useEffect(() => {
    localStorage.setItem('dashboards', JSON.stringify(dashboards));
  }, [dashboards]);

  // ✅ Persist active module
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

  // ✅ Enhanced column type detection
  const inferColumnType = (col: string, sampleRows: any[]): 'string' | 'number' | 'date' => {
    const values = sampleRows.map((r) => r[col]).filter(Boolean).slice(0, 10);
    if (values.length === 0) return 'string';
    if (values.every((v) => !isNaN(Number(v)))) return 'number';
    if (values.every((v) => !isNaN(Date.parse(v)))) return 'date';
    return 'string';
  };

  // ✅ Generate unique values / ranges for filters
  const enrichColumnsWithStats = (rows: any[], columns: string[]) => {
    if (!rows || rows.length === 0) return [];

    return columns.map((col) => {
      const values = rows.map((r) => r[col]).filter((v) => v !== null && v !== undefined);
      const type = inferColumnType(col, rows);

      const uniqueValues =
        type === 'string'
          ? Array.from(new Set(values))
          : type === 'date'
          ? Array.from(new Set(values.map((v) => new Date(v).toISOString().split('T')[0])))
          : [];

      const range =
        type === 'number'
          ? { min: Math.min(...values), max: Math.max(...values) }
          : type === 'date'
          ? {
              min: new Date(Math.min(...values.map((v) => new Date(v).getTime()))).toISOString().split('T')[0],
              max: new Date(Math.max(...values.map((v) => new Date(v).getTime()))).toISOString().split('T')[0],
            }
          : undefined;

      return {
        name: col,
        type,
        originalName: col,
        values: uniqueValues.length > 0 ? uniqueValues : undefined,
        range,
      };
    });
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

          const enrichedCols = enrichColumnsWithStats(rows, columns);

          return {
            id: `dataset-${dataset.id}`,
            backendId: dataset.id,
            sourceType: 'dataset',
            name: dataset.name,
            tableName: dataset.name.replace(/\s+/g, '_').toLowerCase(),
            type: dataset.file_type as any,
            status: dataset.is_processed ? 'connected' : 'pending',
            data: rows,
            columns: enrichedCols,
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
          const colNames = (preview.columns || []).map((c: any) =>
            typeof c === 'string' ? c : c.name
          );
          const enrichedCols = enrichColumnsWithStats(rows, colNames);

          return {
            id: `snapshot-${snap.id}`,
            backendId: snap.id,
            sourceType: 'snapshot',
            name: snap.snapshot_name,
            tableName: snap.result_table,
            type: 'snapshot',
            status: 'connected',
            data: rows,
            columns: enrichedCols,
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
  const removeDataSource = (id: string) =>
    setDataSources((prev) => prev.filter((ds) => ds.id !== id));

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
      columns: columns.map((c) => ({
        name: c,
        type: 'string',
        originalName: c,
      })),
      backendDataset: dataset,
    };
    setDataSources((prev) => [...prev, newSource]);
  };

  const getDashboard = (datasetId: string | number) =>
    dashboards[String(datasetId)] || [];

  const saveDashboard = (datasetId: string | number, charts: ChartConfig[]) =>
    setDashboards((prev) => ({ ...prev, [String(datasetId)]: charts }));

  const clearDashboard = (datasetId: string | number) =>
    setDashboards((prev) => {
      const { [String(datasetId)]: _, ...rest } = prev;
      return rest;
    });

  // ---------- FILTER ENGINE ----------
  const applyFilters = (rows: any[], fs: any[]) => {
    if (!rows || rows.length === 0 || !fs || fs.length === 0) return rows;

    const safe = (v: any) => (v === null || v === undefined ? '' : v);

    return rows.filter((row) => {
      return fs.every((f) => {
        // ✅ Safe column lookup (case-insensitive)
        const colKey = Object.keys(row).find(
          (k) => k.toLowerCase() === f.column.toLowerCase()
        );
        const val = colKey ? row[colKey] : undefined;

        switch (f.type) {
          case 'checkbox':
            if (!Array.isArray(f.value) || f.value.length === 0) return true;
            return f.value.includes(val);

          // ✅ Fixed Radio / Select logic
          case 'radio':
          case 'select': {
            if (!f.value || f.value === '' || f.value === null) return true;
            const cell = safe(val);
            return (
              String(cell).toLowerCase().trim() ===
              String(f.value).toLowerCase().trim()
            );
          }

          case 'slider': {
            if (!f.value || typeof val !== 'number') return true;
            const { min, max } = f.value;
            return (
              (min === undefined || val >= Number(min)) &&
              (max === undefined || val <= Number(max))
            );
          }

          case 'date': {
            if (!f.value || (!f.value.start && !f.value.end)) return true;
            const rowTime = val ? new Date(val).getTime() : NaN;
            if (Number.isNaN(rowTime)) return false;
            const start = f.value.start
              ? new Date(f.value.start).getTime()
              : -Infinity;
            const end = f.value.end ? new Date(f.value.end).getTime() : Infinity;
            return rowTime >= start && rowTime <= end;
          }

          default:
            return true;
        }
      });
    });
  };

  // ✅ Get filtered data for active dataset
  const getActiveFilteredRows = () => {
    const active = dataSources.find((ds) => ds.id === activeDatasetId);
    if (!active) return [];
    return applyFilters(active.data, filters);
  };

  return (
    <DataContext.Provider
      value={{
        dataSources,
        setDataSources,
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

        // ✅ new
        filters,
        setFilters,
        getActiveFilteredRows,
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
