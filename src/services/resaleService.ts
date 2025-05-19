import { db } from './firebase';
import {
  collection,
  getDocs,
  addDoc,
  query,
  where,
  doc,
  getDoc,
  deleteDoc,
  updateDoc,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';

export interface ResaleTicket {
  id: string;
  eventId: string;
  sellerId: string;
  sellerName: string;
  price: number;
  quantity: number;
  section?: string;
  row?: string;
  createdAt: string;
  eventTitle: string;
  validationId?: string;
  ticketFiles?: string[];
  ticketType?: 'physical' | 'digital';
}

interface ResaleTicketInput {
  eventId: string;
  sellerId: string;
  sellerName: string;
  price: number;
  quantity: number;
  section?: string;
  row?: string;
  createdAt: string;
  eventTitle: string;
  validationId?: string;
  ticketFiles?: string[];
  ticketType?: 'physical' | 'digital';
}

/**
 * Fetches all resale tickets for a specific event
 * @param eventId The ID of the event
 * @returns Promise with an array of ResaleTicket objects
 */
export const fetchResaleTickets = async (eventId: string): Promise<ResaleTicket[]> => {
  try {
    const ticketsRef = collection(db, 'resaleTickets');
    
    try {
      const q = query(
        ticketsRef,
        where('eventId', '==', eventId),
        where('quantity', '>', 0), // Only show tickets that are still available
        orderBy('price', 'asc') // Sort by price from lowest to highest
      );
      
      const querySnapshot = await getDocs(q);
      const tickets: ResaleTicket[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        tickets.push({
          id: doc.id,
          eventId: data.eventId || '',
          sellerId: data.sellerId || '',
          sellerName: data.sellerName || '',
          price: data.price || 0,
          quantity: data.quantity || 0,
          section: data.section,
          row: data.row,
          createdAt: data.createdAt || new Date().toISOString(),
          eventTitle: data.eventTitle || '',
          validationId: data.validationId,
          ticketFiles: data.ticketFiles || [],
          ticketType: data.ticketType,
        });
      });
      
      return tickets;
    } catch (indexError) {
      console.warn('Missing index, falling back to simpler query:', indexError);
      
      // Fallback to a simpler query without ordering
      const simpleQuery = query(
        ticketsRef,
        where('eventId', '==', eventId),
        where('quantity', '>', 0)
      );
      
      const querySnapshot = await getDocs(simpleQuery);
      const tickets: ResaleTicket[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        tickets.push({
          id: doc.id,
          eventId: data.eventId || '',
          sellerId: data.sellerId || '',
          sellerName: data.sellerName || '',
          price: data.price || 0,
          quantity: data.quantity || 0,
          section: data.section,
          row: data.row,
          createdAt: data.createdAt || new Date().toISOString(),
          eventTitle: data.eventTitle || '',
          validationId: data.validationId,
          ticketFiles: data.ticketFiles || [],
          ticketType: data.ticketType,
        });
      });
      
      // Sort manually in memory if we can't use Firestore's ordering
      return tickets.sort((a, b) => a.price - b.price);
    }
  } catch (error) {
    console.error('Error fetching resale tickets:', error);
    throw new Error('Failed to fetch resale tickets');
  }
};

/**
 * Creates a new resale ticket listing
 * @param ticketData The ticket data to create
 * @returns Promise with the ID of the created ticket
 */
export const createResaleListing = async (ticketData: ResaleTicketInput): Promise<string> => {
  try {
    // Add server timestamp for accurate sorting
    const dataWithTimestamp = {
      ...ticketData,
      createdAt: ticketData.createdAt || new Date().toISOString(),
      serverTimestamp: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, 'resaleTickets'), dataWithTimestamp);
    return docRef.id;
  } catch (error) {
    console.error('Error creating resale listing:', error);
    throw new Error('Failed to create resale listing');
  }
};

/**
 * Fetches all available resale tickets across all events
 * @returns Promise with an array of ResaleTicket objects
 */
