# 📊 Project Plan: Premium Curated Stock Dashboard with LINE Monthly Notification

## 1. Project Overview
สร้างระบบ FinTech Dashboard ยุคใหม่ (Modern Dark Theme) สำหรับวิเคราะห์สินทรัพย์ 4 ตัว (VOO, SCHD, QQQM, SNDK) โดยเป็นโปรเจกต์ **Pure Frontend 100% (ไม่มี Backend Server) แต่มีระบบยิง LINE Notification แจ้งเตือนจุดเข้าซื้อ Smart DCA รายเดือนอัตโนมัติ** (ผู้ใช้ DCA เดือนละครั้ง) โดยใช้โควตาฟรีของ LINE Messaging API ร่วมกับ GitHub Actions — รันรีเฟรชข้อมูลรายวันแต่ยิง LINE เดือนละครั้ง

> 📖 ศัพท์เฉพาะทั้งหมดนิยามไว้ใน [`CONTEXT.md`](./CONTEXT.md) และเหตุผลเชิงสถาปัตยกรรมอยู่ใน [`docs/adr/`](./docs/adr/)

---

## 2. Technical Constraints & Coding Standards
*   **Frontend Framework:** React 18+ (Vite + TypeScript)
*   **Styling:** Tailwind CSS + UI components (Slate/Zinc Dark Mode, Mobile-First Layout)
*   **Functions:** **Arrow Functions เท่านั้น** ในการประกาศ Components, Hooks, และ Automation Scripts ทุกชนิด (ห้ามใช้คำสำคัญ `function`)
*   **UI:** Single-page **Mobile-First** dashboard (ไม่มี router/state library — ตัด Watchlist/Favorite ออกแล้ว)
*   **Data & Charting:** **TanStack Query v5** ร่วมกับ **TradingView Lightweight Charts** สำหรับวาดกราฟราคา EOD (default 1Y + ตัวเลือกช่วง 3M/6M/1Y/5Y)
*   **Price Source:** **Yahoo Finance chart API** (keyless) ดึงฝั่ง server ใน GitHub Action แล้ว commit เป็น `public/prices.json` — Dashboard อ่าน snapshot static ตัวเดียวกับที่ใช้คำนวณ LINE signal (Stooq ถูกทิ้งเพราะติด anti-bot, ดู ADR-0004); Mock Data ใช้เป็น dev fallback เท่านั้น
*   **Notification:** **LINE Messaging API** (Channel Access Token & User ID เก็บใน GitHub Secrets) ส่งแบบ **push หา userId เดียว** สรุปผลรายเดือน

---

## 3. Directory Structure
```text
src/
├── components/   # Header, StockCard, AnalyticsChart(+SMA/52wk overlay), NewsCard, MultiplierBadge, Portfolio
├── hooks/        # ครอบ TanStack Query (useStockAnalytics, useNews, useLedger)
├── pages/        # Dashboard, Backtest (แท็บสลับใน App)
├── services/     # yahoo parse + prices/news/ledger reader + Mock (dev fallback)
├── styles/       # ไฟล์ CSS Global (index.css)
└── utils/        # dcaCalculator, indicators (SMA/RSI/YTD), backtest, format, multiplier
config/
└── tickers.json  # Source of truth: [{ symbol, name, mode, baseTHB? }] — อ่านร่วมกันทั้ง UI และ Action
public/
├── prices.json   # Prices Snapshot: ~5y EOD ต่อ ticker (Action เขียนทับรายวัน)
├── news.json     # News Digest ต่อ ticker
├── ledger.json   # Ledger: บันทึกการซื้อ DCA รายเดือน (Action append) → Portfolio
└── ...
.state/
└── last-sent.json # lastSentMonth / lastDailyDate / dipAlerts (Action commit กลับ กันส่งซ้ำ)
.github/
└── workflows/
    ├── daily-line-noti.yml  # รันทุกวัน: ดึงราคา/ข่าว, ส่ง LINE (daily/monthly/dip), commit ข้อมูล
    └── deploy-pages.yml      # build + deploy เว็บขึ้น GitHub Pages
```

---

## 4. Smart DCA Signal (จุดเข้าซื้อ)
**Buy Multiplier** คำนวณจาก Drawdown ของราคาปิดล่าสุดเทียบกับ **จุดสูงสุดรอบ 52 สัปดาห์** (highest EOD close ใน 252 วันทำการ) — ตรรกะ band อยู่ใน `utils/dcaCalculator.ts` ที่เดียว ไม่กระจายลง config:

| Drawdown จาก 52wk high | Buy Multiplier |
|---|---|
| 0% ถึง −5% | 1x |
| −5% ถึง −10% | 2x |
| −10% ถึง −15% | 3x |
| −15% ถึง −20% | 4x |
| ≤ −20% | 5x |

จำนวนเงินที่แนะนำต่อวัน = `baseTHB × Buy Multiplier` (฿ เป็นแค่งบประมาณ ไม่มีการแปลงเป็น USD หรือคำนวณจำนวนหุ้น)

---

