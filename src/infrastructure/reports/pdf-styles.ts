export const PDF_COLORS = {
  primary: '#2563eb',
  title: '#1e293b',
  muted: '#64748b',
  body: '#334155',
  border: '#cbd5e1',
  panelBg: '#f1f5f9',
  success: '#16a34a',
  warning: '#ca8a04',
  danger: '#dc2626',
} as const;

export const PDF_LAYOUT = {
  margin: 50,
  sectionGap: 16,
  lineHeight: 1.35,
} as const;

export const DIFFERENCE_GROUP_ORDER = [
  'Tables',
  'Columns',
  'Primary Keys',
  'Foreign Keys',
  'Indexes',
  'Constraints',
] as const;
