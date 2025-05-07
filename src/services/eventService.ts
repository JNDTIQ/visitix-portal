import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';

export interface Event {
  id: string;
  title: string;
  date: string;
  location: string;
  image: string;
  category: string;
  price: number;
  description: string;
  featured: boolean;
}

export const fetchEvents = async (): Promise<Event[]> => {
  try {
    const eventsRef = collection(db, 'events');
    const snapshot = await getDocs(eventsRef);
    
    const events: Event[] = snapshot.docs.map(doc => ({
      id: doc.id,
      title: doc.data().title,
      date: doc.data().date,
      location: doc.data().location,
      image: doc.data().image,
      category: doc.data().category,
      price: doc.data().price,
      description: doc.data().description,
      featured: doc.data().featured
    }));

    return events;
  } catch (error) {
    console.error('Error fetching events:', error);
    throw error;
  }
};