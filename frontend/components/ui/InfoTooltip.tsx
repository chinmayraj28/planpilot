'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Info } from 'lucide-react'

interface InfoTooltipProps {
  text: string
}

export function InfoTooltip({ text }: InfoTooltipProps) {
  const [isOpen, setIsOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return
    const rect = buttonRef.current.getBoundingClientRect()
    setPos({
      top: rect.top + window.scrollY,
      left: rect.left + rect.width / 2 + window.scrollX,
    })
  }, [])

  const handleOpen = () => {
    updatePosition()
    setIsOpen(true)
  }

  return (
    <div className="relative inline-block">
      <button
        ref={buttonRef}
        onMouseEnter={handleOpen}
        onMouseLeave={() => setIsOpen(false)}
        onClick={() => isOpen ? setIsOpen(false) : handleOpen()}
        className="inline-flex items-center justify-center w-5 h-5 border-2 border-swiss-black dark:border-white/30 hover:bg-swiss-accent hover:border-swiss-accent hover:text-swiss-white transition-all duration-150"
      >
        <Info className="w-3 h-3" />
      </button>

      {mounted && createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              transition={{ duration: 0.15 }}
              style={{ top: pos.top, left: pos.left }}
              className="fixed z-[9999] -translate-x-1/2 -translate-y-full -mt-2 w-64 border-4 border-swiss-black dark:border-white/20 bg-swiss-white dark:bg-[#1a1a1a] p-4 shadow-lg pointer-events-none"
            >
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-swiss-white dark:bg-[#1a1a1a] border-r-4 border-b-4 border-swiss-black dark:border-white/20 transform rotate-45" />
              <p className="text-xs leading-relaxed relative z-10">{text}</p>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  )
}
