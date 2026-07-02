export const formatTHB = (value: number): string =>
  `฿${Math.round(value).toLocaleString('en-US')}`;

export const formatUSD = (value: number): string =>
  `$${value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export const formatDrawdown = (pct: number): string =>
  `${pct <= 0 ? '↓' : '↑'}${Math.abs(pct).toFixed(1)}%`;

export const formatThaiDate = (iso: string): string => {
  const date = new Date(`${iso}T00:00:00`);
  return date.toLocaleDateString('th-TH-u-ca-gregory', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};
