// centralized style logic for entry types

export function getEntryClassName(type) {
  switch (type) {
    case 'work':
      return 'tight';
    case 'project':
    case 'archive':
    case 'event':
    default:
      return '';
  }
}
