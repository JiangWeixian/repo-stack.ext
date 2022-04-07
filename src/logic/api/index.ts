// import { $fetch } from 'ohmyfetch'
import type { PackageJson } from 'type-fest'

import { GITHUB_RAW_PREFIX, NPM_REGISTRY_PREFIX } from '../constants'

type GetPkgJsonOptions = {
  fullName: string
}

/**
 * @description Fetch github repo detail.
 */
export const getPkgJson = async ({ fullName }: GetPkgJsonOptions): Promise<PackageJson> => {
  const pkg = await fetch(`${GITHUB_RAW_PREFIX}${fullName}/master/package.json`)
  return pkg.json()
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
