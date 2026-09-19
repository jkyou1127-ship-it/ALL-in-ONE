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
  apiKey: 'AIzaSyC0cG_uGb4tOd21iq3IfPNsXsPnTpmKsaQ',
  authDomain: 'obdcube.firebaseapp.com',
  projectId: 'obdcube',
  storageBucket: 'obdcube.firebasestorage.app',
  messagingSenderId: '505352089186',
  appId: '1:505352089186:web:5b397e5e2962eb32526b3b',
};

export const firebaseConfigured = firebaseConfig.apiKey !== 'PLACEHOLDER_API_KEY';

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
