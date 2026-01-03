"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { motion, AnimatePresence, useScroll, useSpring } from "framer-motion"
import { Button } from "@/components/ui/button"

import { 
  Search,
  MapPin,
  Clock,
  IndianRupee,
  Plus,
  Star,
  Camera,
  Utensils,
  Mountain,
  Building,
  Trees,
  Waves,
  ShoppingBag,
  ArrowLeft,
  Sparkles,
  Loader2,
  Check,
  Sun,
  Cloud,
  Heart,
  Navigation,
  Users,
  Calendar,
  Compass,
  Map,
  Image,
  ChevronRight,
  TrendingUp,
  Award,
  Info,
  Globe,
  Zap,
  Ticket,
  Wind,
  Droplets,
  Share2
} from "lucide-react"
import { toast } from "sonner"
import { supabase, Trip } from "@/lib/supabase"

type TouristSpot = {
  id: string
  name: string
  description: string
  category: string
  estimatedCost: number
  duration: string
  rating: number
  image: string
  bestTime: string
  tips: string
  highlights?: string[]
  reviews?: number
}

type DestinationData = {
  destination: string
  country: string
  overview: string
  bestTimeToVisit: string
  averageDailyBudget: number
  weather?: { temp: string; condition: string; humidity: string }
  language?: string
  currency?: string
  timezone?: string
  famousFor?: string[]
  travelTips?: string[]
  spots: TouristSpot[]
}

