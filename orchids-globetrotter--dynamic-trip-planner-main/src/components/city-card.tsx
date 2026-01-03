/**
 * CityCard Component - Reusable Smart City Preview
 * 
 * Displays city information in a consistent, image-first format.
 * Used across dashboard, city search, and discovery screens.
 * 
 * Features:
 * - High-quality city image
 * - Cost index visualization (₹ / ₹₹ / ₹₹₹)
 * - Best season to visit
 * - "Why visit?" one-liner
 * - City name and country
 */

"use client"

import { motion } from "framer-motion"
import { City } from "@/lib/supabase"
import { MapPin, Calendar, IndianRupee } from "lucide-react"

type CityCardProps = {
  city: City & {
    best_season?: string
    why_visit?: string
  }
  onClick?: () => void
  variant?: "default" | "compact" | "large"
  className?: string
}

/**
 * Get cost index display (₹ / ₹₹ / ₹₹₹)
 * Based on cost_index: 0-40 = ₹, 41-70 = ₹₹, 71+ = ₹₹₹
 */
function getCostIndex(costIndex: number): { display: string; level: number } {
  if (costIndex <= 40) return { display: "₹", level: 1 }
  if (costIndex <= 70) return { display: "₹₹", level: 2 }
  return { display: "₹₹₹", level: 3 }
}

/**
 * Get best season from city data or infer from region
 */
function getBestSeason(city: City & { best_season?: string }): string {
  if (city.best_season) return city.best_season
  
  // Infer from region/country if not specified
  if (city.country === "India") {
    if (city.name === "Goa" || city.name === "Kerala") return "Nov - Feb"
    if (city.name === "Manali") return "Mar - Jun, Oct - Feb"
    return "Oct - Mar"
  }
  if (city.region === "Europe") return "Apr - Oct"
  if (city.region === "Asia") return "Oct - Mar"
  return "Year Round"
}

export function CityCard({ city, onClick, variant = "default", className = "" }: CityCardProps) {
  const costInfo = getCostIndex(city.cost_index || 50)
  const bestSeason = getBestSeason(city)
  const whyVisit = city.why_visit || city.description || "Discover amazing experiences"

  const isCompact = variant === "compact"
  const isLarge = variant === "large"
  const aspectRatio = isCompact ? "aspect-[4/3]" : isLarge ? "aspect-[3/4]" : "aspect-[4/3]"

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={onClick ? { y: -4, scale: 1.02 } : {}}
      onClick={onClick}
      className={`
        glass-card rounded-xl overflow-hidden group relative shadow-md hover:shadow-xl transition-all
        ${onClick ? "cursor-pointer" : ""}
        ${className}
      `}
    >
      <div className={`${aspectRatio} relative overflow-hidden`}>
        {city.image_url ? (
          <motion.img
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.6 }}
            src={city.image_url}
            alt={city.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.style.display = 'none'
              const parent = target.parentElement
              if (parent && !parent.querySelector('.fallback-gradient')) {
                const fallback = document.createElement('div')
                fallback.className = 'fallback-gradient absolute inset-0 bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center'
                fallback.innerHTML = '<svg class="w-12 h-12 text-primary/40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>'
                parent.appendChild(fallback)
              }
            }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center">
            <MapPin className="w-12 h-12 text-primary/40" />
          </div>
        )}
        
        {/* Gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
        
        {/* Top badges */}
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2 z-10">
          <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10">
            <IndianRupee className={`w-3.5 h-3.5 ${
              costInfo.level === 1 ? "text-green-400" :
              costInfo.level === 2 ? "text-yellow-400" : "text-orange-400"
            }`} />
            <span className="text-xs font-bold text-white">{costInfo.display}</span>
          </div>
          
          {city.popularity && (
            <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10">
              <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                {city.popularity}% Popular
              </span>
            </div>
          )}
        </div>

        {/* Bottom content */}
        <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
          <div className="mb-2">
            <h3 className="text-lg font-bold text-white mb-1 group-hover:text-primary transition-colors">
              {city.name}
            </h3>
            <div className="flex items-center gap-2 text-white/80 text-sm">
              <MapPin className="w-3.5 h-3.5" />
              <span>{city.country}</span>
              {city.region && <span className="opacity-60">• {city.region}</span>}
            </div>
          </div>

          {/* Why visit one-liner */}
          {!isCompact && (
            <p className="text-white/90 text-xs font-medium mb-3 line-clamp-2 leading-relaxed">
              {whyVisit}
            </p>
          )}

          {/* Best season badge */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-white/20">
              <Calendar className="w-3 h-3 text-white/90" />
              <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                Best: {bestSeason}
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

