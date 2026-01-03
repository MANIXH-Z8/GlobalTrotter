"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { supabase, City, Trip } from "@/lib/supabase"
import { localCityAPI, STATIC_CITIES } from "@/lib/local-data"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CityCard } from "@/components/city-card"
import { 
  ArrowLeft,
  Search,
  Plus,
  Globe
} from "lucide-react"
import { toast } from "sonner"

type CitySearchProps = {
  trip: Trip | null
  onAddToTrip: (city: City) => void
  onBack: () => void
}

export function CitySearch({ trip, onAddToTrip, onBack }: CitySearchProps) {
  const [cities, setCities] = useState<City[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [regionFilter, setRegionFilter] = useState<string | null>(null)

  const regions = ["Europe", "Asia", "North America", "South America", "Africa", "Oceania", "Middle East"]

  useEffect(() => {
    loadCities()
  }, [])

  const loadCities = async () => {
    setLoading(true)
    
    // Try to load from Supabase first, fallback to local data
    try {
      const { data } = await supabase
        .from("cities")
        .select("*")
        .order("popularity", { ascending: false })

      if (data && data.length > 0) {
        // Ensure all cities have images - use static data as fallback
        const citiesWithImages = data.map(city => {
          if (!city.image_url) {
            const staticCity = STATIC_CITIES.find(sc => 
              sc.name.toLowerCase() === city.name.toLowerCase() ||
              sc.id === city.id
            )
            return { ...city, image_url: staticCity?.image_url || city.image_url }
          }
          return city
        })
        setCities(citiesWithImages)
      } else {
        // Fallback to local static data
        setCities(localCityAPI.getAll())
      }
    } catch (error) {
      // Offline or error - use local data
      setCities(localCityAPI.getAll())
    }

    setLoading(false)
  }

  const handleAddCity = (city: City) => {
    onAddToTrip(city)
    toast.success(`${city.name} added to your trip!`)
  }

  const filteredCities = cities.filter(city => {
    const matchesSearch = 
      city.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      city.country.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRegion = !regionFilter || city.region === regionFilter
    return matchesSearch && matchesRegion
  })


  return (
    <div className="min-h-screen pt-8 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Button variant="ghost" onClick={onBack} className="mb-4 gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold mb-2">Explore Destinations</h1>
          <p className="text-muted-foreground">
            {trip ? "Add cities to your trip" : "Discover amazing places to visit"}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-4 mb-8"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search cities or countries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-secondary/50"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            <Button
              variant={!regionFilter ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setRegionFilter(null)}
              className="whitespace-nowrap"
            >
              <Globe className="w-4 h-4 mr-1" />
              All
            </Button>
            {regions.map(region => (
              <Button
                key={region}
                variant={regionFilter === region ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setRegionFilter(region)}
                className="whitespace-nowrap"
              >
                {region}
              </Button>
            ))}
          </div>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="glass-card rounded-xl overflow-hidden animate-pulse">
                <div className="aspect-[4/3] bg-secondary/50" />
                <div className="p-4 space-y-3">
                  <div className="h-5 bg-secondary/50 rounded w-3/4" />
                  <div className="h-4 bg-secondary/50 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredCities.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <MapPin className="w-20 h-20 mx-auto mb-6 text-muted-foreground/30" />
            <h2 className="text-xl font-semibold mb-2">No cities found</h2>
            <p className="text-muted-foreground">
              Try a different search term or filter
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCities.map((city, i) => (
              <div key={city.id} className="relative">
                <CityCard
                  city={city}
                  variant="default"
                  onClick={trip ? () => handleAddCity(city) : undefined}
                />
                {trip && (
                  <div className="absolute bottom-4 right-4 z-20">
                    <Button
                      size="sm"
                      onClick={() => handleAddCity(city)}
                      className="gap-2 shadow-lg"
                    >
                      <Plus className="w-4 h-4" />
                      Add
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
