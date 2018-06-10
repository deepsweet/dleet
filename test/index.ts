import test from 'tape-promise/tape'
import { createFsFromVolume, Volume } from 'memfs'
import { mock, unmock } from 'mocku'

test('delete directory with all files', async (t) => {
  const vol = Volume.fromJSON({
    '/test/1.md': '',
    '/test/foo/2.md': '',
    '/test/foo/bar/3.md': ''
  })

  mock('../src/', {
    fs: createFsFromVolume(vol)
  })

  const { default: dleet } = await import('../src/')

  await dleet('/test/')

  t.deepEqual(
    vol.toJSON(),
    {},
    'should wipe everything'
  )

  unmock('../src/')
})
