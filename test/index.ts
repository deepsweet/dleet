import test from 'tape-promise/tape'
import { createFsFromVolume, Volume } from 'memfs'
import { mock, unmock } from 'mocku'
import { stub } from 'sinon'
import makethen from 'makethen'

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
  vol.reset()
})

test('error: ENOENT + win32', async (t) => {
  const vol = Volume.fromJSON({})
  const fs = createFsFromVolume(vol)

  mock('../src/', { fs })

  const { default: dleet } = await import('../src/')

  await dleet('/test/2.md')

  t.deepEqual(
    vol.toJSON(),
    {},
    'should ignore it'
  )

  unmock('../src/')
  vol.reset()
})

test('error: ENOENT + not win32', async (t) => {
  const originalPlatform = process.platform
  const vol = Volume.fromJSON({})
  const fs = createFsFromVolume(vol)

  mock('../src/', { fs })

  const { default: dleet } = await import('../src/')

  Object.defineProperty(process, 'platform', {
    value: 'win32'
  })

  await dleet('/test/2.md')

  t.deepEqual(
    vol.toJSON(),
    {},
    'should ignore it'
  )

  Object.defineProperty(process, 'platform', {
    value: originalPlatform
  })

  unmock('../src/')
  vol.reset()
})

test('error: EPERM + win32 + fix + fixed', async (t) => {
  const originalPlatform = process.platform
  const vol = Volume.fromJSON({
    '/test/1.md': ''
  })
  const fs = createFsFromVolume(vol)
  const lstatStub = stub()
    .onFirstCall().throws((path) => ({ path, code: 'EPERM' }))
    .onSecondCall().callsFake(fs.lstat)
  const chmodStub = stub().callsArgWith(2, null)

  let hasFixedMode = false

  mock('../src/', {
    fs: {
      ...fs,
      chmod: chmodStub,
      lstat: lstatStub
    }
  })

  Object.defineProperty(process, 'platform', {
    value: 'win32'
  })

  const { default: dleet } = await import('../src/')

  await dleet('/test/1.md')

  t.true(
    lstatStub.firstCall.calledWithMatch('/test/1.md'),
    'should call lstat first time'
  )

  t.true(
    chmodStub.calledWithMatch('/test/1.md', 438),
    'should apply chmod with value'
  )

  t.true(
    lstatStub.secondCall.calledWithMatch('/test/1.md'),
    'should call lstat second time'
  )

  t.deepEqual(
    vol.toJSON(),
    { '/test': null },
    'should delete a file'
  )

  Object.defineProperty(process, 'platform', {
    value: originalPlatform
  })

  unmock('../src/')
  vol.reset()
})

test('error: EBUSY + win32 + 1 retry', async (t) => {
  const originalPlatform = process.platform
  const vol = Volume.fromJSON({
    '/test/1.md': ''
  })
  const fs = createFsFromVolume(vol)
  const lstatStub = stub()
    .onFirstCall().throws((path) => ({ path, code: 'EBUSY' }))
    .onSecondCall().callsFake(fs.lstat)

  let hasFixedMode = false

  mock('../src/', {
    fs: {
      ...fs,
      lstat: lstatStub
    }
  })

  Object.defineProperty(process, 'platform', {
    value: 'win32'
  })

  const { default: dleet } = await import('../src/')

  await dleet('/test/1.md')

  t.true(
    lstatStub.firstCall.calledWithMatch('/test/1.md'),
    'should call lstat 1st time'
  )

  t.true(
    lstatStub.secondCall.calledWithMatch('/test/1.md'),
    'should call lstat 2nd time'
  )

  t.deepEqual(
    vol.toJSON(),
    { '/test': null },
    'should delete a file'
  )

  Object.defineProperty(process, 'platform', {
    value: originalPlatform
  })

  unmock('../src/')
  vol.reset()
})

test('error: EBUSY + win32 + 2 retries', async (t) => {
  const originalPlatform = process.platform
  const vol = Volume.fromJSON({
    '/test/1.md': ''
  })
  const fs = createFsFromVolume(vol)
  const lstatStub = stub()
    .onFirstCall().throws((path) => ({ path, code: 'EBUSY' }))
    .onSecondCall().throws((path) => ({ path, code: 'EBUSY' }))
    .onThirdCall().callsFake(fs.lstat)

  let hasFixedMode = false

  mock('../src/', {
    fs: {
      ...fs,
      lstat: lstatStub
    }
  })

  Object.defineProperty(process, 'platform', {
    value: 'win32'
  })

  const { default: dleet } = await import('../src/')

  await dleet('/test/1.md')

  t.true(
    lstatStub.firstCall.calledWithMatch('/test/1.md'),
    'should call lstat 1st time'
  )

  t.true(
    lstatStub.secondCall.calledWithMatch('/test/1.md'),
    'should call lstat 2nd time'
  )

  t.true(
    lstatStub.thirdCall.calledWithMatch('/test/1.md'),
    'should call lstat 3rd time'
  )

  t.deepEqual(
    vol.toJSON(),
    { '/test': null },
    'should delete a file'
  )

  Object.defineProperty(process, 'platform', {
    value: originalPlatform
  })

  unmock('../src/')
  vol.reset()
})

