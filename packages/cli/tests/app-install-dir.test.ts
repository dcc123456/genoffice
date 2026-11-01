import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { appBinaryForResources } from '../src/resources'

describe('appBinaryForResources', () => {
  it('finds the app in a custom Windows install directory', () => {
    expect(appBinaryForResources(join('D:\\Apps\\Office-cc', 'resources'), 'win32')).toBe(
      join('D:\\Apps\\Office-cc', 'Office-cc.exe'),
    )
  })

  it('resolves the same binary for the default Windows install directory', () => {
    const localAppData = 'C:\\Users\\test\\AppData\\Local'
    const resources = join(localAppData, 'Programs', 'Office-cc', 'resources')
    expect(appBinaryForResources(resources, 'win32')).toBe(
      join(localAppData, 'Programs', 'Office-cc', 'Office-cc.exe'),
    )
  })

  it('finds the app in a custom macOS bundle location', () => {
    expect(
      appBinaryForResources(join('/Volumes/Work/Office-cc.app/Contents/Resources'), 'darwin'),
    ).toBe(join('/Volumes/Work/Office-cc.app/Contents/MacOS/Office-cc'))
  })

  it('finds the app in a custom Linux prefix', () => {
    expect(appBinaryForResources(join('/opt/officecc-custom/resources'), 'linux')).toBe(
      join('/opt/officecc-custom/officecc'),
    )
  })
})
