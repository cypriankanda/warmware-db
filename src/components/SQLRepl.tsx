import React, { useState, useRef, useEffect } from 'react';
import { SQLHighlighter } from './SQLHighlighter';
import { QueryResult, Row } from '@/lib/rdbms/types';
import { db } from '@/lib/rdbms';
import { ChevronRight, Database, Table as TableIcon, Terminal } from 'lucide-react';

interface HistoryEntry {
  id: number;
  sql: string;
  result: QueryResult;
  timestamp: Date;
}

export const SQLRepl: React.FC = () => {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [history]);

  const executeQuery = () => {
    if (!input.trim()) return;

    const result = db.execute(input.trim());
    const entry: HistoryEntry = {
      id: Date.now(),
      sql: input.trim(),
      result,
      timestamp: new Date(),
    };

    setHistory(prev => [...prev, entry]);
    setInput('');
    setHistoryIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      executeQuery();
    } else if (e.key === 'ArrowUp' && e.ctrlKey) {
      e.preventDefault();
      const queryHistory = history.filter(h => h.sql);
      if (queryHistory.length > 0) {
        const newIndex = historyIndex === -1 
          ? queryHistory.length - 1 
          : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setInput(queryHistory[newIndex].sql);
      }
    } else if (e.key === 'ArrowDown' && e.ctrlKey) {
      e.preventDefault();
      const queryHistory = history.filter(h => h.sql);
      if (historyIndex !== -1) {
        const newIndex = historyIndex + 1;
        if (newIndex >= queryHistory.length) {
          setHistoryIndex(-1);
          setInput('');
        } else {
          setHistoryIndex(newIndex);
          setInput(queryHistory[newIndex].sql);
        }
      }
    }
  };

  const renderResult = (entry: HistoryEntry) => {
    const { result } = entry;

    if (!result.success) {
      return (
        <div className="text-terminal-error font-mono text-sm">
          Error: {result.error}
        </div>
      );
    }

    if (result.data && result.data.length > 0) {
      return <DataTable data={result.data} />;
    }

    return (
      <div className="text-terminal-success font-mono text-sm">
        {result.message || 'Query executed successfully'}
        {result.affectedRows !== undefined && ` (${result.affectedRows} rows affected)`}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-terminal-bg rounded-xl border border-terminal-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-card border-b border-border">
        <Terminal className="w-4 h-4 text-primary" />
        <span className="font-mono text-sm font-semibold">SQL REPL</span>
        <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
          <kbd className="px-1.5 py-0.5 bg-muted rounded">Ctrl</kbd>
          <span>+</span>
          <kbd className="px-1.5 py-0.5 bg-muted rounded">Enter</kbd>
          <span>to execute</span>
        </div>
      </div>

      {/* Output Area */}
      <div 
        ref={outputRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin"
      >
        {history.length === 0 && (
          <div className="text-muted-foreground text-sm font-mono">
            <p className="mb-2">Welcome to the SQL REPL! Try these commands:</p>
            <div className="space-y-1 text-xs opacity-70">
              <p>• CREATE TABLE users (id INT PRIMARY KEY, name VARCHAR(100), email VARCHAR(255) UNIQUE)</p>
              <p>• INSERT INTO users (name, email) VALUES ('John', 'john@example.com')</p>
              <p>• SELECT * FROM users</p>
              <p>• UPDATE users SET name = 'Jane' WHERE id = 1</p>
              <p>• DELETE FROM users WHERE id = 1</p>
            </div>
          </div>
        )}

        {history.map(entry => (
          <div key={entry.id} className="animate-slide-up">
            {/* Query */}
            <div className="flex items-start gap-2 mb-2">
              <ChevronRight className="w-4 h-4 text-terminal-prompt mt-0.5 flex-shrink-0" />
              <SQLHighlighter sql={entry.sql} className="text-sm" />
            </div>
            {/* Result */}
            <div className="ml-6 pl-4 border-l-2 border-border/50">
              {renderResult(entry)}
            </div>
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="border-t border-border bg-card/50 p-4">
        <div className="flex items-start gap-2">
          <ChevronRight className="w-4 h-4 text-terminal-prompt mt-2 flex-shrink-0" />
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter SQL query..."
              className="w-full bg-transparent font-mono text-sm resize-none focus:outline-none placeholder:text-muted-foreground/50 min-h-[60px]"
              rows={3}
            />
            <span className="absolute right-0 bottom-0 w-2 h-4 bg-primary animate-blink" />
          </div>
        </div>
      </div>
    </div>
  );
};

const DataTable: React.FC<{ data: Row[] }> = ({ data }) => {
  if (data.length === 0) return null;

  const columns = Object.keys(data[0]);

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col} className="font-mono text-xs uppercase tracking-wider">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i}>
              {columns.map(col => (
                <td key={col} className="font-mono text-sm">
                  {formatValue(row[col])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

function formatValue(value: unknown): string {
  if (value === null) return 'NULL';
  if (value === undefined) return '';
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

export const SchemaViewer: React.FC = () => {
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setTables(db.getTableNames());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const selectedSchema = selectedTable ? db.getTableSchema(selectedTable) : null;
  const rowCount = selectedTable ? db.getTableRowCount(selectedTable) : 0;

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-card border-b border-border">
        <Database className="w-4 h-4 text-accent" />
        <span className="font-mono text-sm font-semibold">Schema Browser</span>
      </div>

      <div className="p-4">
        {tables.length === 0 ? (
          <p className="text-muted-foreground text-sm">No tables created yet</p>
        ) : (
          <div className="space-y-2">
            {tables.map(table => (
              <button
                key={table}
                onClick={() => setSelectedTable(selectedTable === table ? null : table)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors ${
                  selectedTable === table 
                    ? 'bg-primary/20 text-primary' 
                    : 'hover:bg-muted'
                }`}
              >
                <TableIcon className="w-4 h-4" />
                <span className="font-mono text-sm">{table}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {db.getTableRowCount(table)} rows
                </span>
              </button>
            ))}
          </div>
        )}

        {selectedSchema && (
          <div className="mt-4 pt-4 border-t border-border">
            <h4 className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-3">
              Columns
            </h4>
            <div className="space-y-2">
              {selectedSchema.columns.map(col => (
                <div key={col.name} className="flex items-center gap-2 text-sm">
                  <span className="font-mono text-foreground">{col.name}</span>
                  <span className="text-sql-keyword text-xs">{col.type}</span>
                  {col.primaryKey && (
                    <span className="px-1.5 py-0.5 bg-primary/20 text-primary text-xs rounded">
                      PK
                    </span>
                  )}
                  {col.unique && !col.primaryKey && (
                    <span className="px-1.5 py-0.5 bg-accent/20 text-accent text-xs rounded">
                      UQ
                    </span>
                  )}
                  {col.notNull && (
                    <span className="px-1.5 py-0.5 bg-destructive/20 text-destructive text-xs rounded">
                      NN
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
