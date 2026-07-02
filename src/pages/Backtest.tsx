import { useStockAnalytics } from '../hooks/useStockAnalytics';
import { runBacktest } from '../utils/backtest';
import { formatSignedPct, formatTHB } from '../utils/format';
import type { TickerAnalytics } from '../types';

const UP = '#10b981';
const DOWN = '#ef4444';

const Row = ({
  label,
  plain,
  smart,
  highlight,
}: {
  label: string;
  plain: string;
  smart: string;
  highlight?: boolean;
}): JSX.Element => (
  <div className="grid grid-cols-3 items-center gap-2 py-1.5">
    <span className="text-xs text-slate-500">{label}</span>
    <span className="text-right text-sm text-slate-300">{plain}</span>
    <span
      className={`text-right text-sm ${highlight ? 'font-bold' : ''} text-emerald-300`}
    >
      {smart}
    </span>
  </div>
);

const Card = ({ item }: { item: TickerAnalytics }): JSX.Element => {
  const base = item.baseTHB;
  const plain = runBacktest(item.history, base, false);
  const smart = runBacktest(item.history, base, true);
  const smartWins = smart.returnPct >= plain.returnPct;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5">
      <div className="flex items-baseline justify-between">
        <h3 className="text-lg font-bold text-white">{item.symbol}</h3>
        <span className="text-xs text-slate-500">
          {formatTHB(base)}/เดือน · {smart.months} เดือน
        </span>
      </div>

      <div className="mt-3 grid grid-cols-3 border-b border-slate-800 pb-1 text-[11px] uppercase tracking-wide text-slate-500">
        <span />
        <span className="text-right">DCA ธรรมดา</span>
        <span className="text-right text-emerald-400">Smart DCA</span>
      </div>

      <Row label="ลงทุนรวม" plain={formatTHB(plain.invested)} smart={formatTHB(smart.invested)} />
      <Row
        label="มูลค่าปัจจุบัน"
        plain={formatTHB(plain.finalValue)}
        smart={formatTHB(smart.finalValue)}
      />
      <Row
        label="ผลตอบแทน"
        plain={formatSignedPct(plain.returnPct)}
        smart={formatSignedPct(smart.returnPct)}
        highlight
      />

      <p className="mt-2 text-xs" style={{ color: smartWins ? UP : DOWN }}>
        {smartWins
          ? `Smart DCA ให้ผลตอบแทนดีกว่า +${(smart.returnPct - plain.returnPct).toFixed(2)}%`
          : `รอบนี้ DCA ธรรมดาดีกว่า ${(plain.returnPct - smart.returnPct).toFixed(2)}%`}
      </p>
    </div>
  );
};

export const Backtest = (): JSX.Element => {
  const { data } = useStockAnalytics();
  const dca = data.filter((item) => item.mode === 'dca');

  const totals = dca.reduce(
    (acc, item) => {
      const plain = runBacktest(item.history, item.baseTHB, false);
      const smart = runBacktest(item.history, item.baseTHB, true);
      acc.plainInvested += plain.invested;
      acc.plainValue += plain.finalValue;
      acc.smartInvested += smart.invested;
      acc.smartValue += smart.finalValue;
      return acc;
    },
    { plainInvested: 0, plainValue: 0, smartInvested: 0, smartValue: 0 },
  );
  const plainReturn =
    totals.plainInvested > 0 ? (totals.plainValue / totals.plainInvested - 1) * 100 : 0;
  const smartReturn =
    totals.smartInvested > 0 ? (totals.smartValue / totals.smartInvested - 1) * 100 : 0;

  return (
    <div className="px-4 py-5 sm:px-6">
      <h2 className="text-xl font-bold text-white sm:text-2xl">Backtest</h2>
      <p className="mb-5 text-sm text-slate-400">
        จำลองซื้อต้นเดือนทุกเดือนตลอดช่วงข้อมูลที่มี · Smart DCA vs DCA ธรรมดา
      </p>

      {dca.length === 0 ? (
        <p className="text-slate-400">กำลังโหลดข้อมูล…</p>
      ) : (
        <>
          <div className="mb-5 rounded-2xl border border-emerald-800/40 bg-emerald-900/10 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              ผลตอบแทนรวมทุกตัว (DCA)
            </p>
            <div className="mt-1 flex items-end justify-between">
              <div>
                <p className="text-xs text-slate-500">DCA ธรรมดา</p>
                <p className="text-lg font-bold text-slate-300">
                  {formatSignedPct(plainReturn)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-emerald-400">Smart DCA</p>
                <p className="text-2xl font-bold text-emerald-300">
                  {formatSignedPct(smartReturn)}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
            {dca.map((item) => (
              <Card key={item.symbol} item={item} />
            ))}
          </div>

          <p className="mt-5 text-xs text-slate-600">
            * จำลองจากราคาในอดีต ไม่รวมค่าธรรมเนียม/ปันผล/อัตราแลกเปลี่ยน ผลจริงอาจต่างออกไป
          </p>
        </>
      )}
    </div>
  );
};
