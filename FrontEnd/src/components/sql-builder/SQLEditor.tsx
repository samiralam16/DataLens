import { useState, useRef, useEffect } from "react";
import { Play, Save, Download, Copy, RotateCcw, Database } from "lucide-react";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { ScrollArea } from "../ui/scroll-area";
import { Card } from "../ui/card";
import { toast } from "sonner";
import { useSQL } from "./SQLContext";
import { createSnapshot, listAllSources } from "../../services/api";

interface SQLEditorProps {
  onExecuteQuery: (query: string) => void;
  isExecuting: boolean;
}

export function SQLEditor({ onExecuteQuery, isExecuting }: SQLEditorProps) {
  const { query, setQuery } = useSQL();
  const [queryHistory, setQueryHistory] = useState<string[]>([]);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 👇 merged datasets + snapshots
  const [sources, setSources] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSources = async () => {
    setLoading(true);
    try {
      const data = await listAllSources();
      setSources(data.sources);
    } catch (e) {
      console.error("Failed to fetch sources", e);
      toast.error("Failed to load datasets/snapshots");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSources();
  }, []);

  const handleExecute = () => {
    if (!query.trim()) {
      toast.error("Please enter a SQL query");
      return;
    }
    setQueryHistory((prev) => [query, ...prev.slice(0, 9)]);
    onExecuteQuery(query);
    toast.success("Query executed successfully");
  };

  const handleSave = async () => {
    if (!query.trim()) {
      toast.error("Please enter a SQL query to save");
      return;
    }

    // Pre-validate: snapshot API only supports SELECT
    if (!/^\s*select\b/i.test(query)) {
      toast.error("Only SELECT queries can be saved as snapshots");
      return;
    }

    const snapshotName = prompt("Enter a name for this snapshot:");
    if (!snapshotName) {
      toast.error("Snapshot name is required");
      return;
    }

    try {
      await createSnapshot(snapshotName, query);
      toast.success("Query saved as snapshot");
      fetchSources(); // refresh list
    } catch (err: any) {
      console.error("Error saving snapshot", err);
      const message = err?.message || "Failed to save snapshot";
      toast.error(message);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(query);
    toast.success("Query copied to clipboard");
  };

  const handleDownload = () => {
    const blob = new Blob([query], { type: "text/sql" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "query.sql";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Query downloaded");
  };

  const insertDatasetQuery = (tableName: string) => {
    const newQuery = `SELECT * FROM "${tableName}" LIMIT 10;`;
    setQuery(newQuery);
    toast.success(`Query template inserted for ${tableName}`);
  };

  return (
    <div className="h-full flex bg-card">
      {/* Main Editor */}
      <div className="flex-1 flex flex-col">
        <div className="border-b border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium">SQL Editor</h3>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">FastAPI Backend</Badge>
              <Badge variant="outline">Connected</Badge>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={handleExecute} disabled={isExecuting} className="gap-2">
              {isExecuting ? (
                <RotateCcw className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              {isExecuting ? "Executing..." : "Run Query"}
            </Button>

            <Separator orientation="vertical" className="h-6" />

            <Button variant="outline" size="sm" onClick={handleSave}>
              <Save className="h-4 w-4 mr-1" /> Save
            </Button>
            <Button variant="outline" size="sm" onClick={handleCopy}>
              <Copy className="h-4 w-4 mr-1" /> Copy
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-1" /> Download
            </Button>
          </div>
        </div>

        <div className="flex-1 p-4">
          <Textarea
            ref={textareaRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter your SQL query here..."
            className="h-full font-mono text-sm resize-none border-0 focus-visible:ring-0 p-0"
            style={{ background: "transparent", minHeight: "300px" }}
          />
        </div>
      </div>

      {/* Sidebar for datasets + snapshots */}
      <div className="w-80 border-l border-border bg-card flex flex-col min-h-0 overflow-x-auto">
        <div className="border-b border-border p-4 shrink-0">
          <h4 className="font-medium flex items-center gap-2">
            <Database className="h-4 w-4" />
            Available Datasets
          </h4>
          <p className="text-xs text-muted-foreground mt-1">
            Click on a dataset or snapshot to insert a query template
          </p>
        </div>
        <ScrollArea className="flex-1 min-h-0 overflow-x-auto">
          <div className="p-4 space-y-3">
            {loading ? (
              <div className="text-center text-muted-foreground text-sm py-8">
                Loading sources...
              </div>
            ) : sources.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-8">
                No datasets or snapshots available.
              </div>
            ) : (
              sources.map((src) => (
                <Card
                    key={`${src.type}-${src.id}`}
                    className={`p-3 cursor-pointer hover:bg-accent transition-colors ${
                      selectedSource === src.name ? "ring-2 ring-primary" : ""
                    }`}
                    onClick={() => {
                      setSelectedSource(src.name);
                      const tableName = src.type === "snapshot" ? src.result_table : src.name;
                      if (tableName) {
                        insertDatasetQuery(tableName);
                      } else {
                        toast.error("Table name not found for this source");
                      }
                    }}
                  >

                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h5 className="font-medium text-sm">{src.name}</h5>
                      <p className="text-xs text-muted-foreground mt-1">
                        {src.type === "snapshot" ? "Snapshot" : src.filename}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {src.type.toUpperCase()}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {src.rows} rows
                        </Badge>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
