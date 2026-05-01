// scripts/auth.js
import { showToast } from "./ui.js";
import { auth, db } from "./firebase.js";

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";


/* =========================
   FIREBASE INIT (GLOBAL)
========================= */
const firebaseConfig = {
  apiKey: "AIzaSyAem227DiziypXlJpa1FCqzvAH-gD0K750",
  authDomain: "workboard-fdf84.firebaseapp.com",
  projectId: "workboard-fdf84",
  appId: "1:412387128397:web:f3e5701388b90425831804",
};

/* =========================
   DOM READY WRAPPER
========================= */
document.addEventListener("DOMContentLoaded", () => {
  /* =========================
     LOGIN LOGIC
  ========================= */
  const loginForm = document.getElementById("login-form");

  loginForm?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!email || !password) {
      showToast("Please fill all fields");
      return;
    }

    // 🔥 CHECK RATE LIMIT
    const lockTime = localStorage.getItem('login_lock_time');
    if (lockTime && Date.now() - lockTime < 600000) {
      const minsLeft = Math.ceil((600000 - (Date.now() - lockTime)) / 60000);
      showToast(`Too many attempts. Try again in ${minsLeft} minutes.`);
      return;
    } else if (lockTime) {
      localStorage.removeItem('login_lock_time');
      localStorage.removeItem('login_attempts');
    }

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      const user = userCredential.user;

      // 🔥 SAVE USER INFO FOR DASHBOARD
      const userData = {
        name: user.displayName || user.email.split("@")[0],
        email: user.email,
        uid: user.uid,
      };

      localStorage.setItem("workboard_user", JSON.stringify(userData));

      // 🔥 SUCCESS - RESET LIMITER
      localStorage.removeItem('login_attempts');
      localStorage.removeItem('login_lock_time');

      console.log("Logged in:", user);
      showToast("Login successful");

      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 1000);
    } catch (error) {
      console.log(error.code);

      let attempts = parseInt(localStorage.getItem('login_attempts') || '0');
      attempts++;

      let message = "Login failed. Try again.";

      switch (error.code) {
        case "auth/user-not-found":
          message = "No account found.";
          break;
        case "auth/wrong-password":
          message = "Incorrect password.";
          break;
        case "auth/invalid-email":
          message = "Invalid email.";
          break;
        case "auth/too-many-requests":
          message = "Too many attempts. Try later.";
          break;
      }

      if (attempts >= 5) {
        localStorage.setItem('login_lock_time', Date.now());
        message = "Too many attempts. Try again in 10 minutes.";
      } else {
        localStorage.setItem('login_attempts', attempts);
      }

      showToast(message);
    }
  });

  /* =========================
     SIGNUP LOGIC
  ========================= */
  const signupForm = document.getElementById("signup-form");

  signupForm?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("full-name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const confirmPassword = document
      .getElementById("confirm-password")
      .value.trim();

    if (!name || !email || !password || !confirmPassword) {
      showToast("Please fill all fields");
      return;
    }

    if (password !== confirmPassword) {
      showToast("Passwords do not match");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Save user profile and Firestore document
      await updateProfile(userCredential.user, { displayName: name });
      
      await setDoc(doc(db, "users", userCredential.user.uid), {
        email: email,
        username: name,
        createdAt: new Date()
      });

      console.log("User created:", userCredential.user);

      showToast("Account created successfully");

      setTimeout(() => {
        window.location.href = "./log-in.html";
      }, 1200);
    } catch (error) {
      console.log(error.code);

      let message = "Signup failed. Try again.";

      switch (error.code) {
        case "auth/email-already-in-use":
          message = "Email already in use.";
          break;
        case "auth/invalid-email":
          message = "Invalid email.";
          break;
        case "auth/weak-password":
          message = "Password must be at least 6 characters.";
          break;
        case "auth/operation-not-allowed":
          message = "Enable Email/Password in Firebase.";
          break;
      }

      showToast(message);
    }
  });

  /* =========================
     GOOGLE / GITHUB TOASTS
  ========================= */
  const googleBtn = document.getElementById("google-btn");
  const githubBtn = document.getElementById("github-btn");

  googleBtn?.addEventListener("click", () => {
    showToast("Google sign-in coming soon");
  });

  githubBtn?.addEventListener("click", () => {
    showToast("GitHub sign-in coming soon");
  });

  /* =========================
     PASSWORD CHECKER (SIGNUP)
  ========================= */
  const password = document.getElementById("password");
  const confirmPassword = document.getElementById("confirm-password");

  const checkLength = document.getElementById("check-length");
  const checkUppercase = document.getElementById("check-uppercase");
  const checkNumber = document.getElementById("check-number");
  const checkMatch = document.getElementById("check-match");

  function validatePassword() {
    const pwd = password?.value || "";
    const confirm = confirmPassword?.value || "";

    if (checkLength) checkLength.checked = pwd.length >= 8;
    if (checkUppercase) checkUppercase.checked = /[A-Z]/.test(pwd);
    if (checkNumber) checkNumber.checked = /[0-9]/.test(pwd);
    if (checkMatch) checkMatch.checked = pwd !== "" && pwd === confirm;
  }

  password?.addEventListener("input", validatePassword);
  confirmPassword?.addEventListener("input", validatePassword);

  /* =========================
     PASSWORD VISIBILITY TOGGLE
  ========================= */
  document.querySelectorAll('.toggle-password').forEach(icon => {
    icon.addEventListener('click', function() {
      const input = this.previousElementSibling;
      if (input.type === 'password') {
        input.type = 'text';
        this.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>';
      } else {
        input.type = 'password';
        this.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>';
      }
    });
  });
});
