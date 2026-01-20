import { MapPin, Navigation as NavIcon, Users } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import type { FanZone, Stadium } from '../data/types'
import { toast } from 'sonner'

interface FanZonesMapProps {
  fanZones: FanZone[]
  stadiums: Stadium[]
}

export function FanZonesMap({ fanZones, stadiums }: FanZonesMapProps) {
  // Positions approximatives (juste pour la démo visuelle)
  const positions: Record<string, { top: string; left: string; color: string; label: string }> = {
    Madrid: { top: '18%', left: '55%', color: 'bg-blue-600', label: 'Europe' },
    Barcelone: { top: '23%', left: '58%', color: 'bg-blue-600', label: 'Europe' },
    Casablanca: { top: '42%', left: '56%', color: 'bg-green-600', label: 'Afrique' },
    Montevideo: { top: '66%', left: '34%', color: 'bg-purple-600', label: 'Amérique du Sud' },
    'Buenos Aires': { top: '62%', left: '36%', color: 'bg-purple-600', label: 'Amérique du Sud' },
  }

  const stadiumMarkers = stadiums
    .map((s) => {
      const pos = positions[s.city]
      return pos
        ? {
            id: `st-${s.id}`,
            name: s.city,
            title: `${s.name} - ${s.city}, ${s.country}`,
            color: pos.color,
            top: pos.top,
            left: pos.left,
          }
        : null
    })
    .filter(Boolean) as Array<{ id: string; name: string; title: string; color: string; top: string; left: string }>

  const fanZoneMarkers = fanZones
    .map((fz) => {
      const pos = positions[fz.city]
      return pos
        ? {
            id: `fz-${fz.id}`,
            name: fz.city,
            title: `${fz.name} - ${fz.city}, ${fz.country}`,
            color: 'bg-yellow-500',
            top: `calc(${pos.top} + 4%)`,
            left: `calc(${pos.left} + 2%)`,
          }
        : null
    })
    .filter(Boolean) as Array<{ id: string; name: string; title: string; color: string; top: string; left: string }>

  return (
    <div className="space-y-6">
      {/* Map Container */}
      <Card className="overflow-hidden">
        <div className="relative h-[500px] bg-gradient-to-br from-blue-100 to-purple-100">
          <div className="absolute inset-0">
            {/* Markers */}
            {[...stadiumMarkers, ...fanZoneMarkers].map((m) => (
              <div key={m.id} className="absolute" style={{ top: m.top, left: m.left }}>
                <LocationMarker
                  name={m.name}
                  color={m.color}
                  onClick={() => toast.info(m.title)}
                />
              </div>
            ))}

            {/* Legend */}
            <div className="absolute bottom-4 left-4 bg-white rounded-lg p-3 shadow-lg">
              <div className="text-xs font-semibold mb-2">Légende</div>
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <div className="size-3 bg-blue-600 rounded-full" />
                  <span>Stades (Europe)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="size-3 bg-green-600 rounded-full" />
                  <span>Stades (Afrique)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="size-3 bg-purple-600 rounded-full" />
                  <span>Stades (Amérique du Sud)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="size-3 bg-yellow-500 rounded-full" />
                  <span>Fan Zones</span>
                </div>
              </div>
            </div>

            {/* Label */}
            <div className="absolute top-4 right-4 bg-white/80 backdrop-blur rounded-lg px-3 py-2 text-xs text-gray-700">
              Démo visuelle (sans librairie Map)
            </div>
          </div>
        </div>
      </Card>

      {/* Fan Zones List */}
      <div>
        <h3 className="text-xl font-bold mb-4">Fan Zones Officielles</h3>
        <div className="grid md:grid-cols-3 gap-4">
          {fanZones.map((zone) => (
            <Card key={zone.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{zone.name}</CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <MapPin className="size-3" />
                      {zone.city}, {zone.country}
                    </CardDescription>
                  </div>
                  <Badge className="bg-yellow-500 text-yellow-950">Fan Zone</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="size-4" />
                    <span>Capacité: {zone.capacity.toLocaleString()} personnes</span>
                  </div>
                  <div>
                    <div className="text-sm font-semibold mb-2">Activités:</div>
                    <div className="flex flex-wrap gap-1">
                      {zone.activities.map((activity, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {activity}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => toast.success('Itinéraire vers ' + zone.name)}
                  >
                    <NavIcon className="size-4" />
                    Y aller
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Stadiums List */}
      <div>
        <h3 className="text-xl font-bold mb-4">Tous les Stades</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stadiums.map((stadium) => (
            <Card key={stadium.id} className="hover:shadow-lg transition-shadow">
              <div className="h-32 bg-cover bg-center" style={{ backgroundImage: `url(${stadium.imageUrl})` }}>
                <div className="h-full bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                  <div className="text-white">
                    <div className="font-bold">{stadium.name}</div>
                    <div className="text-xs opacity-90">
                      {stadium.city}, {stadium.country}
                    </div>
                  </div>
                </div>
              </div>
              <CardContent className="pt-4">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Capacité:</span>
                    <span className="font-semibold">{stadium.capacity.toLocaleString()}</span>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full gap-2 mt-2"
                    onClick={() => toast.success('Navigation vers ' + stadium.name)}
                  >
                    <NavIcon className="size-4" />
                    Itinéraire
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

function LocationMarker({
  name,
  color,
  onClick,
}: {
  name: string
  color: string
  onClick: () => void
}) {
  return (
    <button onClick={onClick} className="group relative cursor-pointer transition-transform hover:scale-110">
      <div className={`size-4 ${color} rounded-full border-2 border-white shadow-lg`} />
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">{name}</div>
      </div>
    </button>
  )
}
