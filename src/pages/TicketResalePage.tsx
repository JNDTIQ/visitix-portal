import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { fetchEvents } from '../services/eventService';
import { 
  fetchResaleTickets, 
  fetchAllResaleTickets, 
  createResaleListing, 
  fetchUserResaleTickets,
  deleteResaleTicket
} from '../services/resaleService';
import { CalendarIcon, MapPinIcon, TagIcon, AlertCircleIcon, Trash2 as TrashIcon, Edit as EditIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import EditTicketForm from '../components/EditTicketForm';
import SellTicketForm from '../components/SellTicketForm';

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
  eventTitle?: string;
}

const TicketResalePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, userProfile, verificationStatus } = useAuth();
  
  // Check if there's a tab parameter in the URL
  const queryParams = new URLSearchParams(location.search);
  const tabParam = queryParams.get('tab');

  const [event, setEvent] = useState<Event | null>(null);
  const [resaleTickets, setResaleTickets] = useState<ResaleTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // My listings state
  const [showMyListings, setShowMyListings] = useState(tabParam === 'my-listings');
  const [myListings, setMyListings] = useState<ResaleTicket[]>([]);
  
  // All resale tickets (when no specific event is selected)
  const [allResaleTickets, setAllResaleTickets] = useState<ResaleTicket[]>([]);
  const [allEvents, setAllEvents] = useState<{[id: string]: Event}>({});

  // Sell ticket form state
  const [showSellForm, setShowSellForm] = useState(false);
  
  // State for editing ticket
  const [editingTicket, setEditingTicket] = useState<ResaleTicket | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  
  // Load all resale tickets if no event ID is provided
  useEffect(() => {
    if (!id) {
      const loadAllResaleTickets = async () => {
        setLoading(true);
        try {
          const tickets = await fetchAllResaleTickets();
          setAllResaleTickets(tickets);
          
          // Fetch events info for all tickets
          const eventIds = [...new Set(tickets.map(ticket => ticket.eventId))];
          const eventsData = await fetchEvents();
          const eventsMap: {[id: string]: Event} = {};
          
          eventsData.forEach(event => {
            if (eventIds.includes(event.id)) {
              eventsMap[event.id] = event;
            }
          });
          
          setAllEvents(eventsMap);
        } catch (err) {
          setError('Failed to load available resale tickets');
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      
      loadAllResaleTickets();
    }
  }, [id]);
  
  // Load user's own listings
  useEffect(() => {
    if (currentUser && showMyListings) {
      const loadUserListings = async () => {
        try {
          const tickets = await fetchUserResaleTickets(currentUser.uid);
          setMyListings(tickets);
        } catch (err) {
          console.error('Failed to load your listings:', err);
        }
      };
      
      loadUserListings();
    }
  }, [currentUser, showMyListings]);

  // If no id, show all available resale tickets
  if (!id) {
    return (
      <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Ticket Marketplace</h1>
          {currentUser && (
            <div className="flex gap-4">
              <button 
                onClick={() => {
                  setShowMyListings(!showMyListings);
                  // Update the URL when changing tabs
                  if (!showMyListings) {
                    navigate('/resale?tab=my-listings');
                  } else {
                    navigate('/resale');
                  }
                }}
                className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 transition"
              >
                {showMyListings ? 'View All Tickets' : 'My Listings'}
              </button>
              <button 
                onClick={() => {
                  if (!verificationStatus.isVerified) {
                    alert('You must complete identity verification before listing tickets for resale');
                    navigate('/verify-identity');
                    return;
                  }
                  navigate('/resale/create');
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
              >
                List a Ticket
              </button>
            </div>
          )}
        </div>
        
        {loading ? (
          <div className="text-center py-20">
            <div className="w-12 h-12 border-t-2 border-b-2 border-indigo-500 rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading available tickets...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 my-6">
            <div className="flex">
              <AlertCircleIcon className="h-5 w-5 text-red-500 mr-2" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        ) : showMyListings && currentUser ? (
          <div>
            <h2 className="text-xl font-semibold mb-4">Your Ticket Listings</h2>
            {myListings.length === 0 ? (
              <p className="text-gray-500 py-8 text-center">You don't have any active ticket listings</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myListings.map(ticket => (
                  <div key={ticket.id} className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition">
                    <div className="p-5">
                      <h3 className="text-lg font-semibold">{ticket.eventTitle}</h3>
                      <div className="mt-2 flex items-center text-sm text-gray-500">
                        <TagIcon className="h-4 w-4 mr-1" />
                        <span>${ticket.price.toFixed(2)} per ticket</span>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500">
                        <span>Quantity: {ticket.quantity}</span>
                      </div>
                      {ticket.section && (
                        <div className="mt-2 flex items-center text-sm text-gray-500">
                          <span>Section: {ticket.section}{ticket.row ? `, Row: ${ticket.row}` : ''}</span>
                        </div>
                      )}
                      <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between">
                        {showDeleteConfirm === ticket.id ? (
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-red-600">Confirm delete?</span>
                            <button 
                              onClick={() => handleDeleteTicket(ticket.id)}
                              className="text-sm bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
                            >
                              Yes
                            </button>
                            <button 
                              onClick={() => setShowDeleteConfirm(null)}
                              className="text-sm bg-gray-300 text-gray-700 px-2 py-1 rounded hover:bg-gray-400"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => setShowDeleteConfirm(ticket.id)}
                            className="text-sm text-red-600 hover:text-red-800 flex items-center"
                          >
                            <TrashIcon className="h-4 w-4 mr-1" />
                            Delete
                          </button>
                        )}
                        <button 
                          onClick={() => setEditingTicket(ticket)}
                          className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center"
                        >
                          <EditIcon className="h-4 w-4 mr-1" />
                          Edit
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            <h2 className="text-xl font-semibold mb-4">Available Resale Tickets</h2>
            {allResaleTickets.length === 0 ? (
              <p className="text-gray-500 py-8 text-center">No resale tickets are currently available</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {allResaleTickets.map(ticket => (
                  <div key={ticket.id} className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition">
                    {allEvents[ticket.eventId] && (
                      <div className="h-40 w-full overflow-hidden">
                        <img 
                          src={allEvents[ticket.eventId].image || 'https://placehold.co/600x400?text=Event+Image'} 
                          alt={allEvents[ticket.eventId].title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="p-5">
                      <h3 className="text-lg font-semibold">
                        {allEvents[ticket.eventId]?.title || ticket.eventTitle || 'Event'}
                      </h3>
                      {allEvents[ticket.eventId] && (
                        <>
                          <div className="mt-2 flex items-center text-sm text-gray-500">
                            <CalendarIcon className="h-4 w-4 mr-1" />
                            <span>{allEvents[ticket.eventId].date}</span>
                          </div>
                          <div className="mt-2 flex items-center text-sm text-gray-500">
                            <MapPinIcon className="h-4 w-4 mr-1" />
                            <span>{allEvents[ticket.eventId].location}</span>
                          </div>
                        </>
                      )}
                      <div className="mt-2 flex items-center text-sm text-gray-500">
                        <TagIcon className="h-4 w-4 mr-1" />
                        <span>${ticket.price.toFixed(2)} per ticket</span>
                      </div>
                      {ticket.section && (
                        <div className="mt-2 flex items-center text-sm text-gray-500">
                          <span>Section: {ticket.section}{ticket.row ? `, Row: ${ticket.row}` : ''}</span>
                        </div>
                      )}
                      <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between">
                        <span className="text-sm text-gray-500">
                          {ticket.quantity} {ticket.quantity === 1 ? 'ticket' : 'tickets'} available
                        </span>
                        <button 
                          onClick={() => navigate(`/checkout/resale/${ticket.id}`)}
                          className="text-sm text-indigo-600 hover:text-indigo-800"
                        >
                          Purchase
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
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

  const handlePurchaseTicket = (ticketId: string) => {
    if (!currentUser) {
      navigate('/login', { state: { from: `/resale/${id}` } });
      return;
    }
    navigate(`/checkout/resale/${ticketId}`);
  };

  // Function to handle ticket deletion
  const handleDeleteTicket = async (ticketId: string) => {
    setLoading(true);
    try {
      await deleteResaleTicket(ticketId);
      
      // Update listings after deletion
      if (currentUser) {
        const updatedListings = await fetchUserResaleTickets(currentUser.uid);
        setMyListings(updatedListings);
      }
      
      setShowDeleteConfirm(null);
    } catch (err) {
      console.error('Failed to delete ticket:', err);
      setError('Failed to delete ticket. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Function to refresh listings after an edit
  const handleTicketUpdated = async () => {
    setEditingTicket(null);
    
    if (currentUser) {
      try {
        const updatedListings = await fetchUserResaleTickets(currentUser.uid);
        setMyListings(updatedListings);
      } catch (err) {
        console.error('Failed to refresh listings:', err);
      }
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
                    if (!verificationStatus.isVerified) {
                      alert('You must complete identity verification before listing tickets for resale');
                      navigate('/verify-identity');
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
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    <SellTicketForm
                      eventId=""
                      eventTitle="Generic Resale Listing"
                      onListingCreated={() => {
                        setShowSellForm(false);
                        // Refresh ticket listings after creating a new one
                        if (currentUser) {
                          fetchUserResaleTickets(currentUser.uid)
                            .then(tickets => setMyListings(tickets))
                            .catch(err => console.error('Failed to refresh listings:', err));
                          
                          fetchAllResaleTickets()
                            .then(tickets => setAllResaleTickets(tickets))
                            .catch(err => console.error('Failed to refresh all tickets:', err));
                        }
                      }}
                      onCancel={() => setShowSellForm(false)}
                    />
                  </div>
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
      
      {/* Edit Ticket Form Modal */}
      {editingTicket && (
        <EditTicketForm 
          ticket={editingTicket} 
          onClose={() => setEditingTicket(null)} 
          onSuccess={handleTicketUpdated} 
        />
      )}
      
      {/* Display success message if set */}
      {sellingSuccess && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {sellingSuccess}
        </div>
      )}
      
      {/* Use the enhanced SellTicketForm for specific events too */}
      {showSellForm && (
        <div className="bg-white rounded-lg p-6 mb-6 border border-gray-200">
          <SellTicketForm
            eventId={id!}
            eventTitle={event.title}
            onListingCreated={() => {
              setShowSellForm(false);
              setSellingSuccess('Your ticket has been listed for resale!');
              
              // Refresh ticket listings
              fetchResaleTickets(id!)
                .then(tickets => setResaleTickets(tickets))
                .catch(err => console.error('Failed to refresh tickets:', err));
              
              // Hide success message after a delay
              setTimeout(() => {
                setSellingSuccess('');
              }, 3000);
            }}
            onCancel={() => setShowSellForm(false)}
          />
        </div>
      )}
    </div>
  );
};

export default TicketResalePage;