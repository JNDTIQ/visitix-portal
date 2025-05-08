import { CalendarIcon, MapPinIcon } from 'lucide-react';
import { Link } from 'react-router-dom'; // Import Link from React Router

const events = [{
  id: 1,
  title: '',
  date: '',
  location: '',
  image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
  category: 'Music'
}, {
  id: 2,
  title: '',
  date: '',
  location: '',
  image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1374&q=80',
  category: 'Food'
}, {
  id: 3,
  title: '',
  date: '',
  location: '',
  image: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1469&q=80',
  category: 'Sports'
}, {
  id: 4,
  title: '',
  date: '',
  location: '',
  image: 'https://images.unsplash.com/photo-1503095396549-807759245b35?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1471&q=80',
  category: 'Theater'
}];

export const FeaturedEvents = () => {
  return <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Featured Events
          </h2>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
            Discover the hottest events happening near you
          </p>
        </div>
        <div className="mt-12">
          <div className="flex overflow-x-auto pb-4 hide-scrollbar space-x-4 mb-8">
            <button className="px-5 py-2 rounded-full bg-indigo-600 text-white font-medium flex-shrink-0">
              All Events
            </button>
            <button className="px-5 py-2 rounded-full bg-gray-100 text-gray-800 font-medium flex-shrink-0 hover:bg-gray-200">
              Music
            </button>
            <button className="px-5 py-2 rounded-full bg-gray-100 text-gray-800 font-medium flex-shrink-0 hover:bg-gray-200">
              Sports
            </button>
            <button className="px-5 py-2 rounded-full bg-gray-100 text-gray-800 font-medium flex-shrink-0 hover:bg-gray-200">
              Theater
            </button>
            <button className="px-5 py-2 rounded-full bg-gray-100 text-gray-800 font-medium flex-shrink-0 hover:bg-gray-200">
              Festivals
            </button>
            <button className="px-5 py-2 rounded-full bg-gray-100 text-gray-800 font-medium flex-shrink-0 hover:bg-gray-200">
              Workshops
            </button>
          </div>
          <div className="grid grid-cols-1 gap-y-10 sm:grid-cols-2 gap-x-6 lg:grid-cols-4">
            {events.map(event => <div key={event.id} className="group relative">
                <div className="relative w-full h-60 rounded-lg overflow-hidden bg-gray-200 group-hover:opacity-90 transition-opacity">
                  <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
                  <div className="absolute top-2 left-2 bg-indigo-600 text-white text-xs font-semibold px-2 py-1 rounded">
                    {event.category}
                  </div>
                </div>
                <div className="mt-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {event.title}
                  </h3>
                  <div className="flex items-center mt-1 text-sm text-gray-500">
                    <CalendarIcon className="h-4 w-4 mr-1" />
                    <span>{event.date}</span>
                  </div>
                  <div className="flex items-center mt-1 text-sm text-gray-500">
                    <MapPinIcon className="h-4 w-4 mr-1" />
                    <span>{event.location}</span>
                  </div>
                  <div className="mt-3">
                    <button className="text-indigo-600 font-medium hover:text-indigo-800 text-sm">
                      Buy Tickets →
                    </button>
                  </div>
                </div>
              </div>)}
          </div>
          <div className="mt-12 text-center">
            <Link to="/events" className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
              View All Events
            </Link>
          </div>
        </div>
      </div>
    </section>;
};