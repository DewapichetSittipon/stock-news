# 📊 Project Plan: Premium Curated Stock Dashboard with LINE Daily Notification

## 1. Project Overview
สร้างระบบ FinTech Dashboard ยุคใหม่ (Modern Dark Theme) สำหรับวิเคราะห์สินทรัพย์ 4 ตัว (VOO, SCHD, QQQM, SNDK) โดยเป็นโปรเจกต์ **Pure Frontend 100% (ไม่มี Backend Server) แต่มีระบบยิง LINE Notification แจ้งเตือนจุดเข้าซื้อ Smart DCA รายวันอัตโนมัติ** โดยใช้โควตาฟรีของ LINE Messaging API ร่วมกับ GitHub Actions ในการตั้งเวลารันสคริปต์ตอนเช้า (เวลาไทย)

> 📖 ศัพท์เฉพาะทั้งหมดนิยามไว้ใน [`CONTEXT.md`](./CONTEXT.md) และเหตุผลเชิงสถาปัตยกรรมอยู่ใน [`docs/adr/`](./docs/adr/)

---

## 2. Technical Constraints & Coding Standards
*   **Frontend Framework:** React 18+ (Vite + TypeScript)
*   **Styling:** Tailwind CSS + UI components (Slate/Zinc Dark Mode, Mobile-First Layout)
*   **Functions:** **Arrow Functions เท่านั้น** ในการประกาศ Components, Hooks, Stores, และ Automation Scripts ทุกชนิด (ห้ามใช้คำสำคัญ `function`)
*   **State Management:** **Zustand** + `persist` (บันทึกหุ้น Favorite ลงใน LocalStorage — เป็นแค่ตัวกรองการแสดงผลฝั่ง UI ไม่เกี่ยวกับ Notification)
*   **Data & Charting:** **TanStack Query v5** ร่วมกับ **TradingView Lightweight Charts** สำหรับวาดกราฟราคา EOD (default 1Y + ตัวเลือกช่วง 3M/6M/1Y/5Y)
*   **Price Source:** **Yahoo Finance chart API** (keyless) ดึงฝั่ง server ใน GitHub Action แล้ว commit เป็น `public/prices.json` — Dashboard อ่าน snapshot static ตัวเดียวกับที่ใช้คำนวณ LINE signal (Stooq ถูกทิ้งเพราะติด anti-bot, ดู ADR-0004); Mock Data ใช้เป็น dev fallback เท่านั้น
*   **Notification:** **LINE Messaging API** (Channel Access Token & User ID เก็บใน GitHub Secrets) ส่งแบบ **push หา userId เดียว** สรุปผลรายวัน

---

