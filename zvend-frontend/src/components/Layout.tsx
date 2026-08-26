import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../store/auth'
import { useNotifications } from '../hooks/data'
import { api } from '../api'
import type { Role } from '../types'
import { ROLE_LABEL, formatDate } from '../lib/status'
import { Avatar } from './Avatar'
import { useTheme } from '../hooks/useTheme'
import { THEMES } from './theme-context'

const NAV: Record<Role, { to: string; label: string; icon: string }[]> = {
  Secretary: [
    { to: '/dashboard', label: 'Dashboard', icon: 'M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z' },
    { to: '/facilities', label: 'Facilities', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
  ],
  FieldTechnician: [{ to: '/field', label: 'My Scans', icon: 'M3 9V7.5A2.5 2.5 0 015.5 5H9m6 0h3.5A2.5 2.5 0 0121 7.5V9M3 15v1.5A2.5 2.5 0 005.5 19H9m6 0h3.5a2.5 2.5 0 002.5-2.5V15' }],
  GM: [
    { to: '/dashboard', label: 'Overview', icon: 'M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z' },
    { to: '/reviews', label: 'Review Queue', icon: 'M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z' },
  ],
  MD: [
    { to: '/dashboard', label: 'Overview', icon: 'M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z' },
    { to: '/approvals', label: 'Approvals', icon: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  ],
  IT: [
    { to: '/dashboard', label: 'Overview', icon: 'M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z' },
    { to: '/it', label: 'IT Queue', icon: 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z' },
  ],
}

function NavItem({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `rounded-xl px-4 py-2 text-sm font-semibold whitespace-nowrap transition ${
          isActive ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/25' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
        }`
      }
    >
      {label}
    </NavLink>
  )
}

export function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const client = useQueryClient()
  const { data: notifications } = useNotifications(user?.id)
  const [bellOpen, setBellOpen] = useState(false)
  const [themeOpen, setThemeOpen] = useState(false)
  const bellRef = useRef<HTMLDivElement>(null)
  const themeRef = useRef<HTMLDivElement>(null)
  const { theme, setTheme } = useTheme()

  const unread = (notifications ?? []).filter((n) => !n.read).length
  const nav = user ? NAV[user.role] : []

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false)
      if (themeRef.current && !themeRef.current.contains(e.target as Node)) setThemeOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  if (!user) return <Outlet />

  const openNotification = async (id: string, meterId?: string) => {
    await api.markNotificationRead(id)
    client.invalidateQueries({ queryKey: ['notifications'] })
    setBellOpen(false)
    if (meterId) navigate(`/meters/${meterId}`)
  }

  return (
    <div className="min-h-screen pb-20 sm:pb-0">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/favicon.svg" alt="" className="h-9 w-9 rounded-xl" />
            <span className="leading-tight">
              <span className="block text-[15px] font-extrabold tracking-tight text-slate-900">Zvend Meters</span>
              <span className="block text-[11px] font-medium text-slate-400">Installation System</span>
            </span>
          </Link>

          <div className="flex items-center gap-1.5">
            <div className="relative" ref={themeRef}>
              <button
                onClick={() => setThemeOpen((v) => !v)}
                className="relative rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Change theme"
                title="Change theme"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
                </svg>
              </button>

              {themeOpen && (
                <div className="animate-fade-in-up absolute right-0 mt-2 w-44 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                  <p className="border-b border-slate-100 px-4 py-2.5 text-xs font-bold tracking-wide text-slate-400 uppercase">Theme</p>
                  <div className="p-1.5">
                    {THEMES.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => {
                          setTheme(t.id)
                          setThemeOpen(false)
                        }}
                        className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                          theme === t.id ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <span className="h-4 w-4 rounded-full ring-2 ring-white shadow" style={{ backgroundColor: t.swatch }} />
                        {t.label}
                        {theme === t.id && (
                          <svg xmlns="http://www.w3.org/2000/svg" className="ml-auto h-4 w-4 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="relative" ref={bellRef}>
              <button
                onClick={() => setBellOpen((v) => !v)}
                className="relative rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Notifications"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                </svg>
                {unread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    {unread}
                  </span>
                )}
              </button>

              {bellOpen && (
                <div className="animate-fade-in-up absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                    <p className="text-sm font-bold text-slate-900">Notifications</p>
                    {unread > 0 && (
                      <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-bold text-brand-700">{unread} new</span>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {(notifications ?? []).length === 0 && (
                      <p className="px-4 py-8 text-center text-sm text-slate-500">No notifications yet</p>
                    )}
                    {(notifications ?? []).map((n) => (
                      <button
                        key={n.id}
                        onClick={() => openNotification(n.id, n.meterId)}
                        className={`flex w-full flex-col gap-0.5 border-b border-slate-50 px-4 py-3 text-left transition hover:bg-slate-50 ${n.read ? 'opacity-70' : ''}`}
                      >
                        <span className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                          {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-brand-600" />}
                          {n.title}
                        </span>
                        <span className="text-xs text-slate-500">{n.body}</span>
                        <span className="mt-0.5 text-[10px] text-slate-400">{formatDate(n.createdAt)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="ml-1 hidden items-center gap-2.5 border-l border-slate-200 pl-3 sm:flex">
              <Avatar name={user.fullName} role={user.role} />
              <div className="leading-tight">
                <p className="text-xs font-bold text-slate-900">{user.fullName}</p>
                <p className="text-[10px] font-medium text-slate-400">{ROLE_LABEL[user.role]}</p>
              </div>
            </div>

            <button
              onClick={() => {
                logout()
                navigate('/login')
              }}
              className="rounded-xl p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
              aria-label="Log out"
              title="Log out"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
              </svg>
            </button>
          </div>
        </div>

        {nav.length > 1 && (
          <nav className="mx-auto hidden max-w-6xl gap-1 px-4 pb-2.5 sm:flex">
            {nav.map((item) => (
              <NavItem key={item.to} to={item.to} label={item.label} />
            ))}
          </nav>
        )}
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>

      {nav.length > 1 && (
        <nav className="ios-scroll fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur-lg sm:hidden">
          <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-2 py-1.5">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-2 py-2 text-[10px] font-semibold transition ${
                    isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-500'
                  }`
                }
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                </svg>
                {item.label}
              </NavLink>
            ))}
          </div>
        </nav>
      )}
    </div>
  )
}