# 🗄️ LovableDB — In-Memory Relational Database Management System

<div align="center">

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

**A fully-featured, in-memory relational database built entirely in TypeScript with a SQL interface and interactive REPL.**

[Features](#-features) • [Architecture](#-architecture) • [Quick Start](#-quick-start) • [SQL Reference](#-sql-reference) • [Demo App](#-demo-application)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Tech Stack](#-tech-stack)
- [Features](#-features)
- [Architecture](#-architecture)
- [Quick Start](#-quick-start)
- [SQL Reference](#-sql-reference)
- [API Documentation](#-api-documentation)
- [Demo Application](#-demo-application)
- [Project Structure](#-project-structure)

---

## 🎯 Overview

LovableDB is a lightweight, educational relational database management system (RDBMS) implemented entirely in TypeScript. It runs in-memory within the browser and provides a complete SQL interface for creating tables, performing CRUD operations, and executing complex queries with JOINs.

### Why LovableDB?

- **Educational**: Understand how databases work under the hood
- **Zero Dependencies**: Core engine has no external database dependencies
- **Browser-Native**: Runs entirely in the browser with no server required
- **Full SQL Support**: Standard SQL syntax for familiar querying
- **Interactive REPL**: Execute queries in real-time with syntax highlighting

---

## 🛠️ Tech Stack

### Core Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **TypeScript** | ^5.0 | Type-safe implementation of database engine |
| **React** | ^18.3.1 | UI components and state management |
| **Vite** | ^5.0 | Build tool and development server |
| **Tailwind CSS** | ^3.4 | Utility-first styling |

### UI Components

| Library | Purpose |
|---------|---------|
| **shadcn/ui** | Pre-built accessible React components |
| **Radix UI** | Headless UI primitives |
| **Lucide React** | Icon library |
| **Sonner** | Toast notifications |

### Data Structures

| Structure | Purpose |
|-----------|---------|
| **B-Tree** | Index implementation for O(log n) lookups |
| **HashMap** | Table and index storage |

---

## ✨ Features

### 1. Data Types

| Type | Description | Example |
|------|-------------|---------|
| `INT` | Integer numbers | `42`, `-17`, `0` |
| `VARCHAR(n)` | Variable-length string with max length | `'Hello'` (max n chars) |
| `BOOLEAN` | True/False values | `TRUE`, `FALSE` |
| `TIMESTAMP` | Date/time values | `'2024-01-15'` |

### 2. Constraints

| Constraint | Description |
|------------|-------------|
| `PRIMARY KEY` | Unique identifier, auto-increment for INT |
| `UNIQUE` | Ensures column values are unique |
| `NOT NULL` | Prevents NULL values |

### 3. CRUD Operations

- ✅ **CREATE TABLE** — Define table schema with columns and constraints
- ✅ **INSERT INTO** — Add new rows to tables
- ✅ **SELECT** — Query data with filtering, sorting, and limiting
- ✅ **UPDATE** — Modify existing rows
- ✅ **DELETE** — Remove rows from tables
- ✅ **DROP TABLE** — Remove entire tables

### 4. Query Features

| Feature | Description |
|---------|-------------|
| **WHERE Clause** | Filter with `=`, `!=`, `<`, `>`, `<=`, `>=`, `LIKE` |
| **Logical Operators** | Combine conditions with `AND`, `OR` |
| **ORDER BY** | Sort results `ASC` or `DESC` |
| **LIMIT** | Restrict number of returned rows |
| **Pattern Matching** | `LIKE` with `%` and `_` wildcards |

### 5. JOIN Operations

| Join Type | Description |
|-----------|-------------|
| `INNER JOIN` | Returns matching rows from both tables |
| `LEFT JOIN` | All left rows + matching right rows |
| `RIGHT JOIN` | All right rows + matching left rows |

### 6. Indexing

- **B-Tree Implementation**: Balanced tree structure for efficient lookups
- **Automatic Indexing**: Indexes created for PRIMARY KEY and UNIQUE columns
- **O(log n) Lookups**: Fast searches using index when available
- **Unique Constraint Enforcement**: Prevents duplicate values in indexed columns

### 7. Interactive REPL

- **Syntax Highlighting**: SQL keywords, strings, and numbers highlighted
- **Query History**: Navigate previous queries with Ctrl+↑/↓
- **Result Tables**: Formatted data display with proper alignment
- **Error Messages**: Clear, actionable error feedback
- **Keyboard Shortcuts**: Ctrl+Enter to execute queries

### 8. Schema Browser

- **Live Updates**: Real-time table list refresh
- **Column Details**: View column names, types, and constraints
- **Row Counts**: See table sizes at a glance
- **Constraint Badges**: Visual indicators for PK, UQ, NN

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Application Layer                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   SQL REPL  │  │   Schema    │  │   Contacts App      │  │
│  │  Component  │  │   Browser   │  │   (Demo CRUD)       │  │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘  │
└─────────┼────────────────┼────────────────────┼─────────────┘
          │                │                    │
          ▼                ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│                        RDBMS Engine                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                    db.execute(sql)                    │   │
│  └──────────────────────────┬───────────────────────────┘   │
│                             │                                │
│  ┌──────────────────────────▼───────────────────────────┐   │
│  │                     SQL Parser                        │   │
│  │  • Tokenization    • AST Generation   • Validation   │   │
│  └──────────────────────────┬───────────────────────────┘   │
│                             │                                │
│  ┌──────────────────────────▼───────────────────────────┐   │
│  │                   Query Executor                      │   │
│  │  • CREATE/DROP    • INSERT      • SELECT/JOIN        │   │
│  │  • UPDATE         • DELETE      • Condition Eval     │   │
│  └──────────────────────────┬───────────────────────────┘   │
│                             │                                │
│  ┌──────────────────────────▼───────────────────────────┐   │
│  │                   Storage Layer                       │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │   │
│  │  │   Tables    │  │   Indexes   │  │   Schemas   │   │   │
│  │  │  Map<Row[]> │  │   B-Tree    │  │  Metadata   │   │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘   │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Component Breakdown

| Component | File | Responsibility |
|-----------|------|----------------|
| **Types** | `src/lib/rdbms/types.ts` | Type definitions for all data structures |
| **Parser** | `src/lib/rdbms/parser.ts` | SQL string → ParsedQuery AST |
| **Engine** | `src/lib/rdbms/engine.ts` | Query execution and table management |
| **B-Tree** | `src/lib/rdbms/btree.ts` | Index data structure implementation |
| **REPL** | `src/components/SQLRepl.tsx` | Interactive query interface |
| **Demo** | `src/components/ContactsApp.tsx` | CRUD demonstration app |

---

## 🚀 Quick Start

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd lovable-rdbms

# Install dependencies
npm install

# Start development server
npm run dev
```

### Basic Usage

```typescript
import { db } from '@/lib/rdbms';

// Create a table
db.execute(`
  CREATE TABLE users (
    id INT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE,
    active BOOLEAN
  )
`);

// Insert data
db.execute(`
  INSERT INTO users (name, email, active) 
  VALUES ('John Doe', 'john@example.com', TRUE)
`);

// Query data
const result = db.execute('SELECT * FROM users WHERE active = TRUE');
console.log(result.data);

// Update data
db.execute(`UPDATE users SET active = FALSE WHERE id = 1`);

// Delete data
db.execute(`DELETE FROM users WHERE id = 1`);
```

---

## 📖 SQL Reference

### CREATE TABLE

```sql
CREATE TABLE table_name (
  column1 INT PRIMARY KEY,
  column2 VARCHAR(255) NOT NULL,
  column3 BOOLEAN,
  column4 TIMESTAMP,
  column5 VARCHAR(100) UNIQUE
)
```

### INSERT

```sql
INSERT INTO table_name (col1, col2, col3) 
VALUES (value1, 'string_value', TRUE)
```

### SELECT

```sql
-- Basic select
SELECT * FROM table_name

-- With columns
SELECT col1, col2 FROM table_name

-- With WHERE
SELECT * FROM table_name WHERE col1 = 'value' AND col2 > 10

-- With LIKE pattern matching
SELECT * FROM table_name WHERE name LIKE '%john%'

-- With ORDER BY
SELECT * FROM table_name ORDER BY col1 DESC

-- With LIMIT
SELECT * FROM table_name LIMIT 10

-- With JOIN
SELECT * FROM table1 
INNER JOIN table2 ON table1.id = table2.table1_id
WHERE table1.active = TRUE
```

### UPDATE

```sql
UPDATE table_name 
SET col1 = 'new_value', col2 = 42 
WHERE id = 1
```

### DELETE

```sql
DELETE FROM table_name WHERE id = 1
```

### DROP TABLE

```sql
DROP TABLE table_name
```

---

## 📚 API Documentation

### RDBMSEngine Class

```typescript
class RDBMSEngine {
  // Execute any SQL query
  execute(sql: string): QueryResult;
  
  // Get list of all table names
  getTableNames(): string[];
  
  // Get schema for a specific table
  getTableSchema(tableName: string): TableSchema | null;
  
  // Get row count for a table
  getTableRowCount(tableName: string): number;
}
```

### QueryResult Interface

```typescript
interface QueryResult {
  success: boolean;      // Whether query succeeded
  data?: Row[];          // Result rows for SELECT
  message?: string;      // Success message
  affectedRows?: number; // Number of affected rows
  error?: string;        // Error message if failed
}
```

### Type Definitions

```typescript
type DataType = 'INT' | 'VARCHAR' | 'BOOLEAN' | 'TIMESTAMP';

interface ColumnDefinition {
  name: string;
  type: DataType;
  primaryKey?: boolean;
  unique?: boolean;
  notNull?: boolean;
  maxLength?: number;
}

interface TableSchema {
  name: string;
  columns: ColumnDefinition[];
  primaryKey?: string;
  uniqueKeys: string[];
}

type RowValue = string | number | boolean | Date | null;
type Row = Record<string, RowValue>;
```

---

## 🎮 Demo Application

The project includes a **Contacts Manager** application demonstrating all CRUD operations:

### Features

| Operation | Description |
|-----------|-------------|
| **Create** | Add new contacts with name, email, phone, company |
| **Read** | View all contacts with search and filtering |
| **Update** | Edit existing contact information inline |
| **Delete** | Remove contacts with confirmation |

### Database Schema

```sql
CREATE TABLE contacts (
  id INT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(50),
  company VARCHAR(100)
)
```

### Sample Queries Used

```sql
-- Get all contacts ordered by name
SELECT * FROM contacts ORDER BY name ASC

-- Search contacts
SELECT * FROM contacts 
WHERE name LIKE '%john%' OR email LIKE '%john%'

-- Add new contact
INSERT INTO contacts (name, email, phone, company) 
VALUES ('Jane Doe', 'jane@example.com', '+1-555-0100', 'Acme Inc')

-- Update contact
UPDATE contacts 
SET name = 'Jane Smith', company = 'New Corp' 
WHERE id = 1

-- Delete contact
DELETE FROM contacts WHERE id = 1
```

---

## 📁 Project Structure

```
src/
├── lib/
│   └── rdbms/
│       ├── index.ts        # Public API exports
│       ├── types.ts        # TypeScript type definitions
│       ├── parser.ts       # SQL parser implementation
│       ├── engine.ts       # Query execution engine
│       └── btree.ts        # B-Tree index implementation
├── components/
│   ├── SQLRepl.tsx         # Interactive SQL REPL
│   ├── SQLHighlighter.tsx  # SQL syntax highlighting
│   ├── ContactsApp.tsx     # Demo CRUD application
│   └── ui/                 # shadcn/ui components
├── pages/
│   └── Index.tsx           # Main application page
└── index.css               # Global styles & theme
```

---

## 🔮 Future Enhancements

- [ ] **Aggregate Functions**: `COUNT`, `SUM`, `AVG`, `MIN`, `MAX`
- [ ] **GROUP BY Clause**: Grouping with aggregations
- [ ] **Transactions**: `BEGIN`, `COMMIT`, `ROLLBACK`
- [ ] **Subqueries**: Nested SELECT statements
- [ ] **CREATE INDEX**: Manual index creation
- [ ] **Foreign Keys**: Referential integrity constraints
- [ ] **LocalStorage Persistence**: Data survival across page refreshes
- [ ] **Query Execution Plans**: EXPLAIN functionality
- [ ] **Views**: Virtual tables from saved queries

---

## 📄 License

MIT License — feel free to use, modify, and distribute.

---

<div align="center">

**Built with ❤️ using [Lovable](https://lovable.dev)**

</div>
