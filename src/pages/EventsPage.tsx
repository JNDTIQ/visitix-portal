import React, { useEffect, useState } from 'react';
import { fetchEvents } from '../services/eventService';
import { Link } from 'react-router-dom';

const EventsPage: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents()
      .then(setEvents)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-center py-10">Loading events...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Events</h1>
      {events.length === 0 ? (
        <div>No events found.</div>
      ) : (
        <ul className="space-y-4">
          {events.map(event => (
            <li key={event.id} className="border rounded p-4 hover:shadow transition">
              <Link to={`/event/${event.id}`} className="block hover:text-indigo-600">
                <div className="font-semibold text-lg">{event.title}</div>
                <div>{event.date} - {event.location}</div>
                <div className="text-gray-600">{event.description}</div>
                <div className="mt-2 text-indigo-600 underline text-sm">View Details & Buy Tickets</div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default EventsPage;