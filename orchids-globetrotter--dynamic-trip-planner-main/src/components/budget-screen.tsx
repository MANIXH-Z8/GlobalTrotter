/**
 * Budget Screen Component
 * 
 * Comprehensive budget tracking and visualization:
 * 
 * Features:
 * - Total budget vs estimated costs
 * - Remaining budget (with over-budget warnings)
 * - Average cost per day calculation
 * - Category breakdown (transport, accommodation, activities, meals)
 * - Pie chart for category distribution
 * - Bar chart for cost by destination
 * 
 * Calculations:
 * - Aggregates costs from all stops and activities
 * - Categorizes activities (food vs other)
 * - Estimates meals if not explicitly tracked
 * - Shows visual warnings when over budget
 */

"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { supabase, Trip, TripStop } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { 
  ArrowLeft,
  IndianRupee,
  AlertTriangle,
  PieChart,
  TrendingUp,
  TrendingDown,
  Plane,
  Hotel,
  Utensils,
  Ticket
} from "lucide-react"
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts"

type BudgetScreenProps = {
  trip: Trip
  onBack: () => void
}

export function BudgetScreen({ trip, onBack }: BudgetScreenProps) {
  const [stops, setStops] = useState<TripStop[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBudgetData()
  }, [trip])

  const loadBudgetData = async () => {
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
        
        stop.activities = activitiesData || []
      }
      setStops(stopsData)
    }

    setLoading(false)
  }

  const calculateCosts = () => {
    let transport = 0
    let accommodation = 0
    let activities = 0
    let meals = 0

    stops.forEach(stop => {
      transport += Number(stop.transport_cost || 0)
      accommodation += Number(stop.accommodation_cost || 0)
      stop.activities?.forEach(activity => {
        const cost = Number(activity.estimated_cost || 0)
        if (activity.category?.toLowerCase().includes("food") || activity.category?.toLowerCase().includes("dining")) {
          meals += cost
        } else {
          activities += cost
        }
      })
    })

    const estimatedMeals = stops.length * 1500
    meals = meals || estimatedMeals

    return { transport, accommodation, activities, meals }
  }

  const costs = calculateCosts()
  const totalEstimated = costs.transport + costs.accommodation + costs.activities + costs.meals
  const budget = Number(trip.total_budget || 0)
  const remaining = budget - totalEstimated
  const isOverBudget = remaining < 0

  const pieData = [
    { name: "Transport", value: costs.transport, color: "#00c4b4" },
    { name: "Accommodation", value: costs.accommodation, color: "#e879f9" },
    { name: "Activities", value: costs.activities, color: "#fbbf24" },
    { name: "Meals", value: costs.meals, color: "#60a5fa" }
  ].filter(d => d.value > 0)

  const barData = stops.map(stop => {
    const stopActivitiesCost = stop.activities?.reduce((sum, a) => sum + Number(a.estimated_cost || 0), 0) || 0
    return {
      name: stop.city_name.substring(0, 10),
      Transport: Number(stop.transport_cost || 0),
      Accommodation: Number(stop.accommodation_cost || 0),
      Activities: stopActivitiesCost
    }
  })

  const averagePerDay = trip.start_date && trip.end_date
    ? totalEstimated / Math.max(1, Math.ceil((new Date(trip.end_date).getTime() - new Date(trip.start_date).getTime()) / (1000 * 60 * 60 * 24)))
    : 0

  const formatINR = (value: number) => `₹${value.toLocaleString("en-IN")}`

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
          <h1 className="text-3xl font-bold mb-2">Budget & Costs</h1>
          <p className="text-muted-foreground">Track and manage your trip expenses</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card rounded-xl p-6"
          >
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <IndianRupee className="w-5 h-5" />
              <span className="text-sm">Total Budget</span>
            </div>
            <p className="text-2xl font-bold">{formatINR(budget)}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="glass-card rounded-xl p-6"
          >
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <PieChart className="w-5 h-5" />
              <span className="text-sm">Estimated Total</span>
            </div>
            <p className="text-2xl font-bold">{formatINR(totalEstimated)}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`glass-card rounded-xl p-6 ${isOverBudget ? "border border-destructive/50" : ""}`}
          >
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              {isOverBudget ? (
                <TrendingDown className="w-5 h-5 text-destructive" />
              ) : (
                <TrendingUp className="w-5 h-5 text-green-400" />
              )}
              <span className="text-sm">Remaining</span>
            </div>
            <p className={`text-2xl font-bold ${isOverBudget ? "text-destructive" : "text-green-400"}`}>
              {isOverBudget ? "-" : ""}{formatINR(Math.abs(remaining))}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="glass-card rounded-xl p-6"
          >
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <IndianRupee className="w-5 h-5" />
              <span className="text-sm">Avg per Day</span>
            </div>
            <p className="text-2xl font-bold">{formatINR(Math.round(averagePerDay))}</p>
          </motion.div>
        </div>

        {isOverBudget && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card rounded-xl p-4 mb-8 border border-destructive/50 flex items-center gap-4"
          >
            <AlertTriangle className="w-8 h-8 text-destructive flex-shrink-0" />
            <div>
              <p className="font-semibold text-destructive">Over Budget Warning</p>
              <p className="text-sm text-muted-foreground">
                Your estimated expenses exceed your budget by {formatINR(Math.abs(remaining))}. 
                Consider adjusting your itinerary or increasing your budget.
              </p>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="glass-card rounded-xl p-6"
          >
            <h2 className="text-lg font-semibold mb-6">Cost Breakdown</h2>
            {pieData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [formatINR(value), '']}
                      contentStyle={{ 
                        backgroundColor: 'rgba(0,0,0,0.8)', 
                        border: 'none', 
                        borderRadius: '8px',
                        color: 'white'
                      }}
                    />
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No cost data available
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-card rounded-xl p-6"
          >
            <h2 className="text-lg font-semibold mb-6">Cost by Destination</h2>
            {barData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData}>
                    <XAxis dataKey="name" tick={{ fill: '#888' }} />
                    <YAxis tick={{ fill: '#888' }} />
                    <Tooltip 
                      formatter={(value: number) => [formatINR(value), '']}
                      contentStyle={{ 
                        backgroundColor: 'rgba(0,0,0,0.8)', 
                        border: 'none', 
                        borderRadius: '8px',
                        color: 'white'
                      }}
                    />
                    <Bar dataKey="Transport" fill="#00c4b4" stackId="a" />
                    <Bar dataKey="Accommodation" fill="#e879f9" stackId="a" />
                    <Bar dataKey="Activities" fill="#fbbf24" stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                Add destinations to see cost breakdown
              </div>
            )}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="glass-card rounded-xl p-6"
        >
          <h2 className="text-lg font-semibold mb-6">Expense Categories</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { name: "Transport", value: costs.transport, icon: Plane, color: "text-primary" },
              { name: "Accommodation", value: costs.accommodation, icon: Hotel, color: "text-accent" },
              { name: "Activities", value: costs.activities, icon: Ticket, color: "text-yellow-400" },
              { name: "Meals", value: costs.meals, icon: Utensils, color: "text-blue-400" }
            ].map((item) => (
              <div key={item.name} className="p-4 bg-secondary/30 rounded-xl">
                <div className={`w-10 h-10 rounded-lg bg-secondary flex items-center justify-center mb-3 ${item.color}`}>
                  <item.icon className="w-5 h-5" />
                </div>
                <p className="text-sm text-muted-foreground">{item.name}</p>
                <p className="text-xl font-bold">{formatINR(item.value)}</p>
                {budget > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {((item.value / budget) * 100).toFixed(0)}% of budget
                  </p>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
