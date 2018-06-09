/* eslint-disable promise/always-return */
/* eslint-disable promise/catch-or-return */
import test from 'tape'

import pewPewPew from '../src/'

test('export', (t) => {
  t.equal(
    typeof pewPewPew,
    'function',
    'must be a function'
  )

  t.end()
})
