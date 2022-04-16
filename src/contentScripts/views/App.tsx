import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { onMessage, sendMessage } from 'webext-bridge'
import cx from 'clsx'
import type { PackageJson } from 'type-fest'
import { GitUrl } from 'git-url-parse'
import { pickBy, find } from 'lodash-es'

import '../../styles/main.css'
import { REQUEST_NPM_DETAIL, TOGGLE_MODAL } from '~/logic/constants'
import { resolveRepo } from '~/logic/resolve'
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
 * @todo group pkgs to dep and devdeps
 * @todo support private repo(need github token)
 */
export const App = () => {
  const modal = useRef<HTMLDivElement>(null)
  // current package.json filepath
  const [currentPackageJson, setCurrentPackageJson] = useState('package.json')
  const [defaultBranch, setDefaultBranch] = useState('master')
  const [packageJsons, setPackageJsons] = useState<RepoFilesResponse>()
  const [repo, setRepo] = useState<GitUrl>()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [deps, setDeps] = useState<NonNullable<PackageJson['dependencies']>>({})
  const [readme, setReadme] = useState<Record<string, string>>({})
  const [selected, setSelected] = useState('')
  const selectedReadme = useMemo(() => {
    return readme[selected]
  }, [selected, readme])
  const handleFetchPkgDetail = async ({ name }: FetchPkgDetailOptions) => {
    setSelected(name)
  }
  const handleFetchPkgJson = useCallback((options: GetPkgJsonOptions) => {
    getPkgJson(options).then((res) => {
      const deps = pickBy(
        Object.assign({}, res.dependencies || {}, res.devDependencies || {}),
        (_value, key) => {
          // @types/
          return !key.startsWith('@types/')
        },
      )
      setDeps(deps)
      const defaultPkg = Object.keys(deps)[0]
      setSelected(defaultPkg)
    })
  }, [])
  useEffect(() => {
    setLoading(true)
    sendMessage(REQUEST_NPM_DETAIL, { name: selected })
  }, [selected])
  useEffect(() => {
    const detail = resolveRepo(window.location.href)
    setRepo(detail)
    fetchRepoBranches({ fullName: detail.full_name }).then((res) => {
      const defaultBranch = find(res, (b) => b.protected)
      setDefaultBranch(defaultBranch?.name || 'master')
      fetchRepoPkgFiles({ fullName: detail.full_name, branch: defaultBranch?.name }).then((res) => {
        setPackageJsons(res)
      })
      handleFetchPkgJson({ fullName: detail.full_name, branch: defaultBranch?.name })
    })

    onMessage(TOGGLE_MODAL, () => {
      setOpen((prev) => !prev)
    })
    onMessage<PkgManifest, string>(REQUEST_NPM_DETAIL, ({ data }) => {
      setLoading(false)
      setReadme((prev) => ({ ...prev, [data.name]: data.readme }))
    })
  }, [handleFetchPkgJson])
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
              {packageJsons?.map((p) => {
                return (
                  <li
                    onClick={() => {
                      handleFetchPkgJson({
                        fullName: repo!.full_name,
                        branch: defaultBranch,
                        pkgPath: p.path,
                      })
                      setCurrentPackageJson(p.path)
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
        <div className="flex h-full overflow-hidden">
          <ul className="menu menu-compact bg-base-100 w-56 p-2 rounded-box h-full overflow-y-auto">
            {Object.keys(deps).map((name) => {
              return (
                <li onClick={() => handleFetchPkgDetail({ name })} key={name}>
                  <a className={cx({ active: selected === name })}>{name}</a>
                </li>
              )
            })}
          </ul>
          <div className="flex justify-center items-center bg-base-100 h-full w-full overflow-y-auto py-2 px-4">
            {loading ? <i className="gg-spinner" /> : renderReadme()}
          </div>
        </div>
      </div>
    </div>
  )
}
