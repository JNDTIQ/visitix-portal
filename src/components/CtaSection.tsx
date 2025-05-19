import { TicketIcon, UsersIcon, RepeatIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
export const CtaSection = () => {
  return <section className="bg-gray-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* For Event Attendees */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-8">
              <div className="bg-indigo-100 rounded-full w-12 h-12 flex items-center justify-center mb-5">
                <TicketIcon className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                Find Your Next Experience
              </h3>
              <p className="mt-4 text-gray-600">
                Discover and book tickets to concerts, sports games, theater
                performances, and more. Get notified about events from your
                favorite artists and venues.
              </p>
              <div className="mt-8">
                <Link to="/events" className="inline-flex items-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
                  Browse Events
                </Link>
              </div>
            </div>
          </div>
          
          {/* For Ticket Resale */}
          <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-xl shadow-lg overflow-hidden text-white">
            <div className="p-8">
              <div className="bg-white bg-opacity-20 rounded-full w-12 h-12 flex items-center justify-center mb-5">
                <RepeatIcon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold">Resell Your Tickets</h3>
              <p className="mt-4 text-purple-100">
                Can't make it to an event? Resell your tickets safely and securely on our platform.
                Get fair market value and ensure a smooth transfer to the new ticket holder.
              </p>
              <div className="mt-8">
                <Link to="/resale" className="inline-flex items-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-purple-800 bg-white hover:bg-purple-50">
                  Resell Tickets
                </Link>
              </div>
            </div>
          </div>
          
          {/* For Event Organizers */}
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-xl shadow-lg overflow-hidden text-white">
            <div className="p-8">
              <div className="bg-white bg-opacity-20 rounded-full w-12 h-12 flex items-center justify-center mb-5">
                <UsersIcon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold">Organize and Sell Tickets</h3>
              <p className="mt-4 text-indigo-100">
                Create your event, set ticket prices, and start selling in
                minutes. Our platform provides powerful tools for event
                management, marketing, and real-time analytics.
              </p>
              <div className="mt-8">
                <Link to="/sell" className="inline-flex items-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-indigo-800 bg-white hover:bg-indigo-50">
                  Start Selling
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>;
};