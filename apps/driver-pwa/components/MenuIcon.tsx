export type MenuIconName = 'dashboard' | 'profile' | 'orders' | 'history' | 'earnings' | 'documents' | 'settings' | 'logout' | 'back' | 'location'

export default function MenuIcon({ name, className = 'w-5 h-5' }: { name: MenuIconName; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <use href={`/icons/menu.svg#${name}`} />
    </svg>
  )
}
