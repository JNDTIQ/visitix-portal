import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchEventById } from '../services/eventService';
import { CalendarIcon, MapPinIcon, TagIcon, UsersIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

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
  startTime?: string;
  endTime?: string;
  organizer?: string;
  availableTickets?: number;
}

const EventDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const navigate = useNavigate();
  const { currentUser, verificationStatus } = useAuth();

  useEffect(() => {
    const loadEvent = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const eventData = await fetchEventById(id);
        setEvent(eventData);
      } catch (err) {
        console.error('Error fetching event:', err);
        setError('Failed to load event details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadEvent();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error || 'Event not found'}
        </div>
        <button 
          onClick={() => navigate('/events')}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
        >
          Back to events
        </button>
      </div>
    );
  }

  const handleBuyTickets = () => {
    if (!currentUser) {
      navigate('/login', { state: { from: `/event/${id}` } });
      return;
    }
    // Logic to buy tickets would go here
    navigate(`/checkout/${id}?quantity=${quantity}`);
  };

  const handleResaleMarketplace = () => {
    navigate('/resale');
  };

  const handleListTicketsForResale = () => {
    if (!currentUser) {
      navigate('/login', { state: { from: `/event/${id}` } });
      return;
    }
    
    // Check if user is verified before allowing to list tickets
    if (!verificationStatus.isVerified) {
      // Show alert and redirect to verification page
      alert('You must complete identity verification before listing tickets for resale');
      setTimeout(() => {
        navigate('/verify-identity');
      }, 500);
      return;
    }
    
    navigate(`/resale/create?eventId=${id}`);
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-16">
      {/* Hero image */}
      <div className="w-full h-80 md:h-96 bg-gray-200 relative">
        <img 
          src={event.image || "/api/placeholder/1200/500"} 
          alt={event.title} 
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = "/api/placeholder/1200/500";
          }}
        />
        <div className="absolute inset-0 bg-black bg-opacity-50"></div>
        <div className="absolute inset-0 flex items-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <div className="inline-block bg-indigo-600 px-4 py-1 rounded-md text-white text-sm font-medium mb-4">
              {event.category}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{event.title}</h1>
            <div className="flex flex-wrap gap-4 text-white">
              <div className="flex items-center">
                <CalendarIcon className="h-5 w-5 mr-2" />
                <span>{event.date}</span>
              </div>
              <div className="flex items-center">
                <MapPinIcon className="h-5 w-5 mr-2" />
                <span>{event.location}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Event details */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">About This Event</h2>
              <div className="prose max-w-none">
                <p className="whitespace-pre-line">{event.description}</p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Event Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start">
                  <CalendarIcon className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <h3 className="font-medium">Date and Time</h3>
                    <p className="text-gray-600">{event.date}</p>
                    {event.startTime && event.endTime && (
                      <p className="text-gray-600">{event.startTime} - {event.endTime}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-start">
                  <MapPinIcon className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <h3 className="font-medium">Location</h3>
                    <p className="text-gray-600">{event.location}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <TagIcon className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <h3 className="font-medium">Category</h3>
                    <p className="text-gray-600">{event.category}</p>
                  </div>
                </div>
                {event.organizer && (
                  <div className="flex items-start">
                    <UsersIcon className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <h3 className="font-medium">Organizer</h3>
                      <p className="text-gray-600">{event.organizer}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Ticket purchase sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 mb-6 sticky top-24">
              <h2 className="text-xl font-semibold mb-4">Tickets</h2>
              <div className="mb-4">
                <p className="text-2xl font-bold text-indigo-600">
                  ${event.price}
                </p>
                {event.availableTickets !== undefined && (
                  <p className="text-sm text-gray-500">
                    {event.availableTickets} tickets left
                  </p>
                )}
              </div>
              
              <div className="mb-6">
                <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity
                </label>
                <select
                  id="quantity"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                    <option key={num} value={num}>
                      {num}
                    </option>
                  ))}
                </select>
              </div>
              
              <button
                onClick={handleBuyTickets}
                className="w-full bg-indigo-600 text-white py-3 rounded-md font-medium hover:bg-indigo-700 transition-colors"
              >
                Buy Tickets
              </button>
              
              <div className="mt-6">
                <button
                  onClick={handleResaleMarketplace}
                  className="w-full bg-transparent border border-indigo-600 text-indigo-600 py-3 rounded-md font-medium hover:bg-indigo-50 transition-colors"
                >
                  View Resale Marketplace
                </button>
              </div>
              
              <div className="mt-4">
                <button
                  onClick={handleListTicketsForResale}
                  className="w-full bg-transparent border border-green-600 text-green-600 py-3 rounded-md font-medium hover:bg-green-50 transition-colors"
                >
                  List Tickets for Resale
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetailPage;