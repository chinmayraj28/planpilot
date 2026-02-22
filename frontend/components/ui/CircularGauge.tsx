'use client'

import { motion } from 'framer-motion'

interface CircularGaugeProps {
  value: number
  max?: number
  label: string
  size?: number
}

export function CircularGauge({ value, max = 100, label, size = 200 }: CircularGaugeProps) {
  const percentage = (value / max) * 100
  const color =
    percentage >= 70
      ? '#16a34a'  // green-600
      : percentage >= 40
      ? '#f59e0b'  // amber-500
      : '#dc2626'  // red-600

  const radius = size / 2 - 16
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percentage / 100) * circumference

  return (
    <div className="flex flex-col items-center">
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="stroke-black dark:stroke-white/20"
          strokeWidth="8"
          fill="none"
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth="8"
          fill="none"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
          strokeLinecap="square"
        />
      </svg>

      <div className="text-center mt-6">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-5xl font-black mb-2"
          style={{ color }}
        >
          {percentage.toFixed(1)}%
        </motion.p>
        <p className="text-xs uppercase tracking-widest font-bold opacity-60">
          {label}
        </p>
      </div>
    </div>
  )
}
