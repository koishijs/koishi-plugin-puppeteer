import win32 from './win32'
import darwin from './darwin'
import linux from './linux'

const ERROR_PLATFORM_NOT_SUPPORT = new Error('platform not support')
const ERROR_NO_INSTALLATIONS_FOUND = new Error('no chrome installations found')

function findChromes() {
  switch (process.platform) {
    case 'win32': return win32()
    case 'darwin': return darwin()
    case 'linux':
    case 'android':
      return linux()
    default:
      throw ERROR_PLATFORM_NOT_SUPPORT
  }
}

/**
 * find a executable chrome for all support system
 * @returns executable chrome full path
 * @throws
 * if no executable chrome find, ERROR_NO_INSTALLATIONS_FOUND will be throw
 * if platform is not one if ['win32','darwin','linux','android'], ERROR_PLATFORM_NOT_SUPPORT will be throw
 */
export = function findChrome() {
  const installations = findChromes()
  if (installations.length) {
    return installations[0]
  } else {
    throw ERROR_NO_INSTALLATIONS_FOUND
  }
}
