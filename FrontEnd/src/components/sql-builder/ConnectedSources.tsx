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
      setDatasets(data);
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
        if (previewData?.id === id) {
        setPreviewData(null); // toggle off
        return;
        }
        const res = await fetch(`http://localhost:8000/api/data/${id}`);
        if (!res.ok) throw new Error("Preview failed");
        const data = await res.json();

        // 🔑 Ensure columns_info is parsed here
        const cols = parseColumnsInfo(data.columns_info);
        setPreviewData({ ...data, parsed_columns: cols });
    } catch (error: any) {
        toast.error("Failed to load preview");
    }
    };


  return (
    <div className="p-6">
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
                      variant="outline"
                      onClick={() => handlePreview(ds.id)}
                    >
                      <Eye className="h-4 w-4 mr-1" /> Preview
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

            {previewData.data_preview && previewData.data_preview.length > 0 ? (
            <table className="w-full border text-sm">
                <thead>
                <tr>
                    {previewData.parsed_columns.map((col: string) => (
                    <th key={col} className="border px-2 py-1 bg-muted">
                        {col}
                    </th>
                    ))}
                </tr>
                </thead>
                <tbody>
                {previewData.data_preview.slice(0, 5).map((row: any, idx: number) => (
                    <tr key={idx}>
                    {previewData.parsed_columns.map((col: string) => (
                        <td key={col} className="border px-2 py-1">
                        {row[col] ?? "-"}
                        </td>
                    ))}
                    </tr>
                ))}
                </tbody>
            </table>
            ) : (
            <p className="text-muted-foreground">No preview data available</p>
            )}
        </div>
        )}

    </div>
  );
};
