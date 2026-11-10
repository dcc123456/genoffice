import { existsSync, statSync } from 'node:fs'

/** Every extension the suite opens; also the contract the packaged file
 *  associations must advertise (tests/file-associations.test.ts), so a file
 *  the app accepts is one the OS can send it. */
export const LAUNCHABLE_EXTS = [
  'docx',
  'odt',
  'ott',
  'xlsx',
  'xlsm',
  'xls',
  'csv',
  'tsv',
  'ods',
  'ots',
  'pptx',
  'odp',
  'otp',
  'pdf',
  'md',
  'markdown',
  'txt',
  'json',
  'html',
  'htm',
] as const

const SUPPORTED_LAUNCH_RE = new RegExp(`\\.(${LAUNCHABLE_EXTS.join('|')})$`, 'i')
const UNSUPPORTED_LAUNCH_RE = /\.(doc|rtf|ppt|pps|xlsb|pages|key|numbers)$/i

interface LaunchPayload {
  launchPaths?: unknown
  launchPath?: unknown
}

function payloadLaunchPaths(additionalData: unknown): string[] {
  if (!additionalData || typeof additionalData !== 'object') return []
  const data = additionalData as LaunchPayload
  const paths = Array.isArray(data.launchPaths)
    ? data.launchPaths.filter((path): path is string => typeof path === 'string' && path.length > 0)
    : []
  if (typeof data.launchPath === 'string' && data.launchPath.length > 0) paths.push(data.launchPath)
  return paths
}

export function isDirectoryPath(path: string): boolean {
  try {
    return statSync(path).isDirectory()
  } catch {
    return false
  }
}

/**
 * The paths the OS handed the app: documents the suite opens, plus folders the
 * user opened from Finder ("Open With" on a folder). A folder has no extension
 * to match, so it is recognised by being a directory.
 */
export function collectLaunchPaths(
  argv: readonly string[],
  additionalData?: unknown,
  exists: (path: string) => boolean = existsSync,
  isDirectory: (path: string) => boolean = isDirectoryPath,
): string[] {
  // a folder the user opened from the OS carries no extension, so it is
  // recognised by being a directory — the shell joins it to the home tree
  const supported = argv.filter(
    (path) => exists(path) && (SUPPORTED_LAUNCH_RE.test(path) || isDirectory(path)),
  )
  const payload = payloadLaunchPaths(additionalData)
  // a folder is not a document: it must not silence the "we cannot open this"
  // fallback for an unsupported file that came in the same batch
  const hasDocument = supported.some((path) => SUPPORTED_LAUNCH_RE.test(path))
  const fallback =
    !hasDocument && payload.length === 0
      ? argv.find((path) => UNSUPPORTED_LAUNCH_RE.test(path) && exists(path))
      : undefined
  return [...new Set([...supported, ...payload, ...(fallback ? [fallback] : [])])]
}
