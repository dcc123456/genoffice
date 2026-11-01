import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

import { bundledSkillPath, pdfiumWasmPath, repoRoot, xlsxSidecarPath } from '../src/resources'

/**
 * The checkout-path resolvers. They used to identify the monorepo root by a
 * hard-coded package name, which no root package.json has ever carried
 * ("genoffice", now "office-cc") — so every checkout caller silently got null and
 * jsdom-dependent Word/Markdown generation failed with "jsdom not found".
 * The root is found structurally now; these assertions fail if that regresses.
 */
describe('repoRoot', () => {
  it('finds the monorepo root from inside the cli package', () => {
    const root = repoRoot()
    expect(root).not.toBeNull()
    expect(existsSync(join(root!, 'packages', 'cli', 'package.json'))).toBe(true)
    expect(existsSync(join(root!, 'apps', 'shell', 'package.json'))).toBe(true)
  })

  it('resolves a workspace-root package.json, whatever it is named', () => {
    const root = repoRoot()
    expect(root).not.toBeNull()
    const manifest: unknown = JSON.parse(
      readFileSync(join(root!, 'package.json'), 'utf-8'),
    )
    expect(manifest).toMatchObject({ private: true, workspaces: ['apps/*', 'packages/*'] })
  })
})

describe('checkout-path resolvers built on repoRoot', () => {
  it('resolves the shipped skill beside the renamed skills directory', () => {
    const path = bundledSkillPath()
    expect(path).not.toBeNull()
    expect(existsSync(path!)).toBe(true)
  })

  it('resolves the wasm payload through the root install', () => {
    expect(existsSync(pdfiumWasmPath())).toBe(true)
  })

  it('returns a sidecar path that exists, or null when it is not built yet', () => {
    // never a path: a stale target/release from another platform must not win
    const path = xlsxSidecarPath()
    if (path !== null) expect(existsSync(path)).toBe(true)
  })
})
