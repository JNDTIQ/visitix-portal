import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { CheckCircle, Clock, Download, Mail, Calendar, MapPin, Ticket, ChevronRight, Home } from 'lucide-react';
import { getOrderDetails } from '../services/orderService';

interface OrderDetails {
  id: string;
  status: string;
  amount: number;
  date: string;
  ticketId: string;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  eventLocation: string;
  section?: string;
  row?: string;
  quantity: number;
  confirmationCode: string;
  isResale: boolean;
  sellerName?: string;
}

const PaymentCompletePage: React.FC = () => {
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  
  useEffect(() => {
    const loadOrderDetails = async () => {
      try {
        // Check if we have any query params that indicate a payment was processed
        const searchParams = new URLSearchParams(location.search);
        const orderId = searchParams.get('order_id');
        const paymentIntent = searchParams.get('payment_intent');
        
        if (!orderId && !paymentIntent) {
          // Try to get the most recent order for this user
          if (currentUser?.uid) {
            const orderData = await getOrderDetails(null, currentUser.uid);
            if (orderData) {
              setOrderDetails(orderData);
            } else {
              throw new Error('No recent order found');
            }
          } else {
            throw new Error('No order information available');
          }
        } else {
          // Get order by ID or payment intent
          const orderData = await getOrderDetails(orderId || paymentIntent);
          if (orderData) {
            setOrderDetails(orderData);
          } else {
            throw new Error('Order not found');
          }
        }
      } catch (err: any) {
        console.error('Error fetching order details:', err);
        setError(err.message || 'Failed to load order details.');
      } finally {
        setLoading(false);
      }
    };

    // Only load if user is authenticated
    if (currentUser) {
      loadOrderDetails();
    } else {
      setLoading(false);
      setError('You must be logged in to view your order');
    }
  }, [location.search, currentUser]);

  const handleDownloadTickets = () => {
    // Implementation for ticket download would go here
    // This could generate a PDF or redirect to a ticket download service
    alert('Tickets would be downloaded here in a production environment');
  };

  const handleSendEmailConfirmation = () => {
    // Implementation for sending email confirmation would go here
    alert('Email confirmation would be sent here in a production environment');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !orderDetails) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
            <div className="text-center">
              <h1 className="text-2xl font-semibold text-gray-900 mb-4">Payment Status</h1>
              <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded-md mb-6">
                {error || 'Unable to retrieve order details.'}
              </div>
              <div className="flex justify-center space-x-4 mt-6">
                <button
                  onClick={() => navigate('/events')}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  <Home className="h-5 w-5 mr-2" />
                  Browse Events
                </button>
                {currentUser && (
                  <button
                    onClick={() => navigate('/account/orders')}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <Ticket className="h-5 w-5 mr-2" />
                    My Orders
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
            </div>
            <h1 className="text-2xl font-semibold text-gray-900">Payment Successful!</h1>
            <p className="text-gray-600 mt-2">
              Thank you for your purchase. Your tickets are confirmed.
            </p>
          </div>

          {/* Order Details */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h2 className="text-lg font-medium mb-4">Order Summary</h2>
            <div className="grid grid-cols-2 gap-y-3">
              <div className="text-gray-500">Order ID:</div>
              <div className="text-gray-900 font-medium">{orderDetails.id.slice(0, 8)}</div>
              
              <div className="text-gray-500">Date:</div>
              <div className="text-gray-900">{orderDetails.date ? new Date(orderDetails.date).toLocaleDateString() : 'N/A'}</div>
              
              <div className="text-gray-500">Status:</div>
              <div className="flex items-center">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {orderDetails.status}
                </span>
              </div>
              
              <div className="text-gray-500">Confirmation Code:</div>
              <div className="text-gray-900 font-medium">{orderDetails.confirmationCode}</div>
              
              <div className="text-gray-500">Amount Paid:</div>
              <div className="text-gray-900 font-medium">${orderDetails.amount.toFixed(2)}</div>
            </div>
          </div>

          {/* Event Details */}
          <div className="mb-6">
            <h2 className="text-lg font-medium mb-4">Event Details</h2>
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="p-4">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{orderDetails.eventTitle}</h3>
                <div className="flex items-center text-gray-600 mb-1">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>{orderDetails.eventDate}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span>{orderDetails.eventLocation}</span>
                </div>
              </div>
              
              <div className="border-t border-gray-200 px-4 py-5">
                <div className="grid grid-cols-2 gap-y-3">
                  <div className="text-gray-500">Ticket Type:</div>
                  <div className="text-gray-900">
                    {orderDetails.isResale ? 'Resale Ticket' : 'Standard Ticket'}
                  </div>
                  
                  {orderDetails.isResale && orderDetails.sellerName && (
                    <>
                      <div className="text-gray-500">Seller:</div>
                      <div className="text-gray-900">{orderDetails.sellerName}</div>
                    </>
                  )}
                  
                  {orderDetails.section && (
                    <>
                      <div className="text-gray-500">Section:</div>
                      <div className="text-gray-900">{orderDetails.section}</div>
                    </>
                  )}
                  
                  {orderDetails.row && (
                    <>
                      <div className="text-gray-500">Row:</div>
                      <div className="text-gray-900">{orderDetails.row}</div>
                    </>
                  )}
                  
                  <div className="text-gray-500">Quantity:</div>
                  <div className="text-gray-900">{orderDetails.quantity}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mb-8">
            <h2 className="text-lg font-medium mb-4">Next Steps</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={handleDownloadTickets}
                className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <Download className="h-5 w-5 mr-2" />
                Download Tickets
              </button>
              
              <button
                onClick={handleSendEmailConfirmation}
                className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Mail className="h-5 w-5 mr-2" />
                Email Confirmation
              </button>
            </div>
          </div>

          {/* Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <Clock className="h-5 w-5 text-blue-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Important Information</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    Please arrive at least 30 minutes before the event start time. You will need to present your ticket confirmation (digital or printed) along with valid ID matching the purchaser's name.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-4 justify-center mt-6">
            <Link
              to={`/event/${orderDetails.eventId}`}
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
            >
              Event Details
              <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
            
            <Link
              to="/account/orders"
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
            >
              View All Orders
              <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
            
            <Link
              to="/events"
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
            >
              Browse More Events
              <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentCompletePage;