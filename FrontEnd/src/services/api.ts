const API_BASE_URL = "http://localhost:8000";

// ----------------------
// Dataset Types
// ----------------------
export interface Dataset {
  id: number;
  name: string;
  description: string | null;
  filename: string;
  file_type: string;
  file_size: number;
  columns_info: string;
  row_count: number;
  created_at: string;
  updated_at: string;
  is_processed: boolean;
  user_id: string | null;
  visualizations_count: number;
}

export interface QueryResult {
  rows_returned: number;
  columns: string[];
  data: Record<string, any>[];
}

export interface UploadResponse {
  message: string;
  datasets: Dataset[];
}

export interface ListDatasetsResponse {
  datasets: Dataset[];
  total: number;
}

// ----------------------
// Saved Query (legacy)
// ----------------------
export interface SavedQuery {
  id: number;
  name: string;
  description: string;
  query: string;
  tags: string[];
  createdAt: string;
  lastRun: string | null;
  isFavorite: boolean;
  author: string;
}

// ----------------------
// Dataset APIs
// ----------------------
export const uploadFiles = async (files: File[]): Promise<UploadResponse> => {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append("files", file);
  });

  const response = await fetch(`${API_BASE_URL}/api/data/upload-multiple`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }

  return response.json();
};

export const listDatasets = async (): Promise<Dataset[]> => {
  const response = await fetch(`${API_BASE_URL}/api/data/`);
  if (!response.ok) {
    throw new Error(`Failed to fetch datasets: ${response.statusText}`);
  }
  const data = await response.json();
  return data.datasets || [];
};

// ✅ Unified preview response type
export interface PreviewResponse {
  columns: { name: string; dtype: string }[];
  rows: any[];
  total_rows: number;
}

export const getDatasetPreview = async (
  datasetId: number,
  limit: number = 50
): Promise<PreviewResponse> => {
  const response = await fetch(
    `${API_BASE_URL}/api/data/${datasetId}/preview?limit=${limit}`
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch dataset preview: ${response.statusText}`);
  }
  return response.json();
};

// ----------------------
// Query Execution API
// ----------------------
export const executeQuery = async (sql: string): Promise<QueryResult> => {
  const response = await fetch(
    `${API_BASE_URL}/query?sql=${encodeURIComponent(sql)}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    }
  );

  if (!response.ok) {
    throw new Error(`Query failed: ${response.statusText}`);
  }

  return response.json();
};

// ----------------------
// Helpers
// ----------------------
export const parseColumnsInfo = (columnsInfo: string): string[] => {
  try {
    const cleanedInfo = columnsInfo.replace(/'/g, '"');
    return JSON.parse(cleanedInfo);
  } catch (error) {
    console.error("Failed to parse columns info:", error);
    return [];
  }
};

// ----------------------
// Snapshot Types & APIs
// ----------------------
export interface Snapshot {
  id: number;
  snapshot_name: string;
  sql_query: string;
  result_table: string;
  created_at: string;
}

export const listSnapshots = async (): Promise<Snapshot[]> => {
  const res = await fetch(`${API_BASE_URL}/query/snapshots`);
  if (!res.ok) throw new Error("Failed to fetch snapshots");
  return res.json();
};

export const createSnapshot = async (
  snapshot_name: string,
  sql_query: string
): Promise<Snapshot> => {
  const res = await fetch(`${API_BASE_URL}/query/snapshots`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ snapshot_name, sql_query }),
  });
  if (!res.ok) throw new Error("Failed to create snapshot");
  return res.json();
};

export const deleteSnapshot = async (id: number): Promise<void> => {
  const res = await fetch(`${API_BASE_URL}/query/snapshots/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete snapshot");
};

export const getSnapshotPreview = async (
  snapshotId: number,
  limit: number = 50
): Promise<PreviewResponse> => {
  const res = await fetch(
    `${API_BASE_URL}/query/snapshots/${snapshotId}/preview?limit=${limit}`
  );
  if (!res.ok) throw new Error("Failed to fetch snapshot preview");
  return res.json();
};

// ----------------------
// 🔥 Unified Sources API
// ----------------------
export interface DataSource {
  id: number;
  name: string;
  type: "dataset" | "snapshot";
  rows: number;
  file_type: string;
  filename?: string;
  result_table?: string;
}

export const listAllSources = async (): Promise<{ sources: DataSource[] }> => {
  const res = await fetch(`${API_BASE_URL}/query/all-sources`);
  if (!res.ok) throw new Error("Failed to fetch sources");
  return res.json();
};

/// ----------------------
// Dashboard Types
// ----------------------
export interface ChartConfig {
  id: string;
  type: "bar" | "line" | "pie" | "scatter" | "heatmap" | "treemap" | "geo";
  title: string;
  data: any[];
  x: string | null;
  y: string | null;
  position: { x: number; y: number };
  size: { width: number; height: number };
  filters: Record<string, any>;
}

export interface Dashboard {
  id: number;
  dataset_id: number;
  name: string;
  config: ChartConfig[];
  created_at: string;
}

// ----------------------
// Dashboard APIs
// ----------------------

// ✅ Save (always normalize charts before sending)
export const saveDashboard = async (
  datasetId: number | string | null | undefined,
  name: string,
  charts: ChartConfig[]
): Promise<Dashboard> => {
  if (!datasetId || isNaN(Number(datasetId))) {
    throw new Error(`Invalid datasetId: ${datasetId}`);
  }

  const normalizedCharts = charts.map((c) => ({
    id: c.id,
    type: c.type,
    title: c.title || "",
    data: c.data || [],
    x: c.x || "", // must be string, backend expects str
    y: c.y || "", // must be string, backend expects str
    position: c.position || { x: 0, y: 0 },
    size: c.size || { width: 400, height: 300 },
    filters: c.filters || {},
  }));

  const payload = {
    dataset_id: Number(datasetId),  // ✅ guaranteed integer
    name,
    config: normalizedCharts,
  };

  console.log("📤 Saving dashboard payload:", payload);

  const res = await fetch(`${API_BASE_URL}/api/dashboards`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error("❌ Save dashboard failed:", err);
    throw new Error(`Failed to save dashboard: ${res.statusText}`);
  }

  return res.json();
};



// List all dashboards (optionally by dataset)
export const listDashboards = async (
  datasetId?: number
): Promise<Dashboard[]> => {
  const url = datasetId
    ? `${API_BASE_URL}/api/dashboards/list?dataset_id=${datasetId}`
    : `${API_BASE_URL}/api/dashboards/list`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch dashboards");
  return res.json();
};

// Load a specific dashboard by ID
export const loadDashboard = async (id: number): Promise<Dashboard> => {
  const res = await fetch(`${API_BASE_URL}/api/dashboards/${id}`);
  if (!res.ok) throw new Error("Failed to fetch dashboard");
  return res.json();
};
