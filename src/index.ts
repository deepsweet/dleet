import { chmod, lstat, readdir, rmdir, unlink } from 'fs'
import { join } from 'path'
import makethen from 'makethen'

const pChmod = makethen(chmod)
const pLstat = makethen(lstat)
const pReaddir = makethen(readdir)
const pRmdir = makethen(rmdir)
const pUnlink = makethen(unlink)

const CHMOD_RWRWRW = parseInt('666', 8)
const IS_WINDOWS = process.platform === 'win32'

const dleet = async (targetPath: string) => {
  try {
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
  } catch (error) {
    if (IS_WINDOWS && error.code === 'EPERM') {
      await pChmod(targetPath, CHMOD_RWRWRW)
      await dleet(targetPath)
    } else if (error.code !== 'ENOENT') {
      throw error
    }
  }
}

export default dleet
