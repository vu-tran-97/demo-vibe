import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAlVpwJ91xzok_uMSdX4a57TrxX3R8nNRw",
  authDomain: "vibe-ecommerce-app.firebaseapp.com",
  projectId: "vibe-ecommerce-app",
  storageBucket: "vibe-ecommerce-app.firebasestorage.app",
  messagingSenderId: "388829286580",
  appId: "1:388829286580:web:32caaf92c41fcaf71287e1",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
