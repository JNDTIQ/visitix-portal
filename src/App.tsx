import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { FeaturedEvents } from './components/FeaturedEvents';
import { CtaSection } from './components/CtaSection';
import { Footer } from './components/Footer';
import EventsPage from './pages/EventsPage';
import EventDetailPage from './pages/EventDetailPage';
import TicketResalePage from './pages/TicketResalePage';
import CheckoutPage from './pages/CheckoutPage';
import LoginPage from './components/LoginPage';
import SignupPage from './components/SignupPage';
import ProfilePage from './components/ProfilePage';
import ForgotPassword from './components/ForgotPassword';
import ProtectedRoute from './components/ProtectedRoute';
import VerifierRoute from './components/VerifierRoute';
import { AuthProvider } from './contexts/AuthContext';
import PaymentCompletePage from './pages/PaymentCompletePage';
import SellTicketsPage from './pages/SellTicketsPage';
import TicketTransferPage from './pages/TicketTransferPage';
import TicketVerificationPage from './pages/TicketVerificationPage';
import CreateResaleTicketPage from './pages/CreateResaleTicketPage';

export function App() {
  return (
    <AuthProvider>
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route
              path="/"
              element={
                <>
                  <HeroSection />
                  <FeaturedEvents />
                  <CtaSection />
                </>
              }
            />
            <Route path="/sell" element={<SellTicketsPage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/event/:id" element={<EventDetailPage />} />
            <Route path="/resale" element={<TicketResalePage />} /> {/* Main resale route - accessible from CTA and navigation */}
            <Route path="/resale/:id" element={<TicketResalePage />} /> {/* Route for specific event's resale tickets */}
            <Route 
              path="/resale/create" 
              element={
                <ProtectedRoute>
                  <CreateResaleTicketPage />
                </ProtectedRoute>
              } 
            /> {/* New route for creating a resale ticket */}
            <Route 
              path="/checkout/resale/:ticketId" 
              element={
                <ProtectedRoute>
                  <CheckoutPage />
                </ProtectedRoute>
              } 
            />
            <Route path="/checkout/:id" element={
              <ProtectedRoute>
                <CheckoutPage />
              </ProtectedRoute>
            } />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              } 
            />
            <Route path="/payment-complete" element={<PaymentCompletePage />} />
            <Route 
              path="/transfer" 
              element={
                <ProtectedRoute>
                  <TicketTransferPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/transfer/:eventId" 
              element={
                <ProtectedRoute>
                  <TicketTransferPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/verify-ticket/:id" 
              element={
                <VerifierRoute>
                  <TicketVerificationPage />
                </VerifierRoute>
              } 
            />
          </Routes>
        </main>
        <Footer />
      </div>
    </AuthProvider>
  );
}

export default App;