import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { logoutUser } from '../services/authService';
import { useNavigate } from 'react-router-dom';

const AdminSetup: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  
  return (
    <div className="max-w-md mx-auto my-10 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-4">Admin Setup</h1>
      
      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">Current User:</h2>
        <p>Email: {currentUser?.email}</p>
        <p>Name: {userProfile?.displayName || 'Not set'}</p>
        <p>Roles: {userProfile?.roles?.join(', ') || 'None'}</p>
      </div>
      
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
      
      {userProfile?.roles?.includes('admin') && (
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
