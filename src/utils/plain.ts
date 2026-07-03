import { formatTHB } from './format';
import type { TickerAnalytics } from '../types';

// Everyday-Thai copy for users who don't know market jargon. Code keeps the
// canonical terms (Drawdown, Buy Multiplier — see CONTEXT.md); these helpers
// translate them into "discount / buy n× more" phrasing for display only.

export type PlanInput = Pick<
  TickerAnalytics,
  'symbol' | 'multiplier' | 'drawdownPct' | 'recommendedTHB'
>;

export interface PlainPlanLine {
  symbol: string;
  amount: string;
  reason: string;
  multiplier: number;
}

export interface PlainPlan {
  headline: string;
  detail: string;
  lines: PlainPlanLine[];
}

// "ราคาปกติ…" or "ถูกลง n% … ซื้อเพิ่มเป็น m เท่า" for one DCA ticker.
export const plainReason = (multiplier: number, drawdownPct: number): string =>
  multiplier <= 1
    ? 'ราคาปกติ ซื้อตามแผนเดิม'
    : `ถูกลง ${Math.round(Math.abs(drawdownPct))}% จากจุดสูงสุดในรอบปี → ซื้อเพิ่มเป็น ${multiplier} เท่า`;

// The whole month's action in plain Thai: what to buy, how much, and why —
// or "already done, nothing to do" once the ledger has this month's buys.
export const plainMonthlyPlan = (
  dca: PlanInput[],
  boughtThisMonth: boolean,
): PlainPlan => {
  const total = dca.reduce((sum, item) => sum + item.recommendedTHB, 0);
  const anyDiscount = dca.some((item) => item.multiplier > 1);
  const lines = dca.map((item) => ({
    symbol: item.symbol,
    amount: formatTHB(item.recommendedTHB),
    reason: plainReason(item.multiplier, item.drawdownPct),
    multiplier: item.multiplier,
  }));

  if (boughtThisMonth) {
    return {
      headline: 'เดือนนี้ซื้อเรียบร้อยแล้ว ✓',
      detail: 'ไม่ต้องทำอะไรเพิ่ม ระบบจะเตือนทาง LINE อีกครั้งเมื่อถึงรอบซื้อเดือนหน้า',
      lines,
    };
  }
  return {
    headline: `เดือนนี้ใช้เงินซื้อรวม ${formatTHB(total)}`,
    detail: anyDiscount
      ? 'บางตัวราคาลดลงจากจุดสูงสุด ระบบเลยแนะนำให้ซื้อมากกว่าปกติ — ของถูกให้เก็บเยอะขึ้น'
      : 'ทุกตัวราคาปกติ ซื้อตามแผนเดิมได้เลย',
    lines,
  };
};

export interface StatHelp {
  term: string;
  plain: string;
  dcaOnly?: boolean;
}

// Plain-Thai glossary for every stat shown on a StockCard. `term` mirrors the
// on-card label so users can match them up.
export const STAT_HELP: StatHelp[] = [
  {
    term: 'ป้ายสี 1x–5x (ตัวคูณการซื้อ)',
    plain:
      'จำนวนเท่าของเงินลงทุนรายเดือนที่ควรซื้อเดือนนี้ — ราคาปกติซื้อ 1 เท่า ยิ่งราคาลดจากจุดสูงสุดมากยิ่งให้ซื้อเยอะขึ้น (สูงสุด 5 เท่า) แนวคิดคือของถูกให้เก็บเยอะ',
    dcaOnly: true,
  },
  {
    term: 'จาก 52wk high (ส่วนลดจากจุดสูงสุด)',
    plain:
      'ราคาตอนนี้ถูกกว่าจุดที่แพงที่สุดในรอบ 1 ปีอยู่กี่ % — อ่านเหมือนป้ายลดราคา ยิ่งลดลึก แอปยิ่งแนะนำให้ซื้อเพิ่ม',
    dcaOnly: true,
  },
  {
    term: 'RSI 14',
    plain:
      'มิเตอร์บอกว่าช่วง 2 สัปดาห์นี้คนแห่ซื้อหรือแห่ขาย — ต่ำกว่า 30 คือคนเทขายเยอะ (มักเป็นจังหวะของถูก) เกิน 70 คือคนแห่ซื้อจนราคาตึง',
  },
  {
    term: 'YTD',
    plain: 'ราคาขึ้นหรือลงมาแล้วกี่ % นับตั้งแต่ต้นปีนี้',
  },
  {
    term: 'vs 200D',
    plain:
      'ราคาตอนนี้อยู่ "เหนือ" หรือ "ใต้" เส้นราคาเฉลี่ยย้อนหลัง 200 วัน — เหนือ = แนวโน้มขาขึ้น ใต้ = แนวโน้มขาลง',
  },
  {
    term: 'ปันผล',
    plain:
      'เงินสดที่กองทุนจ่ายคืนให้คนถือหน่วยในรอบ 1 ปี คิดเป็น % ของราคาตอนนี้ — คล้ายดอกเบี้ยเงินฝาก ได้เพิ่มนอกเหนือจากราคาที่ขึ้นลง',
    dcaOnly: true,
  },
  {
    term: '52wk low',
    plain: 'ราคาต่ำสุดในรอบ 1 ปี ไว้เทียบว่าราคาตอนนี้ห่างจากจุดต่ำสุดแค่ไหน',
  },
];
