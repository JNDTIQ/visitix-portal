import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { createResaleListing } from '../services/resaleService';
import { fetchEvents, Event } from '../services/eventService';
import { useTicketUploadResaleOptimized } from '../hooks/useTicketUploadResaleOptimized';
import UserVerificationBadge from '../components/UserVerificationBadge';

// Removed local Event interface; using Event from eventService instead

const CreateResaleTicketPage: React.FC = () => {
  const { currentUser, userProfile, verificationStatus } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { uploadFiles, error: uploadError } = useTicketUploadResaleOptimized();
  
  // Get eventId from URL query parameter if available
  const queryParams = new URLSearchParams(location.search);
  const preselectedEventId = queryParams.get('eventId');
  
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [scanning, setScanning] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    eventId: preselectedEventId || '',
    price: '',
    quantity: '1',
    section: '',
    row: '',
    ticketType: 'digital' as 'digital' | 'physical',
  });

  useEffect(() => {
    // Load events for the dropdown
    const loadEvents = async () => {
      try {
        const eventsData = await fetchEvents();
        setEvents(eventsData);
      } catch (err) {
        console.error('Failed to load events:', err);
        setError('Failed to load events. Please try again later.');
      }
    };

    loadEvents();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles(filesArray);
    }
  };

  const handleScanTicket = () => {
    setScanning(true);
    // In a real implementation, this would trigger a QR code scanner
    // and extract ticket information from the scan
    
    // For now, we'll simulate a successful scan after 2 seconds
    setTimeout(() => {
      setScanning(false);
      setSuccessMessage('Ticket scanned successfully! Extracted information has been added to the form.');
      
      // Here you would extract ticket data from the scan and populate the form
      // This is just a placeholder to simulate the scan
      const selectedEvent = events.length > 0 ? events[0] : null;
      if (selectedEvent) {
        setFormData(prev => ({
          ...prev,
          eventId: selectedEvent.id,
          section: 'A',
          row: '12',
        }));
      }
      
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    }, 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      setError('You must be logged in to list tickets for resale');
      return;
    }
    
    // Check if user is verified before allowing to list tickets
    if (!verificationStatus.isVerified) {
      setError('You must complete identity verification before listing tickets for resale');
      setTimeout(() => {
        navigate('/verify-identity');
      }, 2000);
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      // Upload ticket files if provided - returns placeholder URLs immediately
      let ticketFiles: string[] = [];
      if (selectedFiles.length > 0) {
        ticketFiles = await uploadFiles(selectedFiles);
        
        if (uploadError) {
          console.warn("Upload warning:", uploadError);
        }
      }
      
      // Get the selected event title
      const selectedEvent = events.find(event => event.id === formData.eventId);
      if (!selectedEvent) {
        throw new Error('Selected event not found');
      }
      
      const resaleTicketData = {
        eventId: formData.eventId,
        sellerId: currentUser.uid,
        sellerName: userProfile?.displayName || currentUser.email || 'Anonymous',
        price: parseFloat(formData.price),
        quantity: parseInt(formData.quantity, 10),
        section: formData.section,
        row: formData.row,
        createdAt: new Date().toISOString(),
        eventTitle: selectedEvent.title,
        ticketFiles,
        ticketType: formData.ticketType
      };
      
      await createResaleListing(resaleTicketData);
      
      setSuccessMessage('Your ticket has been successfully listed for resale! File uploads will continue in the background.');
      
      // Redirect to the user's listings page after a short delay
      setTimeout(() => {
        navigate('/resale?tab=my-listings');
      }, 2000);
      
    } catch (err) {
      console.error('Error listing ticket for resale:', err);
      if (err instanceof Error && err.message.includes('upload')) {
        setError('There was an issue uploading your ticket files. Your listing may still have been created. Please check your listings after a few minutes or try again.');
      } else {
        setError('Failed to list your ticket. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">List a Ticket for Resale</h1>
      
      {/* Verification Check */}
      {verificationStatus && !verificationStatus.isVerified && verificationStatus.status !== 'approved' && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded mb-6">
          <h3 className="font-semibold text-lg mb-2">Verification Required</h3>
          <p className="mb-3">
            To protect our users and ensure secure transactions, we require identity and banking verification 
            before you can list tickets for resale.
          </p>
          <div className="mb-3">
            <UserVerificationBadge />
          </div>
          <button 
            onClick={() => navigate('/verify-identity')}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition"
          >
            Complete Verification
          </button>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}
      
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6">
          {successMessage}
        </div>
      )}
      
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Scan Existing Ticket</h2>
        <p className="text-gray-600 mb-4">
          Have a digital ticket? Scan it to automatically fill in the details.
        </p>
        
        <button
          onClick={handleScanTicket}
          disabled={scanning}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition disabled:bg-indigo-300"
        >
          {scanning ? 'Scanning...' : 'Scan Ticket QR Code'}
        </button>
      </div>
      
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Ticket Details</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-2">
              <label className="block text-gray-700 mb-2" htmlFor="eventId">
                Event
              </label>
              <select
                id="eventId"
                name="eventId"
                value={formData.eventId}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select an event</option>
                {events.map(event => (
                  <option key={event.id} value={event.id}>
                    {event.title} - {new Date(event.date).toLocaleDateString()}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="price">
                Price per Ticket ($)
              </label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="quantity">
                Quantity
              </label>
              <input
                type="number"
                id="quantity"
                name="quantity"
                value={formData.quantity}
                onChange={handleInputChange}
                min="1"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="section">
                Section (Optional)
              </label>
              <input
                type="text"
                id="section"
                name="section"
                value={formData.section}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="row">
                Row (Optional)
              </label>
              <input
                type="text"
                id="row"
                name="row"
                value={formData.row}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            
            <div className="col-span-2">
              <label className="block text-gray-700 mb-2">
                Ticket Type
              </label>
              <div className="flex space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="ticketType"
                    value="digital"
                    checked={formData.ticketType === 'digital'}
                    onChange={handleInputChange}
                    className="form-radio h-5 w-5 text-indigo-600"
                  />
                  <span className="ml-2">Digital</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="ticketType"
                    value="physical"
                    checked={formData.ticketType === 'physical'}
                    onChange={handleInputChange}
                    className="form-radio h-5 w-5 text-indigo-600"
                  />
                  <span className="ml-2">Physical</span>
                </label>
              </div>
            </div>
            
            <div className="col-span-2">
              <label className="block text-gray-700 mb-2" htmlFor="ticketFiles">
                Upload Ticket Files (Optional)
              </label>
              <input
                type="file"
                id="ticketFiles"
                name="ticketFiles"
                onChange={handleFileChange}
                multiple
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-sm text-gray-500 mt-1">
                Upload PDFs, images, or other ticket proof. This will help buyers verify authenticity.
              </p>
            </div>
          </div>
          
          <div className="mt-8 flex justify-end">
            <button
              type="button"
              onClick={() => navigate('/resale')}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md mr-2 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition disabled:bg-indigo-300"
            >
              {loading ? 'Listing Ticket...' : 'List Ticket for Resale'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateResaleTicketPage;
