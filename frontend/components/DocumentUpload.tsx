'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, FileText, CheckCircle, AlertTriangle, X, Loader2 } from 'lucide-react'
import type { DocumentExtraction, ProjectParams, ManualOverrides } from '@/lib/types'
import { uploadDocument } from '@/lib/api'

interface DocumentUploadProps {
  token: string
  onExtracted: (params: Partial<ProjectParams>, overrides: Partial<ManualOverrides>, postcode?: string, summary?: string) => void
}

export function DocumentUpload({ token, onExtracted }: DocumentUploadProps) {
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<DocumentExtraction | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const processFile = async (file: File) => {
    setUploading(true)
    setError(null)
    setResult(null)

    try {
      const data = await uploadDocument(file, token)
      setResult(data)

      if (data.success && data.extracted) {
        const e = data.extracted
        const params: Partial<ProjectParams> = {}
        const overrides: Partial<ManualOverrides> = {}

        if (e.application_type) params.application_type = e.application_type
        if (e.property_type) params.property_type = e.property_type
        if (e.num_storeys) params.num_storeys = e.num_storeys
        if (e.estimated_floor_area_m2) params.estimated_floor_area_m2 = e.estimated_floor_area_m2

        if (e.flood_zone != null) overrides.flood_zone = e.flood_zone
        if (e.in_conservation_area != null) overrides.in_conservation_area = e.in_conservation_area
        if (e.in_greenbelt != null) overrides.in_greenbelt = e.in_greenbelt
        if (e.in_article4_zone != null) overrides.in_article4_zone = e.in_article4_zone
        if (e.epc_rating) overrides.avg_epc_rating = e.epc_rating

        onExtracted(params, overrides, e.postcode, e.summary)
      }
    } catch (err: any) {
      setError(err.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  const fieldCount = result?.extracted ? Object.keys(result.extracted).filter(k => k !== 'summary').length : 0

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative cursor-pointer border-2 border-dashed transition-colors p-6 text-center ${
          dragging
            ? 'border-swiss-accent bg-swiss-accent/5'
            : 'border-black/20 hover:border-black/40'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.webp,.gif"
          className="hidden"
          onChange={handleFileSelect}
        />

        {uploading ? (
          <div className="flex flex-col items-center gap-2 py-2">
            <Loader2 className="w-6 h-6 animate-spin text-swiss-accent" />
            <p className="text-xs font-bold uppercase tracking-wider opacity-60">Analyzing document with AI...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-2">
            <Upload className="w-6 h-6 opacity-30" />
            <p className="text-xs font-bold uppercase tracking-wider opacity-50">
              Drop a planning document here
            </p>
            <p className="text-[10px] opacity-30">PDF, PNG, JPEG — max 10MB</p>
          </div>
        )}
      </div>

      {/* Result */}
      <AnimatePresence>
        {result && result.success && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="border-2 border-green-500 bg-green-50 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                <p className="text-xs font-bold uppercase tracking-wider text-green-800">
                  Extracted {fieldCount} fields from {result.filename}
                </p>
                <button onClick={() => setResult(null)} className="ml-auto">
                  <X className="w-3.5 h-3.5 opacity-40 hover:opacity-100" />
                </button>
              </div>
              {result.extracted.summary && (
                <p className="text-xs text-green-700 opacity-80">{result.extracted.summary}</p>
              )}
              <div className="flex flex-wrap gap-1">
                {Object.entries(result.extracted)
                  .filter(([k]) => k !== 'summary')
                  .map(([key, val]) => (
                    <span key={key} className="inline-flex items-center gap-1 bg-green-600 text-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                      <FileText className="w-2.5 h-2.5" />
                      {key.replace(/_/g, ' ')}: {String(val)}
                    </span>
                  ))}
              </div>
            </div>
          </motion.div>
        )}

        {(error || (result && !result.success)) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="border-2 border-amber-500 bg-amber-50 p-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <p className="text-xs font-bold text-amber-800">{error || result?.error || 'Could not extract data'}</p>
              <button onClick={() => { setError(null); setResult(null) }} className="ml-auto">
                <X className="w-3.5 h-3.5 opacity-40 hover:opacity-100" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
