// src/components/sql-builder/SavedQueries.tsx
import { useEffect, useState } from "react";
import { Search, Play, Trash2, Clock } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";
import { toast } from "sonner@2.0.3";
import { listSnapshots, deleteSnapshot, Snapshot } from "../../services/api";

interface SavedQuery {
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

// 👇 new props
interface SavedQueriesProps {
  onLoadQuery: (query: string) => void;
}

export function SavedQueries({ onLoadQuery }: SavedQueriesProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>([]);

  const mapSnapshotToSavedQuery = (s: Snapshot): SavedQuery => ({
    id: s.id,
    name: s.snapshot_name,
    description: "",
    query: s.sql_query,
    tags: [],
    createdAt: s.created_at,
    lastRun: null,
    isFavorite: false,
    author: "system",
  });

  const fetchSnapshots = async () => {
    try {
      const data = await listSnapshots();
      const mapped = data.map(mapSnapshotToSavedQuery);
      setSavedQueries(mapped);
    } catch (err) {
      console.error("Failed to load snapshots", err);
      toast.error("Failed to load saved queries");
    }
  };

  useEffect(() => {
    fetchSnapshots();
  }, []);

  const handleDeleteSnapshot = async (id: number) => {
    try {
      await deleteSnapshot(id);
      toast.success("Snapshot deleted");
      setSavedQueries(savedQueries.filter((s) => s.id !== id));
    } catch {
      toast.error("Failed to delete snapshot");
    }
  };

  const filteredQueries = savedQueries.filter(
    (q) =>
      q.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.query.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full overflow-auto p-6">
      <h2 className="text-xl font-semibold mb-2">Saved Queries</h2>
      <p className="text-muted-foreground mb-6">
        Manage and reuse your saved SQL snapshots
      </p>

      <Input
        placeholder="Search snapshots..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-6"
      />

      <div className="grid gap-4">
        {filteredQueries.map((query) => (
          <Card key={query.id}>
            <CardHeader>
              <CardTitle>{query.name}</CardTitle>
              <CardDescription>
                Created at {new Date(query.createdAt).toLocaleString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">
                {query.query}
              </pre>
              <div className="flex justify-between mt-3">
                {/* 👇 Now uses prop */}
                <Button
                  onClick={() => onLoadQuery(query.query)}
                  className="gap-2"
                >
                  <Play className="h-4 w-4" /> Load Query
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteSnapshot(query.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredQueries.length === 0 && (
        <p className="text-center text-muted-foreground mt-6">
          No snapshots found
        </p>
      )}
    </div>
  );
}
