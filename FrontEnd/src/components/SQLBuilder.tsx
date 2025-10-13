// src/components/SQLBuilder.tsx
import React, { useState, useEffect } from "react";
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
import { useSQL } from "./sql-builder/SQLContext";
import { executeQuery } from "../services/api";
import { toast } from "sonner";

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
  const {
    setAnalyzedData,
    activeDatasetId,
    setActiveDataset,
    setActiveModule,
  } = useData();

  const { query: activeQuery, setQuery: setActiveQuery } = useSQL();
  const [queryResults, setQueryResults] = useState<any[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "editor" | "import" | "saved" | "sources"
  >("editor");
  type AIMsg = { id: string; type: 'assistant' | 'user'; content: string; query?: string; timestamp: Date };
  const initialMessage: AIMsg = {
    id: '1',
    type: 'assistant',
    content: "Hi! I'm your AI SQL assistant. I can help you write SQL queries using natural language. Try asking me something like 'Show me monthly revenue by region' or 'Find all users who signed up last month'.",
    timestamp: new Date()
  };
  const [messages, setMessages] = useState<AIMsg[]>([initialMessage]);

  // ✅ Mark SQL module active
  useEffect(() => {
    setActiveModule("sql");
  }, [setActiveModule]);

  // ✅ Preload query for selected dataset without overwriting user-entered SQL or query results
  useEffect(() => {
    if (!activeDatasetId) return;
    // Don't overwrite the editor when the active dataset is a transient query result
    if (String(activeDatasetId).startsWith("query_result_")) return;
    // Don't overwrite if the user already has something in the editor
    if (activeQuery && activeQuery.trim().length > 0) return;
    setActiveQuery(`SELECT * FROM "${activeDatasetId}" LIMIT 10;`);
  }, [activeDatasetId, activeQuery, setActiveQuery]);

  // ✅ Infer column type
  const inferColumnType = (
    columnName: string,
    data: any[]
  ): "string" | "number" | "date" => {
    if (data.length === 0) return "string";
    const firstValue = data[0][columnName];
    const lower = columnName.toLowerCase();
    if (lower.includes("date") || lower.includes("time") || lower.includes("_at"))
      return "date";
    if (typeof firstValue === "number" || !isNaN(Number(firstValue)))
      return "number";
    return "string";
  };

  // ✅ Execute query
  const handleExecuteQuery = async (query: string) => {
    setIsExecuting(true);
    setActiveQuery(query);

    try {
      const result = await executeQuery(query);
      setQueryResults(result.data);

      const columns = result.columns.map((col: string) => ({
        name: col,
        type: inferColumnType(col, result.data),
        originalName: col,
      }));

      const datasetId = `query_result_${Date.now()}`;

      const match = query.match(/from\s+([a-zA-Z0-9_]+)/i);
      const tableRef = match ? match[1] : null;

      const friendlyName = tableRef
        ? `Query on ${tableRef} (${result.rows_returned} rows)`
        : `Unsaved Query Result (${result.rows_returned} rows)`;

      setActiveDataset(datasetId);

      setAnalyzedData({
        sourceId: datasetId,
        query,
        results: result.data,
        columns,
        timestamp: new Date(),
      });

      toast.success(`Query executed. ${result.rows_returned} rows returned.`);
    } catch (err) {
      console.error("Query failed:", err);
      toast.error("Query failed.");
    } finally {
      setIsExecuting(false);
    }
  };

  // ✅ Handle CSV Import
  const handleImport = (fileName: string, rows: any[], cols: any[]) => {
    const dsId = fileName.replace(/\s+/g, "_").toLowerCase();
    setActiveDataset(dsId);

    setAnalyzedData({
      sourceId: dsId,
      query: "",
      results: rows,
      columns: cols,
      timestamp: new Date(),
    });

    toast.success(`CSV "${fileName}" imported (${rows.length} rows).`);
  };

  // ✅ Editor View
  const renderEditor = () => (
    <>
      {/* <div className="border-b border-border p-2 flex gap-2">
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
      </div> */}

      {/* ✅ Properly constrained scrollable layout */}
      <div className="flex-1 min-h-0 min-w-0 flex flex-col">
        {activeTab === "editor" && (
          <ResizablePanelGroup direction="vertical" className="min-h-0 flex-1">
            <ResizablePanel defaultSize={60} minSize={30}>
               <SQLEditor
                 onExecuteQuery={handleExecuteQuery}
                 isExecuting={isExecuting}
               />
            </ResizablePanel>

            <ResizableHandle />

            <ResizablePanel
              defaultSize={40}
              minSize={20}
              className="overflow-hidden"
            >
              <div className="h-full w-full flex flex-col min-h-0 min-w-0">
                <div className="flex-1 overflow-x-auto overflow-y-auto">
                  <ResultsDisplay
                    results={queryResults}
                    query={activeQuery}
                    isLoading={isExecuting}
                  />
                </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        )}

  {activeTab === "import" && <DataImport />}
        {activeTab === "saved" && (
          <SavedQueries
            goToEditor={() => {
              setActiveTab("editor");
              setActiveTool("editor");
            }}
          />
        )}
        {activeTab === "sources" && <ConnectedSources />}
      </div>
    </>
  );

  return (
    <div className="h-full flex min-h-0 min-w-0">
      <div className="flex-1 flex flex-col min-h-0 min-w-0">
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
  {activeTool === "ai" && <AIAssistant onQueryGenerated={setActiveQuery} messages={messages} setMessages={setMessages} />}
        {activeTool === "sources" && <ConnectedSources />}
      </div>

      {showAIAssistant && (
        <div className="w-80 border-l border-border">
          <AIAssistant onQueryGenerated={setActiveQuery} messages={messages} setMessages={setMessages} />
        </div>
      )}
    </div>
  );
};

export default SQLBuilder;
 