const SAMPLE_DATA: Record<string, DestinationData> = {
  "rajasthan": {
    destination: "Rajasthan",
    country: "India",
    overview: "The Land of Kings, known for majestic forts, vibrant culture, and desert landscapes",
    bestTimeToVisit: "October to March",
    averageDailyBudget: 3500,
    weather: { temp: "25°C", condition: "Sunny", humidity: "30%" },
    language: "Hindi, Rajasthani",
    currency: "INR (₹)",
    timezone: "IST (UTC+5:30)",
    famousFor: ["Royal Palaces", "Desert Safari", "Traditional Crafts", "Folk Music"],
    travelTips: ["Carry sunscreen and hat", "Book heritage hotels in advance", "Bargain at local markets"],
    spots: [
      { id: "raj1", name: "Amber Fort, Jaipur", description: "Magnificent hilltop fort with stunning architecture and elephant rides", category: "Historical", estimatedCost: 500, duration: "3-4 hours", rating: 4.8, image: "https://images.unsplash.com/photo-1599661046289-e31897846e41?w=800", bestTime: "Morning", tips: "Book elephant rides in advance", highlights: ["Light & Sound Show", "Mirror Palace", "Ganesh Pol"], reviews: 12500 },
      { id: "raj2", name: "City Palace, Udaipur", description: "Grand palace complex overlooking Lake Pichola with museums and courtyards", category: "Historical", estimatedCost: 300, duration: "2-3 hours", rating: 4.7, image: "https://images.unsplash.com/photo-1568495248636-6432b97bd949?w=800", bestTime: "Sunset", tips: "Visit the rooftop restaurant", highlights: ["Lake Views", "Royal Museum", "Crystal Gallery"], reviews: 8900 },
      { id: "raj3", name: "Mehrangarh Fort, Jodhpur", description: "One of India's largest forts with panoramic views of the Blue City", category: "Historical", estimatedCost: 600, duration: "3-4 hours", rating: 4.9, image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800", bestTime: "Morning", tips: "Don't miss the museum inside", highlights: ["Blue City Views", "Zip Lining", "Museum"], reviews: 15600 },
      { id: "raj4", name: "Jaisalmer Desert Safari", description: "Camel safari in the Thar Desert with overnight camping under stars", category: "Adventure", estimatedCost: 2500, duration: "Full day", rating: 4.6, image: "https://images.unsplash.com/photo-1596367407372-96cb88503db6?w=800", bestTime: "Evening", tips: "Book 2-night package for best experience", highlights: ["Camel Ride", "Desert Camp", "Folk Dance"], reviews: 7800 },
      { id: "raj5", name: "Hawa Mahal, Jaipur", description: "Iconic Palace of Winds with 953 small windows for royal women to observe street life", category: "Historical", estimatedCost: 200, duration: "1-2 hours", rating: 4.5, image: "https://images.unsplash.com/photo-1586612438666-ffd0ae97ad36?w=800", bestTime: "Morning", tips: "Best photos from across the street cafe", highlights: ["953 Windows", "Pink Sandstone", "Rooftop View"], reviews: 11200 },
      { id: "raj6", name: "Dal Bati Churma Experience", description: "Traditional Rajasthani cuisine at authentic village-themed restaurants", category: "Food", estimatedCost: 800, duration: "2 hours", rating: 4.7, image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800", bestTime: "Lunch/Dinner", tips: "Try at Chokhi Dhani", highlights: ["Live Cooking", "Folk Performance", "Authentic Taste"], reviews: 5400 }
    ]
  },
  "jaipur": {
    destination: "Jaipur",
    country: "India",
    overview: "The Pink City - capital of Rajasthan known for royal palaces, vibrant bazaars, and rich heritage",
    bestTimeToVisit: "October to March",
    averageDailyBudget: 3000,
    weather: { temp: "28°C", condition: "Clear", humidity: "35%" },
    language: "Hindi, English",
    currency: "INR (₹)",
    timezone: "IST (UTC+5:30)",
    famousFor: ["Pink Architecture", "Gemstones", "Block Printing", "Rajasthani Cuisine"],
    travelTips: ["Visit early morning to avoid crowds", "Use app-based cabs", "Try local lassi"],
    spots: [
      { id: "jai1", name: "Amber Fort", description: "Magnificent hilltop fort with stunning Rajput architecture and royal chambers", category: "Historical", estimatedCost: 500, duration: "3-4 hours", rating: 4.8, image: "https://images.unsplash.com/photo-1599661046289-e31897846e41?w=800", bestTime: "Morning", tips: "Book elephant rides in advance", highlights: ["Sheesh Mahal", "Diwan-e-Aam", "Sukh Niwas"], reviews: 12500 },
      { id: "jai2", name: "Hawa Mahal", description: "Iconic Palace of Winds - architectural marvel with 953 small windows", category: "Historical", estimatedCost: 200, duration: "1-2 hours", rating: 4.5, image: "https://images.unsplash.com/photo-1586612438666-ffd0ae97ad36?w=800", bestTime: "Morning", tips: "Best photos from Wind View Cafe across the street", highlights: ["Iconic Facade", "City Views", "Pink Sandstone"], reviews: 11200 },
      { id: "jai3", name: "City Palace", description: "Royal residence blending Rajasthani and Mughal architecture with museums", category: "Historical", estimatedCost: 500, duration: "2-3 hours", rating: 4.7, image: "https://images.unsplash.com/photo-1568495248636-6432b97bd949?w=800", bestTime: "Morning", tips: "Hire an audio guide for detailed history", highlights: ["Peacock Gate", "Mubarak Mahal", "Royal Armoury"], reviews: 9800 },
      { id: "jai4", name: "Jantar Mantar", description: "UNESCO World Heritage astronomical observation site with giant sundials", category: "Historical", estimatedCost: 200, duration: "1-2 hours", rating: 4.4, image: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800", bestTime: "Any time", tips: "Take a guided tour to understand the instruments", highlights: ["World's Largest Sundial", "Ancient Astronomy", "UNESCO Site"], reviews: 6700 },
      { id: "jai5", name: "Nahargarh Fort", description: "Hilltop fort offering panoramic views of Jaipur, perfect for sunset", category: "Historical", estimatedCost: 200, duration: "2-3 hours", rating: 4.6, image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800", bestTime: "Sunset", tips: "Visit Padao cafe for dinner with views", highlights: ["Sunset Views", "Night Cityscape", "Padao Restaurant"], reviews: 8400 },
      { id: "jai6", name: "Johari Bazaar Shopping", description: "Famous market for exquisite jewelry, gemstones, and traditional textiles", category: "Shopping", estimatedCost: 2000, duration: "3-4 hours", rating: 4.5, image: "https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=800", bestTime: "Evening", tips: "Bargain for 30-40% off initial prices", highlights: ["Kundan Jewelry", "Blue Pottery", "Bandhani Fabrics"], reviews: 5600 }
    ]
  },
  "kerala": {
    destination: "Kerala",
    country: "India",
    overview: "God's Own Country - backwaters, beaches, hill stations, Ayurveda, and lush greenery",
    bestTimeToVisit: "September to March",
    averageDailyBudget: 4000,
    weather: { temp: "29°C", condition: "Tropical", humidity: "75%" },
    language: "Malayalam, English",
    currency: "INR (₹)",
    timezone: "IST (UTC+5:30)",
    famousFor: ["Backwaters", "Ayurveda", "Spices", "Kathakali Dance"],
    travelTips: ["Carry rain gear", "Book houseboats in advance", "Try banana chips"],
    spots: [
      { id: "ker1", name: "Alleppey Houseboat", description: "Overnight stay on traditional kettuvallam cruising through serene backwaters", category: "Experience", estimatedCost: 8000, duration: "24 hours", rating: 4.9, image: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800", bestTime: "Any time", tips: "Book premium houseboats for AC and better food", highlights: ["Sunset Cruise", "Local Cuisine", "Village Views"], reviews: 14200 },
      { id: "ker2", name: "Munnar Tea Gardens", description: "Rolling hills covered with endless tea plantations and cool mountain climate", category: "Nature", estimatedCost: 500, duration: "Full day", rating: 4.8, image: "https://images.unsplash.com/photo-1595815771614-ade9d652a65d?w=800", bestTime: "Morning", tips: "Visit KDHP tea museum for history and tasting", highlights: ["Tea Tasting", "Photo Points", "Cool Climate"], reviews: 11800 },
      { id: "ker3", name: "Kovalam Beach", description: "Crescent-shaped beach perfect for swimming, surfing, and beach relaxation", category: "Beach", estimatedCost: 1000, duration: "Half day", rating: 4.5, image: "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=800", bestTime: "Morning/Evening", tips: "Try the lighthouse beach for best views", highlights: ["Lighthouse", "Surfing", "Ayurveda Centers"], reviews: 7900 },
      { id: "ker4", name: "Periyar Wildlife Sanctuary", description: "Boat safari on Periyar Lake to spot elephants, tigers, and exotic birds", category: "Wildlife", estimatedCost: 1500, duration: "4-5 hours", rating: 4.6, image: "https://images.unsplash.com/photo-1564760055775-d63b17a55c44?w=800", bestTime: "Early morning", tips: "Book bamboo rafting for closer wildlife encounters", highlights: ["Elephants", "Bamboo Rafting", "Bird Watching"], reviews: 6500 },
      { id: "ker5", name: "Kathakali Performance", description: "Traditional dance drama with elaborate costumes, makeup, and storytelling", category: "Culture", estimatedCost: 400, duration: "2 hours", rating: 4.7, image: "https://images.unsplash.com/photo-1582639510494-c80b5de9f148?w=800", bestTime: "Evening", tips: "Arrive early to see the fascinating makeup process", highlights: ["Live Performance", "Makeup Session", "Cultural Experience"], reviews: 4800 },
      { id: "ker6", name: "Kerala Sadhya", description: "Traditional vegetarian feast served on banana leaf with 20+ dishes", category: "Food", estimatedCost: 600, duration: "1-2 hours", rating: 4.8, image: "https://images.unsplash.com/photo-1567337710282-00832b415979?w=800", bestTime: "Lunch", tips: "Best experience during Onam festival in August-September", highlights: ["Banana Leaf", "20+ Dishes", "Payasam Dessert"], reviews: 8200 }
    ]
  },
  "goa": {
    destination: "Goa",
    country: "India",
    overview: "Beach paradise with Portuguese heritage, vibrant nightlife, water sports, and seafood",
    bestTimeToVisit: "November to February",
    averageDailyBudget: 3000,
    weather: { temp: "32°C", condition: "Sunny", humidity: "65%" },
    language: "Konkani, English, Hindi",
    currency: "INR (₹)",
    timezone: "IST (UTC+5:30)",
    famousFor: ["Beaches", "Portuguese Churches", "Nightlife", "Seafood"],
    travelTips: ["Rent a scooter for mobility", "Visit North and South Goa", "Try local feni"],
    spots: [
      { id: "goa1", name: "Baga Beach", description: "Popular beach hub with water sports, beach shacks, and legendary nightlife", category: "Beach", estimatedCost: 1500, duration: "Half day", rating: 4.4, image: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800", bestTime: "Evening", tips: "Try parasailing and jet skiing in the morning", highlights: ["Water Sports", "Beach Shacks", "Tito's Lane"], reviews: 13400 },
      { id: "goa2", name: "Basilica of Bom Jesus", description: "UNESCO World Heritage church housing St. Francis Xavier's relics", category: "Historical", estimatedCost: 0, duration: "1-2 hours", rating: 4.7, image: "https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800", bestTime: "Morning", tips: "Dress modestly - no shorts or sleeveless tops", highlights: ["UNESCO Site", "Portuguese Architecture", "Sacred Relics"], reviews: 8900 },
      { id: "goa3", name: "Dudhsagar Falls", description: "Spectacular 4-tiered waterfall on Karnataka border accessible by jeep safari", category: "Nature", estimatedCost: 2500, duration: "Full day", rating: 4.8, image: "https://images.unsplash.com/photo-1598454444604-eb6167a3318f?w=800", bestTime: "Monsoon/Post-monsoon", tips: "Book jeep safari from Mollem - swimming allowed at base", highlights: ["310m Height", "Train View Point", "Natural Pool"], reviews: 11200 },
      { id: "goa4", name: "Anjuna Flea Market", description: "Iconic Wednesday market with handicrafts, clothes, jewelry, and live music", category: "Shopping", estimatedCost: 2000, duration: "3-4 hours", rating: 4.3, image: "https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=800", bestTime: "Wednesday only", tips: "Bargain hard - start at 50% of quoted price", highlights: ["Handicrafts", "Live Music", "Hippie Vibes"], reviews: 6700 },
      { id: "goa5", name: "Palolem Beach", description: "Quiet crescent beach in South Goa with calm waters perfect for swimming", category: "Beach", estimatedCost: 800, duration: "Half day", rating: 4.6, image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800", bestTime: "Any time", tips: "Stay in beach huts for authentic Goan experience", highlights: ["Silent Disco", "Kayaking", "Dolphin Trips"], reviews: 9500 },
      { id: "goa6", name: "Goan Fish Curry Rice", description: "Authentic Goan seafood experience at beach shacks and local restaurants", category: "Food", estimatedCost: 700, duration: "1-2 hours", rating: 4.7, image: "https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=800", bestTime: "Lunch/Dinner", tips: "Try at Brittos, Martin's Corner, or local beach shacks", highlights: ["Fresh Seafood", "Coconut Curry", "Prawn Balchao"], reviews: 7800 }
    ]
  },
  "manali": {
    destination: "Manali",
    country: "India",
    overview: "Popular hill station in Himachal Pradesh with snow-capped mountains and adventure activities",
    bestTimeToVisit: "March to June, October to February",
    averageDailyBudget: 2500,
    weather: { temp: "12°C", condition: "Cool", humidity: "55%" },
    language: "Hindi, Pahari, English",
    currency: "INR (₹)",
    timezone: "IST (UTC+5:30)",
    famousFor: ["Snow", "Adventure Sports", "Cafes", "Hippie Culture"],
    travelTips: ["Rent warm jackets locally", "Book Rohtang permits early", "Try Old Manali cafes"],
    spots: [
      { id: "man1", name: "Solang Valley", description: "Adventure paradise offering paragliding, skiing, zorbing, and gondola rides", category: "Adventure", estimatedCost: 2500, duration: "Half day", rating: 4.6, image: "https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=800", bestTime: "Any season", tips: "Book activities on-site but negotiate prices", highlights: ["Paragliding", "Skiing", "Ropeway"], reviews: 10500 },
      { id: "man2", name: "Hadimba Temple", description: "4th-century pagoda temple dedicated to demon goddess Hadimba", category: "Spiritual", estimatedCost: 0, duration: "1-2 hours", rating: 4.5, image: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800", bestTime: "Morning", tips: "Dress in traditional costume for photos (paid)", highlights: ["Ancient Temple", "Cedar Forest", "Yak Photos"], reviews: 8700 },
      { id: "man3", name: "Rohtang Pass", description: "Legendary mountain pass at 13,050 ft - gateway to Lahaul-Spiti", category: "Adventure", estimatedCost: 3000, duration: "Full day", rating: 4.7, image: "https://images.unsplash.com/photo-1585409677983-0f6c41ca9c3b?w=800", bestTime: "May-June", tips: "Get online permit at least 48 hours before", highlights: ["Snow Activities", "Mountain Views", "Atal Tunnel"], reviews: 12300 },
      { id: "man4", name: "Old Manali", description: "Bohemian area with riverside cafes, hippie vibes, and quirky shops", category: "Culture", estimatedCost: 500, duration: "3-4 hours", rating: 4.4, image: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800", bestTime: "Evening", tips: "Try Lazy Dog, Drifters Inn for cafe experience", highlights: ["Riverside Cafes", "Live Music", "Shopping"], reviews: 7200 },
      { id: "man5", name: "Beas River Rafting", description: "Thrilling white water rafting through scenic Kullu Valley", category: "Adventure", estimatedCost: 1500, duration: "2-3 hours", rating: 4.6, image: "https://images.unsplash.com/photo-1530866495561-507c9faab2ed?w=800", bestTime: "May-June", tips: "Book through HPTDC or certified operators only", highlights: ["Grade 3 Rapids", "Valley Views", "14km Stretch"], reviews: 6800 }
    ]
  },
  "london": {
    destination: "London",
    country: "United Kingdom",
    overview: "A global hub of history, culture, and iconic landmarks along the River Thames",
    bestTimeToVisit: "March to May, September to November",
    averageDailyBudget: 12000,
    weather: { temp: "15°C", condition: "Overcast", humidity: "70%" },
    language: "English",
    currency: "GBP (£)",
    timezone: "GMT (UTC+0)",
    famousFor: ["Royal History", "Museums", "Modern Architecture", "Parks"],
    travelTips: ["Use an Oyster card or contactless for travel", "Visit museums on weekdays", "Carry an umbrella"],
    spots: [
      { id: "lon1", name: "Tower of London", description: "Historic castle on the north bank of the River Thames, home to the Crown Jewels", category: "Historical", estimatedCost: 3000, duration: "3-4 hours", rating: 4.8, image: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800", bestTime: "Morning", tips: "Join a Beefeater tour for the best stories", highlights: ["Crown Jewels", "White Tower", "Traitor's Gate"], reviews: 45000 },
      { id: "lon2", name: "The British Museum", description: "World-renowned museum dedicated to human history, art, and culture", category: "Culture", estimatedCost: 0, duration: "4-5 hours", rating: 4.7, image: "https://images.unsplash.com/photo-1563214815-585a9756181b?w=800", bestTime: "Afternoon", tips: "Booking is free but recommended in advance", highlights: ["Rosetta Stone", "Elgin Marbles", "Egyptian Mummies"], reviews: 62000 },
      { id: "lon3", name: "London Eye", description: "Iconic cantilevered observation wheel offering panoramic city views", category: "Experience", estimatedCost: 3500, duration: "1 hour", rating: 4.5, image: "https://images.unsplash.com/photo-1505761671935-60b3a7427bad?w=800", bestTime: "Sunset", tips: "Book fast-track tickets to skip the lines", highlights: ["Panoramic Views", "Thames Vista", "City Skyline"], reviews: 38000 },
      { id: "lon4", name: "Hyde Park", description: "One of the largest royal parks in London, famous for its Speakers' Corner", category: "Nature", estimatedCost: 0, duration: "2-3 hours", rating: 4.6, image: "https://images.unsplash.com/photo-1549421263-5ec394a5ad4c?w=800", bestTime: "Afternoon", tips: "Rent a pedal boat on the Serpentine", highlights: ["Serpentine Lake", "Speakers' Corner", "Diana Memorial"], reviews: 25000 },
      { id: "lon5", name: "Borough Market", description: "Historic food market with exceptional British and international produce", category: "Food", estimatedCost: 1500, duration: "2 hours", rating: 4.8, image: "https://images.unsplash.com/photo-1533777419517-3e4017e2e15a?w=800", bestTime: "Lunchtime", tips: "Visit on Thursday or Friday for the full market", highlights: ["Artisan Cheese", "Street Food", "Fresh Produce"], reviews: 18000 }
    ]
  }
}

const getCategoryIcon = (category: string) => {
  switch (category.toLowerCase()) {
    case "historical": return Building
    case "nature": return Trees
    case "beach": return Waves
    case "adventure": return Mountain
    case "food": return Utensils
    case "shopping": return ShoppingBag
    case "culture":
    case "spiritual":
    case "experience": return Camera
    case "wildlife": return Trees
    default: return MapPin
  }
}

const getWeatherIcon = (condition: string) => {
  if (condition.toLowerCase().includes("sunny") || condition.toLowerCase().includes("clear")) return Sun
  if (condition.toLowerCase().includes("rain") || condition.toLowerCase().includes("showers")) return Droplets
  if (condition.toLowerCase().includes("wind")) return Wind
  return Cloud
}

type DestinationSuggestionsProps = {
  trip: Trip | null
  onAddToTrip: (spot: TouristSpot, destination: string) => void
  onBack: () => void
}

const FloatingBlob = ({ className, delay = 0 }: { className: string, delay?: number }) => (
  <motion.div
    className={`absolute rounded-full blur-3xl pointer-events-none ${className}`}
    animate={{
      x: [0, 50, -30, 0],
      y: [0, -40, 60, 0],
      scale: [1, 1.2, 0.8, 1],
      rotate: [0, 90, -90, 0],
    }}
    transition={{
      duration: 15,
      repeat: Infinity,
      delay,
      ease: "easeInOut"
    }}
  />
)

const AttractionCard = ({ spot, viewMode, i, addedSpots, savedSpots, onSaveSpot, onAddSpot, destinationName }: any) => {
  const CategoryIcon = getCategoryIcon(spot.category)
  const isAdded = addedSpots.has(spot.id)
  const isSaved = savedSpots.has(spot.id)
  const [isHovered, setIsHovered] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || viewMode === "list") return
    const rect = cardRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const rotateX = (y - centerY) / 15
    const rotateY = (centerX - x) / 15
    
    cardRef.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`
  }

  const handleMouseLeave = () => {
    if (!cardRef.current) return
    cardRef.current.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg)`
    setIsHovered(false)
  }

  return (
    <motion.div
      ref={cardRef}
      layout
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ 
        delay: i * 0.05,
        type: "spring",
        stiffness: 260,
        damping: 20
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={() => setIsHovered(true)}
      className={`glass-card rounded-[2rem] overflow-hidden group border border-white/10 hover:border-emerald-500/50 transition-all duration-300 relative ${
        viewMode === "list" ? "flex flex-row h-64" : "flex flex-col"
      }`}
      style={{ transformStyle: "preserve-3d" }}
    >
      <div className={`relative overflow-hidden ${viewMode === "list" ? "w-72 flex-shrink-0" : "aspect-[4/3]"}`}>
        <motion.img
          src={spot.image}
          alt={spot.name}
          className="w-full h-full object-cover"
          animate={{ scale: isHovered ? 1.15 : 1 }}
          transition={{ duration: 0.6 }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent opacity-70 group-hover:opacity-85 transition-opacity duration-500" />
        
        <div className="absolute top-4 left-4 right-4 flex items-start justify-between" style={{ transform: "translateZ(30px)" }}>
          <motion.span 
            className="px-4 py-2 rounded-full bg-black/60 backdrop-blur-xl text-white text-xs font-bold flex items-center gap-2 border border-white/10 shadow-lg"
            whileHover={{ scale: 1.05, backgroundColor: "rgba(16, 185, 129, 0.8)" }}
          >
            <CategoryIcon className="w-4 h-4" />
            {spot.category}
          </motion.span>
          <div className="flex gap-2">
            <motion.button
              whileTap={{ scale: 0.8 }}
              whileHover={{ scale: 1.2, rotate: 15 }}
              onClick={(e) => {
                e.stopPropagation()
                onSaveSpot(spot.id)
              }}
              className={`p-2.5 rounded-full backdrop-blur-xl border border-white/10 shadow-xl transition-all ${
                isSaved ? "bg-rose-500 text-white" : "bg-black/60 text-white hover:bg-black/80"
              }`}
            >
              <Heart className={`w-5 h-5 ${isSaved ? "fill-current" : ""}`} />
            </motion.button>
          </div>
        </div>
        
        <div className="absolute bottom-4 left-4 right-4" style={{ transform: "translateZ(20px)" }}>
          <div className="flex items-center gap-3">
            <motion.div 
              className="flex items-center gap-1.5 bg-amber-500/90 backdrop-blur-md px-3 py-1 rounded-full shadow-lg"
              whileHover={{ scale: 1.1 }}
            >
              <Star className="w-4 h-4 text-white fill-white" />
              <span className="text-sm font-bold text-white">{spot.rating}</span>
            </motion.div>
            {spot.reviews && (
              <span className="text-xs text-white/90 font-bold drop-shadow-md bg-black/40 px-2 py-1 rounded-lg">
                {(spot.reviews / 1000).toFixed(1)}k REVIEWS
              </span>
            )}
          </div>
        </div>
      </div>
      
      <div className={`p-6 flex flex-col ${viewMode === "list" ? "flex-1 justify-center" : "flex-1"}`} style={{ transform: "translateZ(10px)" }}>
        <h4 className="font-black text-xl mb-3 group-hover:text-emerald-500 transition-colors tracking-tight">{spot.name}</h4>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2 leading-relaxed font-medium">{spot.description}</p>
        
        {spot.highlights && (
          <div className="flex flex-wrap gap-2 mb-4">
            {spot.highlights.slice(0, 3).map((h: string, idx: number) => (
              <motion.span 
                key={idx} 
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + idx * 0.1 }}
                className="px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 text-[10px] font-black uppercase tracking-wider border border-emerald-500/20"
              >
                {h}
              </motion.span>
            ))}
          </div>
        )}
        
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-secondary/30 group-hover:bg-emerald-500/5 transition-colors border border-transparent group-hover:border-emerald-500/20">
            <IndianRupee className="w-4 h-4 text-emerald-500 mb-1" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Cost</span>
            <span className="text-sm font-black text-foreground">₹{spot.estimatedCost}</span>
          </div>
          <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-secondary/30 group-hover:bg-blue-500/5 transition-colors border border-transparent group-hover:border-blue-500/20">
            <Clock className="w-4 h-4 text-blue-500 mb-1" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Time</span>
            <span className="text-sm font-black text-foreground">{spot.duration.split(" ")[0]}H</span>
          </div>
          <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-secondary/30 group-hover:bg-amber-500/5 transition-colors border border-transparent group-hover:border-amber-500/20">
            <Sun className="w-4 h-4 text-amber-500 mb-1" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Best</span>
            <span className="text-xs font-black text-foreground">{spot.bestTime}</span>
          </div>
        </div>

        <motion.div 
          className="text-xs text-muted-foreground mb-5 p-4 rounded-2xl bg-gradient-to-br from-emerald-500/5 to-teal-500/5 border border-emerald-500/10"
          animate={{ x: isHovered ? 5 : 0 }}
        >
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-3 h-3 text-emerald-500" />
            <span className="font-black text-emerald-600 uppercase tracking-tighter text-[10px]">Expert Insight</span>
          </div>
          <p className="italic font-medium leading-relaxed">{spot.tips}</p>
        </motion.div>

        <div className="flex gap-3 mt-auto">
          <Button
            onClick={() => onAddSpot(spot)}
            disabled={isAdded}
            className={`flex-1 h-12 gap-2 rounded-2xl font-black uppercase tracking-widest text-xs transition-all duration-500 ${
              isAdded 
                ? "bg-emerald-600 cursor-default" 
                : "bg-emerald-500 hover:bg-emerald-600 shadow-[0_8px_30px_rgb(16,185,129,0.3)] hover:shadow-emerald-500/50 hover:-translate-y-1"
            }`}
          >
            {isAdded ? (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-2">
                <Check className="w-4 h-4 stroke-[3]" />
                ADDED TO TRIP
              </motion.div>
            ) : (
              <>
                <Ticket className="w-4 h-4" />
                GET TICKETS
              </>
            )}
          </Button>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="outline"
              size="icon"
              className="w-12 h-12 rounded-2xl border-2 border-emerald-500/20 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all shadow-lg"
              onClick={() => {
                const url = `https://www.google.com/maps/search/${encodeURIComponent(spot.name + " " + destinationName)}`
                window.parent.postMessage({ type: "OPEN_EXTERNAL_URL", data: { url } }, "*")
              }}
            >
              <Navigation className="w-5 h-5" />
            </Button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}

export function DestinationSuggestions({ trip, onAddToTrip, onBack }: DestinationSuggestionsProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [destinationData, setDestinationData] = useState<DestinationData | null>(null)
  const [addedSpots, setAddedSpots] = useState<Set<string>>(new Set())
  const [savedSpots, setSavedSpots] = useState<Set<string>>(new Set())
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  })
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  })

  const allDestinations = Object.keys(SAMPLE_DATA).map(key => SAMPLE_DATA[key].destination)

  const searchDestination = useCallback((query: string) => {
    if (!query.trim()) {
      setDestinationData(null)
      return
    }

    setLoading(true)
    
    const normalizedQuery = query.toLowerCase().trim()
    const matchedKey = Object.keys(SAMPLE_DATA).find(key => 
      normalizedQuery === key || 
      key.includes(normalizedQuery) || 
      normalizedQuery.includes(key) ||
      SAMPLE_DATA[key].destination.toLowerCase() === normalizedQuery ||
      SAMPLE_DATA[key].destination.toLowerCase().includes(normalizedQuery)
    )

    setTimeout(() => {
      if (matchedKey) {
        setDestinationData(SAMPLE_DATA[matchedKey])
      } else {
        const defaultData: DestinationData = {
          destination: query,
          country: "International",
          overview: `Discover the unique charm and local experiences of ${query}, a destination waiting to be explored.`,
          bestTimeToVisit: "Seasonal",
          averageDailyBudget: 5000,
          weather: { temp: "22°C", condition: "Variable", humidity: "50%" },
          language: "Local Dialects, English",
          currency: "Local Currency",
          timezone: "Local Time",
          famousFor: ["Local Landmarks", "Cultural Sites", "Culinary Experiences"],
          travelTips: ["Explore the local neighborhoods", "Try authentic local cuisine", "Respect local customs"],
          spots: [
            { id: `${query}1`, name: `${query} City Center`, description: "The vibrant heart of the city with historical landmarks and modern attractions", category: "Culture", estimatedCost: 1000, duration: "3 hours", rating: 4.5, image: "https://images.unsplash.com/photo-1449034446853-66c86144b0ad?w=800", bestTime: "Morning", tips: "Great for walking tours", highlights: ["Architecture", "Public Squares", "Statues"], reviews: 2500 },
            { id: `${query}2`, name: `The ${query} Museum`, description: "Showcasing the rich history and artistic heritage of the region", category: "Historical", estimatedCost: 1500, duration: "2-3 hours", rating: 4.6, image: "https://images.unsplash.com/photo-1518998053502-53cc8f24b78a?w=800", bestTime: "Afternoon", tips: "Check for temporary exhibitions", highlights: ["Art Collections", "Historic Artifacts", "Interactive Displays"], reviews: 1800 },
            { id: `${query}3`, name: `${query} Public Park`, description: "A scenic green space perfect for relaxation and outdoor activities", category: "Nature", estimatedCost: 0, duration: "2 hours", rating: 4.4, image: "https://images.unsplash.com/photo-1585938389612-a552a28d6914?w=800", bestTime: "Sunset", tips: "Ideal for a picnic", highlights: ["Walking Trails", "Flower Gardens", "Lakeside Views"], reviews: 3200 },
            { id: `${query}4`, name: `${query} Food Market`, description: "Sample the best local flavors and artisanal products", category: "Food", estimatedCost: 1200, duration: "2 hours", rating: 4.7, image: "https://images.unsplash.com/photo-1533777419517-3e4017e2e15a?w=800", bestTime: "Lunch", tips: "Try the signature local dish", highlights: ["Street Food", "Fresh Produce", "Local Spices"], reviews: 4100 }
          ]
        }
        setDestinationData(defaultData)
      }
      setLoading(false)
    }, 600)
  }, [])

  useEffect(() => {
    if (searchQuery.length >= 2) {
      const filtered = allDestinations.filter(dest => 
        dest.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setSuggestions(filtered)
      setShowSuggestions(filtered.length > 0)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }, [searchQuery, allDestinations])

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchQuery.length >= 3) {
        searchDestination(searchQuery)
        setShowSuggestions(false)
      }
    }, 400)

    return () => clearTimeout(debounceTimer)
  }, [searchQuery, searchDestination])

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion)
    setShowSuggestions(false)
    searchDestination(suggestion)
  }

  const handleSaveSpot = (spotId: string) => {
    setSavedSpots(prev => {
      const newSet = new Set(prev)
      if (newSet.has(spotId)) {
        newSet.delete(spotId)
        toast.info("Removed from favorites")
      } else {
        newSet.add(spotId)
        toast.success("Added to favorites!", {
          icon: <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
        })
      }
      return newSet
    })
  }

  const handleAddSpot = async (spot: TouristSpot) => {
    if (!trip) {
      toast.error("Create a trip first to add activities")
      return
    }

    try {
      const { data: existingStops } = await supabase
        .from("trip_stops")
        .select("id")
        .eq("trip_id", trip.id)
        .eq("city_name", destinationData?.destination || searchQuery)
        .single()

      let stopId = existingStops?.id

      if (!stopId) {
        const { data: newStop, error: stopError } = await supabase
          .from("trip_stops")
          .insert({
            trip_id: trip.id,
            city_name: destinationData?.destination || searchQuery,
            country: destinationData?.country || "India",
            order_index: 0
          })
          .select()
          .single()

        if (stopError) throw stopError
        stopId = newStop.id
      }

      const { error: activityError } = await supabase
        .from("trip_activities")
        .insert({
          trip_stop_id: stopId,
          name: spot.name,
          description: spot.description,
          duration_hours: parseFloat(spot.duration) || 3,
          estimated_cost: spot.estimatedCost,
          category: spot.category,
          is_custom: true,
          order_index: 0
        })

      if (activityError) throw activityError

      setAddedSpots(prev => new Set([...prev, spot.id]))
      toast.success(`Trip updated: ${spot.name} added!`, {
        description: `Check your itinerary for ${destinationData?.destination || searchQuery}`,
        icon: <Plus className="w-4 h-4 text-emerald-500" />
      })
      onAddToTrip(spot, destinationData?.destination || searchQuery)
    } catch (error) {
      console.error("Error adding spot:", error)
      toast.error("Failed to add activity")
    }
  }

  const categories = destinationData 
    ? ["all", ...new Set(destinationData.spots.map(s => s.category))]
    : []

  const filteredSpots = destinationData?.spots.filter(spot => 
    selectedCategory === "all" || spot.category === selectedCategory
  ) || []

  const WeatherIcon = destinationData?.weather ? getWeatherIcon(destinationData.weather.condition) : Sun

  return (
    <div ref={containerRef} className="min-h-screen pt-12 pb-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-950/20 via-background to-background">
      <motion.div 
        className="fixed top-0 left-0 right-0 h-1 bg-emerald-500 origin-left z-50"
        style={{ scaleX }}
      />
      
      <FloatingBlob className="w-[500px] h-[500px] bg-emerald-500/10 top-[-200px] left-[-100px]" delay={0} />
      <FloatingBlob className="w-[400px] h-[400px] bg-teal-500/10 bottom-[-100px] right-[-100px]" delay={2} />
      <FloatingBlob className="w-[300px] h-[300px] bg-cyan-500/10 top-[20%] right-[10%]" delay={4} />

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-12"
        >
          <Button 
            variant="ghost" 
            onClick={onBack} 
            className="mb-8 group h-10 px-4 rounded-2xl bg-secondary/20 hover:bg-secondary/40 transition-all border border-white/5"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            <span className="font-bold uppercase tracking-widest text-[10px]">Back to Planner</span>
          </Button>
          
          <div className="flex flex-col md:flex-row md:items-end gap-6">
            <motion.div 
              className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center shadow-[0_20px_50px_rgba(16,185,129,0.3)] border-2 border-white/20"
              animate={{ 
                rotate: [0, 5, -5, 0],
                y: [0, -10, 0]
              }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            >
              <Compass className="w-10 h-10 text-white drop-shadow-lg" />
            </motion.div>
            <div className="flex-1">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex items-center gap-2 mb-2"
              >
                <span className="h-px w-8 bg-emerald-500/50" />
                <span className="text-emerald-500 font-black uppercase tracking-[0.2em] text-[10px]">Exploration Engine</span>
              </motion.div>
              <h1 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent tracking-tighter mb-2">
                Discover Places
              </h1>
              <p className="text-muted-foreground font-medium text-base max-w-xl">
                The smart way to find the best attractions, food, and culture in any city.
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 100 }}
          className="glass-card rounded-[2rem] p-6 mb-12 border border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] bg-background/40 backdrop-blur-3xl relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
          
          <div className="relative">
            <div className="relative flex-1 group">
              <div className="absolute inset-0 bg-emerald-500/5 blur-xl group-focus-within:bg-emerald-500/10 transition-colors rounded-2xl" />
              <Search className={`absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-300 z-10 ${searchQuery ? "text-emerald-500" : "text-muted-foreground"}`} />
              <input
                type="text"
                placeholder="Search a city... (e.g., London, Goa, Jaipur)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-14 h-16 text-lg font-bold bg-secondary/30 border-2 border-transparent focus:border-emerald-500/30 rounded-2xl transition-all placeholder:text-muted-foreground/50 shadow-inner focus:outline-none relative z-10"
              />
              <AnimatePresence>
                {loading && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-3 bg-emerald-500/10 px-4 py-2 rounded-2xl border border-emerald-500/20 z-10"
                  >
                    <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />
                    <span className="text-xs font-black text-emerald-600 uppercase tracking-widest">Searching</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <AnimatePresence>
              {showSuggestions && suggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.98 }}
                  className="absolute z-30 w-full mt-4 bg-background/90 backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-[0_24px_48px_-12px_rgba(0,0,0,0.3)] overflow-hidden"
                >
                  <div className="p-4 border-b border-white/5 bg-emerald-500/5">
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest px-2">Top Suggestions</span>
                  </div>
                  {suggestions.map((suggestion, idx) => (
                    <motion.button
                      key={suggestion}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full px-6 py-4 text-left hover:bg-emerald-500/10 flex items-center gap-4 transition-all group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 group-hover:rotate-6 transition-all shadow-sm">
                        <MapPin className="w-5 h-5 text-emerald-500" />
                      </div>
                      <div className="flex-1">
                        <span className="font-bold text-lg group-hover:text-emerald-500 transition-colors">{suggestion}</span>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">Verified Destination</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex flex-wrap items-center gap-4 mt-8">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Trending Now:</span>
            </div>
            {["Goa", "Jaipur", "Kerala", "Manali", "London"].map((place, idx) => (
              <motion.button
                key={place}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + idx * 0.1 }}
                onClick={() => {
                  setSearchQuery(place)
                  searchDestination(place)
                }}
                className="px-6 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl bg-secondary/50 hover:bg-emerald-500/10 hover:text-emerald-500 border border-white/5 hover:border-emerald-500/30 transition-all hover:-translate-y-1 shadow-sm"
              >
                {place}
              </motion.button>
            ))}
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {loading && !destinationData && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-32"
            >
              <div className="relative">
                <motion.div
                  animate={{ rotate: 360, scale: [1, 1.1, 1] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="w-32 h-32 rounded-full border-[6px] border-emerald-500/10 border-t-emerald-500 shadow-[0_0_40px_rgba(16,185,129,0.2)]"
                />
                <motion.div
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 m-auto w-12 h-12 flex items-center justify-center"
                >
                  <Globe className="w-12 h-12 text-emerald-500" />
                </motion.div>
              </div>
              <motion.p 
                animate={{ y: [0, 5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="mt-8 text-lg font-black uppercase tracking-[0.3em] text-emerald-600/60"
              >
                Generating Itinerary...
              </motion.p>
            </motion.div>
          )}

          {destinationData && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -40 }}
              className="space-y-12"
            >
              <motion.div 
                className="glass-card rounded-[3rem] p-10 mb-12 border border-white/10 overflow-hidden relative shadow-2xl"
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
              >
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-10 relative z-10">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-6">
                      <h2 className="text-3xl md:text-4xl font-black tracking-tighter leading-none">{destinationData.destination}</h2>
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="px-4 py-1.5 rounded-xl bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/30 flex items-center gap-2"
                      >
                        <MapPin className="w-3 h-3 stroke-[3]" />
                        {destinationData.country}
                      </motion.div>
                    </div>
                    <p className="text-base text-muted-foreground font-medium mb-8 leading-relaxed max-w-3xl">{destinationData.overview}</p>
                    
                    {destinationData.famousFor && (
                      <div className="flex flex-wrap gap-3 mb-8">
                        {destinationData.famousFor.map((item, idx) => (
                          <motion.span 
                            key={idx} 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 + idx * 0.1 }}
                            className="px-5 py-2.5 rounded-2xl bg-secondary/50 text-xs font-black uppercase tracking-widest flex items-center gap-2 border border-white/5 hover:border-emerald-500/30 transition-colors"
                          >
                            <Award className="w-4 h-4 text-amber-500" />
                            {item}
                          </motion.span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 lg:grid-cols-4 xl:flex xl:flex-col gap-4">
                    {[
                      { icon: WeatherIcon, label: "Weather", value: destinationData.weather?.temp, sub: destinationData.weather?.condition, color: "text-amber-500", bg: "bg-amber-500/10" },
                      { icon: Calendar, label: "Best Time", value: destinationData.bestTimeToVisit, color: "text-emerald-500", bg: "bg-emerald-500/10" },
                      { icon: IndianRupee, label: "Daily Budget", value: `₹${destinationData.averageDailyBudget.toLocaleString("en-IN")}`, color: "text-blue-500", bg: "bg-blue-500/10" },
                      { icon: Users, label: "Main Language", value: destinationData.language?.split(",")[0], color: "text-purple-500", bg: "bg-purple-500/10" }
                    ].map((item, idx) => (
                      <motion.div 
                        key={idx}
                        className="glass-card rounded-[1.5rem] p-5 text-left border border-white/5 hover:border-emerald-500/30 transition-all shadow-xl xl:w-56"
                        whileHover={{ scale: 1.05, x: 10 }}
                      >
                        <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center mb-3`}>
                          <item.icon className={`w-6 h-6 ${item.color}`} />
                        </div>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">{item.label}</p>
                        <p className="font-black text-lg leading-tight">{item.value}</p>
                        {item.sub && <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter mt-1">{item.sub}</p>}
                      </motion.div>
                    ))}
                  </div>
                </div>

                {destinationData.travelTips && (
                  <motion.div 
                    className="mt-12 p-8 rounded-[2rem] bg-gradient-to-r from-amber-500/5 to-orange-500/5 border border-amber-500/10 relative overflow-hidden"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <div className="absolute top-0 left-0 w-2 h-full bg-amber-500/50" />
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                        <Info className="w-6 h-6 text-amber-500" />
                      </div>
                      <span className="font-black text-amber-600 uppercase tracking-widest">Travel Smart: Pro Recommendations</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {destinationData.travelTips.map((tip, idx) => (
                        <div key={idx} className="flex items-start gap-3 bg-white/5 p-4 rounded-2xl border border-white/5 hover:border-amber-500/20 transition-all">
                          <Check className="w-4 h-4 text-amber-500 mt-1 shrink-0" />
                          <p className="text-sm font-bold text-foreground/80 leading-relaxed">{tip}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </motion.div>

              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 sticky top-4 z-20 px-4 py-4 rounded-[2rem] bg-background/60 backdrop-blur-2xl border border-white/10 shadow-2xl">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black tracking-tight leading-none">
                      Top Curated Attractions
                    </h3>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mt-1">
                      Showing {filteredSpots.length} Elite Hand-picked spots
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex gap-2 p-1.5 rounded-2xl bg-secondary/40 border border-white/5">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                          selectedCategory === cat 
                            ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 scale-105" 
                            : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                        }`}
                      >
                        {cat === "all" ? "Explore All" : cat}
                      </button>
                    ))}
                  </div>
                  
                  <div className="flex gap-2 p-1.5 rounded-2xl bg-secondary/40 border border-white/5">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`p-2.5 rounded-xl transition-all ${viewMode === "grid" ? "bg-emerald-500 text-white shadow-lg" : "text-muted-foreground hover:bg-white/5"}`}
                    >
                      <Image className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={`p-2.5 rounded-xl transition-all ${viewMode === "list" ? "bg-emerald-500 text-white shadow-lg" : "text-muted-foreground hover:bg-white/5"}`}
                    >
                      <Map className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
              
              <motion.div 
                className={viewMode === "grid" 
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                  : "flex flex-col gap-6"
                }
                layout
              >
                {filteredSpots.map((spot, i) => (
                  <AttractionCard 
                    key={spot.id}
                    spot={spot}
                    viewMode={viewMode}
                    i={i}
                    addedSpots={addedSpots}
                    savedSpots={savedSpots}
                    onSaveSpot={handleSaveSpot}
                    onAddSpot={handleAddSpot}
                    destinationName={destinationData.destination}
                  />
                ))}
              </motion.div>
            </motion.div>
          )}

          {!loading && !destinationData && (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center py-40 glass-card rounded-[4rem] border border-white/5 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none" />
              <motion.div 
                className="w-48 h-48 mx-auto mb-10 rounded-full bg-gradient-to-br from-emerald-500/10 to-teal-500/10 flex items-center justify-center relative border border-white/10"
                animate={{ 
                  boxShadow: ["0 0 20px rgba(16,185,129,0.1)", "0 0 50px rgba(16,185,129,0.2)", "0 0 20px rgba(16,185,129,0.1)"],
                  scale: [1, 1.05, 1]
                }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                <div className="absolute inset-0 animate-pulse bg-emerald-500/5 rounded-full" />
                <Globe className="w-24 h-24 text-emerald-500/40" />
              </motion.div>
              <h3 className="text-4xl font-black mb-4 tracking-tight">Your Next Adventure Awaits</h3>
              <p className="text-muted-foreground font-medium text-xl max-w-2xl mx-auto mb-10 leading-relaxed px-4">
                Enter any destination above. Our engine will curate the most iconic landmarks, hidden gems, and local experiences instantly.
              </p>
              <div className="flex flex-wrap justify-center gap-4 px-4">
                {[
                  { label: "Elite Coastal Escapes", icon: <Waves className="w-4 h-4" /> },
                  { label: "Majestic Mountain Peaks", icon: <Mountain className="w-4 h-4" /> },
                  { label: "Royal Heritage Trails", icon: <Building className="w-4 h-4" /> },
                  { label: "Exotic Food Journeys", icon: <Utensils className="w-4 h-4" /> }
                ].map((cat, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * idx }}
                    className="flex items-center gap-3 px-6 py-3 rounded-[1.25rem] bg-secondary/30 text-xs font-black uppercase tracking-widest text-muted-foreground border border-white/5 shadow-lg backdrop-blur-sm"
                  >
                    <span className="text-emerald-500">{cat.icon}</span>
                    {cat.label}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {addedSpots.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 glass-card px-10 py-6 rounded-full border-2 border-emerald-500/50 shadow-[0_20px_50px_rgba(16,185,129,0.4)] flex items-center gap-8 bg-emerald-950/90 backdrop-blur-2xl"
          >
            <div className="flex -space-x-4">
              {Array.from(addedSpots).slice(-3).map((id) => {
                const spot = destinationData?.spots.find(s => s.id === id)
                return (
                  <motion.div 
                    key={id}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-12 h-12 rounded-full border-4 border-emerald-950 overflow-hidden shadow-xl"
                  >
                    <img src={spot?.image} className="w-full h-full object-cover" alt="" />
                  </motion.div>
                )
              })}
            </div>
            <div className="flex flex-col">
              <span className="text-emerald-400 font-black uppercase tracking-widest text-[10px]">Active Session</span>
              <p className="text-white font-black text-xl leading-none">
                {addedSpots.size} {addedSpots.size === 1 ? "Activity" : "Activities"} Selected
              </p>
            </div>
            <div className="h-10 w-px bg-white/20" />
            <Button 
              onClick={onBack}
              className="bg-white text-emerald-900 hover:bg-emerald-500 hover:text-white font-black uppercase tracking-widest text-xs h-12 px-8 rounded-2xl shadow-xl transition-all active:scale-95"
            >
              Finish Planning
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-white/60 hover:text-white hover:bg-white/10 rounded-full"
              onClick={() => {
                const text = `I'm planning a trip to ${destinationData?.destination}! I've already added ${addedSpots.size} amazing spots.`
                if (navigator.share) {
                  navigator.share({ title: "My Trip", text, url: window.location.href })
                } else {
                  toast.success("Link copied to clipboard!")
                }
              }}
            >
              <Share2 className="w-5 h-5" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