export const fetchAllResaleTickets = async (): Promise<ResaleTicket[]> => {
  try {
    const ticketsRef = collection(db, 'resaleTickets');
    
    // First try with the composite query (requires index)
    try {
      const q = query(
        ticketsRef,
        where('quantity', '>', 0), // Only show tickets that are still available
        orderBy('serverTimestamp', 'desc') // Most recently listed first
      );
      
      const querySnapshot = await getDocs(q);
      const tickets: ResaleTicket[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        tickets.push({
          id: doc.id,
          eventId: data.eventId || '',
          sellerId: data.sellerId || '',
          sellerName: data.sellerName || '',
          price: data.price || 0,
          quantity: data.quantity || 0,
          section: data.section,
          row: data.row,
          createdAt: data.createdAt || new Date().toISOString(),
          eventTitle: data.eventTitle || '',
          validationId: data.validationId,
          ticketFiles: data.ticketFiles || [],
          ticketType: data.ticketType,
        });
      });
      
      return tickets;
    } catch (indexError) {
      console.warn('Missing index, falling back to simpler query:', indexError);
      
      // Fallback to a simpler query without ordering if index doesn't exist
      const simpleQuery = query(
        ticketsRef,
        where('quantity', '>', 0)
      );
      
      const querySnapshot = await getDocs(simpleQuery);
      const tickets: ResaleTicket[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        tickets.push({
          id: doc.id,
          eventId: data.eventId || '',
          sellerId: data.sellerId || '',
          sellerName: data.sellerName || '',
          price: data.price || 0,
          quantity: data.quantity || 0,
          section: data.section,
          row: data.row,
          createdAt: data.createdAt || new Date().toISOString(),
          eventTitle: data.eventTitle || '',
          validationId: data.validationId,
          ticketFiles: data.ticketFiles || [],
          ticketType: data.ticketType,
        });
      });
      
      // Sort in memory if we can't use Firestore's ordering
      return tickets.sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    }
  } catch (error) {
    console.error('Error fetching all resale tickets:', error);
    throw new Error('Failed to fetch resale tickets');
  }
};

/**
 * Fetches all resale tickets listed by a specific seller
 * @param sellerId The ID of the seller
 * @returns Promise with an array of ResaleTicket objects
 */
export const fetchUserResaleTickets = async (sellerId: string): Promise<ResaleTicket[]> => {
  try {
    const ticketsRef = collection(db, 'resaleTickets');
    
    try {
      const q = query(
        ticketsRef,
        where('sellerId', '==', sellerId),
        orderBy('serverTimestamp', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const tickets: ResaleTicket[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        tickets.push({
          id: doc.id,
          eventId: data.eventId || '',
          sellerId: data.sellerId || '',
          sellerName: data.sellerName || '',
          price: data.price || 0,
          quantity: data.quantity || 0,
          section: data.section,
          row: data.row,
          createdAt: data.createdAt || new Date().toISOString(),
          eventTitle: data.eventTitle || '',
          validationId: data.validationId,
          ticketFiles: data.ticketFiles || [],
          ticketType: data.ticketType,
        });
      });
      
      return tickets;
    } catch (indexError) {
      console.warn('Missing index, falling back to simpler query:', indexError);
      
      // Fallback to a simpler query without ordering
      const simpleQuery = query(
        ticketsRef,
        where('sellerId', '==', sellerId)
      );
      
      const querySnapshot = await getDocs(simpleQuery);
      const tickets: ResaleTicket[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        tickets.push({
          id: doc.id,
          eventId: data.eventId || '',
          sellerId: data.sellerId || '',
          sellerName: data.sellerName || '',
          price: data.price || 0,
          quantity: data.quantity || 0,
          section: data.section,
          row: data.row,
          createdAt: data.createdAt || new Date().toISOString(),
          eventTitle: data.eventTitle || '',
          validationId: data.validationId,
          ticketFiles: data.ticketFiles || [],
          ticketType: data.ticketType,
        });
      });
      
      // Sort manually in memory if we can't use Firestore's ordering
      return tickets.sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    }
  } catch (error) {
    console.error('Error fetching user resale tickets:', error);
    throw new Error('Failed to fetch user tickets');
  }
};
export const fetchResaleTicketById = async (ticketId: string): Promise<ResaleTicket> => {
  try {
    const ticketRef = doc(db, 'resaleTickets', ticketId);
    const ticketDoc = await getDoc(ticketRef);
    
    if (!ticketDoc.exists()) {
      throw new Error('Ticket not found');
    }
    
    const data = ticketDoc.data();
    return {
      id: ticketDoc.id,
      eventId: data.eventId || '',
      sellerId: data.sellerId || '',
      sellerName: data.sellerName || '',
      price: data.price || 0,
      quantity: data.quantity || 0,
      section: data.section,
      row: data.row,
      createdAt: data.createdAt || new Date().toISOString(),
      eventTitle: data.eventTitle || '',
      validationId: data.validationId,
      ticketFiles: data.ticketFiles || [],
      ticketType: data.ticketType,
    };
  } catch (error) {
    console.error('Error fetching resale ticket:', error);
    throw new Error('Failed to fetch resale ticket');
  }
};

/**
 * Updates the quantity of a resale ticket after purchase
 * @param ticketId The ID of the ticket to update
 * @param quantityPurchased The number of tickets being purchased
 * @returns Promise<void>
 */
