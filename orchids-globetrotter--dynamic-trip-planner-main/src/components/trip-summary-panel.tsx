/**
 * Trip Summary Intelligence Panel
 * 
 * Displays key trip metrics and insights:
 * - Total trip duration (days)
 * - Number of cities
 * - Estimated total budget
 * - Trip pace label (Relaxed / Balanced / Packed)
 * 
 * Updates dynamically as itinerary changes.
 */

"use client"

import { motion } from "framer-motion"
import { Trip, TripStop } from "@/lib/supabase"
import { Calendar, MapPin, IndianRupee, Gauge } from "lucide-react"
import { differenceInDays, parseISO } from "date-fns"

type TripSummaryPanelProps = {
  trip: Trip
  stops: TripStop[]
}

/**
 * Calculate trip pace based on activities per day
 * - Relaxed: < 2 activities/day
 * - Balanced: 2-4 activities/day
 * - Packed: > 4 activities/day
 */
function calculateTripPace(trip: Trip, stops: TripStop[]): { label: string; color: string; icon: string } {
  if (!trip.start_date || !trip.end_date || stops.length === 0) {
    return { label: "Planning", color: "text-muted-foreground", icon: "📋" }
  }

  const totalDays = differenceInDays(parseISO(trip.end_date), parseISO(trip.start_date)) + 1
  const totalActivities = stops.reduce((sum, stop) => sum + (stop.activities?.length || 0), 0)
  const activitiesPerDay = totalActivities / totalDays

  if (activitiesPerDay < 2) {
    return { label: "Relaxed", color: "text-green-400", icon: "🌴" }
  } else if (activitiesPerDay <= 4) {
    return { label: "Balanced", color: "text-blue-400", icon: "⚖️" }
  } else {
    return { label: "Packed", color: "text-orange-400", icon: "🚀" }
  }
}

/**
 * Calculate estimated total budget from stops and activities
 */
function calculateEstimatedBudget(trip: Trip, stops: TripStop[]): number {
  let total = 0

  stops.forEach(stop => {
    total += Number(stop.transport_cost || 0)
    total += Number(stop.accommodation_cost || 0)
    stop.activities?.forEach(activity => {
      total += Number(activity.estimated_cost || 0)
    })
  })

  // Add estimated meals if not tracked
  if (trip.start_date && trip.end_date) {
    const days = differenceInDays(parseISO(trip.end_date), parseISO(trip.start_date)) + 1
    const estimatedMeals = days * 1500 // ₹1500 per day for meals
    total += estimatedMeals
  }

  return total
}

export function TripSummaryPanel({ trip, stops }: TripSummaryPanelProps) {
  const tripDuration = trip.start_date && trip.end_date
    ? differenceInDays(parseISO(trip.end_date), parseISO(trip.start_date)) + 1
    : 0

  const estimatedBudget = calculateEstimatedBudget(trip, stops)
  const pace = calculateTripPace(trip, stops)

  const stats = [
    {
      label: "Duration",
      value: tripDuration > 0 ? `${tripDuration} ${tripDuration === 1 ? 'day' : 'days'}` : "Not set",
      icon: Calendar,
      color: "text-blue-400",
    },
    {
      label: "Cities",
      value: `${stops.length} ${stops.length === 1 ? 'city' : 'cities'}`,
      icon: MapPin,
      color: "text-emerald-400",
    },
    {
      label: "Est. Budget",
      value: `₹${estimatedBudget.toLocaleString("en-IN")}`,
      icon: IndianRupee,
      color: "text-amber-400",
    },
    {
      label: "Pace",
      value: pace.label,
      icon: Gauge,
      color: pace.color,
      badge: pace.icon,
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-6 border border-primary/10"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Gauge className="w-4 h-4 text-primary" />
        </div>
        <h3 className="text-lg font-bold">Trip Summary</h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="flex flex-col items-center text-center p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors"
          >
            <div className={`w-10 h-10 rounded-lg bg-secondary flex items-center justify-center mb-2 ${stat.color}`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <p className="text-xl font-bold mb-1">{stat.value}</p>
            <div className="flex items-center gap-1.5">
              <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
              {stat.badge && <span className="text-sm">{stat.badge}</span>}
            </div>
          </motion.div>
        ))}
      </div>

      {trip.total_budget > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Budget vs Estimated</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">₹{trip.total_budget.toLocaleString("en-IN")}</span>
              <span className="text-muted-foreground">/</span>
              <span className={`text-sm font-bold ${
                estimatedBudget > trip.total_budget ? "text-destructive" : "text-green-400"
              }`}>
                ₹{estimatedBudget.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
          <div className="mt-2 h-2 bg-secondary rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, (estimatedBudget / trip.total_budget) * 100)}%` }}
              className={`h-full ${
                estimatedBudget > trip.total_budget ? "bg-destructive" : "bg-primary"
              }`}
            />
          </div>
        </div>
      )}
    </motion.div>
  )
}

