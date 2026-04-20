import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";

import { 
  getAuth 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import {
  getFirestore
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// 🔑 YOUR FIREBASE CONFIG (paste yours here)
const firebaseConfig = {
    apiKey: "AIzaSyAem227DiziypXlJpa1FCqzvAH-gD0K750",
  authDomain: "workboard-fdf84.firebaseapp.com",
  projectId: "workboard-fdf84",
  appId: "1:412387128397:web:f3e5701388b90425831804",
};

// INIT
const app = initializeApp(firebaseConfig);

// EXPORTS
export const auth = getAuth(app);
export const db = getFirestore(app);