// RDBMS Type Definitions

export type DataType = 'INT' | 'VARCHAR' | 'BOOLEAN' | 'TIMESTAMP';

export interface ColumnDefinition {
  name: string;
  type: DataType;
  primaryKey?: boolean;
  unique?: boolean;
  notNull?: boolean;
  maxLength?: number; // For VARCHAR
}

export interface TableSchema {
  name: string;
  columns: ColumnDefinition[];
  primaryKey?: string;
  uniqueKeys: string[];
}

export type RowValue = string | number | boolean | Date | null;
export type Row = Record<string, RowValue>;

export interface Table {
  schema: TableSchema;
  rows: Row[];
  indexes: Map<string, BTreeIndex>;
  autoIncrement: number;
}

export interface BTreeNode {
  keys: RowValue[];
  rowIndices: number[][];
  children: BTreeNode[];
  isLeaf: boolean;
}

export interface BTreeIndex {
  columnName: string;
  root: BTreeNode;
  unique: boolean;
}

export interface QueryResult {
  success: boolean;
  data?: Row[];
  message?: string;
  affectedRows?: number;
  error?: string;
}

export interface ParsedQuery {
  type: 'CREATE' | 'INSERT' | 'SELECT' | 'UPDATE' | 'DELETE' | 'DROP';
  tableName: string;
  columns?: ColumnDefinition[] | string[];
  values?: RowValue[];
  conditions?: Condition[];
  updates?: Record<string, RowValue>;
  joins?: JoinClause[];
  orderBy?: OrderByClause;
  limit?: number;
}

export interface Condition {
  column: string;
  operator: '=' | '!=' | '<' | '>' | '<=' | '>=' | 'LIKE';
  value: RowValue;
  logicalOp?: 'AND' | 'OR';
}

export interface JoinClause {
  type: 'INNER' | 'LEFT' | 'RIGHT';
  tableName: string;
  alias?: string;
  on: {
    leftColumn: string;
    rightColumn: string;
  };
}

export interface OrderByClause {
  column: string;
  direction: 'ASC' | 'DESC';
}
