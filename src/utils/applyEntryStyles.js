// centralized style logic for entry types

export function getEntryClassName(type) {
  switch (type) {
    case 'work':
    case 'research':
      return 'tight';
    case 'project':
    case 'archive':
    default:
      return '';
  }
}
