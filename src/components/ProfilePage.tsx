import React from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { logoutUser } from "../services/authService";
import { UserIcon, LogOutIcon, TicketIcon, ClockIcon } from "lucide-react";

const ProfilePage: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();

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
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <TicketIcon className="h-5 w-5 mr-2 text-indigo-600" />
              My Tickets
            </h2>
            
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-gray-500">You don't have any tickets yet.</p>
              <button 
                onClick={() => navigate("/")}
                className="mt-3 text-indigo-600 font-medium hover:text-indigo-800"
              >
                Browse Events
              </button>
            </div>
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
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;