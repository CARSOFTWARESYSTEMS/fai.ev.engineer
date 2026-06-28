import { useState } from 'react'

const LS_KEY = 'bt_theme'

export function useBatteryTrustTheme() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    try { return localStorage.getItem(LS_KEY) !== 'light' } catch { return true }
  })

  const toggle = () => {
    setIsDark(prev => {
      const next = !prev
      try { localStorage.setItem(LS_KEY, next ? 'dark' : 'light') } catch { /* ignore */ }
      return next
    })
  }

  return { isDark, toggle }
}
