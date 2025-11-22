import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

// O config que você forneceu
export const firebaseConfig = {
  apiKey: "AIzaSyAqp2By_huytVefw41Tte0QAsFqCDBkbJI",
  authDomain: "cronometro-64eaa.firebaseapp.com",
  projectId: "cronometro-64eaa",
  storageBucket: "cronometro-64eaa.firebasestorage.app",
  messagingSenderId: "1061959021378",
  appId: "1:1061959021378:web:ed8a785cf7f744c06e4edb",
  measurementId: "G-2EERRTX1RF"
};

// Inicializa e exporta os serviços
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Login com Google
const googleProvider = new GoogleAuthProvider();

export { db, auth, app, googleProvider, signInWithPopup };
export default db;
