// maps list types to global utility classes from index.css (e.g. tight lists for work/research).
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
