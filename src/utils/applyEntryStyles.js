// utils/applyEntryStyles.js
// Centralized style logic for entry types

export function getEntryClassName(type) {
  switch (type) {
    case 'work':
      return 'tight';       // maps to Content.module.css .tight
    case 'project':
    case 'archive':
    case 'event':
    default:
      return '';             // default section list styling
  }
}
