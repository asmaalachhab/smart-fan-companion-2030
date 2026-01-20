export type Phase = 'Groupe' | 'Huitièmes' | 'Quarts' | 'Demi-finales' | 'Finale'

export interface Stadium {
  id: string
  name: string
  city: string
  country: string
  capacity: number
  imageUrl: string
  coordinates: { lat: number; lng: number }
}

export interface Match {
  id: string
  homeTeam: string
  awayTeam: string
  date: string
  time: string
  stadium: string
  stadiumId: string
  city: string
  country: string
  phase: Phase
  price: number
  availableSeats: number
  homeFlag: string
  awayFlag: string
}

export interface FanZone {
  id: string
  name: string
  city: string
  country: string
  coordinates: { lat: number; lng: number }
  capacity: number
  activities: string[]
}

export type RecommendationType = 'hotel' | 'restaurant' | 'activity' | 'transport'

export interface Recommendation {
  id: string
  type: RecommendationType
  title: string
  description: string
  price: number
  rating: number
  imageUrl: string
}

export interface Ticket {
  id: string
  matchId: string
  section: string
  row: string
  seat: string
  price: number
  qrCode: string
  purchaseDate: string
  match?: Match
}

export interface Profile {
  id: string
  email: string
  name: string
  favoriteTeam?: string | null
  avatarUrl?: string | null
}
