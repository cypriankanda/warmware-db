// SQL Parser
import { ParsedQuery, ColumnDefinition, Condition, RowValue, JoinClause, OrderByClause, DataType } from './types';

export function parseSQL(sql: string): ParsedQuery {
  const trimmed = sql.trim().replace(/;$/, '');
  const upper = trimmed.toUpperCase();
  
  if (upper.startsWith('CREATE TABLE')) {
    return parseCreateTable(trimmed);
  } else if (upper.startsWith('INSERT INTO')) {
    return parseInsert(trimmed);
  } else if (upper.startsWith('SELECT')) {
    return parseSelect(trimmed);
  } else if (upper.startsWith('UPDATE')) {
    return parseUpdate(trimmed);
  } else if (upper.startsWith('DELETE FROM')) {
    return parseDelete(trimmed);
  } else if (upper.startsWith('DROP TABLE')) {
    return parseDrop(trimmed);
  }
  
  throw new Error(`Unsupported SQL statement: ${sql}`);
}

function parseCreateTable(sql: string): ParsedQuery {
  // CREATE TABLE table_name (col1 TYPE, col2 TYPE, ...)
  const match = sql.match(/CREATE\s+TABLE\s+(\w+)\s*\(([\s\S]+)\)/i);
  if (!match) {
    throw new Error('Invalid CREATE TABLE syntax');
  }
  
  const tableName = match[1];
  const columnDefs = match[2];
  
  const columns: ColumnDefinition[] = [];
  const parts = splitColumnDefinitions(columnDefs);
  
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    
    // Check for PRIMARY KEY constraint at end
    if (trimmed.toUpperCase().startsWith('PRIMARY KEY')) {
      continue; // Handle inline constraints
    }
    
    const colMatch = trimmed.match(/^(\w+)\s+(INT|VARCHAR(?:\(\d+\))?|BOOLEAN|TIMESTAMP)(.*)$/i);
    if (!colMatch) {
      throw new Error(`Invalid column definition: ${trimmed}`);
    }
    
    const name = colMatch[1];
    let type = colMatch[2].toUpperCase();
    const constraints = colMatch[3].toUpperCase();
    
    const column: ColumnDefinition = { name, type: type.startsWith('VARCHAR') ? 'VARCHAR' : type as DataType };
    
    // Parse VARCHAR length
    const varcharMatch = colMatch[2].match(/VARCHAR\((\d+)\)/i);
    if (varcharMatch) {
      column.maxLength = parseInt(varcharMatch[1]);
    }
    
    if (constraints.includes('PRIMARY KEY')) {
      column.primaryKey = true;
      column.notNull = true;
    }
    if (constraints.includes('UNIQUE')) {
      column.unique = true;
    }
    if (constraints.includes('NOT NULL')) {
      column.notNull = true;
    }
    
    columns.push(column);
  }
  
  return { type: 'CREATE', tableName, columns };
}

function splitColumnDefinitions(str: string): string[] {
  const parts: string[] = [];
  let current = '';
  let depth = 0;
  
  for (const char of str) {
    if (char === '(') depth++;
    else if (char === ')') depth--;
    else if (char === ',' && depth === 0) {
      parts.push(current);
      current = '';
      continue;
    }
    current += char;
  }
  
  if (current.trim()) {
    parts.push(current);
  }
  
  return parts;
}

function parseInsert(sql: string): ParsedQuery {
  // INSERT INTO table_name (col1, col2) VALUES (val1, val2)
  const match = sql.match(/INSERT\s+INTO\s+(\w+)\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/i);
  if (!match) {
    throw new Error('Invalid INSERT syntax');
  }
  
  const tableName = match[1];
  const columns = match[2].split(',').map(c => c.trim());
  const valueStrings = match[3].split(',').map(v => v.trim());
  
  const values: RowValue[] = valueStrings.map(parseValue);
  
  return { type: 'INSERT', tableName, columns: columns as string[], values };
}

function parseValue(str: string): RowValue {
  const trimmed = str.trim();
  
  if (trimmed.toUpperCase() === 'NULL') {
    return null;
  }
  
  if (trimmed.toUpperCase() === 'TRUE') {
    return true;
  }
  
  if (trimmed.toUpperCase() === 'FALSE') {
    return false;
  }
  
  // String literal
  if ((trimmed.startsWith("'") && trimmed.endsWith("'")) ||
      (trimmed.startsWith('"') && trimmed.endsWith('"'))) {
    return trimmed.slice(1, -1);
  }
  
  // Number
  const num = Number(trimmed);
  if (!isNaN(num)) {
    return num;
  }
  
  return trimmed;
}

