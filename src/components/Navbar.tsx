import { useState } from 'react';
import { CalendarIcon, LogInIcon, TicketIcon, MenuIcon, XIcon, UserIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { logoutUser } from '../services/authService';

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { currentUser } = useAuth();

  const handleLogout = async () => {
    try {
      await logoutUser();
      // No need to navigate; AuthContext will handle the state change
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <span className="text-indigo-600 text-2xl font-bold">VisiTix</span>
            </Link>
          </div>
          {/* Desktop navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              to="/#events"
              className="flex items-center text-gray-700 hover:text-indigo-600 px-3 py-2 text-sm font-medium"
            >
              <CalendarIcon className="h-5 w-5 mr-1" />
              Events
            </Link>
            <Link
              to="/#sell"
              className="flex items-center text-gray-700 hover:text-indigo-600 px-3 py-2 text-sm font-medium"
            >
              <TicketIcon className="h-5 w-5 mr-1" />
              Sell Tickets
            </Link>
            
            {currentUser ? (
              <>
                <Link
                  to="/profile"
                  className="flex items-center text-gray-700 hover:text-indigo-600 px-3 py-2 text-sm font-medium"
                >
                  <UserIcon className="h-5 w-5 mr-1" />
                  My Account
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-md text-sm font-medium"
                >
                  <LogInIcon className="h-5 w-5 mr-1" />
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="flex items-center text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-md text-sm font-medium"
              >
                <LogInIcon className="h-5 w-5 mr-1" />
                Login
              </Link>
            )}
          </nav>
          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <XIcon className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <MenuIcon className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>
      {/* Mobile menu, show/hide based on menu state */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="pt-2 pb-3 space-y-1">
            <Link
              to="/#events"
              className="flex items-center text-indigo-600 hover:bg-indigo-50 block px-3 py-2 text-base font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              <CalendarIcon className="h-5 w-5 mr-2" />
              Events
            </Link>
            <Link
              to="/#sell"
              className="flex items-center text-gray-700 hover:bg-gray-50 block px-3 py-2 text-base font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              <TicketIcon className="h-5 w-5 mr-2" />
              Sell Tickets
            </Link>
            
            {currentUser ? (
              <>
                <Link
                  to="/profile"
                  className="flex items-center text-gray-700 hover:bg-gray-50 block px-3 py-2 text-base font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <UserIcon className="h-5 w-5 mr-2" />
                  My Account
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center text-gray-700 hover:bg-gray-50 block px-3 py-2 text-base font-medium w-full text-left"
                >
                  <LogInIcon className="h-5 w-5 mr-2" />
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="flex items-center text-gray-700 hover:bg-gray-50 block px-3 py-2 text-base font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                <LogInIcon className="h-5 w-5 mr-2" />
                Login
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};