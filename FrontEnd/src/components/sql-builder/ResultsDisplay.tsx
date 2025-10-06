// src/components/sql-builder/ResultsDisplay.tsx
import { useState } from "react";
import {
  Download,
  Copy,
  BarChart3,
  Table as TableIcon,
  FileJson,
  FileSpreadsheet,
} from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  BarChart,
  LineChart,
  PieChart,
  Bar,
  Line,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { toast } from "sonner@2.0.3";

interface ResultsDisplayProps {
  results: any[];
  query: string;
  isLoading: boolean;
}

export function ResultsDisplay({
  results,
  query,
  isLoading,
}: ResultsDisplayProps) {
  const [activeView, setActiveView] = useState<"table" | "chart">("table");

  // ---------- Export / Copy ----------
  const handleCopyResults = () => {
    if (!results.length) return toast.error("No data to copy");
    const headers = Object.keys(results[0]).join("\t");
    const rows = results.map((r) => Object.values(r).join("\t")).join("\n");
    navigator.clipboard.writeText(`${headers}\n${rows}`);
    toast.success("Results copied to clipboard");
  };

  const handleExport = (format: "csv" | "json" | "excel") => {
    if (!results.length) return toast.error("No data to export");

    let content = "";
    let mimeType = "";
    let filename = "";

    if (format === "json") {
      content = JSON.stringify(results, null, 2);
      mimeType = "application/json";
      filename = "query_results.json";
    } else {
      const headers = Object.keys(results[0]).join(",");
      const rows = results
        .map((r) =>
          Object.values(r)
            .map((v) => (typeof v === "string" ? `"${v}"` : v))
            .join(",")
        )
        .join("\n");
      content = `${headers}\n${rows}`;
      mimeType = "text/csv";
      filename =
        format === "csv" ? "query_results.csv" : "query_results.xlsx";
    }

    const blob = new Blob([content], { type: mimeType });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success(`Exported as ${format.toUpperCase()}`);
  };

  // ---------- Chart Data ----------
  const chartData = results.slice(0, 20);
  const keys = results.length ? Object.keys(results[0]) : [];
  const numericKeys = keys.filter((k) =>
    results.some((r) => typeof r[k] === "number")
  );
  const xColumn = keys[0] || "";
  const yColumn = numericKeys[0] || "";
  const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7c7c", "#8dd1e1"];

  // ---------- Loading / Empty ----------
  if (isLoading)
    return (
      <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
        Executing query...
      </div>
    );
  if (!query)
    return (
      <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
        Execute a SQL query to see results here.
      </div>
    );
  if (!results.length)
    return (
      <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
        No results found.
      </div>
    );

  // ---------- Main Render ----------
  return (
    <div className="flex flex-col h-full bg-card">
      {/* Header */}
      <div className="border-b border-border p-4 flex items-center justify-between">
        <h3 className="font-medium">Query Results</h3>
        <div className="flex items-center gap-2">
          <Badge variant="default">{results.length} rows</Badge>
          <Button variant="outline" size="sm" onClick={handleCopyResults}>
            <Copy className="h-4 w-4 mr-1" /> Copy
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-1" /> Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleExport("csv")}>
                <FileSpreadsheet className="h-4 w-4 mr-2" /> CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("json")}>
                <FileJson className="h-4 w-4 mr-2" /> JSON
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("excel")}>
                <FileSpreadsheet className="h-4 w-4 mr-2" /> Excel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeView}
        onValueChange={(v) => setActiveView(v as "table" | "chart")}
      >
        <TabsList className="border-b p-2">
          <TabsTrigger value="table">
            <TableIcon className="h-4 w-4 mr-1" /> Table
          </TabsTrigger>
          <TabsTrigger value="chart">
            <BarChart3 className="h-4 w-4 mr-1" /> Chart
          </TabsTrigger>
        </TabsList>

        {/* -------- TABLE VIEW -------- */}
        <TabsContent value="table" className="flex-1 min-h-0">
  {/* This wrapper gets real scrollbars, regardless of parent overflow settings */}
  {/* ✅ Scrollable in both directions */}
        <div className="results-scroll h-full w-full relative">
          <div className="overflow-x-auto overflow-y-auto w-fit min-w-full scrollbar-gutter-stable">
            <table className="min-w-max text-sm border-collapse">
              <thead className="bg-muted sticky top-0 z-10">
                <tr>
                  {Object.keys(results[0]).map((col) => (
                    <th
                      key={col}
                      className="border px-4 py-2 text-left font-medium whitespace-nowrap bg-muted"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-muted/30">
                    {Object.values(row).map((val, cIdx) => (
                      <td
                        key={cIdx}
                        className="border px-4 py-2 whitespace-nowrap font-mono"
                      >
                        {val !== null && val !== undefined ? String(val) : "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

</TabsContent>

        {/* -------- CHART VIEW -------- */}
        <TabsContent value="chart" className="flex-1 p-4">
          {chartData.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey={xColumn} />
                <YAxis />
                <Tooltip />
                <Bar dataKey={yColumn} fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
              No numeric data available for chart.
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
