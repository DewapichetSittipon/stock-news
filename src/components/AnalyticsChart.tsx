import { useEffect, useRef, useState } from 'react';
import { ColorType, createChart } from 'lightweight-charts';
import { smaSeries } from '../utils/indicators';
import { multiplierSeries } from '../utils/dcaCalculator';
import type { PricePoint } from '../types';

interface Props {
  history: PricePoint[];
  color: string;
  high52?: number;
  low52?: number;
  showMultiplier?: boolean; // overlay the historical Buy Multiplier strip (dca only)
}

const RANGES: { label: string; days: number }[] = [
  { label: '3M', days: 63 },
  { label: '6M', days: 126 },
  { label: '1Y', days: 252 },
  { label: '5Y', days: 1260 },
];

const SMA50_COLOR = '#f59e0b';
const SMA200_COLOR = '#38bdf8';

export const AnalyticsChart = ({
  history,
  color,
  high52,
  low52,
  showMultiplier,
}: Props): JSX.Element => {
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

    const sliced = history.slice(-rangeDays);
    const firstDate = sliced.length > 0 ? sliced[0].date : '';

    const area = chart.addAreaSeries({
      lineColor: color,
      topColor: `${color}55`,
      bottomColor: `${color}05`,
      lineWidth: 2,
      priceLineVisible: false,
    });
    area.setData(sliced.map((point) => ({ time: point.date, value: point.close })));

    // Moving-average overlays (computed on full history, clipped to the range).
    const addSma = (period: number, lineColor: string): void => {
      if (history.length < period) return;
      const series = chart.addLineSeries({ color: lineColor, lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
      series.setData(smaSeries(history, period).filter((point) => point.time >= firstDate));
    };
    addSma(50, SMA50_COLOR);
    addSma(200, SMA200_COLOR);

    if (high52) {
      area.createPriceLine({ price: high52, color: '#64748b', lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: '52w high' });
    }
    if (low52 && Number.isFinite(low52)) {
      area.createPriceLine({ price: low52, color: '#64748b', lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: '52w low' });
    }

    // Buy Multiplier "heat strip" along the bottom: each bar is a full-height
    // block coloured by what the signal would have said that day (1x green →
    // 5x red). Drawn on an overlay price scale so it has no visible axis.
    if (showMultiplier) {
      area.priceScale().applyOptions({ scaleMargins: { top: 0.05, bottom: 0.18 } });
      const strip = chart.addHistogramSeries({
        priceScaleId: 'multiplier',
        priceLineVisible: false,
        lastValueVisible: false,
        base: 0,
      });
      chart.priceScale('multiplier').applyOptions({
        scaleMargins: { top: 0.9, bottom: 0 },
      });
      strip.setData(
        multiplierSeries(history)
          .filter((band) => band.time >= firstDate)
          .map((band) => ({ time: band.time, value: 1, color: `${band.color}cc` })),
      );
    }

    chart.timeScale().fitContent();
    return () => chart.remove();
  }, [history, rangeDays, color, high52, low52, showMultiplier]);

  return (
    <div>
      <div className="mb-2 flex items-center gap-3">
        <div className="flex gap-1">
          {RANGES.map((range) => (
            <button
              key={range.label}
              onClick={() => setRangeDays(range.days)}
              className={`rounded px-3 py-1 text-xs ${
                rangeDays === range.days
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
        <div className="ml-auto flex gap-2 text-[10px] text-slate-500">
          <span style={{ color: SMA50_COLOR }}>— 50D</span>
          <span style={{ color: SMA200_COLOR }}>— 200D</span>
        </div>
      </div>
      <div ref={containerRef} className="h-48 w-full sm:h-60" />
      {showMultiplier && (
        <div className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-500">
          <span>แถบล่าง = จังหวะซื้อในอดีต</span>
          <span className="ml-auto flex items-center gap-1">
            1x
            <span className="inline-block h-2 w-4 rounded-sm bg-gradient-to-r from-emerald-500 via-orange-500 to-red-700" />
            5x
          </span>
        </div>
      )}
    </div>
  );
};
