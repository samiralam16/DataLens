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
// Saved Query (legacy type, not used for snapshots anymore)
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
  return Array.isArray(data) ? data : data.datasets || [];
};

// ----------------------
// Query Execution API
// ----------------------
export const executeQuery = async (sql: string): Promise<QueryResult> => {
  const response = await fetch(
    `${API_BASE_URL}/query?sql=${encodeURIComponent(sql)}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
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
// Snapshot Types
// ----------------------
export interface Snapshot {
  id: number;
  snapshot_name: string;
  sql_query: string;
  result_table: string;
  created_at: string;
}

// Snapshot APIs
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