## 3. Directory Structure
```text
src/
├── components/   # UI Components (Sidebar, StockCard, AnalyticsChart, NewsCard)
├── hooks/        # Custom React Hooks ครอบ TanStack Query (useStockAnalytics)
├── pages/        # หน้าหลักของแอป (Dashboard, Watchlist)
├── services/     # yahoo parse + prices.json/news reader + Mock (dev fallback)
├── stores/       # Zustand State Stores (useWatchlistStore)
├── styles/       # ไฟล์ CSS Global (index.css)
└── utils/        # dcaCalculator.ts สำหรับคำนวณ Buy Multiplier (Arrow Function)
config/
└── tickers.json  # Source of truth: [{ symbol, name, baseTHB }] — อ่านร่วมกันทั้ง UI และ Action
public/
├── prices.json   # Prices Snapshot: ~5y EOD ต่อ ticker (Action เขียนทับรายวัน)
├── news.json     # News Digest ต่อ ticker (Action เขียนทับรายวัน, frontend อ่าน static)
└── ...
.state/
└── last-sent.json # วันที่ EOD ล่าสุดที่ส่ง LINE ไปแล้ว (Action commit กลับ เพื่อกันส่งซ้ำ)
.github/
└── workflows/
    └── daily-line-noti.yml  # GitHub Actions: รันเช้าไทย ดึงราคา/ข่าว คำนวณ ส่ง LINE
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
*   **ตารางเวลา:** cron `0 0 * * *` (00:00 UTC ≈ 07:00 เวลาไทย) — US ปิดตี 3–4 ไทย ข้อมูล EOD จึงสดเสมอ ไม่ว่า DST จะเลื่อน
*   **ราคา (CORS workaround):** Action ดึง **Yahoo Finance chart API** ฝั่ง server แล้ว commit `public/prices.json`; frontend อ่าน snapshot static ตัวเดียวกับที่ใช้คำนวณ signal (ดู ADR-0004)
*   **ข้ามวันหยุด:** ถ้าวันที่ EOD ล่าสุดเท่ากับใน `.state/last-sent.json` (ไม่มีราคาปิดใหม่) → **ไม่ส่ง** (กันโควตา LINE ฟรี + กันตัวเลขซ้ำ) → ครอบทั้งเสาร์อาทิตย์และวันหยุดตลาดโดยไม่ต้องมีปฏิทิน
*   **Failure ต้องดัง:** error ที่ไม่คาดคิด → exit non-zero ให้ GitHub ส่งอีเมลแจ้ง (เพราะความเงียบเป็นสภาวะปกติ แยกไม่ออกจาก outage) — ถ้าดึงได้บางตัว ให้ส่งเท่าที่ได้พร้อมระบุตัวที่พลาด
*   **ข่าว (CORS workaround):** RSS เรียกจาก browser ตรงๆ ไม่ได้ → Action ดึง **Google News RSS ต่อ ticker** ฝั่ง server แล้ว commit `public/news.json` ให้ frontend อ่านเป็น static

### รูปแบบข้อความ (1 ข้อความ/วัน รวมทุก ticker)
```
📊 Smart DCA — 2 ก.ค. 2026 (อิงราคาปิด 1 ก.ค.)

🔴 VOO — ฿2,000 (2x)
   $512.30 · ↓7.2% จาก 52wk high
🟢 SCHD — ฿1,000 (1x)
   $27.80 · ↓1.1%
🟠 QQQM — ฿3,000 (3x)
   $198.40 · ↓12.5%
🟢 SNDK — ฿1,000 (1x)
   $44.10 · ↓3.0%

รวมวันนี้: ฿7,000
```
(สีวงกลมแปรผันตาม multiplier: เขียว 1x → แดงเข้ม 5x)

---

## 6. Implementation Watch-outs
*   **GitHub Actions cron ดีเลย์ได้** ช่วง peak — 07:00 ไทยยังปลอดภัยเพราะข้อมูลพร้อมตั้งแต่ตี 4
*   **commit อัตโนมัติจาก Action** (`prices.json`, `news.json`, `last-sent.json`) ต้องกัน trigger build ตัวเอง — ใส่ `[skip ci]` หรือจำกัด `paths` ใน workflow trigger; workflow ต้องมี `permissions: contents: write`
*   **prices.json ~280KB/วัน** — git history โตวันละเท่านี้ ถ้ากังวลให้ลด `range` ของ Yahoo (เช่น `2y`); 52wk high ต้องการแค่ 252 จุด
*   **Yahoo/Google News เป็น unofficial** อาจเปลี่ยน/ล้ม — `collectPrices` degrade ต่อ ticker, `NewsCard` degrade ได้เมื่อ `news.json` ว่าง
*   **คุณภาพข้อมูล = ของ Yahoo** — ตรวจค่าที่ผิดปกติก่อนเชื่อ signal (เช่น SNDK ที่ Yahoo รายงาน ~$2,032 ต้อง verify ว่าจริงหรือเป็น glitch)
*   **หา LINE userId ของตัวเอง** ต้องผ่าน webhook หรือ LINE Developers console (ไม่มีใน UI ปกติ)
