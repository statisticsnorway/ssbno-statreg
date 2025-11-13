import test from 'node:test'
import assert from 'node:assert'

// We use the native Node test runner (but with ts!). See https://nodejs.org/api/test.html
test('Check that true is true', () => {
  assert.strictEqual(true, true)
})

test('See if math still works', () => {
  assert.equal(3 + 2, 5)
})
