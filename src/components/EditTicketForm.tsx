import React, { useState } from 'react';
import { updateResaleTicket } from '../services/resaleService';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface ResaleTicket {
  id: string;
  eventId: string;
  price: number;
  quantity: number;
  section?: string;
  row?: string;
}

interface EditTicketFormProps {
  ticket: ResaleTicket;
  onClose: () => void;
  onSuccess: () => void;
}

const EditTicketForm: React.FC<EditTicketFormProps> = ({ ticket, onClose, onSuccess }) => {
  const [price, setPrice] = useState(ticket.price.toString());
  const [quantity, setQuantity] = useState(ticket.quantity.toString());
  const [section, setSection] = useState(ticket.section || '');
  const [row, setRow] = useState(ticket.row || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { currentUser, verificationStatus } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Check if user is verified
    if (!verificationStatus.isVerified) {
      setError('You must complete identity verification before editing ticket listings');
      setTimeout(() => {
        navigate('/verify-identity');
      }, 2000);
      setLoading(false);
      return;
    }

    // Validate inputs
    const priceNum = parseFloat(price);
    const quantityNum = parseInt(quantity);

    if (isNaN(priceNum) || priceNum <= 0) {
      setError('Please enter a valid price');
      setLoading(false);
      return;
    }

    if (isNaN(quantityNum) || quantityNum <= 0) {
      setError('Please enter a valid quantity');
      setLoading(false);
      return;
    }

    try {
      // Update the ticket
      await updateResaleTicket(ticket.id, {
        price: priceNum,
        quantity: quantityNum,
        section: section || undefined,
        row: row || undefined
      });

      onSuccess();
    } catch (err) {
      setError('Failed to update ticket. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Edit Ticket Listing</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
              Price per Ticket ($)
            </label>
            <input
              type="number"
              id="price"
              min="0.01"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              required
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
              Quantity
            </label>
            <input
              type="number"
              id="quantity"
              min="1"
              step="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              required
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="section" className="block text-sm font-medium text-gray-700 mb-1">
              Section (Optional)
            </label>
            <input
              type="text"
              id="section"
              value={section}
              onChange={(e) => setSection(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="row" className="block text-sm font-medium text-gray-700 mb-1">
              Row (Optional)
            </label>
            <input
              type="text"
              id="row"
              value={row}
              onChange={(e) => setRow(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-indigo-300"
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Update Listing'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTicketForm;
