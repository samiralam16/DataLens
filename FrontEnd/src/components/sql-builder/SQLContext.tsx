// src/components/SQLContext.tsx
import { createContext, useContext, useState, ReactNode } from "react";

interface SQLContextType {
  query: string;
  setQuery: (q: string) => void;
}

const SQLContext = createContext<SQLContextType | undefined>(undefined);

export function SQLProvider({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState(
    `-- Welcome to DataViz Pro SQL Editor
-- Your available datasets are listed on the right
-- Click on a dataset to see its structure

SELECT * FROM your_dataset_name LIMIT 10;`
  );

  return (
    <SQLContext.Provider value={{ query, setQuery }}>
      {children}
    </SQLContext.Provider>
  );
}

export function useSQL() {
  const context = useContext(SQLContext);
  if (!context) {
    throw new Error("useSQL must be used inside SQLProvider");
  }
  return context;
}
