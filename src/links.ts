export const SOURCE_URL = 'https://github.com/CrispStrobe/bingo'
export const LICENSE_URL = `${SOURCE_URL}/blob/main/LICENSE`
export const NOTICES_URL = `${SOURCE_URL}/blob/main/THIRD-PARTY-NOTICES.md`
export const AUTHOR = 'Christian Ströbele'

export const THIRD_PARTY = [
  { name: 'React', license: 'MIT', url: 'https://react.dev' },
  { name: 'Tauri', license: 'MIT / Apache-2.0', url: 'https://tauri.app' },
  { name: 'node-qrcode', license: 'MIT', url: 'https://github.com/soldair/node-qrcode' },
  { name: 'jsQR', license: 'Apache-2.0', url: 'https://github.com/cozmo/jsQR' },
  {
    name: 'Fredoka',
    license: 'SIL OFL 1.1',
    url: 'https://github.com/hafontia/Fredoka-One',
    copyright: 'Copyright 2016 The Fredoka Project Authors',
  },
  {
    name: 'Outfit',
    license: 'SIL OFL 1.1',
    url: 'https://github.com/Outfitio/Outfit-Fonts',
    copyright: 'Copyright 2021 The Outfit Project Authors',
  },
]

/** A webview inside Tauri ignores target=_blank, so route through the opener plugin. */
export async function openExternal(url: string) {
  if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
    try {
      const { openUrl } = await import('@tauri-apps/plugin-opener')
      await openUrl(url)
      return
    } catch {
      /* fall through to the browser behaviour */
    }
  }
  window.open(url, '_blank', 'noopener,noreferrer')
}