function parseSelect(sql: string): ParsedQuery {
  // SELECT col1, col2 FROM table [JOIN ...] [WHERE ...] [ORDER BY ...] [LIMIT ...]
  let remaining = sql;
  
  // Extract columns
  const selectMatch = remaining.match(/SELECT\s+(.+?)\s+FROM\s+/i);
  if (!selectMatch) {
    throw new Error('Invalid SELECT syntax');
  }
  
  const columnsStr = selectMatch[1];
  const columns = columnsStr === '*' ? ['*'] : columnsStr.split(',').map(c => c.trim());
  
  remaining = remaining.substring(selectMatch[0].length);
  
  // Extract table name
  const tableMatch = remaining.match(/^(\w+)/);
  if (!tableMatch) {
    throw new Error('Invalid SELECT syntax: missing table name');
  }
  
  const tableName = tableMatch[1];
  remaining = remaining.substring(tableMatch[0].length).trim();
  
  const result: ParsedQuery = { type: 'SELECT', tableName, columns: columns as string[] };
  
  // Parse JOINs
  const joins: JoinClause[] = [];
  const joinRegex = /(INNER|LEFT|RIGHT)?\s*JOIN\s+(\w+)(?:\s+(?:AS\s+)?(\w+))?\s+ON\s+(\w+)\.(\w+)\s*=\s*(\w+)\.(\w+)/gi;
  let joinMatch;
  
  while ((joinMatch = joinRegex.exec(remaining)) !== null) {
    joins.push({
      type: (joinMatch[1]?.toUpperCase() || 'INNER') as 'INNER' | 'LEFT' | 'RIGHT',
      tableName: joinMatch[2],
      alias: joinMatch[3],
      on: {
        leftColumn: `${joinMatch[4]}.${joinMatch[5]}`,
        rightColumn: `${joinMatch[6]}.${joinMatch[7]}`,
      },
    });
  }
  
  if (joins.length > 0) {
    result.joins = joins;
  }
  
  // Parse WHERE
  const whereMatch = remaining.match(/WHERE\s+(.+?)(?=\s+ORDER|\s+LIMIT|$)/i);
  if (whereMatch) {
    result.conditions = parseConditions(whereMatch[1]);
  }
  
  // Parse ORDER BY
  const orderMatch = remaining.match(/ORDER\s+BY\s+(\w+)(?:\s+(ASC|DESC))?/i);
  if (orderMatch) {
    result.orderBy = {
      column: orderMatch[1],
      direction: (orderMatch[2]?.toUpperCase() || 'ASC') as 'ASC' | 'DESC',
    };
  }
  
  // Parse LIMIT
  const limitMatch = remaining.match(/LIMIT\s+(\d+)/i);
  if (limitMatch) {
    result.limit = parseInt(limitMatch[1]);
  }
  
  return result;
}

function parseConditions(str: string): Condition[] {
  const conditions: Condition[] = [];
  
  // Split by AND/OR while preserving the operator
  const parts = str.split(/\s+(AND|OR)\s+/i);
  
  for (let i = 0; i < parts.length; i += 2) {
    const condition = parseCondition(parts[i]);
    if (i + 1 < parts.length) {
      condition.logicalOp = parts[i + 1].toUpperCase() as 'AND' | 'OR';
    }
    conditions.push(condition);
  }
  
  return conditions;
}

function parseCondition(str: string): Condition {
  const match = str.trim().match(/(\w+(?:\.\w+)?)\s*(=|!=|<>|<=|>=|<|>|LIKE)\s*(.+)/i);
  if (!match) {
    throw new Error(`Invalid condition: ${str}`);
  }
  
  let operator = match[2].toUpperCase();
  if (operator === '<>') operator = '!=';
  
  return {
    column: match[1],
    operator: operator as Condition['operator'],
    value: parseValue(match[3]),
  };
}

function parseUpdate(sql: string): ParsedQuery {
  // UPDATE table SET col1 = val1, col2 = val2 WHERE ...
  const match = sql.match(/UPDATE\s+(\w+)\s+SET\s+(.+?)(?:\s+WHERE\s+(.+))?$/i);
  if (!match) {
    throw new Error('Invalid UPDATE syntax');
  }
  
  const tableName = match[1];
  const setClause = match[2];
  const whereClause = match[3];
  
  const updates: Record<string, RowValue> = {};
  const setParts = setClause.split(',');
  
  for (const part of setParts) {
    const [col, val] = part.split('=').map(s => s.trim());
    updates[col] = parseValue(val);
  }
  
  const result: ParsedQuery = { type: 'UPDATE', tableName, updates };
  
  if (whereClause) {
    result.conditions = parseConditions(whereClause);
  }
  
  return result;
}

function parseDelete(sql: string): ParsedQuery {
  // DELETE FROM table WHERE ...
  const match = sql.match(/DELETE\s+FROM\s+(\w+)(?:\s+WHERE\s+(.+))?$/i);
  if (!match) {
    throw new Error('Invalid DELETE syntax');
  }
  
  const result: ParsedQuery = { type: 'DELETE', tableName: match[1] };
  
  if (match[2]) {
    result.conditions = parseConditions(match[2]);
  }
  
  return result;
}

function parseDrop(sql: string): ParsedQuery {
  const match = sql.match(/DROP\s+TABLE\s+(\w+)/i);
  if (!match) {
    throw new Error('Invalid DROP TABLE syntax');
  }
  
  return { type: 'DROP', tableName: match[1] };
}
