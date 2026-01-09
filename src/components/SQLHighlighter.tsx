import React from 'react';

interface SQLHighlighterProps {
  sql: string;
  className?: string;
}

const KEYWORDS = [
  'SELECT', 'FROM', 'WHERE', 'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET',
  'DELETE', 'CREATE', 'TABLE', 'DROP', 'ALTER', 'ADD', 'PRIMARY', 'KEY',
  'FOREIGN', 'REFERENCES', 'UNIQUE', 'NOT', 'NULL', 'DEFAULT', 'INDEX',
  'JOIN', 'INNER', 'LEFT', 'RIGHT', 'OUTER', 'ON', 'AND', 'OR', 'IN',
  'LIKE', 'BETWEEN', 'IS', 'ORDER', 'BY', 'ASC', 'DESC', 'LIMIT', 'OFFSET',
  'GROUP', 'HAVING', 'UNION', 'ALL', 'AS', 'DISTINCT', 'COUNT', 'SUM',
  'AVG', 'MIN', 'MAX', 'INT', 'VARCHAR', 'BOOLEAN', 'TIMESTAMP', 'TEXT',
  'TRUE', 'FALSE',
];

export const SQLHighlighter: React.FC<SQLHighlighterProps> = ({ sql, className = '' }) => {
  const highlightSQL = (text: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let key = 0;

    while (remaining.length > 0) {
      // Check for string literals
      const stringMatch = remaining.match(/^(['"])((?:[^\\]|\\.)*?)\1/);
      if (stringMatch) {
        parts.push(
          <span key={key++} className="text-sql-string">
            {stringMatch[0]}
          </span>
        );
        remaining = remaining.substring(stringMatch[0].length);
        continue;
      }

      // Check for comments
      const commentMatch = remaining.match(/^--.*$/m);
      if (commentMatch) {
        parts.push(
          <span key={key++} className="text-sql-comment">
            {commentMatch[0]}
          </span>
        );
        remaining = remaining.substring(commentMatch[0].length);
        continue;
      }

      // Check for numbers
      const numberMatch = remaining.match(/^\d+(\.\d+)?/);
      if (numberMatch) {
        parts.push(
          <span key={key++} className="text-sql-number">
            {numberMatch[0]}
          </span>
        );
        remaining = remaining.substring(numberMatch[0].length);
        continue;
      }

      // Check for keywords
      const wordMatch = remaining.match(/^[a-zA-Z_][a-zA-Z0-9_]*/);
      if (wordMatch) {
        const word = wordMatch[0];
        const upperWord = word.toUpperCase();
        
        if (KEYWORDS.includes(upperWord)) {
          parts.push(
            <span key={key++} className="text-sql-keyword">
              {word}
            </span>
          );
        } else {
          parts.push(
            <span key={key++} className="text-foreground">
              {word}
            </span>
          );
        }
        remaining = remaining.substring(word.length);
        continue;
      }

      // Check for operators
      const operatorMatch = remaining.match(/^[=<>!]+|^[(),;*]/);
      if (operatorMatch) {
        parts.push(
          <span key={key++} className="text-sql-operator">
            {operatorMatch[0]}
          </span>
        );
        remaining = remaining.substring(operatorMatch[0].length);
        continue;
      }

      // Whitespace or other characters
      parts.push(
        <span key={key++}>
          {remaining[0]}
        </span>
      );
      remaining = remaining.substring(1);
    }

    return parts;
  };

  return (
    <code className={`font-mono ${className}`}>
      {highlightSQL(sql)}
    </code>
  );
};
