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
export async function getOrderDetails(orderId: string) {
  const order = await getOrder(orderId);
  if (!order) return null;

  // Fetch event details if eventId exists
  let eventDetails = null;
  if (order.eventId) {
    const eventDoc = await getDoc(doc(db, 'events', order.eventId));
    eventDetails = eventDoc.exists() ? { id: eventDoc.id, ...eventDoc.data() } : null;
  }

  // Fetch ticket details if ticketId exists
  let ticketDetails = null;
  if (order.ticketId) {
    const ticketDoc = await getDoc(doc(db, 'resaleTickets', order.ticketId));
    ticketDetails = ticketDoc.exists() ? { id: ticketDoc.id, ...ticketDoc.data() } : null;
  }

  return {
    ...order,
    event: eventDetails,
    ticket: ticketDetails,
  };
}