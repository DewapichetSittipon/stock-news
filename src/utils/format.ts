export const formatTHB = (value: number): string =>
  `฿${Math.round(value).toLocaleString('en-US')}`;

export const formatUSD = (value: number): string =>
  `$${value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export const formatDrawdown = (pct: number): string =>
  `${pct <= 0 ? '↓' : '↑'}${Math.abs(pct).toFixed(1)}%`;

export const formatSignedPct = (pct: number): string =>
  `${pct >= 0 ? '↑' : '↓'}${Math.abs(pct).toFixed(2)}%`;

export const formatSignedUSD = (value: number): string =>
  `${value >= 0 ? '+' : '-'}$${Math.abs(value).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export const formatThaiDate = (iso: string): string => {
  const date = new Date(`${iso}T00:00:00`);
  return date.toLocaleDateString('th-TH-u-ca-gregory', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

// Unix seconds (e.g. a live-quote trade time) → Bangkok clock "HH:MM".
export const formatClock = (unixSeconds: number): string =>
  new Date(unixSeconds * 1000).toLocaleTimeString('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Bangkok',
  });

// Full ISO timestamp (e.g. prices.json `generatedAt`) → Thai date + time.
export const formatThaiDateTime = (iso: string): string => {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('th-TH-u-ca-gregory', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Current calendar month "YYYY-MM" in the user's DCA timezone (Bangkok), to
// match when the Action records buys.
export const bangkokMonth = (): string =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
  })
    .format(new Date())
    .slice(0, 7);

export const formatThaiMonth = (iso: string): string => {
  const date = new Date(`${iso}T00:00:00`);
  return date.toLocaleDateString('th-TH-u-ca-gregory', {
    month: 'long',
    year: 'numeric',
  });
};
