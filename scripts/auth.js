// scripts/auth.js
import { showToast } from "./ui.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

document.addEventListener("DOMContentLoaded", () => {
  const firebaseConfig = {
    apiKey: "AIzaSyAem227DiziypXlJpa1FCqzvAH-gD0K750",
    authDomain: "workboard-fdf84.firebaseapp.com",
    projectId: "workboard-fdf84",
    appId: "1:412387128397:web:f3e5701388b90425831804",
  };

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);

  // FORM
  const form = document.getElementById("login-form");

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!email || !password) return;

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      console.log("Logged in:", userCredential.user);
      showToast("Login successful");

      setTimeout(() => {
        window.location.href = "../index.html";
      }, 1000);
    } catch (error) {
      let message = "Login failed. Please try again.";

      switch (error.code) {
        case "auth/wrong-password":
          message = "Incorrect password.";
          break;
        case "auth/user-not-found":
          message = "No account found.";
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

  // BUTTONS
  const googleBtn = document.getElementById("google-btn");
  const githubBtn = document.getElementById("github-btn");

  googleBtn?.addEventListener("click", () => {
    showToast("Google sign-in coming soon");
  });

  githubBtn?.addEventListener("click", () => {
    showToast("GitHub sign-in coming soon");
  });
});
