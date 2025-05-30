import { db } from "./firebase";
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where } from "firebase/firestore";

const ticketsRef = collection(db, "tickets");

export const createTicket = async (ticketData: any) => {
  return await addDoc(ticketsRef, ticketData);
};

export const fetchTickets = async () => {
  const snapshot = await getDocs(ticketsRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const fetchUserTickets = async (userId: string) => {
  try {
    const q = query(ticketsRef, where("userId", "==", userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching user tickets:", error);
    throw new Error("Failed to fetch user tickets");
  }
};

export const updateTicket = async (id: string, updatedData: any) => {
  const ticketDoc = doc(db, "tickets", id);
  return await updateDoc(ticketDoc, updatedData);
};

export const deleteTicket = async (id: string) => {
  const ticketDoc = doc(db, "tickets", id);
  return await deleteDoc(ticketDoc);
};
