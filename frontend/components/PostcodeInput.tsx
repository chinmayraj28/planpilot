'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search } from 'lucide-react'

interface PostcodeInputProps {
  onAnalyze: (postcode: string) => void
  loading: boolean
}

export function PostcodeInput({ onAnalyze, loading }: PostcodeInputProps) {
  const [postcode, setPostcode] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (postcode.trim()) {
      onAnalyze(postcode.trim().toUpperCase())
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="border-4 border-swiss-black bg-swiss-white p-8 md:p-12 swiss-grid-pattern"
    >
      <div className="max-w-4xl mx-auto">
        <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-6">
          ANALYZE
          <br />
          POSTCODE
        </h2>
        <p className="text-lg mb-8 opacity-80">
          Enter any UK postcode to receive instant planning intelligence
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 opacity-40" />
            <input
              type="text"
              value={postcode}
              onChange={(e) => setPostcode(e.target.value.toUpperCase())}
              placeholder="SW1A 1AA"
              className="w-full border-4 border-swiss-black px-16 py-6 text-2xl font-bold uppercase tracking-wider focus:outline-none focus:border-swiss-accent transition-colors"
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !postcode.trim()}
            className="swiss-btn-primary md:w-auto w-full disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {loading ? 'Analyzing...' : 'Analyze'}
          </button>
        </form>
      </div>
    </motion.div>
  )
}
