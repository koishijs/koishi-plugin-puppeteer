import fs from 'fs'

export const newLineRegex = /\r?\n/

interface Priority {
  regex: RegExp
  weight: number
}

export function sort(installations: string[], priorities: Priority[]) {
  const defaultPriority = 10
  // assign priorities
  return installations
    .map((inst) => {
      for (const pair of priorities) {
        if (pair.regex.test(inst)) {
          return { path: inst, weight: pair.weight }
        }
      }
      return { path: inst, weight: defaultPriority }
    })
    // sort based on priorities
    .sort((a, b) => b.weight - a.weight)
    // remove priority flag
    .map(pair => pair.path)
}

export function canAccess(file: string) {
  if (!file) {
    return false
  }

  try {
    fs.accessSync(file)
    return true
  } catch (e) {
    return false
  }
}

export function isExecutable(file: string) {
  if (!file) {
    return false
  }

  try {
    var stat = fs.statSync(file)
    return stat && typeof stat.isFile === 'function' && stat.isFile()
  } catch (e) {
    return false
  }
}
