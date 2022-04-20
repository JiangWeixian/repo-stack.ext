import type { PackageJson } from 'type-fest'
import { find } from 'lodash-es'

import { GITHUB_RAW_PREFIX, GITHUB_REST_PREFIX, NPM_REGISTRY_PREFIX } from '../constants'

export type GetPkgJsonOptions = {
  fullName: string
  branch?: string
  pkgPath?: string
}

/**
 * @description Fetch github repo detail.
 */
export const getPkgJson = async ({
  fullName,
  branch = 'master',
  pkgPath = 'package.json',
}: GetPkgJsonOptions): Promise<PackageJson> => {
  const pkg = await fetch(`${GITHUB_RAW_PREFIX}${fullName}/${branch}/${pkgPath}`)
  return pkg.json()
}

type RawRepoFilesResponse = {
  tree: {
    path: string
  }[]
}

export type RepoFilesResponse = {
  path: string
}[]

const ignore = [/node_modules\//, /examples\//, /fixtures\//, /^test\/|\/test\//]

/**
 * @description list repo files list
 * @see {@link https://gist.github.com/MichaelCurrin/6777b91e6374cdb5662b64b8249070ea}
 */
export const fetchRepoPkgFiles = async ({
  fullName,
  branch = 'master',
}: GetPkgJsonOptions): Promise<RepoFilesResponse> => {
  // https://api.github.com/repos/vitest-dev/vitest/git/trees/main?recursive=1
  const result = await fetch(
    `${GITHUB_REST_PREFIX}repos/${fullName}/git/trees/${branch}?recursive=1`,
  )
  const packages: RawRepoFilesResponse = await result.json()
  return packages.tree.filter(
    (p) => p.path.includes('package.json') && ignore.every((i) => !p.path.match(i)),
  )
}

export type RawRepoBranchesResponse = {
  name: string
  protected: boolean
}[]

export type RepoBranchesResponse = {
  name: string
  protected?: boolean
}

/**
 * @description only get protected branch
 */
export const fetchRepoBranches = async ({
  fullName,
}: GetPkgJsonOptions): Promise<RepoBranchesResponse> => {
  const result = await fetch(`${GITHUB_REST_PREFIX}repos/${fullName}/branches`)
  const branches: RawRepoBranchesResponse = await result.json()
  /**
   * Perfer protected branch > master > main
   */
  const defaultBranch =
    find(branches, (b) => b.protected) ||
    find(branches, (b) => b.name === 'master' || b.name === 'main')
  return defaultBranch || { name: 'master' }
}

export type FetchPkgDetailOptions = {
  name: string
}

export type PkgManifest = {
  readme: string
  name: string
}

export const fetchPkgDetail = async ({ name }: FetchPkgDetailOptions): Promise<PkgManifest> => {
  const pkg = await fetch(`${NPM_REGISTRY_PREFIX}${name}`)
  return pkg.json()
}
