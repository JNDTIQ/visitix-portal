import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { fetchResaleTicket } from '../services/resaleService';
import { createOrder } from '../services/orderService';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { AlertCircle, CheckCircle, Lock } from 'lucide-react';

// Initialize Stripe
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY!);

interface CheckoutFormProps {
  clientSecret: string;
  ticketDetails: TicketDetails;
  onSuccess: () => void;
}

interface TicketDetails {
  id: string;
  eventId: string;
  eventTitle: string;
  price: number;
  quantity: number;
  section?: string;
  row?: string;
  sellerName: string;
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({
  clientSecret,
  ticketDetails,
  onSuccess,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string>('');
  const [processing, setProcessing] = useState(false);
  const [billingDetails, setBillingDetails] = useState({
    name: '',
    email: '',
    phone: '',
    address: {
      line1: '',
      line2: '',
      city: '',
      state: '',
      postal_code: '',
      country: '',
    },
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError('');

    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        throw new Error(submitError.message);
      }

      const { error: paymentError, paymentIntent } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/payment-complete`,
          payment_method_data: {
            billing_details: billingDetails,
          },
        },
        redirect: 'if_required',
      });

      if (paymentError) {
        throw new Error(paymentError.message);
      }

      if (paymentIntent?.status === 'succeeded') {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Full Name
          </label>
          <input
            type="text"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            value={billingDetails.name}
            onChange={(e) =>
              setBillingDetails({ ...billingDetails, name: e.target.value })
            }
          />
        </div>

        {/* Billing Details Fields */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              value={billingDetails.email}
              onChange={(e) =>
                setBillingDetails({ ...billingDetails, email: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Phone
            </label>
            <input
              type="tel"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              value={billingDetails.phone}
              onChange={(e) =>
                setBillingDetails({ ...billingDetails, phone: e.target.value })
              }
            />
          </div>
        </div>

        {/* Address Fields */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Address Line 1
            </label>
            <input
              type="text"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              value={billingDetails.address.line1}
              onChange={(e) =>
                setBillingDetails({
                  ...billingDetails,
                  address: { ...billingDetails.address, line1: e.target.value },
                })
              }
            />
          </div>
          {/* More address fields... */}
        </div>

        {/* Payment Element */}
        <div className="border rounded-md p-4">
          <PaymentElement />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <AlertCircle className="inline-block mr-2" size={16} />
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={processing || !stripe}
        className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
          processing && 'opacity-50 cursor-not-allowed'
        }`}
      >
        <Lock className="h-5 w-5 mr-2" />
        {processing ? 'Processing...' : `Pay $${ticketDetails.price.toFixed(2)}`}
      </button>
    </form>
  );
};

export const CheckoutPage: React.FC = () => {
  const { ticketId } = useParams<{ ticketId: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [clientSecret, setClientSecret] = useState<string>('');
  const [ticketDetails, setTicketDetails] = useState<TicketDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const initializeCheckout = async () => {
      try {
        if (!ticketId) throw new Error('No ticket ID provided');

        // Fetch ticket details
        const ticket = await fetchResaleTicket(ticketId);
        if (!ticket) throw new Error('Ticket not found');

        setTicketDetails(ticket);

        // Initialize payment intent
        const response = await fetch('/api/create-payment-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ticketId,
            amount: ticket.price,
          }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message);

        setClientSecret(data.clientSecret);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    initializeCheckout();
  }, [ticketId]);

  const handlePaymentSuccess = async () => {
    try {
      if (!ticketDetails || !currentUser) return;

      await createOrder({
        ticketId: ticketDetails.id,
        buyerId: currentUser.uid,
        amount: ticketDetails.price,
        status: 'completed',
      });

      navigate('/payment-complete');
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

  if (error || !ticketDetails || !clientSecret) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
          {error || 'Failed to initialize checkout'}
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
              <div className="flex justify-between pt-2 border-t">
                <span className="font-medium">Total</span>
                <span className="font-bold text-lg">
                  ${ticketDetails.price.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance: {
                theme: 'stripe',
              },
            }}
          >
            <CheckoutForm
              clientSecret={clientSecret}
              ticketDetails={ticketDetails}
              onSuccess={handlePaymentSuccess}
            />
          </Elements>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;