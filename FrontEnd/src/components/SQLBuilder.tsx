// src/components/SQLBuilder.tsx
import React, { useState } from "react";
import { DataImport } from "./sql-builder/DataImport";
import { SQLEditor } from "./sql-builder/SQLEditor";
import { AIAssistant } from "./sql-builder/AIAssistant";
import { SavedQueries } from "./sql-builder/SavedQueries";
import { ConnectedSources } from "./sql-builder/ConnectedSources";
import { ResultsDisplay } from "./sql-builder/ResultsDisplay";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "./ui/resizable";
import { useData } from "./DataContext";
import { executeQuery } from "../services/api";
import { toast } from "sonner@2.0.3";

export interface SQLBuilderProps {
  activeTool: string;
  setActiveTool: (tool: string) => void;
  showAIAssistant: boolean;
  setShowAIAssistant: (val: boolean) => void;
}

const SQLBuilder: React.FC<SQLBuilderProps> = ({
  activeTool,
  setActiveTool,
  showAIAssistant,
  setShowAIAssistant,
}) => {
  const { setAnalyzedData, dataSources } = useData();
  const [activeQuery, setActiveQuery] = useState("");
  const [queryResults, setQueryResults] = useState<any[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [activeTab, setActiveTab] = useState<"editor" | "import" | "saved" | "sources">(
    "editor"
  );

  const handleExecuteQuery = async (query: string) => {
    setIsExecuting(true);
    setActiveQuery(query);

    try {
      const result = await executeQuery(query);
      setQueryResults(result.data);

      if (dataSources.length > 0) {
        setAnalyzedData({
          sourceId: dataSources[0].id,
          query,
          results: result.data,
          columns: result.columns.map((col) => ({
            name: col,
            type: inferColumnType(col, result.data),
            originalName: col,
          })),
          timestamp: new Date(),
        });
      }

      toast.success(
        `Query executed successfully. ${result.rows_returned} rows returned.`
      );
    } catch (error) {
      console.error("Query execution failed:", error);
      toast.error(
        `Query failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );

      // fallback to mock data
      const mockResults = generateMockResults(query);
      setQueryResults(mockResults);

      if (dataSources.length > 0) {
        setAnalyzedData({
          sourceId: dataSources[0].id,
          query,
          results: mockResults,
          columns: generateColumnsFromResults(mockResults),
          timestamp: new Date(),
        });
      }
    } finally {
      setIsExecuting(false);
    }
  };

  const inferColumnType = (
    columnName: string,
    data: any[]
  ): "string" | "number" | "date" => {
    if (data.length === 0) return "string";
    const firstValue = data[0][columnName];
    const lowerName = columnName.toLowerCase();
    if (
      lowerName.includes("date") ||
      lowerName.includes("time") ||
      lowerName.includes("_at")
    ) {
      return "date";
    }
    if (typeof firstValue === "number" || !isNaN(Number(firstValue))) {
      return "number";
    }
    return "string";
  };

  const generateMockResults = (query: string) => {
    if (query.toLowerCase().includes("revenue")) {
      return Array.from({ length: 12 }, (_, i) => ({
        month: new Date(2024, i, 1).toLocaleDateString("en-US", {
          month: "short",
        }),
        revenue: Math.floor(Math.random() * 50000) + 20000,
        region: ["North", "South", "East", "West"][
          Math.floor(Math.random() * 4)
        ],
      }));
    } else if (query.toLowerCase().includes("user")) {
      return Array.from({ length: 50 }, (_, i) => ({
        id: i + 1,
        name: `User ${i + 1}`,
        email: `user${i + 1}@example.com`,
        created_at: new Date(
          2024,
          0,
          Math.floor(Math.random() * 365)
        ).toISOString(),
        status: Math.random() > 0.5 ? "Active" : "Inactive",
      }));
    }
    return Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      value: Math.floor(Math.random() * 1000),
      category: `Category ${String.fromCharCode(65 + (i % 5))}`,
    }));
  };

  const generateColumnsFromResults = (results: any[]) => {
    if (results.length === 0) return [];
    return Object.keys(results[0]).map((key) => ({
      name: key,
      type:
        typeof results[0][key] === "number"
          ? ("number" as const)
          : key.includes("date") || key.includes("_at")
          ? ("date" as const)
          : ("string" as const),
      originalName: key,
    }));
  };

  const renderEditor = () => (
    <>
      {/* Tabs inside the Editor */}
      <div className="border-b border-border p-2 flex gap-2">
        {[
          { key: "editor", label: "SQL Editor" },
          { key: "import", label: "Data Import" },
          { key: "saved", label: "Saved Queries" },
          { key: "sources", label: "Connected Sources" },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as any)}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              activeTab === key
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content inside the Editor */}
      <div className="flex-1">
        {activeTab === "editor" && (
          <ResizablePanelGroup direction="vertical">
            <ResizablePanel defaultSize={60} minSize={30}>
              <SQLEditor
                onExecuteQuery={handleExecuteQuery}
                isExecuting={isExecuting}
              />
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel defaultSize={40} minSize={20}>
              <ResultsDisplay
                results={queryResults}
                query={activeQuery}
                isLoading={isExecuting}
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        )}

        {activeTab === "import" && <DataImport />}
        {activeTab === "saved" && (
          <SavedQueries
            goToEditor={() => {
              setActiveTab("editor");
              setActiveTool("editor"); // ensure global tool also changes
            }}
          />
        )}
        {activeTab === "sources" && <ConnectedSources />}
      </div>
    </>
  );

  return (
    <div className="h-full flex">
      <div className="flex-1 flex flex-col">
        {/* Sidebar-driven switch */}
        {activeTool === "editor" && renderEditor()}
        {activeTool === "import" && <DataImport />}
        {activeTool === "queries" && (
          <SavedQueries
            goToEditor={() => {
              setActiveTool("editor");
              setActiveTab("editor");
            }}
          />
        )}
        {activeTool === "ai" && (
          <AIAssistant onQueryGenerated={setActiveQuery} />
        )}
        {activeTool === "sources" && <ConnectedSources />}
      </div>

      {showAIAssistant && (
        <div className="w-80 border-l border-border">
          <AIAssistant onQueryGenerated={setActiveQuery} />
        </div>
      )}
    </div>
  );
};

export default SQLBuilder;