## 5. Daily Notification Design
*   **ตารางเวลา:** cron `0 0 * * *` รัน**ทุกวัน** (00:00 UTC ≈ 07:00 ไทย) เพื่อรีเฟรช `prices.json`/`news.json` ให้ dashboard — แต่ **ยิง LINE เดือนละครั้ง** (ดู ADR-0005)
*   **โหมดต่อ ticker (ADR-0006):** `dca` = Smart DCA รายเดือน (VOO/SCHD/QQQM), `daily` = ติดตามรายวัน (SNDK)
*   **ยิงรายเดือน (dca):** ส่งครั้งแรกของเดือนตั้งแต่วันที่ `BUY_DAY_OF_MONTH` (=1) โดยเทียบ `lastSentMonth` (`baseTHB` = งบต่อเดือนต่อตัว) — ถ้าวันที่ 1 ตรงวันหยุดก็ยังส่งด้วยราคาปิดล่าสุด และรันรายวันทำให้ resilient
*   **ยิงรายวัน (daily):** ส่ง SNDK ขึ้น/ลง % เทียบเมื่อวาน ทุกครั้งที่มี EOD ใหม่ (เทียบ `lastDailyDate` → auto ข้ามเสาร์อาทิตย์/วันหยุด) — เป็นคนละข้อความกับ DCA รายเดือน
*   **Dip alert:** ถ้าตัว DCA ย่อ ≤ `DIP_THRESHOLD` (-10%) กลางเดือน → เตือนให้ซื้อเพิ่ม (ครั้งเดียว/ตัว/เดือน, เก็บ `dipAlerts`)
*   **รูปแบบ:** ทุกข้อความเป็น **LINE Flex Message** (การ์ดมีสีตาม multiplier) โดย `altText` เป็น text ธรรมดาไว้ fallback
*   **ราคา (CORS workaround):** Action ดึง **Yahoo Finance chart API** ฝั่ง server แล้ว commit `public/prices.json`; frontend อ่าน snapshot static ตัวเดียวกับที่ใช้คำนวณ signal (ดู ADR-0004)
*   **Failure ต้องดัง:** error ที่ไม่คาดคิด → exit non-zero ให้ GitHub ส่งอีเมลแจ้ง (เพราะความเงียบเป็นสภาวะปกติ แยกไม่ออกจาก outage) — ถ้าดึงได้บางตัว ให้ส่งเท่าที่ได้พร้อมระบุตัวที่พลาด
*   **ทดสอบ:** `FORCE_SEND=1` ข้าม gate รายเดือน (manual `workflow_dispatch` ตั้งให้อัตโนมัติ), `DRY_RUN=1` พิมพ์ข้อความโดยไม่ส่ง/ไม่แตะ state
*   **ข่าว (CORS workaround):** RSS เรียกจาก browser ตรงๆ ไม่ได้ → Action ดึง **Google News RSS ต่อ ticker** ฝั่ง server แล้ว commit `public/news.json` ให้ frontend อ่านเป็น static

### รูปแบบข้อความ
**รายเดือน (dca) — 1 ข้อความ/เดือน**
```
📊 Smart DCA รายเดือน — กรกฎาคม 2026
(อิงราคาปิดล่าสุด 1 ก.ค. 2026)

🟢 VOO — ฿2,000 (1x)
   $685.46 · ↓1.8% จาก 52wk high
🟢 SCHD — ฿1,000 (1x)
   $31.85 · ↓3.0% จาก 52wk high
🟢 QQQM — ฿1,000 (1x)
   $298.61 · ↓2.8% จาก 52wk high

รวมเดือนนี้: ฿4,000
```
(สีวงกลมแปรผันตาม multiplier: เขียว 1x → แดงเข้ม 5x)

**รายวัน (daily) — 1 ข้อความ/วันทำการ**
```
📈 ติดตามรายวัน — 1 ก.ค. 2026

🔴 SNDK — $2,032.22
   ↓10.62% (-$241.51) จากเมื่อวาน
```
(🟢 ขึ้น / 🔴 ลง เทียบราคาปิดวันก่อนหน้า)

---

## 6. Implementation Watch-outs
*   **GitHub Actions cron ดีเลย์ได้** ช่วง peak — 07:00 ไทยยังปลอดภัยเพราะข้อมูลพร้อมตั้งแต่ตี 4
*   **commit อัตโนมัติจาก Action** push ด้วย `GITHUB_TOKEN` ซึ่ง GitHub **จงใจไม่ให้ trigger workflow อื่นผ่าน `push`** (กันลูป) → `deploy-pages.yml` จึงฟังผ่าน `workflow_run` (เมื่อ noti รันเสร็จ) แทน เพื่อให้เว็บอัปเดตข้อมูลรายวัน; workflow noti ต้องมี `permissions: contents: write`
*   **Vite `base`:** ใช้ `/` เพราะ deploy ผ่าน **custom domain** (smart-dca-stock.appstg.site) ที่ root — ถ้าย้ายไป path ย่อย (เช่น github.io/stock-news/) ต้องเปลี่ยน base กลับ
*   **prices.json ~280KB/วัน** — git history โตวันละเท่านี้ ถ้ากังวลให้ลด `range` ของ Yahoo (เช่น `2y`); 52wk high ต้องการแค่ 252 จุด
*   **Yahoo/Google News เป็น unofficial** อาจเปลี่ยน/ล้ม — `collectPrices` degrade ต่อ ticker, `NewsCard` degrade ได้เมื่อ `news.json` ว่าง
*   **คุณภาพข้อมูล = ของ Yahoo** — ตรวจค่าที่ผิดปกติก่อนเชื่อ signal (เช่น SNDK ที่ Yahoo รายงาน ~$2,032 ต้อง verify ว่าจริงหรือเป็น glitch)
*   **หา LINE userId ของตัวเอง** ต้องผ่าน webhook หรือ LINE Developers console (ไม่มีใน UI ปกติ)
