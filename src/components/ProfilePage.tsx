import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, Navigate } from "react-router-dom";
import { logoutUser } from "../services/authService";
import { UserIcon, LogOutIcon, TicketIcon, ClockIcon, Trash2 as TrashIcon, RefreshCw, ShieldCheck } from "lucide-react";
import { fetchUserResaleTickets, deleteResaleTicket } from "../services/resaleService";
import { fetchUserTickets } from "../services/ticketService";
import UserVerificationBadge from "./UserVerificationBadge";

const ProfilePage: React.FC = () => {
  const { currentUser, userProfile, verificationStatus } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resaleTickets, setResaleTickets] = useState<any[]>([]);
  const [purchasedTickets, setPurchasedTickets] = useState<any[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'purchased' | 'resale'>('purchased');

  useEffect(() => {
    if (currentUser) {
      loadUserTickets();
    }
  }, [currentUser]);

  const loadUserTickets = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      // Fetch the user's resale tickets
      const resaleData = await fetchUserResaleTickets(currentUser.uid);
      setResaleTickets(resaleData);
      
      // Fetch the user's purchased tickets
      const purchasedData = await fetchUserTickets(currentUser.uid);
      setPurchasedTickets(purchasedData);
    } catch (err) {
      console.error("Error loading user tickets:", err);
      setError("Failed to load your tickets. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTicket = async (ticketId: string) => {
    if (!currentUser) return;
    
    try {
      await deleteResaleTicket(ticketId);
      // Refresh the list after deletion
      const updatedTickets = resaleTickets.filter(ticket => ticket.id !== ticketId);
      setResaleTickets(updatedTickets);
      setShowDeleteConfirm(null);
      setSuccess("Ticket has been successfully removed from listings");
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (err) {
      console.error("Error deleting ticket:", err);
      setError("Failed to delete ticket. Please try again.");
      
      // Hide error message after 3 seconds
      setTimeout(() => {
        setError("");
      }, 3000);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate("/login");
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Profile Header */}
        <div className="bg-indigo-600 p-6 text-white">
          <div className="flex items-center">
            <div className="bg-white rounded-full p-3">
              <UserIcon className="h-12 w-12 text-indigo-600" />
            </div>
            <div className="ml-4">
              <h1 className="text-2xl font-bold">
                {userProfile?.displayName || "User"}
              </h1>
              <p className="text-indigo-100">{currentUser.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="ml-auto bg-white text-indigo-600 px-4 py-2 rounded-md flex items-center hover:bg-indigo-50"
            >
              <LogOutIcon className="h-4 w-4 mr-2" />
              Logout
            </button>
          </div>
        </div>

        {/* Profile Content */}
        <div className="p-6">
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold flex items-center">
                <TicketIcon className="h-5 w-5 mr-2 text-indigo-600" />
                My Tickets
              </h2>
              <button
                onClick={loadUserTickets}
                disabled={loading}
                className="text-indigo-600 hover:text-indigo-800 flex items-center text-sm"
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
            
            {/* Ticket type tabs */}
            <div className="flex mb-4 border-b">
              <button
                className={`px-4 py-2 font-medium ${activeTab === 'purchased' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500'}`}
                onClick={() => setActiveTab('purchased')}
              >
                Purchased Tickets
              </button>
              <button
                className={`px-4 py-2 font-medium ${activeTab === 'resale' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500'}`}
                onClick={() => setActiveTab('resale')}
              >
                Resale Listings
              </button>
            </div>
            
            {/* Loading state */}
            {loading && (
              <div className="text-center py-8">
                <div className="w-12 h-12 border-t-2 border-b-2 border-indigo-500 rounded-full animate-spin mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading your tickets...</p>
              </div>
            )}
            
            {/* Error message */}
            {error && (
              <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-4">
                {error}
              </div>
            )}
            
            {/* Success message */}
            {success && (
              <div className="bg-green-50 text-green-700 p-4 rounded-lg mb-4">
                {success}
              </div>
            )}
            
            {/* Purchased Tickets */}
            {activeTab === 'purchased' && !loading && (
              <>
                {purchasedTickets.length === 0 ? (
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <p className="text-gray-500">You don't have any purchased tickets yet.</p>
                    <button 
                      onClick={() => navigate("/events")}
                      className="mt-3 text-indigo-600 font-medium hover:text-indigo-800"
                    >
                      Browse Events
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                    {purchasedTickets.map(ticket => (
                      <div key={ticket.id} className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition">
                        <div className="p-4">
                          <h3 className="font-medium text-lg">{ticket.eventTitle}</h3>
                          <div className="flex items-center text-gray-500 text-sm mt-1">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mr-2">
                              Purchased
                            </span>
                            <span>{new Date(ticket.eventDate).toLocaleDateString()}</span>
                          </div>
                          <div className="mt-2 text-sm">
                            <p>Quantity: {ticket.quantity}</p>
                            {ticket.section && <p>Section: {ticket.section}</p>}
                            {ticket.row && <p>Row: {ticket.row}</p>}
                          </div>
                          <div className="mt-3 flex">
                            <button
                              onClick={() => navigate(`/event/${ticket.eventId}`)}
                              className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                            >
                              View Event
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
            
            {/* Resale Listings */}
            {activeTab === 'resale' && !loading && (
              <>
                {resaleTickets.length === 0 ? (
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <p className="text-gray-500">You haven't listed any tickets for resale.</p>
                    <button 
                      onClick={() => navigate("/resale/create")}
                      className="mt-3 text-indigo-600 font-medium hover:text-indigo-800"
                    >
                      List a Ticket
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                    {resaleTickets.map(ticket => (
                      <div key={ticket.id} className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition">
                        <div className="p-4">
                          <h3 className="font-medium text-lg">{ticket.eventTitle}</h3>
                          <div className="flex items-center text-gray-500 text-sm mt-1">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 mr-2">
                              For Sale
                            </span>
                            <span>Listed on {new Date(ticket.createdAt).toLocaleDateString()}</span>
                          </div>
                          <div className="mt-2 text-sm">
                            <p>Price: <span className="font-medium">${ticket.price.toFixed(2)}</span> per ticket</p>
                            <p>Quantity: {ticket.quantity}</p>
                            {ticket.section && <p>Section: {ticket.section}</p>}
                            {ticket.row && <p>Row: {ticket.row}</p>}
                            {ticket.ticketType && <p>Type: {ticket.ticketType}</p>}
                          </div>
                          <div className="mt-3 flex justify-between">
                            <button
                              onClick={() => navigate(`/event/${ticket.eventId}`)}
                              className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                            >
                              View Event
                            </button>
                            
                            {showDeleteConfirm === ticket.id ? (
                              <div className="flex items-center">
                                <span className="text-sm text-gray-600 mr-2">Confirm?</span>
                                <button
                                  onClick={() => handleDeleteTicket(ticket.id)}
                                  className="text-red-600 hover:text-red-800 text-sm font-medium mr-2"
                                >
                                  Yes
                                </button>
                                <button
                                  onClick={() => setShowDeleteConfirm(null)}
                                  className="text-gray-500 hover:text-gray-700 text-sm font-medium"
                                >
                                  No
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setShowDeleteConfirm(ticket.id)}
                                className="text-red-600 hover:text-red-800 text-sm font-medium flex items-center"
                              >
                                <TrashIcon className="h-4 w-4 mr-1" />
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <ClockIcon className="h-5 w-5 mr-2 text-indigo-600" />
              Recent Activity
            </h2>
            
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-gray-500">No recent activity.</p>
            </div>
          </div>
          
          {/* Verification Section */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <h2 className="text-xl font-semibold mb-4">Identity Verification</h2>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="mb-3">
                <UserVerificationBadge />
              </div>
              <p className="text-gray-700 mb-3">
                Identity verification is required to sell tickets on our platform.
                We use this information to ensure the security of all users.
              </p>
              <button
                onClick={() => navigate("/verify-identity")}
                className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition"
              >
                Manage Verification
              </button>
            </div>
          </div>
          
          {/* Admin Section */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <h2 className="text-xl font-semibold mb-4">Admin Settings</h2>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-700 mb-3">
                Need to manage events or access admin features?
              </p>
              <button
                onClick={() => navigate("/admin-setup")}
                className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition"
              >
                Admin Setup
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;