export const updateTicketQuantity = async (
  ticketId: string,
  quantityPurchased: number
): Promise<void> => {
  try {
    const ticketRef = doc(db, 'resaleTickets', ticketId);
    const ticketDoc = await getDoc(ticketRef);
    
    if (!ticketDoc.exists()) {
      throw new Error('Ticket not found');
    }
    
    const ticketData = ticketDoc.data() as ResaleTicket;
    const remainingQuantity = ticketData.quantity - quantityPurchased;
    
    if (remainingQuantity < 0) {
      throw new Error('Not enough tickets available');
    }
    
    if (remainingQuantity === 0) {
      // Remove the listing if no tickets remain
      await deleteDoc(ticketRef);
    } else {
      // Update the quantity
      await updateDoc(ticketRef, {
        quantity: remainingQuantity
      });
    }
  } catch (error) {
    console.error('Error updating ticket quantity:', error);
    throw new Error('Failed to update ticket quantity');
  }
};

/**
 * Fetches all resale tickets listed by a specific seller
 * @param sellerId The ID of the seller
 * @returns Promise with an array of ResaleTicket objects
 */
export const fetchUserListings = async (sellerId: string): Promise<ResaleTicket[]> => {
  try {
    const ticketsRef = collection(db, 'resaleTickets');
    
    try {
      const q = query(
        ticketsRef,
        where('sellerId', '==', sellerId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const tickets: ResaleTicket[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        tickets.push({
          id: doc.id,
          eventId: data.eventId || '',
          sellerId: data.sellerId || '',
          sellerName: data.sellerName || '',
          price: data.price || 0,
          quantity: data.quantity || 0,
          section: data.section,
          row: data.row,
          createdAt: data.createdAt || new Date().toISOString(),
          eventTitle: data.eventTitle || '',
          validationId: data.validationId,
          ticketFiles: data.ticketFiles || [],
          ticketType: data.ticketType,
        });
      });
      
      return tickets;
    } catch (indexError) {
      console.warn('Missing index, falling back to simpler query:', indexError);
      
      // Fallback to a simpler query without ordering
      const simpleQuery = query(
        ticketsRef,
        where('sellerId', '==', sellerId)
      );
      
      const querySnapshot = await getDocs(simpleQuery);
      const tickets: ResaleTicket[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        tickets.push({
          id: doc.id,
          eventId: data.eventId || '',
          sellerId: data.sellerId || '',
          sellerName: data.sellerName || '',
          price: data.price || 0,
          quantity: data.quantity || 0,
          section: data.section,
          row: data.row,
          createdAt: data.createdAt || new Date().toISOString(),
          eventTitle: data.eventTitle || '',
          validationId: data.validationId,
          ticketFiles: data.ticketFiles || [],
          ticketType: data.ticketType,
        });
      });
      
      // Sort manually in memory if we can't use Firestore's ordering
      return tickets.sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    }
  } catch (error) {
    console.error('Error fetching user listings:', error);
    throw new Error('Failed to fetch user listings');
  }
};

/**
 * Removes a ticket listing
 * @param ticketId The ID of the ticket to remove
 * @param sellerId The ID of the seller (for verification)
 * @returns Promise<void>
 */
export const removeTicketListing = async (
  ticketId: string,
  sellerId: string
): Promise<void> => {
  try {
    const ticketRef = doc(db, 'resaleTickets', ticketId);
    const ticketDoc = await getDoc(ticketRef);
    
    if (!ticketDoc.exists()) {
      throw new Error('Ticket not found');
    }
    
    const ticketData = ticketDoc.data() as ResaleTicket;
    
    // Verify the seller is the owner of the listing
    if (ticketData.sellerId !== sellerId) {
      throw new Error('Unauthorized to remove this listing');
    }
    
    await deleteDoc(ticketRef);
  } catch (error) {
    console.error('Error removing ticket listing:', error);
    throw new Error('Failed to remove ticket listing');
  }
};

/**
 * Updates an existing resale ticket
 * @param ticketId The ID of the ticket to update
 * @param updates The fields to update
 * @returns Promise that resolves when the update is complete
 */
export const updateResaleTicket = async (
  ticketId: string, 
  updates: Partial<Omit<ResaleTicket, 'id' | 'createdAt'>>
): Promise<void> => {
  try {
    const ticketRef = doc(db, 'resaleTickets', ticketId);
    
    // Add server timestamp for accurate sorting of updated listings
    const updatesWithTimestamp = {
      ...updates,
      updatedAt: serverTimestamp()
    };
    
    await updateDoc(ticketRef, updatesWithTimestamp);
  } catch (error) {
    console.error('Error updating resale ticket:', error);
    throw new Error('Failed to update resale ticket');
  }
};

/**
 * Deletes a resale ticket
 * @param ticketId The ID of the ticket to delete
 * @returns Promise that resolves when the delete is complete
 */
export const deleteResaleTicket = async (ticketId: string): Promise<void> => {
  try {
    const ticketRef = doc(db, 'resaleTickets', ticketId);
    await deleteDoc(ticketRef);
  } catch (error) {
    console.error('Error deleting resale ticket:', error);
    throw new Error('Failed to delete resale ticket');
  }
};