import { useEffect, useRef } from 'react';
import { ColorType, LineType, createChart } from 'lightweight-charts';
import type { PortfolioPoint } from '../utils/portfolio';

interface Props {
  points: PortfolioPoint[];
}

const VALUE_COLOR = '#10b981';
const INVESTED_COLOR = '#64748b';

// Growth-of-portfolio chart: green area = current value, grey steps = cash
// put in. Green above grey = profit — readable with zero market knowledge.
export const PortfolioChart = ({ points }: Props): JSX.Element | null => {
  const containerRef = useRef<HTMLDivElement>(null);

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

    const value = chart.addAreaSeries({
      lineColor: VALUE_COLOR,
      topColor: `${VALUE_COLOR}33`,
      bottomColor: `${VALUE_COLOR}05`,
      lineWidth: 2,
      priceLineVisible: false,
    });
    value.setData(points.map((point) => ({ time: point.date, value: point.value })));

    const invested = chart.addLineSeries({
      color: INVESTED_COLOR,
      lineWidth: 1,
      lineType: LineType.WithSteps,
      priceLineVisible: false,
      lastValueVisible: false,
    });
    invested.setData(points.map((point) => ({ time: point.date, value: point.invested })));

    chart.timeScale().fitContent();
    return () => chart.remove();
  }, [points]);

  if (points.length < 2) return null;

  return (
    <div className="mt-3">
      <div ref={containerRef} className="h-36 w-full sm:h-44" />
      <div className="mt-1 flex items-center gap-3 text-[10px] text-slate-500">
        <span style={{ color: VALUE_COLOR }}>— มูลค่าพอร์ต</span>
        <span style={{ color: INVESTED_COLOR }}>— เงินที่ใส่ไป</span>
        <span className="ml-auto">เส้นเขียวอยู่เหนือเส้นเทา = กำไร</span>
      </div>
    </div>
  );
};
