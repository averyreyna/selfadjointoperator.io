export const NODE_CATEGORY_ICONS = {
  IA: '◇',
  WIP: '◌'
};

export const NODE_TYPE_ICONS = {
  project: '◆',
  writing: '✦',
  research: '⊕',
  work: '▣'
};

export function iconForEntry({ category, nodeType }) {
  return NODE_CATEGORY_ICONS[category] || NODE_TYPE_ICONS[nodeType] || '·';
}
