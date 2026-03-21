import intro from '../data/intro.json';
import projects from '../data/projects.json';
import writing from '../data/writing.json';
import research from '../data/research.json';
import work from '../data/work.json';

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function coerceConnections(value) {
  if (!Array.isArray(value)) return [];
  return value.filter((item) => typeof item === 'string' && item.trim() !== '');
}

function baseNode(entry, nodeType, fallbackLabel) {
  const label = entry.title || entry.company || fallbackLabel;
  return {
    rawId: entry.id,
    nodeType,
    label,
    year: entry.year || '',
    url: entry.url || '',
    category: entry.category || '',
    subtitle: entry.description || entry.role || '',
    connections: coerceConnections(entry.connections),
    position: entry.position || null
  };
}

function dedupeId(candidate, usedIds) {
  let nextId = candidate || 'entry';
  let suffix = 1;
  while (usedIds.has(nextId)) {
    suffix += 1;
    nextId = `${candidate}-${suffix}`;
  }
  usedIds.add(nextId);
  return nextId;
}

/** Default seed positions; EntryGraphView lays out nodes with d3-force. */
const COLUMN_X = 220;
const ROW_START_Y = 100;
const ROW_GAP = 150;

function withAutoPosition(node, index) {
  if (node.position && Number.isFinite(node.position.x) && Number.isFinite(node.position.y)) {
    return node;
  }

  return {
    ...node,
    position: {
      x: COLUMN_X,
      y: ROW_START_Y + index * ROW_GAP
    }
  };
}

export function buildEntryGraph() {
  const usedIds = new Set();
  const reservedIds = new Set(['intro-root']);

  const combined = [
    ...projects.map((entry) => baseNode(entry, 'project', 'Project')),
    ...writing.map((entry) => baseNode(entry, 'writing', 'Writing')),
    ...research.map((entry) => baseNode(entry, 'research', 'Research')),
    ...work.map((entry) => baseNode(entry, 'work', 'Work'))
  ];

  const nodes = combined.map((entry, index) => {
    const defaultId = `${entry.nodeType}-${slugify(entry.label) || index + 1}`;
    const id = dedupeId(entry.rawId || defaultId, usedIds);
    return withAutoPosition({ ...entry, id }, index);
  });

  const nodeById = new Map(nodes.map((node) => [node.id, node]));

  const explicitEdges = [];
  const edgeSet = new Set();
  nodes.forEach((node) => {
    node.connections.forEach((targetId) => {
      if (reservedIds.has(targetId)) return;
      if (!nodeById.has(targetId) || targetId === node.id) return;
      const key = [node.id, targetId].sort().join('::');
      if (edgeSet.has(key)) return;
      edgeSet.add(key);
      explicitEdges.push({ source: node.id, target: targetId });
    });
  });

  if (explicitEdges.length === 0) {
    const fallbackEdges = [];
    nodes.forEach((node, index) => {
      if (index === 0) return;
      fallbackEdges.push({ source: nodes[index - 1].id, target: node.id });
    });
    return { nodes, edges: fallbackEdges, introName: intro.name };
  }

  return { nodes, edges: explicitEdges, introName: intro.name };
}
