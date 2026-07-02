# Portfolio & backtest values are ฿-ratio, ignoring FX/fees/dividends

The ledger records each buy as `amountTHB`, `priceUSD`, and `units =
amountTHB / priceUSD`. Current value is `units × latestPriceUSD` and P/L% is
`value / invested − 1`.

Because `units` is defined from `amountTHB`, the P/L **percentage** is
currency-agnostic (the units factor cancels), so it is correct regardless of
the THB/USD rate. The displayed baht "value", however, treats the ฿ budget as
if it tracked the USD price 1:1 — it ignores USD/THB drift, and also ignores
trading fees and dividends. The backtest makes the same simplifications.

This is a deliberate v1 choice, consistent with "฿ = budget, no FX conversion"
(see CONTEXT.md → Base Contribution). It keeps the app backend-less and
dependency-free at the cost of absolute-value precision. Revisit by adding an
FX series + dividend/fee handling if accurate baht valuation becomes important.
