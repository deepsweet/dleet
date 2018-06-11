import test from 'tape-promise/tape'
import { createFsFromVolume, Volume } from 'memfs'
import { mock, unmock } from 'mocku'

test('delete directory with subdirectories, files and symlinks', async (t) => {
  const vol = Volume.fromJSON({
    '/test/1.md': '',
    '/test/foo/2.md': '',
    '/test/foo/bar/3.md': ''
  })
  const fs = createFsFromVolume(vol)
  type Symlink = (target: string, path: string, cb: (error: any) => void) => void
  const symlink = makethen(fs.symlink as Symlink)

  await symlink('/test/foo/2.md', '/test/symlink')

  mock('../src/', { fs })

  const { default: dleet } = await import('../src/')

  await dleet('/test/')

  t.deepEqual(
    vol.toJSON(),
    {},
    'should wipe everything'
  )

  unmock('../src/')
})
