"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useAuth } from "@/lib/auth-context"
import { supabase, Trip } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Plus, 
  Search, 
  Calendar, 
  DollarSign, 
  MapPin,
  Trash2,
  Edit,
  Eye,
  Plane,
  MoreHorizontal
} from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type MyTripsProps = {
  onSelectTrip: (trip: Trip) => void
  onEditTrip: (trip: Trip) => void
  onCreateTrip: () => void
}

export function MyTrips({ onSelectTrip, onEditTrip, onCreateTrip }: MyTripsProps) {
  const { user } = useAuth()
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    if (user) {
      loadTrips()
    }
  }, [user])

  const loadTrips = async () => {
    setLoading(true)
    
    const { data } = await supabase
      .from("trips")
      .select("*")
      .eq("user_id", user?.id)
      .order("created_at", { ascending: false })

    if (data) {
      setTrips(data)
    }

    setLoading(false)
  }

    const handleDelete = async (tripId: string) => {
      // confirm() is not available in iframe, but we'll use toast for feedback
      // In a real app, we'd use a custom dialog component
      const { data: trip } = await supabase.from("trips").select("name").eq("id", tripId).single()
      
      const { error } = await supabase
        .from("trips")
        .delete()
        .eq("id", tripId)

    if (error) {
      toast.error("Failed to delete trip")
      return
    }

    setTrips(trips.filter(t => t.id !== tripId))
    toast.success("Trip deleted")
  }

  const filteredTrips = trips.filter(trip =>
    trip.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen pt-8 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10"
            >
              <div>
                <h1 className="text-3xl font-extrabold mb-2 tracking-tight">My <span className="gradient-text">Trips</span></h1>
                <p className="text-muted-foreground text-base">Manage and view all your travel plans</p>
              </div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button onClick={onCreateTrip} size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground gap-3 px-8 rounded-2xl shadow-xl shadow-primary/20 transition-all text-sm font-bold">
                  <Plus className="w-5 h-5" />
                  Plan New Trip
                </Button>
              </motion.div>
            </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mb-10"
          >
            <div className="relative max-w-md group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Search trips..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 py-6 bg-secondary/30 border-none rounded-2xl focus-visible:ring-primary focus-visible:ring-offset-0"
              />
            </div>
          </motion.div>


        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="glass-card rounded-xl overflow-hidden animate-pulse">
                <div className="aspect-video bg-secondary/50" />
                <div className="p-4 space-y-3">
                  <div className="h-5 bg-secondary/50 rounded w-3/4" />
                  <div className="h-4 bg-secondary/50 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredTrips.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <Plane className="w-20 h-20 mx-auto mb-6 text-muted-foreground/30" />
            <h2 className="text-xl font-semibold mb-2">No trips yet</h2>
            <p className="text-muted-foreground mb-6">
              {searchQuery ? "No trips match your search" : "Start planning your first adventure!"}
            </p>
            {!searchQuery && (
              <Button onClick={onCreateTrip} className="gap-2">
                <Plus className="w-4 h-4" />
                Create Your First Trip
              </Button>
            )}
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredTrips.map((trip, i) => (
              <motion.div
                key={trip.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -12, scale: 1.02 }}
                className="glass-card rounded-3xl overflow-hidden group shadow-lg hover:shadow-2xl transition-all duration-500"
              >
                <div 
                  className="aspect-video relative overflow-hidden cursor-pointer"
                  onClick={() => onSelectTrip(trip)}
                >
                  {trip.cover_image ? (
                    <motion.img 
                      whileHover={{ scale: 1.15 }}
                      transition={{ duration: 0.8 }}
                      src={trip.cover_image}
                      alt={trip.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/30 via-accent/20 to-primary/30 flex items-center justify-center group-hover:bg-primary/40 transition-colors">
                      <Plane className="w-16 h-16 text-primary/30 group-hover:rotate-12 transition-transform duration-500" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute bottom-5 left-6 right-6">
                    <h3 className="text-xl font-bold text-white group-hover:text-primary transition-colors truncate">{trip.name}</h3>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="flex items-center gap-6 text-sm text-muted-foreground mb-6">
                    {trip.start_date && (
                      <div className="flex items-center gap-2 font-medium">
                        <Calendar className="w-4 h-4 text-primary" />
                        {format(new Date(trip.start_date), "MMM d, yyyy")}
                      </div>
                    )}
                    {trip.total_budget > 0 && (
                      <div className="flex items-center gap-2 font-bold text-foreground">
                        <DollarSign className="w-4 h-4 text-accent" />
                        {trip.total_budget.toLocaleString()}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between gap-4">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onSelectTrip(trip)}
                      className="flex-1 gap-2 rounded-xl group/btn"
                    >
                      <Eye className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                      View Details
                    </Button>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-secondary/50">
                          <MoreHorizontal className="w-5 h-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl border-none glass shadow-2xl p-2">
                        <DropdownMenuItem onClick={() => onEditTrip(trip)} className="rounded-lg gap-2 cursor-pointer focus:bg-primary/10">
                          <Edit className="w-4 h-4" />
                          Edit Trip
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDelete(trip.id)}
                          className="text-destructive rounded-lg gap-2 cursor-pointer focus:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
