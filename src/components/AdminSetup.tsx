import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { assignAdminRole } from '../services/userService';
import { logoutUser } from '../services/authService';
import { useNavigate } from 'react-router-dom';

const AdminSetup: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const makeAdmin = async () => {
    if (!currentUser) {
      setError('You must be logged in to perform this action');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await assignAdminRole(currentUser.uid);
      setSuccess('Successfully granted admin privileges! Please log out and log back in to apply the changes.');
    } catch (err) {
      console.error('Error assigning admin role:', err);
      setError('Failed to grant admin privileges. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-10 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-4">Admin Setup</h1>
      
      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">Current User:</h2>
        <p>Email: {currentUser?.email}</p>
        <p>Name: {userProfile?.displayName || 'Not set'}</p>
        <p>Roles: {userProfile?.roles?.join(', ') || 'None'}</p>
      </div>
      
      {success && (
        <div className="mb-4 p-3 bg-green-50 text-green-800 rounded-md">
          {success}
        </div>
      )}
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-800 rounded-md">
          {error}
        </div>
      )}
      
      <button
        onClick={makeAdmin}
        disabled={loading || userProfile?.roles?.includes('admin')}
        className={`w-full py-2 px-4 rounded-md text-white ${
          userProfile?.roles?.includes('admin')
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-indigo-600 hover:bg-indigo-700'
        }`}
      >
        {loading ? 'Processing...' : userProfile?.roles?.includes('admin') ? 'Already an Admin' : 'Make Me an Admin'}
      </button>
      
      {userProfile?.roles?.includes('admin') && (
        <div className="mt-4">
          <p className="text-sm text-gray-600 mb-2">
            You already have admin privileges. You can now manage events and user verifications.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <button 
              onClick={() => navigate('/events')} 
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
            >
              Manage Events
            </button>
            <button 
              onClick={() => navigate('/admin/verification-requests')} 
              className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition"
            >
              User Verifications
            </button>
          </div>
        </div>
      )}
      
      {success && (
        <div className="mt-4">
          <button
            onClick={async () => {
              try {
                await logoutUser();
                navigate('/login');
              } catch (error) {
                console.error('Failed to log out:', error);
              }
            }}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Log Out and Log Back In
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminSetup;
