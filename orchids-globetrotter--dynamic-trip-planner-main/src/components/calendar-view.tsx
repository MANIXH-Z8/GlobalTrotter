"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { supabase, Trip, TripStop } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { 
  ArrowLeft,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  DollarSign,
  MapPin
} from "lucide-react"
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, isWithinInterval, parseISO } from "date-fns"

type CalendarViewProps = {
  trip: Trip
  onBack: () => void
}

export function CalendarView({ trip, onBack }: CalendarViewProps) {
  const [stops, setStops] = useState<TripStop[]>([])
  const [currentMonth, setCurrentMonth] = useState(() => {
    return trip.start_date ? new Date(trip.start_date) : new Date()
  })
  const [viewMode, setViewMode] = useState<"calendar" | "timeline">("calendar")
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  useEffect(() => {
    loadCalendarData()
  }, [trip])

  const loadCalendarData = async () => {
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
  }

  const getStopForDate = (date: Date) => {
    return stops.find(stop => {
      if (!stop.start_date) return false
      const startDate = parseISO(stop.start_date)
      const endDate = stop.end_date ? parseISO(stop.end_date) : startDate
      return isWithinInterval(date, { start: startDate, end: endDate })
    })
  }

  const getActivitiesForDate = (date: Date) => {
    const stop = getStopForDate(date)
    if (!stop || !stop.activities) return []
    return stop.activities.filter(a => {
      if (a.scheduled_date) {
        return isSameDay(parseISO(a.scheduled_date), date)
      }
      return true
    })
  }

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const startDayOfWeek = monthStart.getDay()
  const paddingDays = Array.from({ length: startDayOfWeek }, (_, i) => 
    addDays(monthStart, -(startDayOfWeek - i))
  )
  const allDays = [...paddingDays, ...calendarDays]

  const tripDays = trip.start_date && trip.end_date 
    ? eachDayOfInterval({ start: parseISO(trip.start_date), end: parseISO(trip.end_date) })
    : []

  return (
    <div className="min-h-screen pt-8 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Button variant="ghost" onClick={onBack} className="mb-4 gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Trip
          </Button>
          <h1 className="text-3xl font-bold mb-2">Trip Calendar</h1>
          <p className="text-muted-foreground">View your itinerary day by day</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center justify-between mb-6"
        >
          <div className="flex gap-2">
            <Button
              variant={viewMode === "calendar" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("calendar")}
            >
              Calendar
            </Button>
            <Button
              variant={viewMode === "timeline" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("timeline")}
            >
              Timeline
            </Button>
          </div>
        </motion.div>

        {viewMode === "calendar" ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addDays(currentMonth, -30))}>
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <h2 className="text-xl font-bold">{format(currentMonth, "MMMM yyyy")}</h2>
              <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addDays(currentMonth, 30))}>
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                <div key={day} className="text-center text-sm text-muted-foreground py-2">{day}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {allDays.map((day, i) => {
                const stop = getStopForDate(day)
                const isCurrentMonth = isSameMonth(day, currentMonth)
                const isToday = isSameDay(day, new Date())
                const isSelected = selectedDate && isSameDay(day, selectedDate)
                const isTripDay = tripDays.some(td => isSameDay(td, day))

                return (
                  <motion.button
                    key={i}
                    whileHover={{ scale: 1.05 }}
                    onClick={() => setSelectedDate(day)}
                    className={`aspect-square p-1 rounded-lg text-sm relative
                      ${!isCurrentMonth ? "opacity-30" : ""}
                      ${isToday ? "ring-2 ring-primary" : ""}
                      ${isSelected ? "bg-primary text-primary-foreground" : ""}
                      ${isTripDay && !isSelected ? "bg-primary/20" : ""}
                      ${stop && !isSelected ? "bg-accent/30" : ""}
                      hover:bg-secondary/50 transition-colors
                    `}
                  >
                    <span className="block">{format(day, "d")}</span>
                    {stop && (
                      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                      </div>
                    )}
                  </motion.button>
                )
              })}
            </div>

            {selectedDate && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 pt-6 border-t border-border">
                <h3 className="font-semibold mb-4">{format(selectedDate, "EEEE, MMMM d, yyyy")}</h3>
                {(() => {
                  const stop = getStopForDate(selectedDate)
                  const activities = getActivitiesForDate(selectedDate)
                  if (!stop) return <p className="text-muted-foreground text-sm">No activities planned for this day</p>
                  return (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-primary" />
                        <span className="font-medium">{stop.city_name}, {stop.country}</span>
                      </div>
                      {activities.length > 0 ? (
                        activities.map(activity => (
                          <div key={activity.id} className="p-3 bg-secondary/30 rounded-lg">
                            <p className="font-medium">{activity.name}</p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                              {activity.scheduled_time && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{activity.scheduled_time}</span>}
                              {activity.duration_hours > 0 && <span>{activity.duration_hours}h</span>}
                              {activity.estimated_cost > 0 && <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{activity.estimated_cost}</span>}
                            </div>
                          </div>
                        ))
                      ) : <p className="text-muted-foreground text-sm">No specific activities scheduled</p>}
                    </div>
                  )
                })()}
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-4">
            {tripDays.length === 0 ? (
              <div className="glass-card rounded-xl p-12 text-center">
                <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground">Set trip dates to see the timeline</p>
              </div>
            ) : (
              tripDays.map((day, index) => {
                const stop = getStopForDate(day)
                const activities = getActivitiesForDate(day)
                return (
                  <motion.div key={index} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }} className="glass-card rounded-xl p-4">
                    <div className="flex items-start gap-4">
                      <div className="text-center bg-primary/20 rounded-lg p-3 min-w-[70px]">
                        <p className="text-2xl font-bold text-primary">{format(day, "d")}</p>
                        <p className="text-xs text-muted-foreground">{format(day, "EEE")}</p>
                      </div>
                      <div className="flex-1">
                        {stop ? (
                          <>
                            <div className="flex items-center gap-2 mb-2">
                              <MapPin className="w-4 h-4 text-accent" />
                              <span className="font-semibold">{stop.city_name}</span>
                              <span className="text-muted-foreground text-sm">{stop.country}</span>
                            </div>
                            {activities.length > 0 && (
                              <div className="space-y-2">
                                {activities.map(activity => (
                                  <div key={activity.id} className="flex items-center gap-3 text-sm">
                                    <div className="w-2 h-2 rounded-full bg-primary" />
                                    <span>{activity.name}</span>
                                    {activity.duration_hours > 0 && <span className="text-muted-foreground">({activity.duration_hours}h)</span>}
                                  </div>
                                ))}
                              </div>
                            )}
                          </>
                        ) : <p className="text-muted-foreground text-sm">Free day - no activities planned</p>}
                      </div>
                    </div>
                  </motion.div>
                )
              })
            )}
          </motion.div>
        )}
      </div>
    </div>
  )
}

