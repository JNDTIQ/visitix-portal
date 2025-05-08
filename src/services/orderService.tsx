import { collection, addDoc, getDoc, getDocs, doc, query, where, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from './firebase';

// Stricter status type
export type OrderStatus = 'pending' | 'completed' | 'failed' | 'cancelled';

export interface Order {
  id?: string;
  ticketId: string;
  buyerId: string;
  amount: number;
  status: OrderStatus;
  createdAt?: Date;
  updatedAt?: Date;
  paymentIntentId?: string;
  eventId?: string;
  quantity?: number;
}

export interface OrderDetails {
  id: string;
  status: string;
  amount: number;
  date: string;
  ticketId: string;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  eventLocation: string;
  section?: string;
  row?: string;
  quantity: number;
  confirmationCode: string;
  isResale: boolean;
  sellerName?: string;
}

const ORDERS_COLLECTION = 'orders';

// Create a new order
export async function createOrder(orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const now = new Date();
  const docRef = await addDoc(collection(db, ORDERS_COLLECTION), {
    ...orderData,
    createdAt: Timestamp.fromDate(now),
    updatedAt: Timestamp.fromDate(now),
  });
  return docRef.id;
}

// Get a single order by ID
export async function getOrder(orderId: string): Promise<Order | null> {
  const docRef = doc(db, ORDERS_COLLECTION, orderId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    createdAt: data.createdAt?.toDate?.() ?? undefined,
    updatedAt: data.updatedAt?.toDate?.() ?? undefined,
  } as Order;
}

// Get all orders for a user
export async function getOrdersByUser(buyerId: string): Promise<Order[]> {
  const q = query(collection(db, ORDERS_COLLECTION), where('buyerId', '==', buyerId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docSnap => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      createdAt: data.createdAt?.toDate?.() ?? undefined,
      updatedAt: data.updatedAt?.toDate?.() ?? undefined,
    } as Order;
  });
}

// Update order status
export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
  const docRef = doc(db, ORDERS_COLLECTION, orderId);
  await updateDoc(docRef, {
    status,
    updatedAt: Timestamp.fromDate(new Date()),
  });
}

// Get all orders (admin use)
export async function getAllOrders(): Promise<Order[]> {
  const snapshot = await getDocs(collection(db, ORDERS_COLLECTION));
  return snapshot.docs.map(docSnap => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      createdAt: data.createdAt?.toDate?.() ?? undefined,
      updatedAt: data.updatedAt?.toDate?.() ?? undefined,
    } as Order;
  });
}

// Delete an order (admin/cancellation)
export async function deleteOrder(orderId: string): Promise<void> {
  const docRef = doc(db, ORDERS_COLLECTION, orderId);
  await deleteDoc(docRef);
}

// Get order details with event and ticket info
export async function getOrderDetails(orderId: string | null, userId?: string): Promise<OrderDetails | null> {
  // If orderId is provided, fetch that specific order
  if (orderId) {
    const order = await getOrder(orderId);
    if (!order) return null;

    // Fetch event details
    let eventDetails = { title: 'Unknown Event', date: 'Unknown Date', location: 'Unknown Location', id: '' };
    if (order.eventId) {
      const eventDoc = await getDoc(doc(db, 'events', order.eventId));
      if (eventDoc.exists()) {
        const data = eventDoc.data();
        eventDetails = { 
          title: data.title || 'Unknown Event', 
          date: data.date ? (typeof data.date === 'string' ? data.date : data.date.toDate?.().toLocaleDateString()) : 'Unknown Date',
          location: data.location || 'Unknown Location',
          id: eventDoc.id
        };
      }
    }

    // Fetch ticket details
    let ticketDetails = { section: undefined, row: undefined, quantity: 1, isResale: false, sellerName: undefined };
    if (order.ticketId) {
      const ticketDoc = await getDoc(doc(db, 'resaleTickets', order.ticketId));
      if (ticketDoc.exists()) {
        const data = ticketDoc.data();
        ticketDetails = {
          section: data.section,
          row: data.row,
          quantity: data.quantity || 1,
          isResale: true,
          sellerName: data.sellerName
        };
      }
    }

    // Generate confirmation code (typically would be stored, but for example we'll generate it)
    const confirmationCode = `TC${orderId.slice(0, 6).toUpperCase()}`;

    return {
      id: order.id || '',
      status: order.status,
      amount: order.amount,
      date: order.createdAt ? order.createdAt.toISOString() : new Date().toISOString(),
      ticketId: order.ticketId,
      eventId: order.eventId || '',
      eventTitle: eventDetails.title,
      eventDate: eventDetails.date,
      eventLocation: eventDetails.location,
      section: ticketDetails.section,
      row: ticketDetails.row,
      quantity: ticketDetails.quantity,
      confirmationCode,
      isResale: ticketDetails.isResale,
      sellerName: ticketDetails.sellerName
    };
  } 
  // If userId is provided, fetch the most recent order for that user
  else if (userId) {
    const orders = await getOrdersByUser(userId);
    if (orders.length === 0) return null;
    
    // Sort by creation date descending and get the most recent
    const recentOrder = orders.sort((a, b) => {
      const dateA = a.createdAt ? a.createdAt.getTime() : 0;
      const dateB = b.createdAt ? b.createdAt.getTime() : 0;
      return dateB - dateA;
    })[0];
    
    // Recursively call with the orderId to get full details
    return getOrderDetails(recentOrder.id);
  }
  
  return null;
}