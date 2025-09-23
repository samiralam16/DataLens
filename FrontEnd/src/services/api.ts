const API_BASE_URL = 'http://localhost:8000';

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

// Upload multiple files
export const uploadFiles = async (files: File[]): Promise<UploadResponse> => {
  const formData = new FormData();
  files.forEach(file => {
    formData.append('files', file);
  });

  const response = await fetch(`${API_BASE_URL}/api/data/upload-multiple`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }

  return response.json();
};

// List all datasets
export const listDatasets = async (): Promise<Dataset[]> => {
  const response = await fetch(`${API_BASE_URL}/api/data/`);

  if (!response.ok) {
    throw new Error(`Failed to fetch datasets: ${response.statusText}`);
  }

  const data = await response.json();
  // The API returns an array directly, but let's handle both formats
  return Array.isArray(data) ? data : data.datasets || [];
};

// Execute SQL query
export const executeQuery = async (sql: string): Promise<QueryResult> => {
  const response = await fetch(`${API_BASE_URL}/query?sql=${encodeURIComponent(sql)}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Query failed: ${response.statusText}`);
  }

  return response.json();
};

// Helper function to parse columns info string into array
export const parseColumnsInfo = (columnsInfo: string): string[] => {
  try {
    // Remove any extra quotes and parse the string as JSON
    const cleanedInfo = columnsInfo.replace(/'/g, '"');
    return JSON.parse(cleanedInfo);
  } catch (error) {
    console.error('Failed to parse columns info:', error);
    return [];
  }
};