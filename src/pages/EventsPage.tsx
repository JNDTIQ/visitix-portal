import React, { useState, useEffect } from 'react';
import { fetchEvents } from '../services/eventService';
import { CalendarIcon, MapPinIcon, SearchIcon, FilterIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Event {
  id: string;
  title: string;
  date: string;
  location: string;
  image: string;
  category: string;
  price: number;
  description: string;
  featured: boolean;
}

const EventsPage: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [priceRange, setPriceRange] = useState<number>(1000);
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();

  const categories = ['All', 'Music', 'Sports', 'Theater', 'Festivals', 'Workshops', 'Other'];

  useEffect(() => {
    const loadEvents = async () => {
      try {
        setLoading(true);
        const eventData = await fetchEvents();
        setEvents(eventData);
        setFilteredEvents(eventData);
      } catch (err) {
        console.error('Error fetching events:', err);
        setError('Failed to load events. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, []);

  useEffect(() => {
    // Filter events based on search term, category, and price range
    const filtered = events.filter((event) => {
      const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           event.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           event.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === 'All' || event.category === selectedCategory;
      
      const matchesPrice = event.price <= priceRange;
      
      return matchesSearch && matchesCategory && matchesPrice;
    });
    
    setFilteredEvents(filtered);
  }, [searchTerm, selectedCategory, priceRange, events]);

  const featuredEvents = filteredEvents.filter(event => event.featured);
  const regularEvents = filteredEvents.filter(event => !event.featured);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-16">
      <div className="bg-indigo-900 pt-16 pb-10 px-4 sm:px-6 lg:px-8 mb-10">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-6">Discover Events</h1>
          
          {/* Search and Filter */}
          <div className="relative">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-grow">
                <input
                  type="text"
                  placeholder="Search events, locations, or artists"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <SearchIcon className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
              </div>
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center justify-center gap-2 bg-indigo-600 text-white rounded-lg px-4 py-3 hover:bg-indigo-700"
              >
                <FilterIcon className="h-5 w-5" />
                <span>Filters</span>
              </button>
            </div>
            
            {showFilters && (
              <div className="bg-white rounded-lg shadow-lg p-6 mt-2 absolute z-20 w-full">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full rounded-lg border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      {categories.map((category) => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Price: ${priceRange}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1000"
                      value={priceRange}
                      onChange={(e) => setPriceRange(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Featured Events Section */}
        {featuredEvents.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Featured Events</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {featuredEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </div>
        )}

        {/* Regular Events */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">All Events</h2>
          {regularEvents.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {regularEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <p className="text-gray-500">No events found matching your criteria.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface EventCardProps {
  event: Event;
}

const EventCard: React.FC<EventCardProps> = ({ event }) => {
  const navigate = useNavigate();
  
  return (
    <div 
      className="bg-white rounded-lg shadow overflow-hidden cursor-pointer hover:shadow-lg transition-shadow duration-300"
      onClick={() => navigate(`/event/${event.id}`)}
    >
      <div className="relative h-48">
        <img 
          src={event.image || "/api/placeholder/400/300"} 
          alt={event.title} 
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = "/api/placeholder/400/300";
          }}
        />
        <div className="absolute top-2 left-2 bg-indigo-600 text-white text-xs font-semibold px-2 py-1 rounded">
          {event.category}
        </div>
        {event.featured && (
          <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs font-semibold px-2 py-1 rounded">
            Featured
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-1">{event.title}</h3>
        <div className="flex items-center mt-1 text-sm text-gray-500">
          <CalendarIcon className="h-4 w-4 mr-1" />
          <span>{event.date}</span>
        </div>
        <div className="flex items-center mt-1 text-sm text-gray-500">
          <MapPinIcon className="h-4 w-4 mr-1" />
          <span>{event.location}</span>
        </div>
        <div className="mt-3 flex justify-between items-center">
          <span className="font-semibold text-indigo-600">${event.price}</span>
          <button className="text-indigo-600 font-medium hover:text-indigo-800 text-sm">
            Buy Tickets →
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventsPage;