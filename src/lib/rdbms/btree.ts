// B-Tree Index Implementation
import { BTreeNode, BTreeIndex, RowValue } from './types';

const ORDER = 4; // B-tree order (max children per node)

function createNode(isLeaf: boolean): BTreeNode {
  return {
    keys: [],
    rowIndices: [],
    children: [],
    isLeaf,
  };
}

function compareValues(a: RowValue, b: RowValue): number {
  if (a === null && b === null) return 0;
  if (a === null) return -1;
  if (b === null) return 1;
  
  if (typeof a === 'number' && typeof b === 'number') {
    return a - b;
  }
  
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() - b.getTime();
  }
  
  return String(a).localeCompare(String(b));
}

export function createBTreeIndex(columnName: string, unique: boolean): BTreeIndex {
  return {
    columnName,
    root: createNode(true),
    unique,
  };
}

export function insertIntoIndex(index: BTreeIndex, value: RowValue, rowIndex: number): boolean {
  const { root } = index;
  
  // Check for unique constraint violation
  if (index.unique) {
    const existing = searchIndex(index, value);
    if (existing.length > 0) {
      return false; // Unique constraint violation
    }
  }
  
  if (root.keys.length === ORDER - 1) {
    // Root is full, need to split
    const newRoot = createNode(false);
    newRoot.children.push(root);
    splitChild(newRoot, 0);
    index.root = newRoot;
    insertNonFull(newRoot, value, rowIndex);
  } else {
    insertNonFull(root, value, rowIndex);
  }
  
  return true;
}

function splitChild(parent: BTreeNode, childIndex: number): void {
  const child = parent.children[childIndex];
  const mid = Math.floor((ORDER - 1) / 2);
  
  const newNode = createNode(child.isLeaf);
  
  // Move keys and row indices to new node
  newNode.keys = child.keys.splice(mid + 1);
  newNode.rowIndices = child.rowIndices.splice(mid + 1);
  
  if (!child.isLeaf) {
    newNode.children = child.children.splice(mid + 1);
  }
  
  // Move middle key up to parent
  const midKey = child.keys.pop()!;
  const midRowIndices = child.rowIndices.pop()!;
  
  parent.keys.splice(childIndex, 0, midKey);
  parent.rowIndices.splice(childIndex, 0, midRowIndices);
  parent.children.splice(childIndex + 1, 0, newNode);
}

function insertNonFull(node: BTreeNode, value: RowValue, rowIndex: number): void {
  let i = node.keys.length - 1;
  
  if (node.isLeaf) {
    // Find position and insert
    while (i >= 0 && compareValues(value, node.keys[i]) < 0) {
      i--;
    }
    
    // Check if key already exists
    if (i >= 0 && compareValues(value, node.keys[i]) === 0) {
      node.rowIndices[i].push(rowIndex);
    } else {
      node.keys.splice(i + 1, 0, value);
      node.rowIndices.splice(i + 1, 0, [rowIndex]);
    }
  } else {
    // Find child to recurse into
    while (i >= 0 && compareValues(value, node.keys[i]) < 0) {
      i--;
    }
    i++;
    
    if (node.children[i].keys.length === ORDER - 1) {
      splitChild(node, i);
      if (compareValues(value, node.keys[i]) > 0) {
        i++;
      }
    }
    insertNonFull(node.children[i], value, rowIndex);
  }
}

export function searchIndex(index: BTreeIndex, value: RowValue): number[] {
  return searchNode(index.root, value);
}

function searchNode(node: BTreeNode, value: RowValue): number[] {
  let i = 0;
  
  while (i < node.keys.length && compareValues(value, node.keys[i]) > 0) {
    i++;
  }
  
  if (i < node.keys.length && compareValues(value, node.keys[i]) === 0) {
    return [...node.rowIndices[i]];
  }
  
  if (node.isLeaf) {
    return [];
  }
  
  return searchNode(node.children[i], value);
}

export function removeFromIndex(index: BTreeIndex, value: RowValue, rowIndex: number): void {
  removeFromNode(index.root, value, rowIndex);
}

function removeFromNode(node: BTreeNode, value: RowValue, rowIndex: number): void {
  let i = 0;
  
  while (i < node.keys.length && compareValues(value, node.keys[i]) > 0) {
    i++;
  }
  
  if (i < node.keys.length && compareValues(value, node.keys[i]) === 0) {
    // Found the key, remove the row index
    const idx = node.rowIndices[i].indexOf(rowIndex);
    if (idx !== -1) {
      node.rowIndices[i].splice(idx, 1);
    }
    
    // If no more row indices, remove the key
    if (node.rowIndices[i].length === 0) {
      node.keys.splice(i, 1);
      node.rowIndices.splice(i, 1);
    }
    return;
  }
  
  if (!node.isLeaf) {
    removeFromNode(node.children[i], value, rowIndex);
  }
}

export function rebuildIndex(index: BTreeIndex, rows: { value: RowValue; rowIndex: number }[]): void {
  index.root = createNode(true);
  for (const { value, rowIndex } of rows) {
    insertIntoIndex(index, value, rowIndex);
  }
}
