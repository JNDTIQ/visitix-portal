import React from 'react';
import { FacebookIcon, TwitterIcon, InstagramIcon, YoutubeIcon } from 'lucide-react';
export const Footer = () => {
  return <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">VisiTix</h3>
            <ul className="space-y-2">
              <li>
                <a href="#about" className="text-gray-300 hover:text-white">
                  About Us
                </a>
              </li>
              <li>
                <a href="#careers" className="text-gray-300 hover:text-white">
                  Careers
                </a>
              </li>
              <li>
                <a href="#press" className="text-gray-300 hover:text-white">
                  Press
                </a>
              </li>
              <li>
                <a href="#contact" className="text-gray-300 hover:text-white">
                  Contact
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">For Attendees</h3>
            <ul className="space-y-2">
              <li>
                <a href="#how-it-works" className="text-gray-300 hover:text-white">
                  How It Works
                </a>
              </li>
              <li>
                <a href="#faq" className="text-gray-300 hover:text-white">
                  FAQ
                </a>
              </li>
              <li>
                <a href="#refunds" className="text-gray-300 hover:text-white">
                  Refund Policy
                </a>
              </li>
              <li>
                <a href="#gift-cards" className="text-gray-300 hover:text-white">
                  Gift Cards
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">For Organizers</h3>
            <ul className="space-y-2">
              <li>
                <a href="#create-event" className="text-gray-300 hover:text-white">
                  Create an Event
                </a>
              </li>
              <li>
                <a href="#pricing" className="text-gray-300 hover:text-white">
                  Pricing
                </a>
              </li>
              <li>
                <a href="#resources" className="text-gray-300 hover:text-white">
                  Resources
                </a>
              </li>
              <li>
                <a href="#api" className="text-gray-300 hover:text-white">
                  API Documentation
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Connect With Us</h3>
            <div className="flex space-x-4 mb-4">
              <a href="#facebook" className="text-gray-400 hover:text-white">
                <FacebookIcon className="h-6 w-6" />
                <span className="sr-only">Facebook</span>
              </a>
              <a href="#twitter" className="text-gray-400 hover:text-white">
                <TwitterIcon className="h-6 w-6" />
                <span className="sr-only">Twitter</span>
              </a>
              <a href="#instagram" className="text-gray-400 hover:text-white">
                <InstagramIcon className="h-6 w-6" />
                <span className="sr-only">Instagram</span>
              </a>
              <a href="#youtube" className="text-gray-400 hover:text-white">
                <YoutubeIcon className="h-6 w-6" />
                <span className="sr-only">YouTube</span>
              </a>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-2">
                Subscribe to our newsletter
              </h4>
              <div className="flex">
                <input type="email" placeholder="Enter your email" className="px-3 py-2 placeholder-gray-500 border border-transparent rounded-l-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent" />
                <button type="button" className="px-4 py-2 border border-transparent rounded-r-md bg-indigo-600 text-white font-medium hover:bg-indigo-700">
                  Subscribe
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            © 2023 VisiTix. All rights reserved.
          </p>
          <div className="mt-4 md:mt-0 flex space-x-6 text-sm text-gray-400">
            <a href="#terms" className="hover:text-white">
              Terms of Service
            </a>
            <a href="#privacy" className="hover:text-white">
              Privacy Policy
            </a>
            <a href="#cookies" className="hover:text-white">
              Cookie Policy
            </a>
          </div>
        </div>
      </div>
    </footer>;
};