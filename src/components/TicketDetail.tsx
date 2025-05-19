import React from 'react';
import { Calendar, MapPin, CreditCard, User, Tag, QrCode } from 'lucide-react';
import VerificationStatusBadge, { VerificationStatus } from './VerificationStatusBadge';

interface TicketDetailProps {
  ticketData: {
    id: string;
    eventName: string;
    eventDate?: string;
    venue?: string;
    seatInfo?: string;
    price?: string;
    ticketType?: string;
    holder?: string;
    barcode?: string;
    qrCode?: string;
    status?: VerificationStatus;
    confidenceScore?: number;
  };
  showQRCode?: boolean;
  showVerificationStatus?: boolean;
}

const TicketDetail: React.FC<TicketDetailProps> = ({
  ticketData,
  showQRCode = false,
  showVerificationStatus = true
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Header */}
      <div className="relative bg-gradient-to-r from-indigo-600 to-indigo-800 text-white p-6">
        {showVerificationStatus && ticketData.status && (
          <div className="absolute top-4 right-4">
            <VerificationStatusBadge 
              status={ticketData.status} 
              confidenceScore={ticketData.confidenceScore}
              showConfidence
              size="lg"
              className="shadow-sm"
            />
          </div>
        )}
        <h3 className="text-xl font-bold mb-1">{ticketData.eventName}</h3>
        
        {ticketData.eventDate && (
          <div className="flex items-center text-indigo-100 mb-1">
            <Calendar className="h-4 w-4 mr-1" />
            <span className="text-sm">{ticketData.eventDate}</span>
          </div>
        )}
        
        {ticketData.venue && (
          <div className="flex items-center text-indigo-100">
            <MapPin className="h-4 w-4 mr-1" />
            <span className="text-sm">{ticketData.venue}</span>
          </div>
        )}
      </div>
      
      {/* Details */}
      <div className="p-6">
        <div className="grid grid-cols-2 gap-4">
          {ticketData.seatInfo && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Seat Information</p>
              <p className="font-medium">{ticketData.seatInfo}</p>
            </div>
          )}
          
          {ticketData.price && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Price</p>
              <div className="flex items-center">
                <CreditCard className="h-4 w-4 text-gray-400 mr-1" />
                <p className="font-medium">{ticketData.price}</p>
              </div>
            </div>
          )}
          
          {ticketData.ticketType && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Ticket Type</p>
              <div className="flex items-center">
                <Tag className="h-4 w-4 text-gray-400 mr-1" />
                <p className="font-medium">{ticketData.ticketType}</p>
              </div>
            </div>
          )}
          
          {ticketData.holder && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Ticket Holder</p>
              <div className="flex items-center">
                <User className="h-4 w-4 text-gray-400 mr-1" />
                <p className="font-medium">{ticketData.holder}</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Barcode/QR Code section */}
        {(ticketData.barcode || ticketData.qrCode) && showQRCode && (
          <div className="mt-6 pt-6 border-t">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-700">Ticket Code</p>
              <div className="flex items-center text-indigo-600 text-sm">
                <QrCode className="h-4 w-4 mr-1" />
                <span>{ticketData.barcode?.slice(0, 4) || ''}••••</span>
              </div>
            </div>
            
            {ticketData.qrCode && (
              <div className="flex justify-center mt-2">
                <img 
                  src={ticketData.qrCode} 
                  alt="Ticket QR Code"
                  className="w-40 h-40 object-contain"
                />
              </div>
            )}
          </div>
        )}
        
        {/* Ticket ID footer */}
        <div className="mt-6 pt-4 border-t border-dashed border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Ticket ID: {ticketData.id}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TicketDetail;
