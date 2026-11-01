/**
 * Build the xlsx sidecar when its binary is missing or older than its sources.
 *
 * The shell opens every workbook — including CSV/TSV, which the Sheets main
 * process first converts to xlsx — through this Rust binary. It is not shipped
 * in git, and `npm run dev` never compiled it, so a fresh tree reached the
 * open path with nothing to spawn: "XLSX sidecar failed to start (...): spawn
 * ENOENT" and an empty grid. Mirrors the stale-preload hook: stale sources or a
 * missing artifact trigger one release build; a fresh tree is a no-op.
 *
 * Without cargo the build is skipped with a warning instead of aborting: the
 * other apps still run, and only workbook opening is unavailable.
 */
import { existsSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

const ENGINE = join('apps', 'sheets', 'native', 'xlsx-engine')
const EXE = process.platform === 'win32' ? 'xlsx-sidecar.exe' : 'xlsx-sidecar'
const BINARY = join(ENGINE, 'target', 'release', EXE)

/** Newest mtime (ms) under dir, 0 when missing. */
function newestMtime(dir) {
  if (!existsSync(dir)) return 0
  let newest = 0
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name)
    // target/ holds build output only; walking it would compare the binary
    // against itself and force a rebuild on every dev start.
    if (entry.name === 'target') continue
    newest = Math.max(newest, entry.isDirectory() ? newestMtime(p) : statSync(p).mtimeMs)
  }
  return newest
}

if (existsSync(BINARY) && newestMtime(ENGINE) <= statSync(BINARY).mtimeMs) process.exit(0)

const cargo = spawnSync('cargo', ['--version'], { stdio: 'ignore', shell: process.platform === 'win32' })
if (cargo.error || cargo.status !== 0) {
  console.warn(
    '[predev] cargo not found: skipping the xlsx sidecar build.\n' +
      '         Opening any workbook (.xlsx, .csv, .tsv) will fail until it is built:\n' +
      '           npm run native:build -w @office-cc/sheets\n' +
      '         Install Rust from https://rustup.rs to fix this.',
  )
  process.exit(0)
}

console.log('Building the xlsx sidecar (first build takes a few minutes)...')
const build = spawnSync(
  'npm',
  ['run', 'native:build', '-w', '@office-cc/sheets'],
  { stdio: 'inherit', shell: process.platform === 'win32' },
)
if (build.error) {
  console.error(build.error)
  process.exit(1)
}
if (build.status !== 0) process.exit(build.status ?? 1)
