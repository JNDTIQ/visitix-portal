import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { fetchResaleTicketById } from '../services/resaleService';
import { createOrder } from '../services/orderService';
import { getDoc, doc as firestoreDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { AlertCircle, Lock } from 'lucide-react';

interface TicketDetails {
  id: string;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  eventLocation: string;
  price: number;
  quantity: number;
  section?: string;
  row?: string;
  sellerName: string;
  sellerId?: string;
}

export const CheckoutPage: React.FC = () => {
  const { id, ticketId } = useParams<{ id: string, ticketId: string }>();
  const location = useLocation();
  const isResaleTicket = location.pathname.includes('resale');
  const currentTicketId = isResaleTicket ? ticketId : id;
  const { currentUser } = useAuth();
  const navigate = useNavigate(); // Used for navigation after payment processing
  const [ticketDetails, setTicketDetails] = useState<TicketDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const initializeCheckout = async () => {
      try {
        if (!currentTicketId) throw new Error('No ticket ID provided');

        // Handle different types of tickets (regular and resale)
        if (isResaleTicket) {
          // Fetch resale ticket
          const resaleTicket = await fetchResaleTicketById(currentTicketId);
          if (!resaleTicket) throw new Error('Ticket not found');

          let eventTitle = resaleTicket.eventTitle || 'Unknown Event';
          let eventDate = '';
          let eventLocation = '';
          
          // Get event details if needed
          if (resaleTicket.eventId && (!resaleTicket.eventTitle || resaleTicket.eventTitle === 'Unknown Event')) {
            const eventDoc = await getDoc(firestoreDoc(db, 'events', resaleTicket.eventId));
            if (eventDoc.exists()) {
              const eventData = eventDoc.data();
              eventTitle = eventData.title || 'Unknown Event';
              eventDate = eventData.date || '';
              eventLocation = eventData.location || '';
            }
          }

          setTicketDetails({
            id: resaleTicket.id,
            eventId: resaleTicket.eventId,
            eventTitle: eventTitle,
            eventDate: eventDate,
            eventLocation: eventLocation,
            price: resaleTicket.price,
            quantity: resaleTicket.quantity,
            section: resaleTicket.section,
            row: resaleTicket.row,
            sellerName: resaleTicket.sellerName,
            sellerId: resaleTicket.sellerId
          });
        } else {
          // Handle regular event tickets (non-resale)
          const eventDoc = await getDoc(firestoreDoc(db, 'events', currentTicketId));
          if (!eventDoc.exists()) throw new Error('Event not found');
          
          const eventData = eventDoc.data();
          setTicketDetails({
            id: currentTicketId,
            eventId: currentTicketId,
            eventTitle: eventData.title || 'Unknown Event',
            eventDate: eventData.date || '',
            eventLocation: eventData.location || '',
            price: eventData.price || 0,
            quantity: 1, // Default for direct purchases
            sellerName: 'Official Seller'
          });
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    initializeCheckout();
  }, [currentTicketId, isResaleTicket]);

  const handlePayment = async () => {
    if (!ticketDetails || !currentUser) return;

    try {
      // Create an order record first
      await createOrder({
        ticketId: ticketDetails.id,
        buyerId: currentUser.uid,
        amount: ticketDetails.price,
        status: 'pending',
        eventId: ticketDetails.eventId,
        quantity: ticketDetails.quantity
      });

      // You should have a backend endpoint that generates a WiPay payment link
      const response = await fetch('/api/create-wipay-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: ticketDetails.price,
          ticketId: ticketDetails.id,
          buyerId: currentUser.uid,
          email: currentUser.email,
          description: `Purchase of ticket for ${ticketDetails.eventTitle}`,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to initialize payment');

      const { paymentUrl } = data;

      // Redirect user to WiPay payment page
      window.location.href = paymentUrl;

    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !ticketDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
          {error || 'Failed to load ticket'}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
          <h1 className="text-2xl font-semibold mb-6">Checkout</h1>

          {/* Order Summary */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h2 className="text-lg font-medium mb-4">Order Summary</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Event</span>
                <span className="font-medium">{ticketDetails.eventTitle}</span>
              </div>
              <div className="flex justify-between">
                <span>Date</span>
                <span className="font-medium">{ticketDetails.eventDate}</span>
              </div>
              <div className="flex justify-between">
                <span>Location</span>
                <span className="font-medium">{ticketDetails.eventLocation}</span>
              </div>
              <div className="flex justify-between">
                <span>Section</span>
                <span className="font-medium">
                  {ticketDetails.section || 'General Admission'}
                </span>
              </div>
              {ticketDetails.row && (
                <div className="flex justify-between">
                  <span>Row</span>
                  <span className="font-medium">{ticketDetails.row}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Quantity</span>
                <span className="font-medium">{ticketDetails.quantity}</span>
              </div>
              {isResaleTicket && (
                <div className="flex justify-between">
                  <span>Seller</span>
                  <span className="font-medium">{ticketDetails.sellerName}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t">
                <span className="font-medium">Total</span>
                <span className="font-bold text-lg">
                  ${ticketDetails.price.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Button */}
          <button
            onClick={handlePayment}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <Lock className="h-5 w-5 mr-2" />
            Continue to Payment
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
