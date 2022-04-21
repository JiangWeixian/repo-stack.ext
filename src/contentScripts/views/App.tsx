import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { onMessage, sendMessage } from 'webext-bridge'
import cx from 'clsx'
import type { PackageJson } from 'type-fest'
import { GitUrl } from 'git-url-parse'
import { pickBy, sortBy } from 'lodash-es'

import '../../styles/main.css'
import { REQUEST_NPM_DETAIL, TOGGLE_MODAL } from '~/logic/constants'
import { resolveRepo, findUpPackage } from '~/logic/resolve'
import {
  getPkgJson,
  FetchPkgDetailOptions,
  PkgManifest,
  fetchRepoPkgFiles,
  RepoFilesResponse,
  fetchRepoBranches,
  GetPkgJsonOptions,
} from '~/logic/api'
import { md } from '~/logic/md'
const useClickOutside = (ref: any, callback: any) => {
  const handleClick = (e: any) => {
    if (ref.current && !ref.current.contains(e.target)) {
      callback()
    }
  }
  React.useEffect(() => {
    document.addEventListener('click', handleClick)
    return () => {
      document.removeEventListener('click', handleClick)
    }
  })
}

/**
 * @todo support private repo(need github token)
 */
export const App = () => {
  const modal = useRef<HTMLDivElement>(null)
  // current package.json filepath
  const [currentPackageJson, setCurrentPackageJson] = useState('')
  const [tabId, setTabId] = useState<number>()
  const [defaultBranch, setDefaultBranch] = useState('master')
  const [packageJsons, setPackageJsons] = useState<RepoFilesResponse>()
  const [repo, setRepo] = useState<GitUrl>()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [deps, setDeps] = useState<{
    dependencies: NonNullable<PackageJson['dependencies']>
    devDependencies: NonNullable<PackageJson['dependencies']>
  }>({ dependencies: {}, devDependencies: {} })
  const [readme, setReadme] = useState<Record<string, string>>({})
  const [selected, setSelected] = useState('')
  const selectedReadme = useMemo(() => {
    return readme[selected]
  }, [selected, readme])
  const handleFetchPkgDetail = useCallback(
    async ({ name }: FetchPkgDetailOptions) => {
      setSelected(name)
      setLoading(true)
      sendMessage(REQUEST_NPM_DETAIL, { name, tabId })
    },
    [tabId],
  )
  const handleFetchPkgJson = useCallback(async (options: GetPkgJsonOptions) => {
    setCurrentPackageJson(options.pkgPath || 'package.json')
    return getPkgJson(options).then((res) => {
      const dependencies = pickBy(Object.assign(res.dependencies || {}), (_value, key) => {
        // @types/
        return !key.startsWith('@types/')
      })
      const devDependencies = pickBy(Object.assign(res.devDependencies || {}), (_value, key) => {
        // @types/
        return !key.startsWith('@types/')
      })
      const deps = { dependencies, devDependencies }
      setDeps(deps)
      const defaultPkg = Object.keys(dependencies)[0] || Object.keys(devDependencies)[0]
      setSelected(defaultPkg)
      return defaultPkg
    })
  }, [])
  useLayoutEffect(() => {
    onMessage<{ tabId: number }, string>(TOGGLE_MODAL, ({ data }) => {
      setTabId(data.tabId)
      setOpen((prev) => !prev)
    })
    onMessage<PkgManifest, string>(REQUEST_NPM_DETAIL, ({ data }) => {
      setLoading(false)
      setReadme((prev) => ({ ...prev, [data.name]: data.readme }))
    })
  }, [])
  useEffect(() => {
    const detail = resolveRepo(window.location.href)
    setRepo(detail)
    if (open) {
      fetchRepoBranches({ fullName: detail.full_name }).then(async (branchRes) => {
        setDefaultBranch(branchRes.name)
        fetchRepoPkgFiles({ fullName: detail.full_name, branch: branchRes?.name }).then(
          async (fileRes) => {
            const nearestPackage = findUpPackage(detail.filepath, fileRes || [])
            setPackageJsons(fileRes)
            const defaultPkg = await handleFetchPkgJson({
              fullName: detail.full_name,
              branch: branchRes?.name,
              pkgPath: nearestPackage?.path,
            })
            if (defaultPkg) {
              await handleFetchPkgDetail({ name: defaultPkg })
            }
          },
        )
      })
    }
  }, [handleFetchPkgDetail, handleFetchPkgJson, open])
  useClickOutside(modal, function () {
    setOpen(false)
  })
  const isEmptyReadme = !selectedReadme
  const renderReadme = () => {
    if (isEmptyReadme) {
      return <p className="text-base font-bold">No README Found</p>
    }
    return (
      <article
        className="prose prose-sm h-full w-full max-w-full"
        dangerouslySetInnerHTML={{ __html: md.render(selectedReadme) }}
      />
    )
  }
  return (
    <div className={cx('modal', 'fixed', { 'modal-open': open })}>
      <div
        ref={modal}
        onClick={(e) => {
          e.stopPropagation()
          return false
        }}
        className="modal-box w-3/5 max-w-5xl overflow-hidden"
      >
        <div className="flex justify-between items-center">
          {/* FIXME: input s will auto focus github seach input */}
          {/* <input
            autoFocus={true}
            onBlur={({ target }) => target.focus()}
            type="text"
            onChange={(e) => {
              console.log(e.target.value)
            }}
            placeholder={repo?.full_name}
            className="input w-full max-w-xs"
          /> */}
          <h3 className="font-bold text-lg">{repo?.full_name}</h3>
          <div className="dropdown dropdown-end">
            <label tabIndex={0} className="btn btn-ghost rounded-btn lowercase">
              {currentPackageJson} <i className="ml-2 gg-chevron-down" />
            </label>
            <ul
              tabIndex={0}
              className="dropdown-content menu p-2 shadow bg-base-100 rounded-box max-h-52 overflow-auto"
            >
              {sortBy(packageJsons, (p) => p.path.length)?.map((p) => {
                return (
                  <li
                    onClick={() => {
                      handleFetchPkgJson({
                        fullName: repo!.full_name,
                        branch: defaultBranch,
                        pkgPath: p.path,
                      })
                    }}
                    key={p.path}
                  >
                    <a>{p.path}</a>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
        <div className="divider mb-0 -mx-6" />
        <div className="flex h-full overflow-y-hidden">
          <div className="flex flex-0 flex-col h-full w-64 overflow-y-auto">
            <ul className="menu bg-base-100 mx-2 rounded-box">
              <li className="menu-title">
                <span>dependencies</span>
              </li>
              {Object.keys(deps.dependencies).map((name) => {
                return (
                  <li
                    className={cx({ bordered: selected === name })}
                    onClick={() => handleFetchPkgDetail({ name })}
                    key={name}
                  >
                    <a>{name}</a>
                  </li>
                )
              })}
            </ul>
            <ul className="menu bg-base-100 mx-2 rounded-box">
              <li className="menu-title">
                <span>devDependencies</span>
              </li>
              {Object.keys(deps.devDependencies).map((name) => {
                return (
                  <li
                    className={cx({ bordered: selected === name })}
                    onClick={() => handleFetchPkgDetail({ name })}
                    key={name}
                  >
                    <a>{name}</a>
                  </li>
                )
              })}
            </ul>
          </div>
          <div className="flex flex-1 justify-center items-center bg-base-100 h-full overflow-y-auto py-2 px-4">
            {loading ? <i className="gg-spinner" /> : renderReadme()}
          </div>
        </div>
      </div>
    </div>
  )
}