test('error: EBUSY + win32 + 3 retries', async (t) => {
  const originalPlatform = process.platform
  const vol = Volume.fromJSON({
    '/test/1.md': ''
  })
  const fs = createFsFromVolume(vol)
  const lstatStub = stub().throws((path) => ({ path, code: 'EBUSY' }))

  let hasFixedMode = false

  mock('../src/', {
    fs: {
      ...fs,
      lstat: lstatStub
    }
  })

  Object.defineProperty(process, 'platform', {
    value: 'win32'
  })

  const { default: dleet } = await import('../src/')

  try {
    await dleet('/test/1.md')
  } catch (error) {
    t.true(
      lstatStub.firstCall.calledWithMatch('/test/1.md'),
      'should call lstat 1st time'
    )

    t.true(
      lstatStub.secondCall.calledWithMatch('/test/1.md'),
      'should call lstat 2nd time'
    )

    t.true(
      lstatStub.thirdCall.calledWithMatch('/test/1.md'),
      'should call lstat 3rd time'
    )

    t.equal(
      error.code,
      'EBUSY',
      'should throw an error'
    )
  }

  Object.defineProperty(process, 'platform', {
    value: originalPlatform
  })

  unmock('../src/')
  vol.reset()
})

test('error: EBUSY + not win32', async (t) => {
  const vol = Volume.fromJSON({
    '/test/1.md': ''
  })
  const fs = createFsFromVolume(vol)
  const lstatStub = stub().throws((path) => ({ path, code: 'EBUSY' }))

  mock('../src/', {
    fs: {
      ...fs,
      lstat: lstatStub
    }
  })

  const { default: dleet } = await import('../src/')

  try {
    await dleet('/test/1.md')
  } catch (error) {
    t.true(
      lstatStub.calledOnce,
      'should call lstat once'
    )

    t.equal(
      error.code,
      'EBUSY',
      'should throw an error'
    )
  }

  unmock('../src/')
  vol.reset()
})

test('error: EPERM + win32 + fix + not fixed', async (t) => {
  const originalPlatform = process.platform
  const vol = Volume.fromJSON({
    '/test/1.md': ''
  })
  const fs = createFsFromVolume(vol)
  const lstatStub = stub().throws((path) => ({ path, code: 'EPERM' }))

  mock('../src/', {
    fs: {
      ...fs,
      lstat: lstatStub
    }
  })

  Object.defineProperty(process, 'platform', {
    value: 'win32'
  })

  const { default: dleet } = await import('../src/')

  try {
    await dleet('/test/1.md')
  } catch (error) {
    t.true(
      lstatStub.calledTwice,
      'should call lstat two times'
    )

    t.equal(
      error.code,
      'EPERM',
      'should throw an error'
    )
  }

  Object.defineProperty(process, 'platform', {
    value: originalPlatform
  })

  unmock('../src/')
  vol.reset()
})

test('error: EPERM + not win32', async (t) => {
  const vol = Volume.fromJSON({
    '/test/1.md': ''
  })
  const fs = createFsFromVolume(vol)
  const lstatStub = stub().throws((path) => ({ path, code: 'EPERM' }))

  mock('../src/', {
    fs: {
      ...fs,
      lstat: lstatStub
    }
  })

  const { default: dleet } = await import('../src/')

  try {
    await dleet('/test/1.md')
  } catch (error) {
    t.true(
      lstatStub.calledOnce,
      'should call lstat once'
    )

    t.equal(
      error.code,
      'EPERM',
      'should throw an error'
    )
  }

  unmock('../src/')
  vol.reset()
})

test('error: any other + win32', async (t) => {
  const originalPlatform = process.platform
  const vol = Volume.fromJSON({
    '/test/1.md': ''
  })
  const fs = createFsFromVolume(vol)
  const lstatStub = stub().throws((path) => ({ path, code: 'OOPSIE' }))

  mock('../src/', {
    fs: {
      ...fs,
      lstat: lstatStub
    }
  })

  const { default: dleet } = await import('../src/')

  try {
    await dleet('/test/1.md')
  } catch (error) {
    t.true(
      lstatStub.calledOnce,
      'should call lstat once'
    )

    t.equal(
      error.code,
      'OOPSIE',
      'should throw an error'
    )
  }

  unmock('../src/')
  vol.reset()
})

test('error: any other + not win32', async (t) => {
  const originalPlatform = process.platform
  const vol = Volume.fromJSON({
    '/test/1.md': ''
  })
  const fs = createFsFromVolume(vol)
  const lstatStub = stub().throws((path) => ({ path, code: 'OOPSIE' }))

  mock('../src/', {
    fs: {
      ...fs,
      lstat: lstatStub
    }
  })

  Object.defineProperty(process, 'platform', {
    value: 'win32'
  })

  const { default: dleet } = await import('../src/')

  try {
    await dleet('/test/1.md')
  } catch (error) {
    t.true(
      lstatStub.calledOnce,
      'should call lstat once'
    )

    t.equal(
      error.code,
      'OOPSIE',
      'should throw an error'
    )
  }

  Object.defineProperty(process, 'platform', {
    value: originalPlatform
  })

  unmock('../src/')
  vol.reset()
})
