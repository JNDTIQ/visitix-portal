import { db } from "./firebase";
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";

const eventsRef = collection(db, "events");

export const createEvent = async (eventData: any) => {
  return await addDoc(eventsRef, eventData);
};

export const fetchEvents = async () => {
  const snapshot = await getDocs(eventsRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const updateEvent = async (id: string, updatedData: any) => {
  const eventDoc = doc(db, "events", id);
  return await updateDoc(eventDoc, updatedData);
};

export const deleteEvent = async (id: string) => {
  const eventDoc = doc(db, "events", id);
  return await deleteDoc(eventDoc);
};
