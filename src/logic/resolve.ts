import GitUrlParse from 'git-url-parse'
import { findLast } from 'lodash-es'
import pathb from 'path-browserify'

export const resolveRepo = (url: string) => {
  const result = GitUrlParse(url)
  return result
}

/**
 * @description find up nearest package json filepath according to location.pathname
 */
export const findUpPackage = (path: string, packages: { path: string }[]) => {
  const dirname = pathb.dirname(path)
  if (!path) {
    return findLast(packages, (p) => p.path === 'package.json')
  }
  return (
    findLast(packages, (p) => dirname.includes(pathb.dirname(p.path))) ||
    findLast(packages, (p) => p.path === 'package.json')
  )
}
