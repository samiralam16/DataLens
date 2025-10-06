import React, { useEffect, useState } from "react";
import { listDatasets, Dataset, parseColumnsInfo } from "../../services/api";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { toast } from "sonner@2.0.3";
import { RefreshCw, Trash2, Eye } from "lucide-react";

export const ConnectedSources: React.FC = () => {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<any | null>(null);

  const fetchDatasets = async () => {
    setLoading(true);
    try {
      const data = await listDatasets();
      setDatasets(data.map(d => ({ ...d, id: Number(d.id) })));
    } catch (error: any) {
      console.error("Failed to fetch datasets", error);
      toast.error("Failed to load datasets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatasets();
  }, []);

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`http://localhost:8000/api/data/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Dataset deleted");
      fetchDatasets(); // refresh after delete
      if (previewData?.id === id) setPreviewData(null); // clear preview if deleted
    } catch (error: any) {
      toast.error("Failed to delete dataset");
    }
  };

  const handlePreview = async (id: number) => {
  try {
    // toggle off if same dataset
    if (previewData?.id === id) {
      setPreviewData(null);
      return;
    }

    const res = await fetch(`http://localhost:8000/api/data/${id}`);
    if (!res.ok) throw new Error("Preview failed");
    const data = await res.json();

    // 1) Parse columns from metadata
    const colsFromMeta = parseColumnsInfo(data.columns_info ?? "");

    // 2) Also derive columns from the first preview row (fallback when meta is incomplete)
    const colsFromRows =
      Array.isArray(data.data_preview) && data.data_preview.length
        ? Object.keys(data.data_preview[0])
        : [];

    // 3) Union the two sources to be robust across datasets/endpoints
    const parsedColumns = Array.from(new Set([...colsFromMeta, ...colsFromRows]));

    // 4) Normalize id to number so the Preview/Close toggle works reliably
    setPreviewData({
      ...data,
      id: Number(data.id),
      parsed_columns: parsedColumns,
    });
  } catch (error: any) {
    toast.error("Failed to load preview");
  }
};


  return (
    <div className="p-6 overflow-auto min-h-0 min-w-0 flex-1">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-lg">Connected Data Sources</h2>
        <Button
          size="sm"
          variant="outline"
          onClick={fetchDatasets}
          disabled={loading}
        >
          <RefreshCw
            className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : datasets.length === 0 ? (
        <p className="text-muted-foreground">No datasets connected yet.</p>
      ) : (
        <div className="space-y-3">
          {datasets.map((ds) => {
            const cols = parseColumnsInfo(ds.columns_info);
            return (
              <Card key={ds.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium">{ds.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {ds.file_type} • {ds.row_count} rows • {cols.length}{" "}
                      columns
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                        size="sm"
                        variant={previewData?.id === ds.id ? "secondary" : "outline"}
                        onClick={() => handlePreview(ds.id)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        {previewData?.id === ds.id ? "Close" : "Preview"}
                      </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(ds.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Preview Section */}
      {previewData && (
  <div className="mt-6">
    <h3 className="font-semibold mb-2">
      Preview of {previewData.name} ({previewData.row_count} rows)
    </h3>

    {/* ✅ Handle both new (columns + rows) and old (data_preview) structures */}
    {previewData.rows && previewData.rows.length > 0 ? (
      <div className="results-scroll w-full mt-2 rounded-md border max-h-[400px] overflow-x-auto overflow-y-auto">
        <table className="min-w-max border-collapse text-sm">
          <thead>
            <tr>
              {previewData.columns.map((col: any) => (
                <th
                  key={col.name ?? col}
                  className="border px-2 py-1 bg-muted text-left whitespace-nowrap sticky top-0 z-10"
                >
                  {col.name ?? col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {previewData.rows.slice(0, 10).map((row: any, idx: number) => (
              <tr key={idx}>
                {previewData.columns.map((col: any) => (
                  <td
                    key={col.name ?? col}
                    className="border px-2 py-1 whitespace-nowrap"
                  >
                    {String(row[col.name ?? col] ?? "-")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : previewData.data_preview && previewData.data_preview.length > 0 ? (
      // 🧩 fallback for older previewData
      <div className="results-scroll w-full mt-2 rounded-md border max-h-[400px] overflow-x-auto overflow-y-auto">
        <table className="min-w-max border-collapse text-sm">
          <thead>
            <tr>
              {previewData.parsed_columns.map((col: string) => (
                <th
                  key={col}
                  className="border px-2 py-1 bg-muted text-left whitespace-nowrap sticky top-0 z-10"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {previewData.data_preview.slice(0, 10).map((row: any, idx: number) => (
              <tr key={idx}>
                {previewData.parsed_columns.map((col: string) => (
                  <td key={col} className="border px-2 py-1 whitespace-nowrap">
                    {row[col] ?? "-"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : (
      <p className="text-muted-foreground">No preview data available</p>
    )}
        </div>
        )}

    </div>
  );
};
