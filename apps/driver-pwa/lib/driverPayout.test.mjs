import { test } from 'node:test'
import assert from 'node:assert/strict'
import { formatPayout } from './driverPayout.ts'

test('keeps the API commission amount consistent in details and map labels', () => {
  const order = { estimated_price: '125.00', price: 178.57 }
  assert.equal(formatPayout(order), '125.00')
  assert.equal(formatPayout(order, 0), '125')
})

test('does not mistake dollar earnings above 100 for cents', () => {
  assert.equal(formatPayout({ driver_earnings: 125 }), '125.00')
  assert.equal(formatPayout({ driver_earnings_cents: 12500 }), '125.00')
  assert.equal(formatPayout({ driver_earnings_cents: 75 }), '0.75')
})

test('handles decimal strings and legacy fields without applying commission twice', () => {
  assert.equal(formatPayout({ payout: '120.25' }), '120.25')
  assert.equal(formatPayout({ price: 200 }), '200.00')
  assert.equal(formatPayout({ total: 300 }), '300.00')
  assert.equal(formatPayout({ final_price: '210.25' }), '210.25')
})

test('invalid amounts never render NaN or throw and may fall back to a valid amount', () => {
  assert.equal(formatPayout({ estimated_price: 'invalid', payout: 50 }), '50.00')
  assert.equal(formatPayout({ estimated_price: Infinity, driver_earnings: -20 }), '0.00')
  assert.equal(formatPayout({}), '0.00')
})
