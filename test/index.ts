import test from 'tape'

import dleet from '../src/'

test('export', (t) => {
  t.equal(
    typeof dleet,
    'function',
    'must be a function'
  )

  t.end()
})
