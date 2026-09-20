import { afterEach, beforeEach, test, mock } from 'node:test'
import assert from 'node:assert/strict'
import { trackDriverLocation } from './driverLocation.ts'

let stop
let initial
let watch
let fail
let requests
let cleared
let positions
let statuses
let geolocation

beforeEach(() => {
  mock.timers.enable({ apis: ['Date', 'setInterval'], now: 1000000 })
  requests = 0
  cleared = []
  positions = []
  statuses = []
  geolocation = {
    getCurrentPosition(receive) { initial = receive; requests++ },
    watchPosition(receive, error) { watch = receive; fail = error; return 0 },
    clearWatch(id) { cleared.push(id) },
  }
  stop = trackDriverLocation(geolocation, position => positions.push(position), status => statuses.push(status))
})
afterEach(() => { stop(); mock.timers.reset() })

const fix = (timestamp = Date.now(), latitude = 0) => ({
  timestamp, coords: { latitude, longitude: 0, accuracy: 8, heading: 90, speed: 4 },
})

test('streams small movements including zero coordinates and preserves heading/speed', () => {
  watch(fix())
  mock.timers.tick(5000)
  watch(fix(Date.now(), 0.00001))
  assert.equal(positions.length, 2)
  assert.equal(positions[1].coords.heading, 90)
  assert.equal(positions[1].coords.speed, 4)
  assert.equal(statuses.at(-1), 'live')
})

test('permission denial clears tracking without a fabricated driver position', () => {
  fail({ code: 1 })
  mock.timers.tick(45000)
  assert.equal(statuses.at(-1), 'denied')
  assert.deepEqual(cleared, [0])
  assert.equal(positions.length, 0)
  assert.equal(requests, 1)
})

test('stale, invalid and out-of-order positions are discarded', () => {
  initial(fix(Date.now() - 31000))
  watch(fix(Date.now(), NaN))
  watch(fix(Date.now(), 91))
  assert.equal(positions.length, 0)
  watch(fix())
  initial(fix(Date.now() - 1000, 10))
  assert.equal(positions.length, 1)
})

test('heartbeat obtains a fresh fix instead of sending an old location as live', () => {
  watch(fix())
  mock.timers.tick(45000)
  assert.equal(positions.length, 1)
  assert.equal(requests, 4)
  assert.equal(statuses.at(-1), 'stale')
  initial(fix())
  assert.equal(positions.length, 2)
  assert.equal(statuses.at(-1), 'live')
})

test('low accuracy is visible and temporary GPS errors recover', () => {
  watch({ ...fix(), coords: { ...fix().coords, accuracy: 800 } })
  assert.equal(statuses.at(-1), 'approximate')
  mock.timers.tick(35000)
  fail({ code: 2 })
  assert.equal(statuses.at(-1), 'unavailable')
  watch(fix())
  assert.equal(statuses.at(-1), 'live')
})

test('callbacks and heartbeats stop after unmount or visibility change', () => {
  stop()
  watch(fix())
  initial(fix())
  mock.timers.tick(45000)
  assert.equal(positions.length, 0)
  assert.equal(requests, 1)
  assert.deepEqual(cleared, [0])
})
