'use client'

import { useState, useRef, useEffect } from 'react'
import { Info } from 'lucide-react'

interface InfoTooltipProps {
  text: string
}

export function InfoTooltip({ text }: InfoTooltipProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [above, setAbove] = useState(true)
  const btnRef = useRef<HTMLButtonElement>(null)
  const tipRef = useRef<HTMLDivElement>(null)

  // Decide whether tooltip should go above or below based on available space
  useEffect(() => {
    if (isOpen && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      // If less than 120px above button, flip to below
      setAbove(rect.top > 120)
    }
  }, [isOpen])

  return (
    <span className="relative inline-flex align-middle" style={{ overflow: 'visible' }}>
      <button
        ref={btnRef}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onClick={(e) => { e.stopPropagation(); setIsOpen(o => !o) }}
        className="inline-flex items-center justify-center w-5 h-5 border-2 border-swiss-black dark:border-white/30 hover:bg-swiss-accent hover:border-swiss-accent hover:text-swiss-white transition-all duration-150"
        type="button"
      >
        <Info className="w-3 h-3" />
      </button>

      {isOpen && (
        <div
          ref={tipRef}
          style={{
            position: 'absolute',
            zIndex: 9999,
            ...(above
              ? { bottom: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)' }
              : { top: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)' }
            ),
          }}
          className="w-56 sm:w-64 border-2 border-swiss-black dark:border-white/20 bg-white dark:bg-[#1a1a1a] p-3 shadow-xl"
        >
          {/* Arrow */}
          <div
            className="absolute w-3 h-3 bg-white dark:bg-[#1a1a1a] border-swiss-black dark:border-white/20"
            style={{
              left: '50%',
              transform: 'translateX(-50%) rotate(45deg)',
              ...(above
                ? { bottom: -7, borderRight: '2px solid', borderBottom: '2px solid', borderColor: 'inherit' }
                : { top: -7, borderLeft: '2px solid', borderTop: '2px solid', borderColor: 'inherit' }
              ),
            }}
          />
          <p className="text-xs leading-relaxed relative z-10">{text}</p>
        </div>
      )}
    </span>
  )
}
