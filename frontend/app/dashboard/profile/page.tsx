'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import {
  ArrowLeft, User, Lock, Trash2, Moon, Sun, Check, AlertTriangle,
  Eye, EyeOff, Mail, Calendar, Loader2, Settings, ShieldCheck, KeyRound,
} from 'lucide-react'

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-3 mb-4 sm:mb-6">
      <div className="w-1.5 h-6 bg-swiss-accent flex-shrink-0" />
      <div className="min-w-0">
        <h2 className="text-sm font-black uppercase tracking-widest">{title}</h2>
        {subtitle && <p className="text-xs opacity-40 mt-0.5 hidden sm:block">{subtitle}</p>}
      </div>
      <div className="flex-1 h-px bg-black/10 dark:bg-white/10" />
    </div>
  )
}

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [darkMode, setDarkMode] = useState(false)

  // Display name
  const [displayName, setDisplayName] = useState('')
  const [nameLoading, setNameLoading] = useState(false)
  const [nameSuccess, setNameSuccess] = useState(false)

  // Password
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPwd, setShowNewPwd] = useState(false)
  const [showConfirmPwd, setShowConfirmPwd] = useState(false)
  const [pwdLoading, setPwdLoading] = useState(false)
  const [pwdSuccess, setPwdSuccess] = useState(false)
  const [pwdError, setPwdError] = useState<string | null>(null)

  // Delete account
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('planpilot_dark')
    if (stored === 'true') {
      setDarkMode(true)
      document.documentElement.classList.add('dark')
    }
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push('/login'); return }
      setUser(session.user)
      setDisplayName(session.user.user_metadata?.display_name || '')
      setLoading(false)
    })
  }, [router])

  const toggleDarkMode = () => {
    setDarkMode(prev => {
      const next = !prev
      document.documentElement.classList.toggle('dark', next)
      localStorage.setItem('planpilot_dark', String(next))
      return next
    })
  }

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault()
    setNameLoading(true)
    setError(null)
    try {
      const { error } = await supabase.auth.updateUser({
        data: { display_name: displayName.trim() },
      })
      if (error) throw error
      setNameSuccess(true)
      setTimeout(() => setNameSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setNameLoading(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwdError(null)
    if (newPassword.length < 6) {
      setPwdError('Password must be at least 6 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      setPwdError('Passwords do not match')
      return
    }
    setPwdLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      setPwdSuccess(true)
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setPwdSuccess(false), 3000)
    } catch (err: any) {
      setPwdError(err.message)
    } finally {
      setPwdLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') return
    setDeleteLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      const res = await fetch('/api/delete-account', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error || 'Failed to delete account')
      }
      await supabase.auth.signOut()
      router.push('/')
    } catch (err: any) {
      setError(err.message || 'Failed to delete account')
      setDeleteLoading(false)
      setShowDeleteModal(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-[#0a0a0a]">
        <Loader2 className="w-8 h-8 animate-spin opacity-40" />
      </div>
    )
  }

  const initials = displayName
    ? displayName.trim().split(/\s+/).map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : (user?.email?.[0] || '?').toUpperCase()

  const createdAt = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—'

  // Derive connected sign-in methods from Supabase identities
  const identities: any[] = user?.identities || []
  const hasPassword = identities.some(i => i.provider === 'email')
  const connectedOAuth = identities.filter(i => i.provider !== 'email').map(i => i.provider as string)

  // Provider display config
  const PROVIDER_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
    google: {
      label: 'Google',
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden>
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
      ),
      color: 'text-blue-600 dark:text-blue-400',
    },
    github: {
      label: 'GitHub',
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden>
          <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
        </svg>
      ),
      color: 'text-black dark:text-white',
    },
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#0a0a0a] dark:text-white">

      {/* ── Top bar ── */}
      <header className="bg-white dark:bg-[#111] border-b-4 border-black dark:border-white/10 px-3 sm:px-8 py-3 sm:py-4 flex items-center gap-3 sticky top-0 z-20">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-xs uppercase font-bold tracking-wider opacity-60 hover:opacity-100 transition-opacity flex-shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden xs:inline">Dashboard</span>
        </Link>
        <div className="w-px h-5 bg-black/15 dark:bg-white/15" />
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 opacity-40" />
          <h1 className="text-xs sm:text-sm font-black uppercase tracking-widest">Account Settings</h1>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={toggleDarkMode}
            className="w-9 h-9 border-2 border-black dark:border-white/20 flex items-center justify-center hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
            title={darkMode ? 'Light mode' : 'Dark mode'}
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-3 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">

        {/* Error banner */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="border-4 border-swiss-accent bg-swiss-accent/10 px-4 py-3 flex items-center gap-3"
            >
              <AlertTriangle className="w-4 h-4 text-swiss-accent flex-shrink-0" />
              <p className="text-sm font-bold flex-1">{error}</p>
              <button onClick={() => setError(null)} className="opacity-60 hover:opacity-100 text-lg leading-none">✕</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Profile ── */}
        <section>
          <SectionHeader title="Profile" subtitle="Your public display name on PlanPilot" />
          <div className="bg-white dark:bg-[#111] border-4 border-black dark:border-white/15 p-4 sm:p-8">
            {/* Avatar + info */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-black dark:bg-white flex items-center justify-center flex-shrink-0">
                <span className="text-lg sm:text-xl font-black text-white dark:text-black">{initials}</span>
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-xl font-black truncate">{displayName || user?.email?.split('@')[0] || 'User'}</p>
                <p className="text-xs opacity-40 mt-0.5 truncate">{user?.email}</p>
              </div>
            </div>

            <form onSubmit={handleUpdateName} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold opacity-50 mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full border-4 border-black dark:border-white/20 dark:bg-[#1a1a1a] px-4 py-3 text-base font-bold focus:outline-none focus:border-swiss-accent transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={nameLoading}
                className="flex items-center gap-2 border-4 border-black dark:border-white/20 px-5 py-2.5 text-xs uppercase font-bold tracking-wider hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors disabled:opacity-50"
              >
                {nameLoading ? <Loader2 className="w-4 h-4 animate-spin" />
                  : nameSuccess ? <Check className="w-4 h-4 text-green-600" />
                  : <User className="w-4 h-4" />}
                {nameLoading ? 'Saving…' : nameSuccess ? 'Saved!' : 'Update Name'}
              </button>
            </form>
          </div>
        </section>

        {/* ── Account ── */}
        <section>
          <SectionHeader title="Account" subtitle="Email address and password management" />
          <div className="bg-white dark:bg-[#111] border-4 border-black dark:border-white/15 p-4 sm:p-8 space-y-6">

            {/* Email (read-only) */}
            <div>
              <label className="block text-[10px] uppercase tracking-widest font-bold opacity-50 mb-2">
                Email Address
              </label>
              <div className="flex items-center gap-3 border-4 border-black/15 dark:border-white/10 px-4 py-3 bg-black/5 dark:bg-white/5">
                <Mail className="w-4 h-4 opacity-40 flex-shrink-0" />
                <span className="text-sm font-bold opacity-60 truncate flex-1">{user?.email}</span>
                <span className="text-[10px] uppercase font-bold tracking-wider opacity-30 flex-shrink-0">Read-only</span>
              </div>
            </div>

            {/* Member since */}
            <div>
              <label className="block text-[10px] uppercase tracking-widest font-bold opacity-50 mb-2">
                Member Since
              </label>
              <div className="flex items-center gap-3 border-4 border-black/15 dark:border-white/10 px-4 py-3 bg-black/5 dark:bg-white/5">
                <Calendar className="w-4 h-4 opacity-40 flex-shrink-0" />
                <span className="text-sm font-bold opacity-60">{createdAt}</span>
              </div>
            </div>

            {/* Change / Set password */}
            <div className="border-t-2 border-black/10 dark:border-white/10 pt-5">
              <div className="flex items-center gap-2 mb-4">
                <Lock className="w-4 h-4 opacity-40" />
                <h3 className="text-xs font-black uppercase tracking-widest">
                  {hasPassword ? 'Change Password' : 'Set a Password'}
                </h3>
                {!hasPassword && (
                  <span className="ml-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400">
                    Not set
                  </span>
                )}
              </div>
              <form onSubmit={handleChangePassword} className="space-y-3">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold opacity-50 mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPwd ? 'text' : 'password'}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="Min. 6 characters"
                      minLength={6}
                      className="w-full border-4 border-black dark:border-white/20 dark:bg-[#1a1a1a] px-4 py-3 pr-12 text-base font-bold focus:outline-none focus:border-swiss-accent transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPwd(!showNewPwd)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-80 transition-opacity"
                    >
                      {showNewPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold opacity-50 mb-1.5">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPwd ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      className="w-full border-4 border-black dark:border-white/20 dark:bg-[#1a1a1a] px-4 py-3 pr-12 text-base font-bold focus:outline-none focus:border-swiss-accent transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-80 transition-opacity"
                    >
                      {showConfirmPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {pwdError && (
                  <motion.p
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="text-xs font-bold text-red-600"
                  >
                    {pwdError}
                  </motion.p>
                )}

                <button
                  type="submit"
                  disabled={pwdLoading || !newPassword || !confirmPassword}
                  className="flex items-center gap-2 border-4 border-black dark:border-white/20 px-5 py-2.5 text-xs uppercase font-bold tracking-wider hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors disabled:opacity-50"
                >
                  {pwdLoading ? <Loader2 className="w-4 h-4 animate-spin" />
                    : pwdSuccess ? <Check className="w-4 h-4 text-green-600" />
                    : <Lock className="w-4 h-4" />}
                  {pwdLoading ? 'Saving…' : pwdSuccess ? 'Password Saved!' : hasPassword ? 'Update Password' : 'Set Password'}
                </button>
              </form>
            </div>
          </div>
        </section>

        {/* ── Sign-in Methods ── */}
        <section>
          <SectionHeader title="Sign-in Methods" subtitle="How you access your PlanPilot account" />
          <div className="bg-white dark:bg-[#111] border-4 border-black dark:border-white/15 divide-y-2 divide-black/8 dark:divide-white/8">

            {/* Email / Password row */}
            <div className="flex items-center gap-4 px-4 sm:px-6 py-4">
              <div className="w-10 h-10 border-2 border-black/15 dark:border-white/10 flex items-center justify-center flex-shrink-0">
                <KeyRound className="w-4 h-4 opacity-50" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black">Email & Password</p>
                <p className="text-xs opacity-40 mt-0.5 truncate">{user?.email}</p>
              </div>
              {hasPassword ? (
                <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 bg-green-100 dark:bg-green-500/15 text-green-700 dark:text-green-400 flex-shrink-0">
                  <ShieldCheck className="w-3 h-3" />
                  Password set
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 flex-shrink-0">
                  No password
                </span>
              )}
            </div>

            {/* OAuth providers */}
            {Object.entries(PROVIDER_CONFIG).map(([key, cfg]) => {
              const isConnected = connectedOAuth.includes(key)
              return (
                <div key={key} className="flex items-center gap-4 px-4 sm:px-6 py-4">
                  <div className="w-10 h-10 border-2 border-black/15 dark:border-white/10 flex items-center justify-center flex-shrink-0">
                    <span className={isConnected ? cfg.color : 'opacity-25'}>{cfg.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black">{cfg.label}</p>
                    <p className="text-xs opacity-40 mt-0.5">
                      {isConnected ? `Sign in with ${cfg.label}` : `Not connected`}
                    </p>
                  </div>
                  {isConnected ? (
                    <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 bg-green-100 dark:bg-green-500/15 text-green-700 dark:text-green-400 flex-shrink-0">
                      <ShieldCheck className="w-3 h-3" />
                      Connected
                    </span>
                  ) : (
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 bg-black/5 dark:bg-white/5 text-black/30 dark:text-white/30 flex-shrink-0">
                      Not linked
                    </span>
                  )}
                </div>
              )
            })}

            {/* Note for OAuth-only users */}
            {!hasPassword && connectedOAuth.length > 0 && (
              <div className="px-4 sm:px-6 py-3 bg-amber-50 dark:bg-amber-500/10">
                <p className="text-xs text-amber-700 dark:text-amber-400 font-bold">
                  You sign in via {connectedOAuth.map(p => PROVIDER_CONFIG[p]?.label || p).join(' & ')}. Set a password above to also enable email login.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* ── Preferences ── */}
        <section>
          <SectionHeader title="Preferences" subtitle="Appearance and display settings" />
          <div className="bg-white dark:bg-[#111] border-4 border-black dark:border-white/15 p-4 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-black uppercase tracking-wider">Dark Mode</p>
                <p className="text-xs opacity-40 mt-0.5">Switch between light and dark interface</p>
              </div>
              {/* Toggle switch */}
              <button
                onClick={toggleDarkMode}
                aria-label="Toggle dark mode"
                className={`relative flex-shrink-0 w-14 h-7 border-2 transition-colors duration-200 ${
                  darkMode
                    ? 'bg-black border-black dark:bg-white dark:border-white'
                    : 'bg-white border-black'
                }`}
              >
                <span
                  className={`absolute top-0.5 w-5 h-5 transition-all duration-200 ${
                    darkMode
                      ? 'left-[30px] bg-white dark:bg-black'
                      : 'left-0.5 bg-black'
                  }`}
                />
              </button>
            </div>
          </div>
        </section>

        {/* ── Danger Zone ── */}
        <section>
          <SectionHeader title="Danger Zone" subtitle="Irreversible — proceed with caution" />
          <div className="bg-white dark:bg-[#111] border-4 border-red-500 p-4 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
              <div className="min-w-0">
                <p className="text-sm font-black uppercase tracking-wider text-red-600">Delete Account</p>
                <p className="text-xs opacity-60 mt-1 max-w-xs">
                  Permanently delete your account and all data. Cannot be undone.
                </p>
              </div>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="flex-shrink-0 flex items-center gap-2 border-4 border-red-500 text-red-600 px-4 py-2.5 text-xs uppercase font-bold tracking-wider hover:bg-red-500 hover:text-white transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete Account
              </button>
            </div>
          </div>
        </section>

        {/* Sign out link */}
        <div className="pb-8 flex items-center gap-6">
          <button
            onClick={async () => { await supabase.auth.signOut(); router.push('/') }}
            className="text-xs uppercase tracking-widest font-bold opacity-40 hover:opacity-100 transition-opacity"
          >
            Sign Out
          </button>
          <Link
            href="/dashboard"
            className="text-xs uppercase tracking-widest font-bold opacity-40 hover:opacity-100 transition-opacity"
          >
            Back to Dashboard
          </Link>
        </div>
      </main>

      {/* ── Delete Confirmation Modal ── */}
      <AnimatePresence>
        {showDeleteModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => { setShowDeleteModal(false); setDeleteConfirm('') }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 max-w-md mx-auto"
            >
              <div className="bg-white dark:bg-[#111] dark:text-white border-4 border-red-500 p-5 sm:p-8">
                <div className="flex items-center gap-3 mb-4">
                  <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0" />
                  <h3 className="text-lg font-black uppercase tracking-tight">Delete Account?</h3>
                </div>
                <p className="text-sm opacity-60 mb-1">
                  This permanently deletes your account and all associated data.
                </p>
                <p className="text-sm font-bold mb-5">
                  Type <span className="text-red-600 font-black">DELETE</span> to confirm.
                </p>
                <input
                  type="text"
                  value={deleteConfirm}
                  onChange={e => setDeleteConfirm(e.target.value.toUpperCase())}
                  placeholder="TYPE DELETE"
                  className="w-full border-4 border-black dark:border-white/20 dark:bg-[#1a1a1a] px-4 py-3 text-base font-black uppercase tracking-widest focus:outline-none focus:border-red-600 transition-colors mb-4"
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => { setShowDeleteModal(false); setDeleteConfirm('') }}
                    className="flex-1 border-4 border-black dark:border-white/20 py-2.5 text-xs uppercase font-bold tracking-wider hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleteConfirm !== 'DELETE' || deleteLoading}
                    className="flex-1 flex items-center justify-center gap-2 border-4 border-red-600 bg-red-600 text-white py-2.5 text-xs uppercase font-bold tracking-wider hover:bg-red-700 hover:border-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {deleteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    {deleteLoading ? 'Deleting…' : 'Delete Forever'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
