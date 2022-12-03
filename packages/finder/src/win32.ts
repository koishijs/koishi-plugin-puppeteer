import { join } from 'path'
import { canAccess } from './utils'

const prefixes = [
  process.env.LOCALAPPDATA,
  process.env.PROGRAMFILES,
  process.env['PROGRAMFILES(X86)'],
]

const suffixes = [
  '\\Chromium\\Application\\chrome.exe',
  '\\Google\\Chrome\\Application\\chrome.exe',
  '\\chrome-win32\\chrome.exe',
  '\\Microsoft\\Edge\\Application\\msedge.exe',
  '\\Google\\Chrome Beta\\Application\\chrome.exe',
  '\\Microsoft\\Edge Dev\\Application\\msedge.exe',
  '\\Google\\Chrome SxS\\Application\\chrome.exe',
  '\\Microsoft\\Edge Canary\\Application\\msedge.exe',
]

export default function win32() {
  const installations = []

  prefixes.forEach(prefix => suffixes.forEach(suffix => {
    if (prefix) {
      const chromePath = join(prefix, suffix)
      if (canAccess(chromePath)) {
        installations.push(chromePath)
      }
    }
  }))
  return installations
}
