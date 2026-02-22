'use client'

import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { motion } from 'framer-motion'
import { InfoTooltip } from '@/components/ui/InfoTooltip'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix for default marker icon
const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

interface PlanningMapProps {
  location: {
    lat: number
    lon: number
    district: string
    ward: string
  }
  postcode: string
}

export function PlanningMap({ location, postcode }: PlanningMapProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.6 }}
      className="swiss-card"
    >
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-black uppercase tracking-tight">
            Location
          </h3>
          <p className="text-xs opacity-50 mt-1">
            Source: postcodes.io (geocoding) · OpenStreetMap (tiles)
          </p>
        </div>
        <InfoTooltip text="Interactive map showing the postcode location and surrounding area." />
      </div>

      <div className="border-4 border-swiss-black h-[400px] overflow-hidden isolate">
        <MapContainer
          center={[location.lat, location.lon]}
          zoom={14}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={[location.lat, location.lon]} icon={icon}>
            <Popup>
              <div className="font-sans">
                <p className="font-bold text-sm mb-1">{postcode}</p>
                <p className="text-xs">
                  {location.district}
                  <br />
                  {location.ward}
                </p>
              </div>
            </Popup>
          </Marker>
        </MapContainer>
      </div>

      <div className="mt-4 pt-4 border-t-2 border-swiss-black grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-xs uppercase tracking-wider opacity-60 block mb-1">
            District
          </span>
          <span className="font-bold">{location.district}</span>
        </div>
        <div>
          <span className="text-xs uppercase tracking-wider opacity-60 block mb-1">
            Ward
          </span>
          <span className="font-bold">{location.ward}</span>
        </div>
      </div>
    </motion.div>
  )
}
