import type { Order } from './api'

export function formatPayout(order: Order, digits = 2): string {
  const amounts = [
    order.estimated_price,
    order.final_price,
    order.driver_earnings,
    order.payout,
    order.driver_earnings_cents == null ? null : order.driver_earnings_cents / 100,
    order.price,
    order.total,
  ]
  for (const value of amounts) {
    const amount = Number(value)
    if (Number.isFinite(amount) && amount > 0) return amount.toFixed(digits)
  }
  return (0).toFixed(digits)
}
