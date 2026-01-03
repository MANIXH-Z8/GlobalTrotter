/**
 * Trip Builder Component
 * 
 * Handles both creating new trips and editing existing ones.
 * 
 * Features:
 * - Trip details form (name, dates, description, cover image, budget)
 * - Add multiple cities (stops) to itinerary
 * - Assign dates per city
 * - Add activities per stop
 * - Reorder cities using up/down buttons
 * - Search and filter cities
 * 
 * Data Model:
 * - Trip (parent entity)
 *   - TripStop (cities in the trip, ordered)
 *     - TripActivity (activities at each stop)
 * 
 * Reordering Logic:
 * - Uses order_index field to maintain sequence
 * - Up/down buttons swap adjacent stops
 * - Updates persisted immediately to database
 */

"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useAuth } from "@/lib/auth-context"
import { supabase, Trip, TripStop, TripActivity, City } from "@/lib/supabase"
import { localCityAPI, STATIC_CITIES } from "@/lib/local-data"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  Plus, 
  X, 
  MapPin, 
  Calendar,
  Trash2,
  Save,
  ArrowLeft,
  Search,
  Clock,
  IndianRupee,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ArrowUp,
  ArrowDown
} from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"

type TripBuilderProps = {
  trip: Trip | null
  onSave: (trip: Trip) => void
  onCancel: () => void
  onAddActivity?: (stopId: string) => void
  onSearchCity?: () => void
  onDiscover?: () => void
}

