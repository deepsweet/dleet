import { chmod, lstat, readdir, rmdir, unlink } from 'fs'
import { join } from 'path'
import makethen from 'makethen'

const EBUSY_MAX_TRIES = 3
const EBUSY_RETRY_DELAY = 100
const CHMOD_RWRWRW = parseInt('666', 8)
const IS_WINDOWS = process.platform === 'win32'

const pChmod = makethen(chmod)
const pLstat = makethen(lstat)
const pReaddir = makethen(readdir)
const pRmdir = makethen(rmdir)
const pUnlink = makethen(unlink)
const pDelay = (delay: number) => new Promise((resolve) => setTimeout(resolve, delay))

const rm = async (targetPath: string) => {
  const stats = await pLstat(targetPath)

  if (stats.isDirectory()) {
    const list = await pReaddir(targetPath)

    await Promise.all(
      list
        .map((item) => join(targetPath, item))
        .map(dleet)
    )
    await pRmdir(targetPath)
  } else {
    await pUnlink(targetPath)
  }
}

const dleet = async (targetPath: string) => {
  let ebusyTries = 1

  const tryToRm = async () => {
    try {
      await rm(targetPath)
    } catch (error) {
      if (IS_WINDOWS && error.code === 'EPERM') {
        await pChmod(targetPath, CHMOD_RWRWRW)
        await tryToRm()
      } else if (IS_WINDOWS && error.code === 'EBUSY') {
        if (ebusyTries === EBUSY_MAX_TRIES) {
          throw error
        }

        ebusyTries += 1

        await pDelay(EBUSY_RETRY_DELAY)
        await tryToRm()
      } else if (error.code !== 'ENOENT') {
        throw error
      }
    }
  }

  await tryToRm()
}

export default dleet
