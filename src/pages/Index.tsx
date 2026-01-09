import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SQLRepl, SchemaViewer } from '@/components/SQLRepl';
import { ContactsApp } from '@/components/ContactsApp';
import { Database, Terminal, Users } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      {/* Header */}
      <header className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center glow-primary">
            <Database className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              <span className="text-primary">Cyp-Mini</span>RDBMS
            </h1>
            <p className="text-sm text-muted-foreground">
              In-memory relational database with SQL support
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 mt-4">
          <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full font-mono">
            B-Tree Indexing
          </span>
          <span className="px-2 py-1 bg-accent/10 text-accent text-xs rounded-full font-mono">
            SQL Parser
          </span>
          <span className="px-2 py-1 bg-sql-keyword/10 text-sql-keyword text-xs rounded-full font-mono">
            PRIMARY KEY
          </span>
          <span className="px-2 py-1 bg-sql-string/10 text-sql-string text-xs rounded-full font-mono">
            UNIQUE
          </span>
          <span className="px-2 py-1 bg-sql-number/10 text-sql-number text-xs rounded-full font-mono">
            JOIN
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto">
        <Tabs defaultValue="repl" className="w-full">
          <TabsList className="mb-6 bg-card border border-border">
            <TabsTrigger value="repl" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Terminal className="w-4 h-4" />
              SQL REPL
            </TabsTrigger>
            <TabsTrigger value="demo" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Users className="w-4 h-4" />
              Demo App
            </TabsTrigger>
          </TabsList>

          <TabsContent value="repl" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3 h-[600px]">
                <SQLRepl />
              </div>
              <div className="h-[600px]">
                <SchemaViewer />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="demo" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-[600px]">
                <ContactsApp />
              </div>
              <div className="h-[600px]">
                <SQLRepl />
              </div>
            </div>
            <p className="mt-4 text-sm text-muted-foreground text-center">
              The Contacts Manager uses the RDBMS for all CRUD operations. Try running queries against the <code className="text-primary">contacts</code> table!
            </p>
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto mt-12 pt-6 border-t border-border text-center text-sm text-muted-foreground">
        <p>
          Built with React by Cyprian K • Custom SQL Parser • B-Tree Indexes • In-Memory Storage
        </p>
      </footer>
    </div>
  );
};

export default Index;