export function TripBuilder({ trip, onSave, onCancel, onAddActivity, onSearchCity, onDiscover }: TripBuilderProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [stops, setStops] = useState<TripStop[]>([])
  const [expandedStops, setExpandedStops] = useState<Set<string>>(new Set())
  const [formData, setFormData] = useState({
    name: trip?.name || "",
    description: trip?.description || "",
    start_date: trip?.start_date || "",
    end_date: trip?.end_date || "",
    cover_image: trip?.cover_image || "",
    total_budget: trip?.total_budget || 0
  })
  const [newStop, setNewStop] = useState({ city_name: "", country: "", start_date: "", end_date: "" })
  const [showAddStop, setShowAddStop] = useState(false)
  const [cities, setCities] = useState<City[]>([])
  const [citySearch, setCitySearch] = useState("")

  useEffect(() => {
    if (trip) {
      loadTripStops()
    }
    loadCities()
  }, [trip])

  const loadTripStops = async () => {
    if (!trip) return
    
    const { data: stopsData } = await supabase
      .from("trip_stops")
      .select("*")
      .eq("trip_id", trip.id)
      .order("order_index")

    if (stopsData) {
      for (const stop of stopsData) {
        const { data: activitiesData } = await supabase
          .from("trip_activities")
          .select("*")
          .eq("trip_stop_id", stop.id)
          .order("order_index")
        
        stop.activities = activitiesData || []
      }
      setStops(stopsData)
      if (stopsData.length > 0) {
        setExpandedStops(new Set([stopsData[0].id]))
      }
    }
  }

  const loadCities = async () => {
    // Try Supabase first, fallback to local data
    try {
      const { data } = await supabase
        .from("cities")
        .select("*")
        .order("popularity", { ascending: false })
      
      if (data && data.length > 0) {
        // Ensure all cities have images
        const citiesWithImages = data.map(city => {
          if (!city.image_url) {
            const staticCity = STATIC_CITIES.find(sc => 
              sc.name.toLowerCase() === city.name.toLowerCase()
            )
            return { ...city, image_url: staticCity?.image_url || city.image_url }
          }
          return city
        })
        setCities(citiesWithImages)
      } else {
        setCities(localCityAPI.getAll())
      }
    } catch (error) {
      // Offline - use local data
      setCities(localCityAPI.getAll())
    }
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("Please enter a trip name")
      return
    }

    setLoading(true)

    try {
      if (trip) {
        const { data, error } = await supabase
          .from("trips")
          .update({
            ...formData,
            updated_at: new Date().toISOString()
          })
          .eq("id", trip.id)
          .select()
          .single()

        if (error) throw error
        toast.success("Trip updated!")
        onSave(data)
      } else {
        const shareCode = Math.random().toString(36).substring(2, 10)
        const { data, error } = await supabase
          .from("trips")
          .insert({
            ...formData,
            user_id: user?.id,
            share_code: shareCode
          })
          .select()
          .single()

        if (error) throw error
        toast.success("Trip created!")
        onSave(data)
      }
    } catch (error) {
      toast.error("Failed to save trip")
    }

    setLoading(false)
  }

  const handleAddStop = async () => {
    if (!trip || !newStop.city_name.trim()) {
      toast.error("Please enter a city name")
      return
    }

    const { data, error } = await supabase
      .from("trip_stops")
      .insert({
        trip_id: trip.id,
        city_name: newStop.city_name,
        country: newStop.country,
        start_date: newStop.start_date || null,
        end_date: newStop.end_date || null,
        order_index: stops.length
      })
      .select()
      .single()

    if (error) {
      toast.error("Failed to add stop")
      return
    }

    setStops([...stops, { ...data, activities: [] }])
    setNewStop({ city_name: "", country: "", start_date: "", end_date: "" })
    setShowAddStop(false)
    setExpandedStops(new Set([...expandedStops, data.id]))
    toast.success("Stop added!")
  }

  const handleDeleteStop = async (stopId: string) => {
    const { error } = await supabase
      .from("trip_stops")
      .delete()
      .eq("id", stopId)

    if (error) {
      toast.error("Failed to delete stop")
      return
    }

    setStops(stops.filter(s => s.id !== stopId))
    toast.success("Stop deleted")
  }

  const handleAddActivity = async (stopId: string, activity: Partial<TripActivity>) => {
    const stop = stops.find(s => s.id === stopId)
    if (!stop) return

    const { data, error } = await supabase
      .from("trip_activities")
      .insert({
        trip_stop_id: stopId,
        name: activity.name || "New Activity",
        description: activity.description,
        estimated_cost: activity.estimated_cost || 0,
        duration_hours: activity.duration_hours || 1,
        order_index: stop.activities?.length || 0,
        category: activity.category
      })
      .select()
      .single()

    if (error) {
      toast.error("Failed to add activity")
      return
    }

    setStops(stops.map(s => {
      if (s.id === stopId) {
        return { ...s, activities: [...(s.activities || []), data] }
      }
      return s
    }))
    toast.success("Activity added!")
  }

  const handleDeleteActivity = async (stopId: string, activityId: string) => {
    const { error } = await supabase
      .from("trip_activities")
      .delete()
      .eq("id", activityId)

    if (error) {
      toast.error("Failed to delete activity")
      return
    }

    setStops(stops.map(s => {
      if (s.id === stopId) {
        return { ...s, activities: s.activities?.filter(a => a.id !== activityId) }
      }
      return s
    }))
    toast.success("Activity deleted")
  }

  // Reorder stops - move up or down in the itinerary
  const handleReorderStop = async (stopId: string, direction: 'up' | 'down') => {
    if (!trip) return

    const currentIndex = stops.findIndex(s => s.id === stopId)
    if (currentIndex === -1) return

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (newIndex < 0 || newIndex >= stops.length) return

    // Swap order indices
    const updatedStops = [...stops]
    const temp = updatedStops[currentIndex].order_index
    updatedStops[currentIndex].order_index = updatedStops[newIndex].order_index
    updatedStops[newIndex].order_index = temp

    // Update in database
    const updates = [
      supabase.from("trip_stops").update({ order_index: updatedStops[currentIndex].order_index }).eq("id", stopId),
      supabase.from("trip_stops").update({ order_index: updatedStops[newIndex].order_index }).eq("id", updatedStops[newIndex].id)
    ]

    const results = await Promise.all(updates)
    const hasError = results.some(r => r.error)

    if (hasError) {
      toast.error("Failed to reorder stops")
      return
    }

    // Update local state - swap array positions
    const reordered = [...stops]
    ;[reordered[currentIndex], reordered[newIndex]] = [reordered[newIndex], reordered[currentIndex]]
    setStops(reordered)
    toast.success("Itinerary reordered")
  }

  const toggleStopExpand = (stopId: string) => {
    const newExpanded = new Set(expandedStops)
    if (newExpanded.has(stopId)) {
      newExpanded.delete(stopId)
    } else {
      newExpanded.add(stopId)
    }
    setExpandedStops(newExpanded)
  }

  const filteredCities = cities.filter(c => 
    c.name.toLowerCase().includes(citySearch.toLowerCase()) ||
    c.country.toLowerCase().includes(citySearch.toLowerCase())
  )

  const isCreateMode = !trip

  return (
    <div className="min-h-screen pt-8 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Button variant="ghost" onClick={onCancel} className="mb-4 gap-2 text-xs font-bold uppercase tracking-widest">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {isCreateMode ? "Create New Trip" : "Edit Trip"}
            </h1>
            <p className="text-muted-foreground text-sm">
              {isCreateMode ? "Start planning your adventure" : "Update your trip details"}
            </p>
          </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-2xl p-6 mb-6"
        >
          <h2 className="text-lg font-semibold mb-4">Trip Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Label htmlFor="name">Trip Name</Label>
              <Input
                id="name"
                placeholder="My Rajasthan Adventure"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-secondary/50 mt-1"
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="A journey through the royal cities of Rajasthan..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-secondary/50 mt-1"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="bg-secondary/50 mt-1"
              />
            </div>
            <div>
              <Label htmlFor="end_date">End Date</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="bg-secondary/50 mt-1"
              />
            </div>
            <div>
              <Label htmlFor="budget">Total Budget (₹)</Label>
              <Input
                id="budget"
                type="number"
                placeholder="50000"
                value={formData.total_budget || ""}
                onChange={(e) => setFormData({ ...formData, total_budget: Number(e.target.value) })}
                className="bg-secondary/50 mt-1"
              />
            </div>
            <div>
              <Label htmlFor="cover">Cover Image URL</Label>
              <Input
                id="cover"
                placeholder="https://..."
                value={formData.cover_image}
                onChange={(e) => setFormData({ ...formData, cover_image: e.target.value })}
                className="bg-secondary/50 mt-1"
              />
            </div>
          </div>

          {isCreateMode && (
            <div className="mt-6 flex justify-end">
              <Button
                onClick={handleSave}
                disabled={loading}
                className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
              >
                <Save className="w-4 h-4" />
                {loading ? "Creating..." : "Create Trip"}
              </Button>
            </div>
          )}
        </motion.div>

        {!isCreateMode && (
          <>
            {onDiscover && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="glass-card rounded-2xl p-6 mb-6 bg-gradient-to-r from-primary/10 to-accent/10"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Discover Tourist Spots</h3>
                      <p className="text-sm text-muted-foreground">Find attractions with budget estimates in ₹</p>
                    </div>
                  </div>
                  <Button onClick={onDiscover} className="gap-2">
                    <Sparkles className="w-4 h-4" />
                    Discover Places
                  </Button>
                </div>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card rounded-2xl p-6 mb-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Destinations</h2>
                <Button
                  onClick={() => setShowAddStop(!showAddStop)}
                  size="sm"
                  variant={showAddStop ? "secondary" : "default"}
                  className="gap-2"
                >
                  {showAddStop ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  {showAddStop ? "Cancel" : "Add City"}
                </Button>
              </div>

              {showAddStop && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mb-6 p-4 bg-secondary/30 rounded-xl"
                >
                  <div className="mb-3">
                    <Label>Search Cities</Label>
                    <div className="relative mt-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search for a city..."
                        value={citySearch}
                        onChange={(e) => setCitySearch(e.target.value)}
                        className="pl-10 bg-secondary/50"
                      />
                    </div>
                  </div>
                  
                  {citySearch && (
                    <div className="mb-4 max-h-48 overflow-y-auto space-y-1">
                      {filteredCities.slice(0, 6).map(city => {
                        // Ensure city has image - use static data as fallback
                        const cityImage = city.image_url || STATIC_CITIES.find(sc => 
                          sc.name.toLowerCase() === city.name.toLowerCase()
                        )?.image_url
                        
                        return (
                          <button
                            key={city.id}
                            onClick={() => {
                              setNewStop({ ...newStop, city_name: city.name, country: city.country })
                              setCitySearch("")
                            }}
                            className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 text-left"
                          >
                            {cityImage ? (
                              <img 
                                src={cityImage} 
                                alt={city.name} 
                                className="w-10 h-10 rounded-lg object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
                                  target.style.display = 'none'
                                }}
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center">
                                <MapPin className="w-5 h-5 text-primary/40" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium">{city.name}</p>
                              <p className="text-xs text-muted-foreground">{city.country}</p>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div>
                      <Label>City Name</Label>
                      <Input
                        placeholder="Jaipur"
                        value={newStop.city_name}
                        onChange={(e) => setNewStop({ ...newStop, city_name: e.target.value })}
                        className="bg-secondary/50 mt-1"
                      />
                    </div>
                    <div>
                      <Label>Country</Label>
                      <Input
                        placeholder="India"
                        value={newStop.country}
                        onChange={(e) => setNewStop({ ...newStop, country: e.target.value })}
                        className="bg-secondary/50 mt-1"
                      />
                    </div>
                    <div>
                      <Label>Arrival</Label>
                      <Input
                        type="date"
                        value={newStop.start_date}
                        onChange={(e) => setNewStop({ ...newStop, start_date: e.target.value })}
                        className="bg-secondary/50 mt-1"
                      />
                    </div>
                    <div>
                      <Label>Departure</Label>
                      <Input
                        type="date"
                        value={newStop.end_date}
                        onChange={(e) => setNewStop({ ...newStop, end_date: e.target.value })}
                        className="bg-secondary/50 mt-1"
                      />
                    </div>
                  </div>
                  <Button onClick={handleAddStop} className="w-full gap-2">
                    <Plus className="w-4 h-4" />
                    Add Destination
                  </Button>
                </motion.div>
              )}

              <div className="space-y-3">
                {stops.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No destinations yet. Add your first city!</p>
                  </div>
                ) : (
                  stops.map((stop, index) => (
                    <motion.div
                      key={stop.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="border border-border/50 rounded-xl overflow-hidden"
                    >
                      <div
                        onClick={() => toggleStopExpand(stop.id)}
                        className="flex items-center gap-3 p-4 cursor-pointer hover:bg-secondary/30 transition-colors"
                      >
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary font-semibold text-sm">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">{stop.city_name}</h3>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            {stop.country && <span>{stop.country}</span>}
                            {stop.start_date && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {format(new Date(stop.start_date), "MMM d")}
                                {stop.end_date && ` - ${format(new Date(stop.end_date), "MMM d")}`}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {stop.activities?.length || 0} activities
                          </span>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleReorderStop(stop.id, 'up')
                              }}
                              disabled={index === 0}
                            >
                              <ArrowUp className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleReorderStop(stop.id, 'down')
                              }}
                              disabled={index === stops.length - 1}
                            >
                              <ArrowDown className="w-4 h-4" />
                            </Button>
                          </div>
                          {expandedStops.has(stop.id) ? (
                            <ChevronUp className="w-5 h-5 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                      </div>

                      {expandedStops.has(stop.id) && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="border-t border-border/50 p-4 bg-secondary/10"
                        >
                          <div className="space-y-2 mb-4">
                            {stop.activities?.map(activity => (
                              <div
                                key={activity.id}
                                className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg"
                              >
                                <div className="flex-1">
                                  <p className="font-medium text-sm">{activity.name}</p>
                                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                    {activity.duration_hours && (
                                      <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {activity.duration_hours}h
                                      </span>
                                    )}
                                    {activity.estimated_cost > 0 && (
                                      <span className="flex items-center gap-1">
                                        <IndianRupee className="w-3 h-3" />
                                        {activity.estimated_cost.toLocaleString("en-IN")}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteActivity(stop.id, activity.id)}
                                  className="text-muted-foreground hover:text-destructive h-8 w-8"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                          </div>

                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAddActivity(stop.id, { name: "New Activity" })}
                              className="flex-1 gap-2"
                            >
                              <Plus className="w-4 h-4" />
                              Quick Add
                            </Button>
                            {onAddActivity && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onAddActivity(stop.id)}
                                className="flex-1 gap-2"
                              >
                                <Search className="w-4 h-4" />
                                Browse Activities
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteStop(stop.id)}
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex justify-end gap-3"
            >
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={loading}
                className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
              >
                <Save className="w-4 h-4" />
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </motion.div>
          </>
        )}
      </div>
    </div>
  )
}
