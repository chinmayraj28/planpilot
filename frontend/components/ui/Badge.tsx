import { motion } from 'framer-motion'

interface BadgeProps {
  label: string
  variant: 'success' | 'warning' | 'danger' | 'info'
  className?: string
}

const variantStyles = {
  success: 'bg-green-100 border-green-600 text-green-900',
  warning: 'bg-amber-100 border-amber-600 text-amber-900',
  danger: 'bg-red-100 border-red-600 text-red-900',
  info: 'bg-blue-100 border-blue-600 text-blue-900',
}

export function Badge({ label, variant, className = '' }: BadgeProps) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={`inline-block px-4 py-2 border-2 text-xs uppercase font-bold tracking-wider ${variantStyles[variant]} ${className}`}
    >
      {label}
    </motion.span>
  )
}
