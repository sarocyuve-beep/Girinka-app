export const defaultLocations = [
  { id: 'cyuve', label: 'Cyuve', children: ['Ruhanga', 'Shingiro', 'Muko', 'Nyabubare'] },
  { id: 'musanze', label: 'Musanze', children: ['Muhoza', 'Busogo', 'Gacaca', 'Cyuve'] },
];

export function getLocations() {
  return defaultLocations;
}
