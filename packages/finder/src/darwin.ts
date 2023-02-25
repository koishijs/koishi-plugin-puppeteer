import { execSync } from 'child_process'
import { join } from 'path'
import { canAccess, newLineRegex, sort } from './utils'

const suffixes = [
  '/Contents/MacOS/Google Chrome Canary',
  '/Contents/MacOS/Google Chrome Dev',
  '/Contents/MacOS/Google Chrome',
  '/Contents/MacOS/Chromium',
  '/Contents/MacOS/Microsoft Edge Canary',
  '/Contents/MacOS/Microsoft Edge Dev',
  '/Contents/MacOS/Microsoft Edge',
]

const LSREGISTER =
  '/System/Library/Frameworks/CoreServices.framework' +
  '/Versions/A/Frameworks/LaunchServices.framework' +
  '/Versions/A/Support/lsregister'

export default function darwin() {
  const installations = []

  execSync([
    `${LSREGISTER} -dump`,
    `grep -E -i -o '/.+(((google chrome)|(microsoft edge))( (dev|canary))?|chromium)\\.app(\\s|$)'`,
    `grep -E -v 'Caches|TimeMachine|Temporary|/Volumes|\\.Trash'`,
  ].join(' | '))
    .toString()
    .split(newLineRegex)
    .forEach((inst) => {
      suffixes.forEach(suffix => {
        const execPath = join(inst.trim(), suffix)
        if (canAccess(execPath)) {
          installations.push(execPath)
        }
      })
    })

  // Retains one per line to maintain readability.
  const priorities = [
    { regex: new RegExp(`^${process.env.HOME}/Applications/.*Microsoft Edge.app`), weight: 46 },
    { regex: new RegExp(`^${process.env.HOME}/Applications/.*Microsoft Edge Dev.app`), weight: 47 },
    { regex: new RegExp(`^${process.env.HOME}/Applications/.*Microsoft Edge Canary.app`), weight: 48 },
    { regex: new RegExp(`^${process.env.HOME}/Applications/.*Chromium.app`), weight: 49 },
    { regex: new RegExp(`^${process.env.HOME}/Applications/.*Chrome.app`), weight: 50 },
    { regex: new RegExp(`^${process.env.HOME}/Applications/.*Chrome Dev.app`), weight: 51 },
    { regex: new RegExp(`^${process.env.HOME}/Applications/.*Chrome Canary.app`), weight: 52 },
    { regex: /^\/Applications\/.*Microsoft Edge.app/, weight: 96 },
    { regex: /^\/Applications\/.*Microsoft Edge Dev.app/, weight: 97 },
    { regex: /^\/Applications\/.*Microsoft Edge Canary.app/, weight: 98 },
    { regex: /^\/Applications\/.*Chromium.app/, weight: 99 },
    { regex: /^\/Applications\/.*Chrome.app/, weight: 100 },
    { regex: /^\/Applications\/.*Chrome Dev.app/, weight: 101 },
    { regex: /^\/Applications\/.*Chrome Canary.app/, weight: 102 },
    { regex: /^\/Volumes\/.*Microsoft Edge.app/, weight: -6 },
    { regex: /^\/Volumes\/.*Microsoft Edge Dev.app/, weight: -5 },
    { regex: /^\/Volumes\/.*Microsoft Edge Canary.app/, weight: -4 },
    { regex: /^\/Volumes\/.*Chromium.app/, weight: -3 },
    { regex: /^\/Volumes\/.*Chrome.app/, weight: -2 },
    { regex: /^\/Volumes\/.*Chrome Dev.app/, weight: -1 },
    { regex: /^\/Volumes\/.*Chrome Canary.app/, weight: 0 },
  ]

  return sort(installations, priorities)
}
