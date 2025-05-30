import React, { useEffect, useState } from 'react';
import { fetchEvents, deleteEvent } from '../services/eventService';
import { Link } from 'react-router-dom';
import { Trash2 as TrashIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const EventsPage: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isAdmin } = useAuth();

  const loadEvents = async () => {
    setLoading(true);
    try {
      const eventsData = await fetchEvents();
      setEvents(eventsData);
    } catch (err) {
      console.error('Error loading events:', err);
      setError('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const handleDeleteEvent = async (eventId: string) => {
    setDeleteLoading(true);
    try {
      const success = await deleteEvent(eventId);
      if (success) {
        // Remove the event from local state
        setEvents(events.filter(event => event.id !== eventId));
        setError(null);
      } else {
        setError('Failed to delete event');
      }
    } catch (err) {
      console.error('Error deleting event:', err);
      setError('Failed to delete event');
    } finally {
      setDeleteLoading(false);
      setDeleteConfirm(null);
    }
  };

  if (loading) {
    return <div className="text-center py-10">Loading events...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Events</h1>
        <Link 
          to="/sell" 
          className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition"
        >
          Create Event
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-4">
          {error}
        </div>
      )}
      
      {events.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No events found.</p>
          <Link to="/sell" className="mt-3 text-indigo-600 font-medium hover:text-indigo-800 inline-block">
            Create your first event
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {events.map(event => (
            <li key={event.id} className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition">
              <div className="flex flex-col md:flex-row">
                <div className="md:w-1/4 h-40">
                  <img 
                    src={event.image || "/api/placeholder/400/300"} 
                    alt={event.title} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "/api/placeholder/400/300";
                    }}
                  />
                </div>
                <div className="p-4 flex-1">
                  <div className="font-semibold text-lg">{event.title}</div>
                  <div className="text-gray-500">{event.date} - {event.location}</div>
                  <div className="text-gray-600 mt-2 line-clamp-2">{event.description}</div>
                  <div className="mt-4 flex justify-between items-center">
                    <Link to={`/event/${event.id}`} className="text-indigo-600 hover:text-indigo-800 font-medium">
                      View Details & Buy Tickets
                    </Link>
                    
                    {isAdmin() && (
                      <div>
                        {deleteConfirm === event.id ? (
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600">Confirm delete?</span>
                            <button 
                              onClick={() => handleDeleteEvent(event.id)}
                              disabled={deleteLoading}
                              className="text-red-600 hover:text-red-800 text-sm font-medium disabled:text-gray-400"
                            >
                              Yes
                            </button>
                            <button 
                              onClick={() => setDeleteConfirm(null)}
                              className="text-gray-500 hover:text-gray-700 text-sm font-medium"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => setDeleteConfirm(event.id)}
                            className="text-red-600 hover:text-red-800 flex items-center"
                          >
                            <TrashIcon className="h-4 w-4 mr-1" />
                            Remove
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default EventsPage;