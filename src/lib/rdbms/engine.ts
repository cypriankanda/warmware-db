// RDBMS Engine
import { Table, Row, RowValue, QueryResult, ParsedQuery, Condition, ColumnDefinition, TableSchema } from './types';
import { parseSQL } from './parser';
import { createBTreeIndex, insertIntoIndex, searchIndex, removeFromIndex, rebuildIndex } from './btree';

export class RDBMSEngine {
  private tables: Map<string, Table> = new Map();

  execute(sql: string): QueryResult {
    try {
      const parsed = parseSQL(sql);
      
      switch (parsed.type) {
        case 'CREATE':
          return this.createTable(parsed);
        case 'INSERT':
          return this.insert(parsed);
        case 'SELECT':
          return this.select(parsed);
        case 'UPDATE':
          return this.update(parsed);
        case 'DELETE':
          return this.delete(parsed);
        case 'DROP':
          return this.dropTable(parsed);
        default:
          return { success: false, error: 'Unknown query type' };
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  private createTable(parsed: ParsedQuery): QueryResult {
    if (this.tables.has(parsed.tableName)) {
      return { success: false, error: `Table '${parsed.tableName}' already exists` };
    }

    const columns = parsed.columns as ColumnDefinition[];
    const primaryKey = columns.find(c => c.primaryKey)?.name;
    const uniqueKeys = columns.filter(c => c.unique || c.primaryKey).map(c => c.name);

    const schema: TableSchema = {
      name: parsed.tableName,
      columns,
      primaryKey,
      uniqueKeys,
    };

    const table: Table = {
      schema,
      rows: [],
      indexes: new Map(),
      autoIncrement: 1,
    };

    // Create indexes for primary key and unique columns
    for (const key of uniqueKeys) {
      table.indexes.set(key, createBTreeIndex(key, true));
    }

    this.tables.set(parsed.tableName, table);

    return { 
      success: true, 
      message: `Table '${parsed.tableName}' created with ${columns.length} columns`,
      affectedRows: 0,
    };
  }

  private insert(parsed: ParsedQuery): QueryResult {
    const table = this.tables.get(parsed.tableName);
    if (!table) {
      return { success: false, error: `Table '${parsed.tableName}' does not exist` };
    }

    const columns = parsed.columns as string[];
    const values = parsed.values!;

    if (columns.length !== values.length) {
      return { success: false, error: 'Column count does not match value count' };
    }

    const row: Row = {};

    // Build the row
    for (let i = 0; i < columns.length; i++) {
      const colDef = table.schema.columns.find(c => c.name === columns[i]);
      if (!colDef) {
        return { success: false, error: `Column '${columns[i]}' does not exist` };
      }

      const value = values[i];
      
      // Type validation
      if (value !== null) {
        if (!this.validateType(value, colDef)) {
          return { success: false, error: `Invalid type for column '${columns[i]}'` };
        }
      } else if (colDef.notNull) {
        return { success: false, error: `Column '${columns[i]}' cannot be NULL` };
      }

      row[columns[i]] = value;
    }

    // Check for NOT NULL constraints on missing columns
    for (const col of table.schema.columns) {
      if (!(col.name in row)) {
        if (col.notNull && !col.primaryKey) {
          return { success: false, error: `Column '${col.name}' cannot be NULL` };
        }
        row[col.name] = null;
      }
    }

    // Handle auto-increment for primary key if not provided
    if (table.schema.primaryKey && !(table.schema.primaryKey in row) || row[table.schema.primaryKey!] === null) {
      const pkCol = table.schema.columns.find(c => c.name === table.schema.primaryKey);
      if (pkCol?.type === 'INT') {
        row[table.schema.primaryKey!] = table.autoIncrement++;
      }
    }

    const rowIndex = table.rows.length;

    // Check and update indexes
    for (const [colName, index] of table.indexes) {
      const value = row[colName];
      if (!insertIntoIndex(index, value, rowIndex)) {
        return { success: false, error: `Duplicate value for unique column '${colName}'` };
      }
    }

    table.rows.push(row);

    return { success: true, message: 'Row inserted', affectedRows: 1 };
  }

  private select(parsed: ParsedQuery): QueryResult {
    const table = this.tables.get(parsed.tableName);
    if (!table) {
      return { success: false, error: `Table '${parsed.tableName}' does not exist` };
    }

    let resultRows: Row[] = [];

    // Handle JOINs
    if (parsed.joins && parsed.joins.length > 0) {
      resultRows = this.executeJoins(table, parsed.joins);
    } else {
      resultRows = [...table.rows];
    }

    // Apply WHERE conditions
    if (parsed.conditions) {
      resultRows = this.filterRows(resultRows, parsed.conditions, table);
    }

    // Apply ORDER BY
    if (parsed.orderBy) {
      resultRows = this.sortRows(resultRows, parsed.orderBy);
    }

    // Apply LIMIT
    if (parsed.limit !== undefined) {
      resultRows = resultRows.slice(0, parsed.limit);
    }

    // Select specific columns
    const columns = parsed.columns as string[];
    if (columns[0] !== '*') {
      resultRows = resultRows.map(row => {
        const newRow: Row = {};
        for (const col of columns) {
          if (col in row) {
            newRow[col] = row[col];
          }
        }
        return newRow;
      });
    }

    return { success: true, data: resultRows, affectedRows: resultRows.length };
  }

  private executeJoins(table: Table, joins: NonNullable<ParsedQuery['joins']>): Row[] {
    let result: Row[] = table.rows.map(row => {
      const prefixedRow: Row = {};
      for (const key in row) {
        prefixedRow[`${table.schema.name}.${key}`] = row[key];
        prefixedRow[key] = row[key]; // Also keep without prefix for convenience
      }
      return prefixedRow;
    });

    for (const join of joins) {
      const joinTable = this.tables.get(join.tableName);
      if (!joinTable) {
        throw new Error(`Table '${join.tableName}' does not exist`);
      }

      const newResult: Row[] = [];

      for (const leftRow of result) {
        const leftValue = leftRow[join.on.leftColumn];
        let matched = false;

        for (const rightRow of joinTable.rows) {
          const rightCol = join.on.rightColumn.split('.').pop()!;
          const rightValue = rightRow[rightCol];

          if (leftValue === rightValue) {
            matched = true;
            const combinedRow: Row = { ...leftRow };
            for (const key in rightRow) {
              combinedRow[`${join.tableName}.${key}`] = rightRow[key];
              if (!(key in combinedRow)) {
                combinedRow[key] = rightRow[key];
              }
            }
            newResult.push(combinedRow);
          }
        }

        // LEFT JOIN: include left row even without match
        if (!matched && join.type === 'LEFT') {
          const combinedRow: Row = { ...leftRow };
          for (const col of joinTable.schema.columns) {
            combinedRow[`${join.tableName}.${col.name}`] = null;
          }
          newResult.push(combinedRow);
        }
      }

      result = newResult;
    }

    return result;
  }

  private filterRows(rows: Row[], conditions: Condition[], table: Table): Row[] {
    // Try to use index for first equality condition
    const firstEqCondition = conditions.find(c => c.operator === '=');
    
    if (firstEqCondition && table.indexes.has(firstEqCondition.column)) {
      const index = table.indexes.get(firstEqCondition.column)!;
      const rowIndices = searchIndex(index, firstEqCondition.value);
      
      if (rowIndices.length > 0) {
        rows = rowIndices.map(i => table.rows[i]).filter(Boolean);
      }
    }

    return rows.filter(row => this.evaluateConditions(row, conditions));
  }

  private evaluateConditions(row: Row, conditions: Condition[]): boolean {
    if (conditions.length === 0) return true;

    let result = this.evaluateCondition(row, conditions[0]);

    for (let i = 1; i < conditions.length; i++) {
      const prevOp = conditions[i - 1].logicalOp || 'AND';
      const condResult = this.evaluateCondition(row, conditions[i]);

      if (prevOp === 'AND') {
        result = result && condResult;
      } else {
        result = result || condResult;
      }
    }

    return result;
  }

  private evaluateCondition(row: Row, condition: Condition): boolean {
    const value = row[condition.column];
    const compareValue = condition.value;

    switch (condition.operator) {
      case '=':
        return value === compareValue;
      case '!=':
        return value !== compareValue;
      case '<':
        return value !== null && compareValue !== null && value < compareValue;
      case '>':
        return value !== null && compareValue !== null && value > compareValue;
      case '<=':
        return value !== null && compareValue !== null && value <= compareValue;
      case '>=':
        return value !== null && compareValue !== null && value >= compareValue;
      case 'LIKE':
        if (typeof value !== 'string' || typeof compareValue !== 'string') return false;
        const pattern = compareValue.replace(/%/g, '.*').replace(/_/g, '.');
        return new RegExp(`^${pattern}$`, 'i').test(value);
      default:
        return false;
    }
  }

  private sortRows(rows: Row[], orderBy: NonNullable<ParsedQuery['orderBy']>): Row[] {
    return [...rows].sort((a, b) => {
      const aVal = a[orderBy.column];
      const bVal = b[orderBy.column];

      if (aVal === null && bVal === null) return 0;
      if (aVal === null) return orderBy.direction === 'ASC' ? -1 : 1;
      if (bVal === null) return orderBy.direction === 'ASC' ? 1 : -1;

      let comparison = 0;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        comparison = aVal - bVal;
      } else {
        comparison = String(aVal).localeCompare(String(bVal));
      }

      return orderBy.direction === 'ASC' ? comparison : -comparison;
    });
  }

  private update(parsed: ParsedQuery): QueryResult {
    const table = this.tables.get(parsed.tableName);
    if (!table) {
      return { success: false, error: `Table '${parsed.tableName}' does not exist` };
    }

    let affectedRows = 0;

    for (let i = 0; i < table.rows.length; i++) {
      const row = table.rows[i];

      if (!parsed.conditions || this.evaluateConditions(row, parsed.conditions)) {
        // Check unique constraints before updating
        for (const [colName, newValue] of Object.entries(parsed.updates!)) {
          const index = table.indexes.get(colName);
          if (index && newValue !== row[colName]) {
            const existing = searchIndex(index, newValue);
            if (existing.length > 0 && !existing.includes(i)) {
              return { success: false, error: `Duplicate value for unique column '${colName}'` };
            }
          }
        }

        // Update indexes
        for (const [colName, newValue] of Object.entries(parsed.updates!)) {
          const index = table.indexes.get(colName);
          if (index) {
            removeFromIndex(index, row[colName], i);
            insertIntoIndex(index, newValue, i);
          }
        }

        // Apply updates
        for (const [colName, newValue] of Object.entries(parsed.updates!)) {
          row[colName] = newValue;
        }

        affectedRows++;
      }
    }

    return { success: true, message: `Updated ${affectedRows} row(s)`, affectedRows };
  }

  private delete(parsed: ParsedQuery): QueryResult {
    const table = this.tables.get(parsed.tableName);
    if (!table) {
      return { success: false, error: `Table '${parsed.tableName}' does not exist` };
    }

    const indicesToDelete: number[] = [];

    for (let i = 0; i < table.rows.length; i++) {
      if (!parsed.conditions || this.evaluateConditions(table.rows[i], parsed.conditions)) {
        indicesToDelete.push(i);
      }
    }

    // Remove from indexes first
    for (const idx of indicesToDelete) {
      const row = table.rows[idx];
      for (const [colName, index] of table.indexes) {
        removeFromIndex(index, row[colName], idx);
      }
    }

    // Delete rows in reverse order to maintain indices
    for (let i = indicesToDelete.length - 1; i >= 0; i--) {
      table.rows.splice(indicesToDelete[i], 1);
    }

    // Rebuild indexes with new row indices
    for (const [colName, index] of table.indexes) {
      const values = table.rows.map((row, i) => ({ value: row[colName], rowIndex: i }));
      rebuildIndex(index, values);
    }

    return { success: true, message: `Deleted ${indicesToDelete.length} row(s)`, affectedRows: indicesToDelete.length };
  }

  private dropTable(parsed: ParsedQuery): QueryResult {
    if (!this.tables.has(parsed.tableName)) {
      return { success: false, error: `Table '${parsed.tableName}' does not exist` };
    }

    this.tables.delete(parsed.tableName);

    return { success: true, message: `Table '${parsed.tableName}' dropped`, affectedRows: 0 };
  }

  private validateType(value: RowValue, colDef: ColumnDefinition): boolean {
    if (value === null) return true;

    switch (colDef.type) {
      case 'INT':
        return typeof value === 'number' && Number.isInteger(value);
      case 'VARCHAR':
        if (typeof value !== 'string') return false;
        if (colDef.maxLength && value.length > colDef.maxLength) return false;
        return true;
      case 'BOOLEAN':
        return typeof value === 'boolean';
      case 'TIMESTAMP':
        return value instanceof Date || typeof value === 'string';
      default:
        return true;
    }
  }

  getTableNames(): string[] {
    return Array.from(this.tables.keys());
  }

  getTableSchema(tableName: string): TableSchema | null {
    return this.tables.get(tableName)?.schema || null;
  }

  getTableRowCount(tableName: string): number {
    return this.tables.get(tableName)?.rows.length || 0;
  }
}

// Singleton instance
export const db = new RDBMSEngine();
