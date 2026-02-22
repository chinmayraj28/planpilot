'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Info } from 'lucide-react'

interface InfoTooltipProps {
  text: string
}

export function InfoTooltip({ text }: InfoTooltipProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative inline-block">
      <button
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center justify-center w-5 h-5 border-2 border-swiss-black dark:border-white/30 hover:bg-swiss-accent hover:border-swiss-accent hover:text-swiss-white transition-all duration-150"
      >
        <Info className="w-3 h-3" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 border-4 border-swiss-black dark:border-white/20 bg-swiss-white dark:bg-[#1a1a1a] p-4 shadow-lg"
          >
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-swiss-white dark:bg-[#1a1a1a] border-r-4 border-b-4 border-swiss-black dark:border-white/20 transform rotate-45" />
            <p className="text-xs leading-relaxed relative z-10">{text}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
