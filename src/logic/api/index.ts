import { $fetch } from 'ohmyfetch'
import type { PackageJson } from 'type-fest'

import { GITHUB_RAW_PREFIX, NPM_REGISTRY_PREFIX } from '../constants'

type GetPkgJsonOptions = {
  fullName: string
}

/**
 * @description Fetch github repo detail.
 */
export const getPkgJson = async ({ fullName }: GetPkgJsonOptions) => {
  const pkg: PackageJson = await $fetch(`${GITHUB_RAW_PREFIX}${fullName}/master/package.json`, {
    parseResponse: JSON.parse,
  })
  return pkg
}

export type FetchPkgDetailOptions = {
  name: string
}

export type PkgManifest = {
  readme: string
  name: string
}

export const fetchPkgDetail = async ({ name }: FetchPkgDetailOptions) => {
  const pkg: PkgManifest = await $fetch(`${NPM_REGISTRY_PREFIX}${name}`)
  return pkg
}
