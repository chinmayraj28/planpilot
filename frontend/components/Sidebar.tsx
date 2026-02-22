'use client'

import { motion, AnimatePresence } from 'framer-motion'
import {
  LogOut, LayoutDashboard, Building2,
  TrendingUp, Leaf, Users, Clock, ChevronRight,
} from 'lucide-react'
import type { ProjectParams, ManualOverrides } from '@/lib/types'

export type Tab = 'overview' | 'planning' | 'market' | 'sustainability' | 'community'

export interface HistoryEntry {
  postcode: string
  timestamp: number
  viability_score: number
  approval_probability: number
}

interface SidebarProps {
  userEmail: string
  onSignOut: () => void
  onAnalyze: (postcode: string, params?: ProjectParams, overrides?: ManualOverrides) => void
  loading: boolean
  activeTab: Tab
  setActiveTab: (tab: Tab) => void
  hasData: boolean
  searchHistory: HistoryEntry[]
  currentPostcode?: string
}

export const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'overview',       label: 'Overview',        icon: LayoutDashboard },
  { id: 'planning',       label: 'Planning',         icon: Building2 },
  { id: 'market',         label: 'Market',           icon: TrendingUp },
  { id: 'sustainability', label: 'Sustainability',   icon: Leaf },
  { id: 'community',      label: 'Community',        icon: Users },
]

export function Sidebar({
  userEmail, onSignOut, onAnalyze, loading,
  activeTab, setActiveTab, hasData, searchHistory, currentPostcode,
}: SidebarProps) {
  return (
    <aside className="w-72 flex-shrink-0 bg-slate-900 text-white flex flex-col h-screen sticky top-0 z-30 border-r-4 border-black overflow-hidden">

      {/* ── Brand ── */}
      <div className="px-6 pt-6 pb-5 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2.5 h-2.5 bg-swiss-accent" />
          <span className="text-xl font-black tracking-tighter">PLANPILOT</span>
        </div>
        <p className="text-xs text-white/30 uppercase tracking-widest pl-4">AI Planning Intelligence</p>
      </div>

      {/* ── Current Postcode ── */}
      {currentPostcode && !loading && (
        <div className="px-5 py-3 border-b border-white/10 flex-shrink-0">
          <p className="text-xs text-white/30 truncate">
            Showing: <span className="text-white/60 font-bold">{currentPostcode}</span>
          </p>
        </div>
      )}

      {/* ── Tab Navigation ── */}
      <nav className="px-3 py-4 border-b border-white/10 flex-shrink-0">
        <p className="text-[10px] text-white/25 uppercase tracking-widest px-3 mb-2 font-bold">Sections</p>
        {TABS.map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          const isDisabled = !hasData

          return (
            <button
              key={tab.id}
              onClick={() => !isDisabled && setActiveTab(tab.id)}
              disabled={isDisabled}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-left transition-all mb-0.5 ${
                isActive
                  ? 'bg-white/15 text-white border-l-[3px] border-swiss-accent pl-[9px]'
                  : isDisabled
                  ? 'text-white/20 cursor-not-allowed border-l-[3px] border-transparent'
                  : 'text-white/55 hover:bg-white/8 hover:text-white border-l-[3px] border-transparent'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{tab.label}</span>
              {isActive && <ChevronRight className="w-3 h-3 opacity-50" />}
            </button>
          )
        })}
      </nav>

      {/* ── Search History ── */}
      <div className="flex-1 overflow-y-auto">
        {searchHistory.length > 0 ? (
          <div className="px-3 py-4">
            <p className="text-[10px] text-white/25 uppercase tracking-widest px-3 mb-2 font-bold flex items-center gap-2">
              <Clock className="w-3 h-3" /> Recent
            </p>
            <div className="space-y-0.5">
              {searchHistory.map((entry, i) => (
                <motion.button
                  key={`${entry.postcode}-${entry.timestamp}`}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => { onAnalyze(entry.postcode); setActiveTab('overview') }}
                  disabled={loading}
                  className={`w-full flex items-center justify-between px-3 py-2.5 hover:bg-white/8 transition-colors group disabled:opacity-40 ${
                    entry.postcode === currentPostcode ? 'bg-white/10' : ''
                  }`}
                >
                  <div className="text-left min-w-0">
                    <p className="text-sm font-black truncate">{entry.postcode}</p>
                    <p className="text-[10px] text-white/30">
                      {new Date(entry.timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className={`text-xs font-black ${
                      entry.viability_score >= 70 ? 'text-green-400'
                      : entry.viability_score >= 40 ? 'text-amber-400'
                      : 'text-red-400'
                    }`}>
                      {entry.viability_score}<span className="text-white/20 text-[10px]">/100</span>
                    </p>
                    <p className="text-[10px] text-white/30">
                      {(entry.approval_probability * 100).toFixed(0)}% approval
                    </p>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        ) : (
          <div className="px-6 py-8 text-center">
            <Clock className="w-6 h-6 text-white/15 mx-auto mb-2" />
            <p className="text-xs text-white/20 uppercase tracking-wider">No recent searches</p>
          </div>
        )}
      </div>

      {/* ── User Footer ── */}
      <div className="px-5 py-4 border-t border-white/10 flex-shrink-0">
        <p className="text-[11px] text-white/30 truncate mb-3">{userEmail}</p>
        <button
          onClick={onSignOut}
          className="flex items-center gap-2 text-xs text-white/40 hover:text-white/80 transition-colors uppercase tracking-wider font-bold"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
