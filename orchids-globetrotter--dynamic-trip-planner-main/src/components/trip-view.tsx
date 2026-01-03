"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { supabase, Trip, TripStop, TripActivity } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { TripSummaryPanel } from "@/components/trip-summary-panel"
import { ConflictAlerts } from "@/components/conflict-alerts"
import { 
  ArrowLeft,
  Calendar,
  DollarSign,
  MapPin,
  Clock,
  Share2,
  Edit,
  BarChart3,
  CalendarDays,
  Copy,
  Check,
  Plane,
  Download,
  Upload
} from "lucide-react"
import { format, differenceInDays } from "date-fns"
import { toast } from "sonner"
import { exportTrip } from "@/lib/trip-export"
import { useRef } from "react"

type TripViewProps = {
  trip: Trip
  onEdit: () => void
  onViewBudget: () => void
  onViewCalendar: () => void
  onBack: () => void
}

export function TripView({ trip, onEdit, onViewBudget, onViewCalendar, onBack }: TripViewProps) {
  const { user } = useAuth()
  const [stops, setStops] = useState<TripStop[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [viewMode, setViewMode] = useState<"list" | "timeline">("list")
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadTripData()
  }, [trip])

  const loadTripData = async () => {
    setLoading(true)
    
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
    }

    setLoading(false)
  }

  const handleShare = async () => {
    // Ensure trip is public and has a share code
    if (!trip.share_code) {
      // Generate share code if missing
      const shareCode = Math.random().toString(36).substring(2, 10)
      await supabase
        .from("trips")
        .update({ share_code: shareCode, is_public: true })
        .eq("id", trip.id)
    }
    
    // Generate shareable URL with query parameter
    const shareCode = trip.share_code || Math.random().toString(36).substring(2, 10)
    const url = `${window.location.origin}?share=${shareCode}`
    
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast.success("Share link copied!")
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      // Fallback for browsers without clipboard API
      const textArea = document.createElement("textarea")
      textArea.value = url
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      toast.success("Share link copied!")
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleExport = async () => {
    try {
      const allActivities: TripActivity[] = []
      stops.forEach(stop => {
        if (stop.activities) {
          allActivities.push(...stop.activities)
        }
      })
      
      await exportTrip(trip, stops, allActivities)
      toast.success("Trip exported successfully!")
    } catch (error) {
      toast.error("Failed to export trip")
    }
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) {
      toast.error("Please sign in to import trips")
      return
    }

    try {
      const { importTrip, prepareImportedTripForInsert } = await import("@/lib/trip-export")
      const importedData = await importTrip(file)

      if (!importedData) {
        toast.error("Invalid trip file format")
        return
      }

      const { trip: newTripData, stops: newStopsData, activities: newActivitiesData } = 
        prepareImportedTripForInsert(importedData, user.id)

      // Create trip
      const { data: createdTrip, error: tripError } = await supabase
        .from("trips")
        .insert({
          ...newTripData,
          share_code: Math.random().toString(36).substring(2, 10),
        })
        .select()
        .single()

      if (tripError || !createdTrip) {
        throw tripError || new Error("Failed to create trip")
      }

      // Create stops and map old IDs to new IDs
      const stopIdMap = new Map<string, string>()
      
      for (const stopData of newStopsData) {
        const { _original_stop_id, ...stopInsertData } = stopData
        const { data: createdStop, error: stopError } = await supabase
          .from("trip_stops")
          .insert({
            ...stopInsertData,
            trip_id: createdTrip.id,
          })
          .select()
          .single()

        if (createdStop && _original_stop_id) {
          stopIdMap.set(_original_stop_id, createdStop.id)
        }
      }

      // Create activities with mapped stop IDs
      const activitiesToInsert = newActivitiesData
        .filter(a => a._original_stop_id && stopIdMap.has(a._original_stop_id))
        .map(a => {
          const { _original_stop_id, ...activityData } = a
          return {
            ...activityData,
            trip_stop_id: stopIdMap.get(_original_stop_id!)!,
          }
        })

      if (activitiesToInsert.length > 0) {
        await supabase.from("trip_activities").insert(activitiesToInsert)
      }

      toast.success("Trip imported successfully!")
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (error) {
      console.error("Import error:", error)
      toast.error("Failed to import trip")
    }
  }

  const calculateTotalCost = () => {
    let total = 0
    stops.forEach(stop => {
      total += Number(stop.transport_cost || 0)
      total += Number(stop.accommodation_cost || 0)
      stop.activities?.forEach(activity => {
        total += Number(activity.estimated_cost || 0)
      })
    })
    return total
  }

  const tripDuration = trip.start_date && trip.end_date
    ? differenceInDays(new Date(trip.end_date), new Date(trip.start_date)) + 1
    : 0

  return (
    <div className="min-h-screen pt-8 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Button variant="ghost" onClick={onBack} className="mb-4 gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Trips
          </Button>
        </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="relative rounded-[2rem] overflow-hidden mb-12 shadow-2xl shadow-primary/20 group"
          >
            {trip.cover_image ? (
              <motion.img 
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 1.2 }}
                src={trip.cover_image}
                alt={trip.name}
                className="w-full h-[400px] object-cover"
              />
            ) : (
              <div className="w-full h-[400px] bg-gradient-to-br from-primary/30 via-accent/20 to-primary/30 flex items-center justify-center">
                <Plane className="w-32 h-32 text-primary/30 group-hover:rotate-12 transition-transform duration-700" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-10">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <h1 className="text-3xl sm:text-5xl font-black text-white mb-4 tracking-tight">{trip.name}</h1>
                  {trip.description && (
                    <p className="text-white/80 text-lg max-w-2xl leading-relaxed">{trip.description}</p>
                  )}
                </motion.div>
              </div>
          </motion.div>

          {/* Trip Summary Intelligence Panel */}
          <div className="mb-8">
            <TripSummaryPanel trip={trip} stops={stops} />
          </div>

          {/* Conflict Alerts */}
          <div className="mb-8">
            <ConflictAlerts trip={trip} stops={stops} />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap gap-4 mb-16"
          >
            {[
              { onClick: onEdit, icon: Edit, label: "Edit Trip", primary: true },
              { onClick: onViewBudget, icon: BarChart3, label: "Budget" },
              { onClick: onViewCalendar, icon: CalendarDays, label: "Calendar" },
              { onClick: handleShare, icon: copied ? Check : Share2, label: copied ? "Copied!" : "Share" },
              { onClick: handleExport, icon: Download, label: "Export" },
              { onClick: handleImportClick, icon: Upload, label: "Import" }
            ].map((btn, i) => (
              <motion.div key={btn.label} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  onClick={btn.onClick} 
                  variant={btn.primary ? "default" : "outline"} 
                  className={`gap-2 h-12 px-6 rounded-xl ${btn.primary ? "shadow-lg shadow-primary/20" : ""}`}
                >
                  <btn.icon className="w-4 h-4" />
                  {btn.label}
                </Button>
              </motion.div>
            ))}
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </motion.div>


        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Itinerary</h2>
            <div className="flex gap-2">
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                List
              </Button>
              <Button
                variant={viewMode === "timeline" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("timeline")}
              >
                Timeline
              </Button>
            </div>
          </div>

          {stops.length === 0 ? (
            <div className="glass-card rounded-xl p-12 text-center">
              <MapPin className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground mb-4">No destinations added yet</p>
              <Button onClick={onEdit} className="gap-2">
                <Edit className="w-4 h-4" />
                Add Destinations
              </Button>
            </div>
          ) : viewMode === "list" ? (
            <div className="space-y-4">
              {stops.map((stop, index) => (
                <motion.div
                  key={stop.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="glass-card rounded-xl overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/20 text-primary font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold mb-1">{stop.city_name}</h3>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                          {stop.country && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {stop.country}
                            </span>
                          )}
                          {stop.start_date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {format(new Date(stop.start_date), "MMM d")}
                              {stop.end_date && ` - ${format(new Date(stop.end_date), "MMM d")}`}
                            </span>
                          )}
                        </div>

                        {stop.activities && stop.activities.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-muted-foreground">Activities</p>
                            {stop.activities.map(activity => (
                              <div
                                key={activity.id}
                                className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg"
                              >
                                <div className="flex-1">
                                  <p className="font-medium">{activity.name}</p>
                                  {activity.description && (
                                    <p className="text-sm text-muted-foreground line-clamp-1">
                                      {activity.description}
                                    </p>
                                  )}
                                </div>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  {activity.duration_hours > 0 && (
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-4 h-4" />
                                      {activity.duration_hours}h
                                    </span>
                                  )}
                                  {activity.estimated_cost > 0 && (
                                    <span className="flex items-center gap-1">
                                      <DollarSign className="w-4 h-4" />
                                      {activity.estimated_cost}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="relative pl-8">
              <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-border" />
              {stops.map((stop, index) => (
                <motion.div
                  key={stop.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="relative pb-8 last:pb-0"
                >
                  <div className="absolute -left-5 w-4 h-4 rounded-full bg-primary border-4 border-background" />
                  <div className="glass-card rounded-xl p-4 ml-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      {stop.start_date && format(new Date(stop.start_date), "MMM d, yyyy")}
                    </div>
                    <h3 className="font-bold mb-2">{stop.city_name}, {stop.country}</h3>
                    {stop.activities && stop.activities.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {stop.activities.map(activity => (
                          <span
                            key={activity.id}
                            className="text-xs px-2 py-1 bg-secondary/50 rounded-full"
                          >
                            {activity.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
