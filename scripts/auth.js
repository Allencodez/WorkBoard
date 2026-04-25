// scripts/auth.js
import { showToast } from "./ui.js";
import { auth } from "./firebase.js";

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";


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

      console.log("Logged in:", user);
      showToast("Login successful");

      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 1000);
    } catch (error) {
      console.log(error.code);

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
});
