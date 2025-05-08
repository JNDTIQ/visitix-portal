import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useNavigate } from 'react-router-dom';

export const SellTicketsPage: React.FC = () => {
  const [eventData, setEventData] = useState({
    title: '',
    date: '',
    location: '',
    description: '',
  });
  const [tickets, setTickets] = useState([
    { price: '', section: '', row: '', seat: '', type: '' }
  ]);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleEventChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setEventData({ ...eventData, [e.target.name]: e.target.value });
  };

  const handleTicketChange = (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const newTickets = [...tickets];
    const fieldName = e.target.name as keyof typeof tickets[0];
    newTickets[idx][fieldName] = e.target.value;
    setTickets(newTickets);
  };

  const addTicket = () => {
    setTickets([...tickets, { price: '', section: '', row: '', seat: '', type: '' }]);
  };

  const removeTicket = (idx: number) => {
    setTickets(tickets.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess('');
    setError('');
    try {
      // 1. Create event
      const eventRef = await addDoc(collection(db, 'events'), eventData);
      // 2. Create tickets
      for (const ticket of tickets) {
        await addDoc(collection(db, 'tickets'), {
          ...ticket,
          eventId: eventRef.id,
          status: 'available',
          createdAt: new Date().toISOString(),
        });
      }
      setSuccess('Event and tickets created successfully!');
      setEventData({ title: '', date: '', location: '', description: '' });
      setTickets([{ price: '', section: '', row: '', seat: '', type: '' }]);
      // Redirect to events page after a short delay
      setTimeout(() => {
        navigate('/events');
      }, 1200);
    } catch (err: any) {
      setError('Failed to create event or tickets.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Create Event & Sell Tickets</h1>
      {success && <div className="bg-green-100 text-green-700 p-3 rounded mb-4">{success}</div>}
      {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block font-medium">Event Title</label>
          <input
            type="text"
            name="title"
            value={eventData.title}
            onChange={handleEventChange}
            required
            className="w-full border rounded p-2"
          />
        </div>
        <div>
          <label className="block font-medium">Date</label>
          <input
            type="date"
            name="date"
            value={eventData.date}
            onChange={handleEventChange}
            required
            className="w-full border rounded p-2"
          />
        </div>
        <div>
          <label className="block font-medium">Location</label>
          <input
            type="text"
            name="location"
            value={eventData.location}
            onChange={handleEventChange}
            required
            className="w-full border rounded p-2"
          />
        </div>
        <div>
          <label className="block font-medium">Description</label>
          <textarea
            name="description"
            value={eventData.description}
            onChange={handleEventChange}
            className="w-full border rounded p-2"
          />
        </div>
        <div>
          <label className="block font-medium mb-2">Tickets</label>
          {tickets.map((ticket, idx) => (
            <div key={idx} className="mb-4 border p-3 rounded">
              <div className="flex gap-2 mb-2">
                <input
                  type="number"
                  name="price"
                  placeholder="Price"
                  value={ticket.price}
                  onChange={e => handleTicketChange(idx, e)}
                  required
                  className="border rounded p-2 w-24"
                />
                <input
                  type="text"
                  name="section"
                  placeholder="Section"
                  value={ticket.section}
                  onChange={e => handleTicketChange(idx, e)}
                  className="border rounded p-2 w-24"
                />
                <input
                  type="text"
                  name="row"
                  placeholder="Row"
                  value={ticket.row}
                  onChange={e => handleTicketChange(idx, e)}
                  className="border rounded p-2 w-24"
                />
                <input
                  type="text"
                  name="seat"
                  placeholder="Seat"
                  value={ticket.seat}
                  onChange={e => handleTicketChange(idx, e)}
                  className="border rounded p-2 w-24"
                />
                <input
                  type="text"
                  name="type"
                  placeholder="Type"
                  value={ticket.type}
                  onChange={e => handleTicketChange(idx, e)}
                  className="border rounded p-2 w-24"
                />
                {tickets.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeTicket(idx)}
                    className="text-red-600 ml-2"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={addTicket}
            className="bg-indigo-600 text-white px-4 py-2 rounded"
          >
            Add Ticket
          </button>
        </div>
        <button
          type="submit"
          className="w-full bg-green-600 text-white py-2 rounded font-bold"
        >
          Create Event & Sell Tickets
        </button>
      </form>
    </div>
  );
};

export default SellTicketsPage;