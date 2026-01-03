/**
 * Shared Trip View Component
 * 
 * Public read-only view of a shared trip itinerary.
 * 
 * Features:
 * - View trip without authentication
 * - Shareable URL (via share_code)
 * - Copy Trip functionality (creates duplicate for logged-in users)
 * - Read-only display of full itinerary
 * 
 * URL Format:
 * - /?share=<share_code>
 * - Accessible without login
 * 
 * Copy Trip Logic:
 * - Creates new trip with "(Copy)" suffix
 * - Duplicates all stops and activities
 * - Maintains structure and order
 * - Sets is_public=false for copied trips
 */

"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { supabase, Trip, TripStop, TripActivity } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { 
  Calendar,
  DollarSign,
  MapPin,
  Clock,
  Copy,
  Globe,
  Plane,
  Share2,
  ArrowLeft,
  Check
} from "lucide-react"
import { format, differenceInDays } from "date-fns"
import { toast } from "sonner"

type SharedTripViewProps = {
  shareCode: string
  onCopyTrip?: (trip: Trip) => void
  onBack?: () => void
}

export function SharedTripView({ shareCode, onCopyTrip, onBack }: SharedTripViewProps) {
  const { user } = useAuth()
  const [trip, setTrip] = useState<Trip | null>(null)
  const [stops, setStops] = useState<TripStop[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    loadSharedTrip()
  }, [shareCode])

  const loadSharedTrip = async () => {
    setLoading(true)
    const { data: tripData, error: tripError } = await supabase.from("trips").select("*").eq("share_code", shareCode).eq("is_public", true).single()
    if (tripError || !tripData) {
      setError(true)
      setLoading(false)
      return
    }
    setTrip(tripData)
    const { data: stopsData } = await supabase.from("trip_stops").select("*").eq("trip_id", tripData.id).order("order_index")
    if (stopsData) {
      for (const stop of stopsData) {
        const { data: activitiesData } = await supabase.from("trip_activities").select("*").eq("trip_stop_id", stop.id).order("order_index")
        stop.activities = activitiesData || []
      }
      setStops(stopsData)
    }
    setLoading(false)
  }

  const handleCopyTrip = async () => {
    if (!user || !trip) {
      toast.error("Please sign in to copy this trip")
      return
    }

    try {
      // Create a new trip based on the shared one
      const shareCode = Math.random().toString(36).substring(2, 10)
      const { data: newTrip, error: tripError } = await supabase
        .from("trips")
        .insert({
          user_id: user.id,
          name: `${trip.name} (Copy)`,
          description: trip.description,
          start_date: trip.start_date,
          end_date: trip.end_date,
          cover_image: trip.cover_image,
          is_public: false,
          share_code: shareCode,
          total_budget: trip.total_budget,
        })
        .select()
        .single()

      if (tripError) throw tripError

      // Copy all stops
      for (const stop of stops) {
        const { data: newStop, error: stopError } = await supabase
          .from("trip_stops")
          .insert({
            trip_id: newTrip.id,
            city_id: stop.city_id,
            city_name: stop.city_name,
            country: stop.country,
            start_date: stop.start_date,
            end_date: stop.end_date,
            order_index: stop.order_index,
            transport_cost: stop.transport_cost,
            accommodation_cost: stop.accommodation_cost,
            notes: stop.notes,
          })
          .select()
          .single()

        if (stopError) continue

        // Copy all activities for this stop
        if (stop.activities && stop.activities.length > 0) {
          const activitiesToInsert = stop.activities.map(activity => ({
            trip_stop_id: newStop.id,
            activity_id: activity.activity_id,
            name: activity.name,
            description: activity.description,
            scheduled_date: activity.scheduled_date,
            scheduled_time: activity.scheduled_time,
            duration_hours: activity.duration_hours,
            estimated_cost: activity.estimated_cost,
            order_index: activity.order_index,
            category: activity.category,
            is_custom: activity.is_custom,
          }))

          await supabase.from("trip_activities").insert(activitiesToInsert)
        }
      }

      setCopied(true)
      toast.success("Trip copied to your account!")
      
      if (onCopyTrip) {
        // Reload the new trip with all relations
        const { data: fullTrip } = await supabase
          .from("trips")
          .select("*")
          .eq("id", newTrip.id)
          .single()
        
        if (fullTrip) {
          onCopyTrip(fullTrip)
        }
      }
    } catch (error) {
      console.error("Error copying trip:", error)
      toast.error("Failed to copy trip")
    }
  }

  const handleShare = async () => {
    await navigator.clipboard.writeText(window.location.href)
    toast.success("Link copied!")
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
          <Globe className="w-12 h-12 text-primary" />
        </motion.div>
      </div>
    )
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Plane className="w-20 h-20 mx-auto mb-6 text-muted-foreground/30" />
          <h1 className="text-2xl font-bold mb-2">Trip Not Found</h1>
          <p className="text-muted-foreground">This trip may not exist or is not shared publicly.</p>
        </div>
      </div>
    )
  }

  const tripDuration = trip.start_date && trip.end_date ? differenceInDays(new Date(trip.end_date), new Date(trip.start_date)) + 1 : 0
  const totalCost = stops.reduce((sum, stop) => {
    const stopCost = (stop.activities?.reduce((a, act) => a + Number(act.estimated_cost || 0), 0) || 0)
    return sum + stopCost + Number(stop.transport_cost || 0) + Number(stop.accommodation_cost || 0)
  }, 0)

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-50 glass border-b border-border/50">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="w-6 h-6 text-primary" />
            <span className="font-bold gradient-text">GlobeTrotter</span>
          </div>
          <div className="flex gap-2">
            {onBack && (
              <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={handleShare} className="gap-2">
              <Share2 className="w-4 h-4" />
              Share
            </Button>
            <Button 
              size="sm" 
              onClick={handleCopyTrip} 
              className="gap-2"
              disabled={copied || !user}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy Trip
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="pt-8 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative rounded-2xl overflow-hidden mb-8">
            {trip.cover_image ? (
              <img src={trip.cover_image} alt={trip.name} className="w-full h-64 object-cover" />
            ) : (
              <div className="w-full h-64 bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center">
                <Plane className="w-24 h-24 text-primary/30" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">{trip.name}</h1>
              {trip.description && <p className="text-white/80 max-w-2xl">{trip.description}</p>}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <div className="glass-card rounded-xl p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1"><Calendar className="w-4 h-4" /><span className="text-xs">Duration</span></div>
              <p className="text-xl font-bold">{tripDuration} days</p>
            </div>
            <div className="glass-card rounded-xl p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1"><MapPin className="w-4 h-4" /><span className="text-xs">Destinations</span></div>
              <p className="text-xl font-bold">{stops.length} cities</p>
            </div>
            <div className="glass-card rounded-xl p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1"><DollarSign className="w-4 h-4" /><span className="text-xs">Est. Cost</span></div>
              <p className="text-xl font-bold">${totalCost.toLocaleString()}</p>
            </div>
            <div className="glass-card rounded-xl p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1"><Clock className="w-4 h-4" /><span className="text-xs">Activities</span></div>
              <p className="text-xl font-bold">{stops.reduce((sum, s) => sum + (s.activities?.length || 0), 0)}</p>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h2 className="text-xl font-bold mb-4">Itinerary</h2>
            <div className="space-y-4">
              {stops.map((stop, index) => (
                <motion.div key={stop.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + index * 0.1 }} className="glass-card rounded-xl overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/20 text-primary font-bold">{index + 1}</div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold mb-1">{stop.city_name}</h3>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                          {stop.country && <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{stop.country}</span>}
                          {stop.start_date && <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{format(new Date(stop.start_date), "MMM d")}{stop.end_date && ` - ${format(new Date(stop.end_date), "MMM d")}`}</span>}
                        </div>
                        {stop.activities && stop.activities.length > 0 && (
                          <div className="space-y-2">
                            {stop.activities.map(activity => (
                              <div key={activity.id} className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg">
                                <div className="flex-1"><p className="font-medium">{activity.name}</p></div>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  {activity.duration_hours > 0 && <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{activity.duration_hours}h</span>}
                                  {activity.estimated_cost > 0 && <span className="flex items-center gap-1"><DollarSign className="w-4 h-4" />{activity.estimated_cost}</span>}
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
          </motion.div>
        </div>
      </div>
    </div>
  )
}

