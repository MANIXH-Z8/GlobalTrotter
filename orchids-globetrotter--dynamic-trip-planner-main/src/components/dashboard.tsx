/**
 * Dashboard Component
 * 
 * Main landing page after login, showing:
 * - User greeting and stats
 * - Recent trips (last 4)
 * - "Plan New Trip" CTA
 * - Popular/recommended cities with images
 * 
 * Data Flow:
 * - Loads trips from Supabase (with offline fallback)
 * - Loads recommended cities (Supabase → local data fallback)
 * - All city cards display images (with fallback gradients)
 * 
 * Offline Support:
 * - Falls back to localCityAPI if Supabase fails
 * - Static city images ensure UI never breaks
 */

"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useAuth } from "@/lib/auth-context"
import { supabase, Trip, City } from "@/lib/supabase"
import { localCityAPI, STATIC_CITIES } from "@/lib/local-data"
import { Button } from "@/components/ui/button"
import { CityCard } from "@/components/city-card"
import { 
  Plus, 
  MapPin, 
  Calendar, 
  IndianRupee, 
  ChevronRight,
  Sparkles,
  Globe,
  Plane
} from "lucide-react"
import { format } from "date-fns"

type DashboardProps = {
  onCreateTrip: () => void
  onViewTrip: (trip: Trip) => void
  onViewAllTrips: () => void
  onExplore: () => void
}

