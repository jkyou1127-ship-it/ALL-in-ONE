import { initializeApp, type FirebaseOptions } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase web config is not a secret - it just identifies which project to talk
// to. Access control is enforced by Firestore Security Rules, not by hiding this
// object.
//
// This points at the SAME Firebase project as the OBD Cube app (../../obdcube),
// so a single email/password account works across both apps in this ALL-in-ONE
// site ("integrated login") - solves/records saved here belong to the same uid
// that OBD Cube uses for competitions, admin status and licenses.
const firebaseConfig: FirebaseOptions = {
  apiKey: 'AIzaSyAWJX2yC3xFFcbG9nhuwvxKWA9EAtwCDh4',
  authDomain: 'all-in-one-bfc59.firebaseapp.com',
  projectId: 'all-in-one-bfc59',
  storageBucket: 'all-in-one-bfc59.firebasestorage.app',
  messagingSenderId: '354393080607',
  appId: '1:354393080607:web:73d5f8fae5baa9b85aa62a',
};

export const firebaseConfigured = firebaseConfig.apiKey !== 'PLACEHOLDER_API_KEY';

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
