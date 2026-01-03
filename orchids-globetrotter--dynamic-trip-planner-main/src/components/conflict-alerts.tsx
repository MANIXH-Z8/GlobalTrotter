/**
 * Conflict Alerts Component
 * 
 * Shows non-blocking visual alerts for:
 * - Days that exceed daily budget
 * - Too many activities in a single day
 * - Activities scheduled outside a city's date range
 * 
 * Alerts are informative and use icons with short messages.
 */

"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Trip, TripStop } from "@/lib/supabase"
import { AlertTriangle, DollarSign, Calendar, Activity } from "lucide-react"
import { differenceInDays, parseISO, isWithinInterval, isAfter, isBefore } from "date-fns"

type ConflictAlertsProps = {
  trip: Trip
  stops: TripStop[]
}

type Alert = {
  type: "budget" | "activities" | "date"
  message: string
  icon: React.ReactNode
  severity: "warning" | "error"
}

export function ConflictAlerts({ trip, stops }: ConflictAlertsProps) {
  const alerts: Alert[] = []

  // Check daily budget exceedances
  if (trip.start_date && trip.end_date && trip.total_budget > 0) {
    const totalDays = differenceInDays(parseISO(trip.end_date), parseISO(trip.start_date)) + 1
    const dailyBudget = trip.total_budget / totalDays

    stops.forEach(stop => {
      if (stop.start_date && stop.end_date) {
        const stopDays = differenceInDays(parseISO(stop.end_date), parseISO(stop.start_date)) + 1
        const stopBudget = (stop.transport_cost || 0) + (stop.accommodation_cost || 0)
        const activitiesCost = stop.activities?.reduce((sum, a) => sum + (a.estimated_cost || 0), 0) || 0
        const totalStopCost = stopBudget + activitiesCost
        const stopDailyCost = totalStopCost / stopDays

        if (stopDailyCost > dailyBudget * 1.2) {
          // 20% over budget threshold
          alerts.push({
            type: "budget",
            message: `${stop.city_name} exceeds daily budget by ₹${Math.round(stopDailyCost - dailyBudget).toLocaleString("en-IN")}`,
            icon: <DollarSign className="w-4 h-4" />,
            severity: "warning",
          })
        }
      }
    })
  }

  // Check for too many activities in a day
  stops.forEach(stop => {
    if (stop.activities && stop.activities.length > 0 && stop.start_date && stop.end_date) {
      const stopDays = differenceInDays(parseISO(stop.end_date), parseISO(stop.start_date)) + 1
      const activitiesPerDay = stop.activities.length / stopDays

      if (activitiesPerDay > 5) {
        alerts.push({
          type: "activities",
          message: `${stop.city_name} has ${Math.round(activitiesPerDay)} activities/day - consider spreading them out`,
          icon: <Activity className="w-4 h-4" />,
          severity: "warning",
        })
      }
    }
  })

  // Check for activities outside city date range
  stops.forEach(stop => {
    if (stop.activities && stop.start_date && stop.end_date) {
      const stopStart = parseISO(stop.start_date)
      const stopEnd = parseISO(stop.end_date)

      stop.activities.forEach(activity => {
        if (activity.scheduled_date) {
          const activityDate = parseISO(activity.scheduled_date)
          if (!isWithinInterval(activityDate, { start: stopStart, end: stopEnd })) {
            alerts.push({
              type: "date",
              message: `Activity "${activity.name}" in ${stop.city_name} is scheduled outside city dates`,
              icon: <Calendar className="w-4 h-4" />,
              severity: "error",
            })
          }
        }
      })
    }
  })

  if (alerts.length === 0) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-2"
    >
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-5 h-5 text-amber-400" />
        <h4 className="text-sm font-semibold">Planning Alerts</h4>
      </div>

      <AnimatePresence>
        {alerts.map((alert, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className={`
              glass-card rounded-lg p-3 flex items-start gap-3 border
              ${alert.severity === "error" 
                ? "border-destructive/50 bg-destructive/5" 
                : "border-amber-500/50 bg-amber-500/5"
              }
            `}
          >
            <div className={`
              w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0
              ${alert.severity === "error" 
                ? "bg-destructive/20 text-destructive" 
                : "bg-amber-500/20 text-amber-400"
              }
            `}>
              {alert.icon}
            </div>
            <p className="text-sm font-medium flex-1">{alert.message}</p>
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  )
}