export function Dashboard({ onCreateTrip, onViewTrip, onViewAllTrips, onExplore }: DashboardProps) {
  const { user } = useAuth()
  const [trips, setTrips] = useState<Trip[]>([])
  const [recommendedCities, setRecommendedCities] = useState<City[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ totalTrips: 0, totalCities: 0, totalBudget: 0 })

  useEffect(() => {
    if (user) {
      loadDashboardData()
    }
  }, [user])

  const loadDashboardData = async () => {
    setLoading(true)
    
    const { data: tripsData } = await supabase
      .from("trips")
      .select("*")
      .eq("user_id", user?.id)
      .order("created_at", { ascending: false })
      .limit(4)

    if (tripsData) {
      setTrips(tripsData)
      const totalBudget = tripsData.reduce((sum, t) => sum + Number(t.total_budget || 0), 0)
      setStats({
        totalTrips: tripsData.length,
        totalCities: 0,
        totalBudget
      })
    }

    // Load cities - try Supabase first, fallback to local data
    try {
      const { data: citiesData } = await supabase
        .from("cities")
        .select("*")
        .order("popularity", { ascending: false })
        .limit(6)

      if (citiesData && citiesData.length > 0) {
        // Ensure all cities have images
        const citiesWithImages = citiesData.map(city => {
          if (!city.image_url) {
            const staticCity = STATIC_CITIES.find(sc => 
              sc.name.toLowerCase() === city.name.toLowerCase()
            )
            return { ...city, image_url: staticCity?.image_url || city.image_url }
          }
          return city
        })
        setRecommendedCities(citiesWithImages)
      } else {
        // Fallback to local static data
        setRecommendedCities(localCityAPI.getAll().slice(0, 6))
      }
    } catch (error) {
      // Offline - use local data
      setRecommendedCities(localCityAPI.getAll().slice(0, 6))
    }

    setLoading(false)
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good morning"
    if (hour < 18) return "Good afternoon"
    return "Good evening"
  }

  return (
    <div className="min-h-screen pt-8 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-12"
            >
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">
                {getGreeting()}, <span className="gradient-text">{user?.full_name?.split(" ")[0] || "Traveler"}</span>
              </h1>
              <p className="text-muted-foreground text-base">
                Where will your next adventure take you?
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
              {[
                { label: "Total Trips", value: stats.totalTrips, icon: Globe, color: "from-primary to-primary/50" },
                { label: "Cities Visited", value: stats.totalCities, icon: MapPin, color: "from-accent to-accent/50" },
                { label: "Total Budget", value: `₹${stats.totalBudget.toLocaleString("en-IN")}`, icon: IndianRupee, color: "from-chart-3 to-chart-3/50" }
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ y: -8, scale: 1.02, rotateX: 2, rotateY: 2 }}
                  className="glass-card rounded-2xl p-6 relative group overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-6 shadow-lg shadow-primary/20`}>
                    <stat.icon className="w-7 h-7 text-white" />
                  </div>
                  <p className="text-2xl font-bold mb-1">{stat.value}</p>
                  <p className="text-muted-foreground font-medium text-sm">{stat.label}</p>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="glass-card rounded-3xl p-10 mb-16 relative overflow-hidden group"
            >
              <motion.div 
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: [0, 90, 0]
                }}
                transition={{ duration: 20, repeat: Infinity }}
                className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" 
              />
              <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
                <div className="max-w-xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
                    <Sparkles size={14} />
                    <span>AI-Powered Planning</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold mb-4">Ready for a new adventure?</h2>
                  <p className="text-muted-foreground text-base leading-relaxed">
                    Plan your perfect multi-city trip with custom itineraries, budget tracking, and smart recommendations.
                  </p>
                </div>
                <Button
                  onClick={onCreateTrip}
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground gap-3 px-8 py-6 text-base rounded-2xl shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95"
                >
                  <Plus className="w-5 h-5" />
                  Plan New Trip
                </Button>
              </div>
            </motion.div>

          {trips.length > 0 && (
            <section className="mb-16">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="flex items-center justify-between mb-8"
              >
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Calendar className="text-primary" />
                  Recent Trips
                </h2>
                <Button variant="ghost" onClick={onViewAllTrips} className="gap-2 group text-muted-foreground hover:text-primary">
                  View All
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </motion.div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {trips.map((trip, i) => (
                  <motion.div
                    key={trip.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    whileHover={{ y: -10, scale: 1.02 }}
                    onClick={() => onViewTrip(trip)}
                    className="glass-card rounded-2xl overflow-hidden cursor-pointer group shadow-lg hover:shadow-2xl transition-all"
                  >
                    <div className="aspect-[4/3] relative overflow-hidden">
                      {trip.cover_image ? (
                        <motion.img 
                          whileHover={{ scale: 1.1 }}
                          transition={{ duration: 0.6 }}
                          src={trip.cover_image} 
                          alt={trip.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/30 via-accent/20 to-primary/30 flex items-center justify-center">
                          <Plane className="w-14 h-14 text-primary/40 group-hover:rotate-12 transition-transform duration-500" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      <div className="absolute bottom-4 left-4 right-4">
                        <h3 className="font-bold text-white text-lg truncate group-hover:text-primary transition-colors">{trip.name}</h3>
                      </div>
                    </div>
                    <div className="p-5">
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        {trip.start_date && (
                          <div className="flex items-center gap-2 font-medium">
                            <Calendar className="w-4 h-4 text-primary" />
                            {format(new Date(trip.start_date), "MMM d, yyyy")}
                          </div>
                        )}
                        {trip.total_budget > 0 && (
                          <div className="flex items-center gap-1 font-bold text-foreground">
                            <IndianRupee className="w-4 h-4 text-accent" />
                            {trip.total_budget.toLocaleString("en-IN")}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          <section>
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex items-center justify-between mb-8"
            >
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Sparkles className="text-accent" />
                  Recommended
                </h2>
                <p className="text-muted-foreground">Places you might love based on your interests</p>
              </div>
              <Button variant="ghost" onClick={onExplore} className="gap-2 group text-muted-foreground hover:text-accent">
                Explore All
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </motion.div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
              {recommendedCities.map((city, i) => (
                <CityCard
                  key={city.id}
                  city={city}
                  onClick={onExplore}
                  variant="large"
                />
              ))}
            </div>
          </section>

      </div>
    </div>
  )
}
