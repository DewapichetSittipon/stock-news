import { useEffect, useRef, useState } from 'react';
import { ColorType, createChart } from 'lightweight-charts';
import type { PricePoint } from '../types';

interface Props {
  history: PricePoint[];
  color: string;
}

const RANGES: { label: string; days: number }[] = [
  { label: '3M', days: 63 },
  { label: '6M', days: 126 },
  { label: '1Y', days: 252 },
  { label: '5Y', days: 1260 },
];

export const AnalyticsChart = ({ history, color }: Props): JSX.Element => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rangeDays, setRangeDays] = useState(252);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#94a3b8',
      },
      grid: {
        vertLines: { color: 'rgba(148,163,184,0.08)' },
        horzLines: { color: 'rgba(148,163,184,0.08)' },
      },
      rightPriceScale: { borderVisible: false },
      timeScale: { borderVisible: false },
      autoSize: true,
    });

    const series = chart.addAreaSeries({
      lineColor: color,
      topColor: `${color}55`,
      bottomColor: `${color}05`,
      lineWidth: 2,
      priceLineVisible: false,
    });
    series.setData(
      history
        .slice(-rangeDays)
        .map((point) => ({ time: point.date, value: point.close })),
    );
    chart.timeScale().fitContent();

    return () => chart.remove();
  }, [history, rangeDays, color]);

  return (
    <div>
      <div className="mb-2 flex gap-1">
        {RANGES.map((range) => (
          <button
            key={range.label}
            onClick={() => setRangeDays(range.days)}
            className={`rounded px-2 py-0.5 text-xs ${
              rangeDays === range.days
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {range.label}
          </button>
        ))}
      </div>
      <div ref={containerRef} className="h-60 w-full" />
    </div>
  );
};
