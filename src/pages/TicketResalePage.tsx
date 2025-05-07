import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchEventById } from '../services/eventService';
import { fetchResaleTickets, createResaleListing } from '../services/resaleService';
import { CalendarIcon, MapPinIcon, TagIcon, AlertCircleIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface Event {
  id: string;
  title: string;
  date: string;
  location: string;
  image: string;
  category: string;
  price: number;
}

interface ResaleTicket {
  id: string;
  eventId: string;
  sellerId: string;
  sellerName: string;
  price: number;
  quantity: number;
  section?: string;
  row?: string;
  createdAt: string;
}

const TicketResalePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [resaleTickets, setResaleTickets] = useState<ResaleTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();
  
  // Sell ticket form state
  const [showSellForm, setShowSellForm] = useState(false);
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [section, setSection] = useState('');
  const [row, setRow] = useState('');
  const [sellingError, setSellingError] = useState('');
  const [sellingSuccess, setSellingSuccess] = useState('');

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const [eventData, ticketsData] = await Promise.all([
          fetchEventById(id),
          fetchResaleTickets(id)
        ]);
        
        setEvent(eventData);
        setResaleTickets(ticketsData);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  const handleSubmitListing = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      navigate('/login', { state: { from: `/resale/${id}` } });
      return;
    }
    
    if (!price || Number(price) <= 0) {
      setSellingError('Please enter a valid price');
      return;
    }
    
    try {
      const ticketData = {
        eventId: id!,
        sellerId: currentUser.uid,
        sellerName: userProfile?.displayName || 'Anonymous',
        price: Number(price),
        quantity,
        section,
        row,
        createdAt: new Date().toISOString()
      };
      
      await createResaleListing(ticketData);
      setSellingSuccess('Your ticket has been listed for resale!');
      
      // Reset form
      setPrice('');
      setQuantity(1);
      setSection('');
      setRow('');
      setSellingError('');
      
      // Refresh ticket listings
      const updatedTickets = await fetchResaleTickets(id!);
      setResaleTickets(updatedTickets);
      
      // Hide form after successful submission
      setTimeout(() => {
        setShowSellForm(false);
        setSellingSuccess('');
      }, 3000);
      
    } catch (err) {
      console.error('Error creating listing:', err);
      setSellingError('Failed to create listing. Please try again.');
    }
  };

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

  return (
    <div className="bg-gray-50 min-h-screen pb-16">
      {/* Event header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{event.title} - Resale Market</h1>
              <div className="flex flex-wrap gap-4 mt-2 text-gray-500">
                <div className="flex items-center">
                  <CalendarIcon className="h-4 w-4 mr-1" />
                  <span>{event.date}</span>
                </div>
                <div className="flex items-center">
                  <MapPinIcon className="h-4 w-4 mr-1" />
                  <span>{event.location}</span>
                </div>
                <div className="flex items-center">
                  <TagIcon className="h-4 w-4 mr-1" />
                  <span>{event.category}</span>
                </div>
              </div>
            </div>
            <div className="mt-4 md:mt-0">
              <button 
                onClick={() => navigate(`/event/${id}`)}
                className="text-indigo-600 hover:text-indigo-900"
              >
                Back to event details
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Ticket listings */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Available Resale Tickets</h2>
                <button
                  onClick={() => {
                    if (!currentUser) {
                      navigate('/login', { state: { from: `/resale/${id}` } });
                      return;
                    }
                    setShowSellForm(!showSellForm);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  {showSellForm ? 'Cancel' : 'Sell Tickets'}
                </button>
              </div>

              {/* Sell ticket form */}
              {showSellForm && (
                <div className="bg-gray-50 rounded-lg p-6 mb-6 border border-gray-200">
                  <h3 className="text-lg font-medium mb-4">List Your Tickets</h3>
                  
                  {sellingError && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                      {sellingError}
                    </div>
                  )}
                  
                  {sellingSuccess && (
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                      {sellingSuccess}
                    </div>
                  )}
                  
                  <form onSubmit={handleSubmitListing}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                          Price per ticket ($)
                        </label>
                        <input
                          type="number"
                          id="price"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          required
                          min="1"
                          step="0.01"
                        />
                      </div>
                      <div>
                        <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                          Number of tickets
                        </label>
                        <select
                          id="quantity"
                          value={quantity}
                          onChange={(e) => setQuantity(Number(e.target.value))}
                          className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"