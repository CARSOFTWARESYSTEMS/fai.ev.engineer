import { Sun, Moon } from 'lucide-react'

interface Props {
  isDark:   boolean
  onToggle: () => void
}

export function BatteryTrustThemeToggle({ isDark, onToggle }: Props) {
  return (
    <button
      onClick={onToggle}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
        isDark
          ? 'border-slate-700 bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
          : 'border-border bg-background text-text-secondary hover:bg-primary-light hover:text-primary'
      }`}
    >
      {isDark
        ? <Sun  className="w-3.5 h-3.5" />
        : <Moon className="w-3.5 h-3.5" />
      }
      <span className="hidden sm:inline">{isDark ? 'Light' : 'Dark'}</span>
    </button>
  )
}
