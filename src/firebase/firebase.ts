import { initializeApp } from 'firebase/app';
import { 
  initializeFirestore, 
  enableMultiTabIndexedDbPersistence,
  collection,
  doc
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';


import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyARHp5Z0q6ECyu9vuP0E8czgZue0TvJ-3o",
  authDomain: "mks-expense-tracker.firebaseapp.com",
  projectId: "mks-expense-tracker",
  storageBucket: "mks-expense-tracker.firebasestorage.app",
  messagingSenderId: "585368845749",
  appId: "1:585368845749:web:8049ec755286411fe56dfc",
  measurementId: "G-13KBKF26B2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = initializeFirestore(app, {
  ignoreUndefinedProperties: true
});
const storage = getStorage(app);

// Enable offline persistence with multi-tab support
enableMultiTabIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Persistence could not be enabled because another tab is already open with persistence enabled.');
  } else if (err.code === 'unimplemented') {
    console.warn('The current browser does not support all of the features required to enable offline persistence.');
  } else {
    console.warn('Failed to enable offline persistence:', err);
  }
});

export { db, collection, doc, analytics, storage };
