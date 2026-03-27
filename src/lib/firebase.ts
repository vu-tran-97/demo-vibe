import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyB6bGyC5pqbou49aqLNuFz4P9OH0eRv9X8",
  authDomain: "vibe-shop-ecommerce.firebaseapp.com",
  projectId: "vibe-shop-ecommerce",
  storageBucket: "vibe-shop-ecommerce.firebasestorage.app",
  messagingSenderId: "953565200792",
  appId: "1:953565200792:web:140b95fcde12cd13426bed",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
