import { useState } from 'react';
import { Calendar, MapPin, Users, Star, ChevronRight, Filter } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import type { Match, Stadium } from '../data/types';
import { toast } from 'sonner';

interface TicketingPageProps {
  isAuthenticated: boolean;
  matches: Match[];
  stadiums: Stadium[];
  onPurchaseTicket: (match: Match, section: string, seat: string) => Promise<void> | void;
}

export function TicketingPage({ isAuthenticated, matches, stadiums, onPurchaseTicket }: TicketingPageProps) {
  const [selectedPhase, setSelectedPhase] = useState<string>('all');
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [selectedSection, setSelectedSection] = useState<string>('');

  const filteredMatches = selectedPhase === 'all'
    ? matches
    : matches.filter(m => m.phase === selectedPhase);

  const handlePurchase = async () => {
    if (!isAuthenticated) {
      toast.error('Veuillez vous connecter pour acheter des billets');
      return;
    }
    if (!selectedMatch || !selectedSection) {
      toast.error('Veuillez sélectionner une section');
      return;
    }

    const seat = `${selectedSection}-${Math.floor(Math.random() * 20) + 1}-${Math.floor(Math.random() * 30) + 1}`;
    await onPurchaseTicket(selectedMatch, selectedSection, seat);
    toast.success('Billet acheté avec succès! 🎉');
    setSelectedMatch(null);
    setSelectedSection('');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">Billetterie Officielle</h1>
          <p className="text-lg text-blue-100">
            Sélectionnez votre match et réservez vos places en quelques clics
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Filter className="size-5 text-gray-600" />
            <Select value={selectedPhase} onValueChange={setSelectedPhase}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Phase du tournoi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les phases</SelectItem>
                <SelectItem value="Groupe">Phase de groupes</SelectItem>
                <SelectItem value="Huitièmes">Huitièmes de finale</SelectItem>
                <SelectItem value="Quarts">Quarts de finale</SelectItem>
                <SelectItem value="Demi-finales">Demi-finales</SelectItem>
                <SelectItem value="Finale">Finale</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-gray-600">
              {filteredMatches.length} match{filteredMatches.length > 1 ? 's' : ''} disponible{filteredMatches.length > 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Matches Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMatches.map((match) => {
            const stadium = stadiums.find(s => s.id === match.stadiumId);
            return (
              <Dialog key={match.id} open={selectedMatch?.id === match.id} onOpenChange={(open) => !open && setSelectedMatch(null)}>
                <DialogTrigger asChild>
                  <Card className="cursor-pointer hover:shadow-xl transition-all hover:scale-105" onClick={() => setSelectedMatch(match)}>
                    <div 
                      className="h-48 bg-cover bg-center relative rounded-t-lg"
                      style={{ backgroundImage: `url(${stadium?.imageUrl})` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent rounded-t-lg" />
                      <Badge className="absolute top-4 left-4 bg-yellow-500 text-yellow-950">
                        {match.phase}
                      </Badge>
                      <div className="absolute bottom-4 left-4 right-4">
                        <div className="flex items-center justify-between text-white">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{match.homeFlag}</span>
                            <span className="font-bold">{match.homeTeam}</span>
                          </div>
                          <span className="text-sm opacity-75">vs</span>
                          <div className="flex items-center gap-2">
                            <span className="font-bold">{match.awayTeam}</span>
                            <span className="text-2xl">{match.awayFlag}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <CardContent className="pt-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="size-4" />
                          <span>{new Date(match.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} - {match.time}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="size-4" />
                          <span>{match.stadium}, {match.city}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Users className="size-4" />
                          <span>{match.availableSeats.toLocaleString()} places disponibles</span>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t">
                          <span className="text-2xl font-bold text-blue-600">{match.price}€</span>
                          <ChevronRight className="size-5 text-gray-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </DialogTrigger>

                {/* Purchase Dialog */}
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-2xl">
                      {match.homeFlag} {match.homeTeam} vs {match.awayTeam} {match.awayFlag}
                    </DialogTitle>
                    <DialogDescription>
                      {match.stadium}, {match.city} - {new Date(match.date).toLocaleDateString('fr-FR')} à {match.time}
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-6">
                    {/* Stadium 3D View Mockup */}
                    <div>
                      <h3 className="font-semibold mb-3">Vue 3D du stade - Sélectionnez votre section</h3>
                      <div className="relative bg-gradient-to-b from-green-600 to-green-700 rounded-lg p-8 aspect-video">
                        {/* Terrain */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-3/4 h-3/4 border-4 border-white rounded-lg flex items-center justify-center">
                            <div className="text-white text-center">
                              <div className="text-6xl mb-2">⚽</div>
                              <div className="text-sm opacity-75">TERRAIN</div>
                            </div>
                          </div>
                        </div>

                        {/* Sections */}
                        <div className="absolute top-4 left-1/2 -translate-x-1/2">
                          <Button
                            variant={selectedSection === 'Tribune Nord' ? 'default' : 'outline'}
                            className={selectedSection === 'Tribune Nord' ? 'bg-blue-600' : 'bg-white/90'}
                            onClick={() => setSelectedSection('Tribune Nord')}
                          >
                            Tribune Nord - {match.price}€
                          </Button>
                        </div>
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                          <Button
                            variant={selectedSection === 'Tribune Sud' ? 'default' : 'outline'}
                            className={selectedSection === 'Tribune Sud' ? 'bg-blue-600' : 'bg-white/90'}
                            onClick={() => setSelectedSection('Tribune Sud')}
                          >
                            Tribune Sud - {match.price}€
                          </Button>
                        </div>
                        <div className="absolute left-4 top-1/2 -translate-y-1/2">
                          <Button
                            variant={selectedSection === 'Tribune Ouest' ? 'default' : 'outline'}
                            className={selectedSection === 'Tribune Ouest' ? 'bg-blue-600' : 'bg-white/90'}
                            onClick={() => setSelectedSection('Tribune Ouest')}
                          >
                            Tribune Ouest - {Math.round(match.price * 1.2)}€
                          </Button>
                        </div>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                          <Button
                            variant={selectedSection === 'Tribune Est' ? 'default' : 'outline'}
                            className={selectedSection === 'Tribune Est' ? 'bg-blue-600' : 'bg-white/90'}
                            onClick={() => setSelectedSection('Tribune Est')}
                          >
                            Tribune Est - {Math.round(match.price * 1.2)}€
                          </Button>
                        </div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 mt-16">
                          <Button
                            variant={selectedSection === 'VIP Centrale' ? 'default' : 'outline'}
                            className={selectedSection === 'VIP Centrale' ? 'bg-yellow-600' : 'bg-yellow-100 border-yellow-500'}
                            onClick={() => setSelectedSection('VIP Centrale')}
                          >
                            <Star className="size-4 mr-2" />
                            VIP Centrale - {Math.round(match.price * 2.5)}€
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Stadium Info */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Informations sur le stade</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-semibold">Capacité:</span> {stadium?.capacity.toLocaleString()} places
                          </div>
                          <div>
                            <span className="font-semibold">Ville:</span> {stadium?.city}, {stadium?.country}
                          </div>
                          <div>
                            <span className="font-semibold">Ouverture des portes:</span> 2h avant le match
                          </div>
                          <div>
                            <span className="font-semibold">Accès PMR:</span> Disponible
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Purchase Summary */}
                    {selectedSection && (
                      <Card className="bg-blue-50 border-blue-200">
                        <CardContent className="pt-6">
                          <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                              <span>Section sélectionnée:</span>
                              <span className="font-semibold">{selectedSection}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Prix du billet:</span>
                              <span className="font-semibold">{match.price}€</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Frais de service:</span>
                              <span className="font-semibold">{Math.round(match.price * 0.05)}€</span>
                            </div>
                            <div className="border-t border-blue-300 pt-3 flex justify-between">
                              <span className="font-bold">Total:</span>
                              <span className="text-xl font-bold text-blue-600">{Math.round(match.price * 1.05)}€</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Purchase Button */}
                    <Button 
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-6 text-lg"
                      onClick={handlePurchase}
                      disabled={!selectedSection}
                    >
                      {selectedSection ? 'Confirmer l\'achat' : 'Sélectionnez une section'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            );
          })}
        </div>
      </div>
    </div>
  );
}
