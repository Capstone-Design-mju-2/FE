export type Screen = 'home' | 'chat' | 'my'

export function screenForLocation(hash: string, search: string): Screen {
  if (hash === '#home') return 'home'
  if (hash === '#my') return 'my'
  if (hash === '#chat' || new URLSearchParams(search).has('mock')) return 'chat'
  return 'home'
}
