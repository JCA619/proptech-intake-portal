import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy 
} from 'firebase/firestore';

// Default mock data to populate local storage when empty so the dashboard is immediately usable
const DEFAULT_MOCK_LEADS = [
  {
    id: 'mock-1',
    firstName: 'Sarah',
    lastName: 'Jenkins',
    email: 'sarah.j@techcorp.com',
    phone: '555-0128',
    contactMethod: 'Text',
    propertyOfInterest: 'Oakridge Condos - Unit 12B',
    moveInDate: '2026-06-20',
    budget: '$1,800 - $2,200',
    currentAddress: '742 Evergreen Terrace, Springfield, IL 62704',
    occupants: '1 Adult',
    hasPets: 'No',
    petDetails: '',
    notes: 'Urgent move-in. Needs a parking spot close to the building. Credit score is 740.',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    status: 'New'
  },
  {
    id: 'mock-2',
    firstName: 'Marcus',
    lastName: 'Brody',
    email: 'marcus.brody@museum.org',
    phone: '555-0144',
    contactMethod: 'Phone Call',
    propertyOfInterest: 'Grandview Heights - Suite 4A',
    moveInDate: '2026-08-15',
    budget: '$3,000 - $3,500',
    currentAddress: '128 Museum Way, New York, NY 10024',
    occupants: '2 Adults',
    hasPets: 'Yes',
    petDetails: 'One small golden retriever (25 lbs)',
    notes: 'Looking for a 12-month lease minimum. Works in curation. Very polite on phone.',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    status: 'Contacted'
  },
  {
    id: 'mock-3',
    firstName: 'Alice',
    lastName: 'Vance',
    email: 'alice.vance@gmail.com',
    phone: '555-0199',
    contactMethod: 'Email',
    propertyOfInterest: 'Sunset Plaza - Unit 302',
    moveInDate: '2026-07-01',
    budget: '$2,400 - $2,800',
    currentAddress: '55 Ocean Drive, Apt 3, Santa Monica, CA 90401',
    occupants: '1 Adult',
    hasPets: 'Yes',
    petDetails: 'One domestic shorthair cat',
    notes: 'Works remotely. Interested in high-speed internet options. Requested a video tour.',
    createdAt: new Date().toISOString(), // Today
    status: 'New'
  }
];

// Firebase configuration placeholder
// In production, these should be replaced with actual config values
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBDhmsLPp1USjF6ad6y3LIQebG4JPAMMMA",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "intake-form-87163.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "intake-form-87163",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "intake-form-87163.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "170034329510",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:170034329510:web:a179a8c3e5a13d56e9c167"
};

// Check if valid firebase configuration is provided
const isFirebaseEnabled = 
  firebaseConfig.apiKey && 
  firebaseConfig.apiKey !== 'YOUR_API_KEY' &&
  firebaseConfig.projectId;

let db = null;

if (isFirebaseEnabled) {
  try {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app);
    console.log('Firebase integration successfully initialized.');
  } catch (error) {
    console.error('Failed to initialize Firebase. Falling back to LocalStorage mode:', error);
  }
} else {
  console.log('Running in LocalStorage Mode. Submissions will be stored in your browser.');
}

// -------------------------------------------------------------
// Database Operations (with automatic LocalStorage fallbacks)
// -------------------------------------------------------------

/**
 * Saves a new client lead submission
 */
export async function saveLead(leadData) {
  const formattedData = {
    ...leadData,
    createdAt: new Date().toISOString(),
    status: 'New'
  };

  if (isFirebaseEnabled && db) {
    try {
      const docRef = await addDoc(collection(db, 'leads'), formattedData);
      return { id: docRef.id, ...formattedData };
    } catch (e) {
      console.error('Error adding document to Firestore: ', e);
      return saveToLocalStorage(formattedData);
    }
  } else {
    return saveToLocalStorage(formattedData);
  }
}

/**
 * Subscribes to real-time changes in the leads database
 */
export function subscribeToLeads(callback) {
  if (isFirebaseEnabled && db) {
    const q = query(collection(db, 'leads'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const leads = [];
      snapshot.forEach((doc) => {
        leads.push({ id: doc.id, ...doc.data() });
      });
      callback(leads);
    }, (error) => {
      console.error('Firestore subscription error, falling back to LocalStorage:', error);
      setupLocalStorageSubscription(callback);
    });
  } else {
    return setupLocalStorageSubscription(callback);
  }
}

/**
 * Updates properties of a single lead (e.g. status, internal notes)
 */
export async function updateLead(leadId, updatedFields) {
  if (isFirebaseEnabled && db && !leadId.startsWith('mock-') && !leadId.startsWith('local-')) {
    try {
      const docRef = doc(db, 'leads', leadId);
      await updateDoc(docRef, updatedFields);
      return true;
    } catch (e) {
      console.error('Error updating document in Firestore: ', e);
      return updateInLocalStorage(leadId, updatedFields);
    }
  } else {
    return updateInLocalStorage(leadId, updatedFields);
  }
}

/**
 * Deletes a lead record
 */
export async function deleteLead(leadId) {
  if (isFirebaseEnabled && db && !leadId.startsWith('mock-') && !leadId.startsWith('local-')) {
    try {
      const docRef = doc(db, 'leads', leadId);
      await deleteDoc(docRef);
      return true;
    } catch (e) {
      console.error('Error deleting document in Firestore: ', e);
      return deleteFromLocalStorage(leadId);
    }
  } else {
    return deleteFromLocalStorage(leadId);
  }
}

// -------------------------------------------------------------
// LocalStorage Helper Functions
// -------------------------------------------------------------

function getLocalStorageLeads() {
  const data = localStorage.getItem('proptech_leads');
  if (!data) {
    localStorage.setItem('proptech_leads', JSON.stringify(DEFAULT_MOCK_LEADS));
    return DEFAULT_MOCK_LEADS;
  }
  return JSON.parse(data);
}

function saveToLocalStorage(lead) {
  const leads = getLocalStorageLeads();
  const newLead = {
    ...lead,
    id: 'local-' + Math.random().toString(36).substr(2, 9)
  };
  leads.unshift(newLead);
  localStorage.setItem('proptech_leads', JSON.stringify(leads));
  
  // Trigger custom event to notify listeners
  window.dispatchEvent(new Event('leads_updated'));
  return newLead;
}

function updateInLocalStorage(id, fields) {
  const leads = getLocalStorageLeads();
  const index = leads.findIndex(l => l.id === id);
  if (index !== -1) {
    leads[index] = { ...leads[index], ...fields };
    localStorage.setItem('proptech_leads', JSON.stringify(leads));
    window.dispatchEvent(new Event('leads_updated'));
    return true;
  }
  return false;
}

function deleteFromLocalStorage(id) {
  let leads = getLocalStorageLeads();
  leads = leads.filter(l => l.id !== id);
  localStorage.setItem('proptech_leads', JSON.stringify(leads));
  window.dispatchEvent(new Event('leads_updated'));
  return true;
}

function setupLocalStorageSubscription(callback) {
  // Initial callback
  callback(getLocalStorageLeads());

  const handleUpdate = () => {
    callback(getLocalStorageLeads());
  };

  window.addEventListener('leads_updated', handleUpdate);
  
  // Return unsubscribe function
  return () => {
    window.removeEventListener('leads_updated', handleUpdate);
  };
}

// Export connection status helper
export function getFirebaseConnectionStatus() {
  return {
    enabled: isFirebaseEnabled,
    connected: !!(db)
  };
}
