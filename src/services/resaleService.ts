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

interface ResaleTicket {
  id: string;
  eventId: string;
  sellerId: string;
  sellerName: string;
  price: number;
  quantity: number;
  section?: string;
  row?: string;
  createdAt: string;
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
}

/**
 * Fetches all resale tickets for a specific event
 * @param eventId The ID of the event
 * @returns Promise with an array of ResaleTicket objects
 */
export const fetchResaleTickets = async (eventId: string): Promise<ResaleTicket[]> => {
  try {
    const ticketsRef = collection(db, 'resaleTickets');
    const q = query(
      ticketsRef,
      where('eventId', '==', eventId),
      where('quantity', '>', 0), // Only show tickets that are still available
      orderBy('price', 'asc') // Sort by price from lowest to highest
    );
    
    const querySnapshot = await getDocs(q);
    const tickets: ResaleTicket[] = [];
    
    querySnapshot.forEach((doc) => {
      tickets.push({
        id: doc.id,
        ...doc.data() as Omit<ResaleTicket, 'id'>
      });
    });
    
    return tickets;
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
 * Fetches a specific resale ticket by ID
 * @param ticketId The ID of the ticket to fetch
 * @returns Promise with the ResaleTicket object
 */
export const fetchResaleTicketById = async (ticketId: string): Promise<ResaleTicket> => {
  try {
    const ticketRef = doc(db, 'resaleTickets', ticketId);
    const ticketDoc = await getDoc(ticketRef);
    
    if (!ticketDoc.exists()) {
      throw new Error('Ticket not found');
    }
    
    return {
      id: ticketDoc.id,
      ...ticketDoc.data() as Omit<ResaleTicket, 'id'>
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
    const q = query(
      ticketsRef,
      where('sellerId', '==', sellerId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const tickets: ResaleTicket[] = [];
    
    querySnapshot.forEach((doc) => {
      tickets.push({
        id: doc.id,
        ...doc.data() as Omit<ResaleTicket, 'id'>
      });
    });
    
    return tickets;
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