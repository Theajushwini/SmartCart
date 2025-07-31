// src/firebase.js

// 1. Import Firebase functions
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get, update, onValue, remove } from "firebase/database";


// 2. Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyABiRU_iEMSJVVUgaYesM1m_O0_Nl3CxKU",
  authDomain: "smartcart-b7805.firebaseapp.com",
  databaseURL: "https://smartcart-b7805-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "smartcart-b7805",
  storageBucket: "smartcart-b7805.firebasestorage.app",
  messagingSenderId: "115267998167",
  appId: "1:115267998167:web:64fc8d7de0f5147ec27b92"
};

// 3. Initialize Firebase
const app = initializeApp(firebaseConfig);

// 4. ✅ Get a reference to the Realtime Database
const database = getDatabase(app);

// 5. ✅ Export it so you can use it elsewhere in your app
export {
  database,
  ref,
  set,
  get,
  update,
  onValue,
  remove  // optional, in case you use it elsewhere
};
