import React from 'react';
import { SearchIcon } from 'lucide-react';
export const HeroSection = () => {
  return <div className="relative bg-indigo-900 overflow-hidden">
      <div className="absolute inset-0">
        <img src="https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1974&q=80" alt="Concert crowd with light show" className="w-full h-full object-cover opacity-40" />
      </div>
      <div className="relative max-w-7xl mx-auto py-24 px-4 sm:py-32 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
          Discover Unforgettable Experiences
        </h1>
        <p className="mt-6 max-w-3xl text-xl text-indigo-100">
          Find and book tickets to the most exciting events happening around
          you. From concerts and festivals to sports and theater.
        </p>
        <div className="mt-10 max-w-2xl">
          <div className="flex rounded-md shadow-lg">
            <div className="relative flex items-stretch flex-grow">
              <input type="text" className="block w-full rounded-l-md border-0 py-4 pl-4 pr-10 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-600" placeholder="Search events, venues, or artists" />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <SearchIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
            </div>
            <button type="button" className="relative inline-flex items-center px-6 py-4 border border-transparent text-base font-medium rounded-r-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Search
            </button>
          </div>
        </div>
      </div>
    </div>;
};