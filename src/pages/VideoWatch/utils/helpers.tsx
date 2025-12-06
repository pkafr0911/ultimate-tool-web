export const FormatBandWidth = (bps: number | undefined): string => {
  if (!bps || bps <= 0) return '0 bps';
  const units = ['bps', 'Kbps', 'Mbps', 'Gbps'];
  let i = 0;
  let value = bps;
  while (value >= 1000 && i < units.length - 1) {
    value /= 1000;
    i++;
  }
  return `${value.toFixed(2)} ${units[i]}`;
};

export const FormatBytes = (bytes: number | undefined): string => {
  if (!bytes || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  let value = bytes;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i++;
  }
  return `${value.toFixed(2)} ${units[i]}`;
};
