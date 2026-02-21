'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Mail, Lock, Chrome } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        })
        if (error) throw error
        setError('Check your email for confirmation link')
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        router.push('/dashboard')
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError(null)
    setGoogleLoading(true)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      })
      if (error) throw error
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed')
      setGoogleLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-swiss-muted swiss-grid-pattern">
      {/* Back to Home */}
      <Link
        href="/"
        className="absolute top-8 left-8 flex items-center gap-2 text-sm uppercase font-bold tracking-wider hover:text-swiss-accent transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Home
      </Link>

      {/* Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md mx-4"
      >
        <div className="border-4 border-swiss-black bg-swiss-white p-12 relative">
          {/* Decorative Elements */}
          <div className="absolute -top-4 -left-4 w-16 h-16 bg-swiss-accent" />
          <div className="absolute -bottom-4 -right-4 w-24 h-24 border-4 border-swiss-black bg-swiss-white" />

          <div className="relative z-10">
            {/* Header */}
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-2">
              {isSignUp ? 'SIGN UP' : 'SIGN IN'}
            </h1>
            <p className="text-sm uppercase tracking-wider mb-8 opacity-60">
              PlanPilot AI Platform
            </p>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="border-4 border-swiss-accent bg-swiss-accent bg-opacity-10 p-4 mb-6"
              >
                <p className="text-sm font-medium">{error}</p>
              </motion.div>
            )}

            {/* Google Sign In */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading || loading}
              className="w-full border-4 border-swiss-black bg-swiss-white hover:bg-swiss-black hover:text-swiss-white transition-all duration-150 px-8 py-4 text-sm uppercase font-bold tracking-widest disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              <Chrome className="w-5 h-5" />
              {googleLoading ? 'Connecting...' : 'Continue with Google'}
            </button>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t-2 border-swiss-black"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-swiss-white px-4 text-xs uppercase tracking-widest font-bold opacity-60">
                  Or continue with email
                </span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleAuth} className="space-y-6">
              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs uppercase tracking-widest font-bold mb-3"
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 opacity-40" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full border-4 border-swiss-black px-12 py-4 text-lg focus:outline-none focus:border-swiss-accent transition-colors"
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-xs uppercase tracking-widest font-bold mb-3"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 opacity-40" />
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full border-4 border-swiss-black px-12 py-4 text-lg focus:outline-none focus:border-swiss-accent transition-colors"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || googleLoading}
                className="w-full swiss-btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : isSignUp ? 'Create Account' : 'Sign In'}
              </button>
            </form>

            {/* Toggle Sign Up/Sign In */}
            <div className="mt-8 pt-8 border-t-2 border-swiss-black">
              <p className="text-sm text-center">
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button
                  onClick={() => {
                    setIsSignUp(!isSignUp)
                    setError(null)
                  }}
                  className="font-bold uppercase tracking-wider hover:text-swiss-accent transition-colors"
                >
                  {isSignUp ? 'Sign In' : 'Sign Up'}
                </button>
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Background Geometric Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <motion.div
          className="absolute top-20 right-20 w-32 h-32 border-4 border-swiss-black opacity-20"
          animate={{ rotate: [0, 90, 180, 270, 360] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute bottom-20 left-20 w-48 h-48 bg-swiss-accent opacity-10"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
    </main>
  )
}
