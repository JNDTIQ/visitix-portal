import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchEvents } from '../services/eventService';
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

  // If no id, show a message or a list of events to select from
  if (!id) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Select an event to resell tickets</h2>
        <p className="text-gray-600 mb-6">
          Please browse <a href="/events" className="text-indigo-600 underline">Events</a> and choose the event you want to resell tickets for.
        </p>
      </div>
    );
  }
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
        const [eventsData, ticketsData] = await Promise.all([
          fetchEvents(),
          fetchResaleTickets(id)
        ]);

        const eventData = eventsData.find(event => event.id === id);
        setEvent(eventData || null);
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

  const handlePurchaseTicket = (ticketId: string) => {
    if (!currentUser) {
      navigate('/login', { state: { from: `/resale/${id}` } });
      return;
    }
    navigate(`/checkout/resale/${ticketId}`);
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
                        >
                          {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                            <option key={num} value={num}>
                              {num}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label htmlFor="section" className="block text-sm font-medium text-gray-700 mb-1">
                          Section (optional)
                        </label>
                        <input
                          type="text"
                          id="section"
                          value={section}
                          onChange={(e) => setSection(e.target.value)}
                          className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label htmlFor="row" className="block text-sm font-medium text-gray-700 mb-1">
                          Row (optional)
                        </label>
                        <input
                          type="text"
                          id="row"
                          value={row}
                          onChange={(e) => setRow(e.target.value)}
                          className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                    
                    <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-md mb-4">
                      <div className="flex">
                        <AlertCircleIcon className="h-5 w-5 text-yellow-400 mr-2" />
                        <div>
                          <p className="text-sm text-yellow-700">
                            By listing tickets for resale, you confirm that:
                          </p>
                          <ul className="list-disc pl-5 mt-1 text-xs text-yellow-600">
                            <li>You are authorized to resell these tickets</li>
                            <li>Tickets are valid and will be transferred upon purchase</li>
                            <li>A 10% service fee will be deducted from your earnings</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      type="submit"
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-md font-medium"
                    >
                      List Tickets for Sale
                    </button>
                  </form>
                </div>
              )}
              
              {/* Ticket listings */}
              {resaleTickets.length > 0 ? (
                <div className="border border-gray-200 rounded-md overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Seller
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Details
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Price
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quantity
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {resaleTickets.map((ticket) => (
                        <tr key={ticket.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{ticket.sellerName}</div>
                            <div className="text-xs text-gray-500">Listed {new Date(ticket.createdAt).toLocaleDateString()}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {ticket.section && ticket.row ? (
                              <div className="text-sm text-gray-900">Section {ticket.section}, Row {ticket.row}</div>
                            ) : ticket.section ? (
                              <div className="text-sm text-gray-900">Section {ticket.section}</div>
                            ) : ticket.row ? (
                              <div className="text-sm text-gray-900">Row {ticket.row}</div>
                            ) : (
                              <div className="text-sm text-gray-500">General Admission</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-indigo-600">${ticket.price.toFixed(2)}</div>
                            {ticket.price > event.price ? (
                              <div className="text-xs text-red-500">
                                +${(ticket.price - event.price).toFixed(2)} (original)
                              </div>
                            ) : ticket.price < event.price ? (
                              <div className="text-xs text-green-500">
                                -${(event.price - ticket.price).toFixed(2)} (original)
                              </div>
                            ) : null}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{ticket.quantity} available</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <button
                              onClick={() => handlePurchaseTicket(ticket.id)}
                              className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-5 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                              Buy Now
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 border border-gray-200 rounded-md">
                  <p className="text-gray-500">No resale tickets available for this event.</p>
                  <p className="text-sm text-gray-400 mt-1">Be the first to list your tickets!</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Event info card */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-lg font-medium mb-4">Event Information</h3>
              <div className="mb-4">
                <img 
                  src={event.image || "/api/placeholder/400/300"} 
                  alt={event.title} 
                  className="w-full h-40 object-cover rounded-md mb-4"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "/api/placeholder/400/300";
                  }}
                />
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Original Price:</span>
                  <span className="font-semibold">${event.price.toFixed(2)}</span>
                </div>
              </div>
              <button 
                onClick={() => navigate(`/event/${id}`)}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-md font-medium"
              >
                View Event Details
              </button>
            </div>
            
            {/* Resale info card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-medium mb-4">About Resale</h3>
              <div className="space-y-4 text-sm">
                <div>
                  <h4 className="font-medium text-gray-900">Secure Transactions</h4>
                  <p className="text-gray-600">All purchases and sales are processed securely through our platform.</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Buyer Protection</h4>
                  <p className="text-gray-600">Tickets are guaranteed to be valid or your money back.</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Seller Fees</h4>
                  <p className="text-gray-600">A 10% service fee is applied to all sales to cover processing costs.</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Instant Delivery</h4>
                  <p className="text-gray-600">Tickets are transferred electronically immediately after purchase.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketResalePage;