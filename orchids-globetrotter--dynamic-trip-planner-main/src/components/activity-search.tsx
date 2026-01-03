"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { supabase, Activity, ActivityCategory } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  ArrowLeft,
  Search,
  Clock,
  DollarSign,
  Plus,
  Camera,
  Utensils,
  Mountain,
  Landmark,
  Moon,
  ShoppingBag,
  Sparkles,
  TreePine
} from "lucide-react"
import { toast } from "sonner"

type ActivitySearchProps = {
  stopId: string | null
  onBack: () => void
}

const categoryIcons: Record<string, React.ReactNode> = {
  "camera": <Camera className="w-4 h-4" />,
  "utensils": <Utensils className="w-4 h-4" />,
  "mountain": <Mountain className="w-4 h-4" />,
  "landmark": <Landmark className="w-4 h-4" />,
  "moon": <Moon className="w-4 h-4" />,
  "shopping-bag": <ShoppingBag className="w-4 h-4" />,
  "spa": <Sparkles className="w-4 h-4" />,
  "tree": <TreePine className="w-4 h-4" />
}

export function ActivitySearch({ stopId, onBack }: ActivitySearchProps) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [categories, setCategories] = useState<ActivityCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    
    const [activitiesResult, categoriesResult] = await Promise.all([
      supabase.from("activities").select("*, category:activity_categories(*)").order("name"),
      supabase.from("activity_categories").select("*")
    ])

    if (activitiesResult.data) {
      setActivities(activitiesResult.data)
    }
    if (categoriesResult.data) {
      setCategories(categoriesResult.data)
    }

    setLoading(false)
  }

  const handleAddActivity = async (activity: Activity) => {
    if (!stopId) {
      toast.error("No destination selected")
      return
    }

    const { error } = await supabase
      .from("trip_activities")
      .insert({
        trip_stop_id: stopId,
        activity_id: activity.id,
        name: activity.name,
        description: activity.description,
        estimated_cost: activity.estimated_cost,
        duration_hours: activity.duration_hours,
        category: activity.category?.name
      })

    if (error) {
      toast.error("Failed to add activity")
      return
    }

    toast.success(`${activity.name} added!`)
    onBack()
  }

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = activity.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = !categoryFilter || activity.category_id === categoryFilter
    return matchesSearch && matchesCategory
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
          <h1 className="text-3xl font-bold mb-2">Browse Activities</h1>
          <p className="text-muted-foreground">
            Find things to do and add them to your itinerary
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
              placeholder="Search activities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-secondary/50"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            <Button
              variant={!categoryFilter ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setCategoryFilter(null)}
              className="whitespace-nowrap"
            >
              All
            </Button>
            {categories.map(cat => (
              <Button
                key={cat.id}
                variant={categoryFilter === cat.id ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setCategoryFilter(cat.id)}
                className="whitespace-nowrap gap-1"
              >
                {cat.icon && categoryIcons[cat.icon]}
                {cat.name}
              </Button>
            ))}
          </div>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="glass-card rounded-xl overflow-hidden animate-pulse">
                <div className="aspect-video bg-secondary/50" />
                <div className="p-4 space-y-3">
                  <div className="h-5 bg-secondary/50 rounded w-3/4" />
                  <div className="h-4 bg-secondary/50 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredActivities.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <Sparkles className="w-20 h-20 mx-auto mb-6 text-muted-foreground/30" />
            <h2 className="text-xl font-semibold mb-2">No activities found</h2>
            <p className="text-muted-foreground">
              Try a different search or category
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredActivities.map((activity, i) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -4 }}
                className="glass-card rounded-xl overflow-hidden group"
              >
                <div className="aspect-video relative overflow-hidden">
                  {activity.image_url ? (
                    <img 
                      src={activity.image_url}
                      alt={activity.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center">
                      <Sparkles className="w-12 h-12 text-primary/30" />
                    </div>
                  )}
                  {activity.category && (
                    <div className="absolute top-3 left-3 bg-black/60 px-3 py-1 rounded-full">
                      <span className="text-xs text-white">{activity.category.name}</span>
                    </div>
                  )}
                </div>
                
                <div className="p-4">
                  <h3 className="font-bold mb-2">{activity.name}</h3>
                  {activity.description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {activity.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {activity.duration_hours > 0 && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {activity.duration_hours}h
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        {activity.estimated_cost > 0 ? `$${activity.estimated_cost}` : "Free"}
                      </span>
                    </div>
                    
                    <Button
                      size="sm"
                      onClick={() => handleAddActivity(activity)}
                      className="gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add
                    </Button>
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
