// login.js
const ROLE_ROUTES = {
  manager: "manager.html",
  qc: "qc.html",
  worker: "worker.html",
};

let attempts = 0;
let lockUntil = 0;

async function handleLogin() {
  const btn = document.getElementById("loginBtn");
  const errorDiv = document.getElementById("error");
  errorDiv.textContent = "";

  if (Date.now() < lockUntil) {
    const secs = Math.ceil((lockUntil - Date.now()) / 1000);
    errorDiv.textContent = `Too many attempts. Try again in ${secs}s.`;
    return;
  }

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;

  if (!username || !password) {
    errorDiv.textContent = "Please enter both username and password.";
    return;
  }

  btn.disabled = true;
  btn.textContent = "Signing in…";

  try {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();

    if (res.ok && ROLE_ROUTES[data.role]) {
      attempts = 0;
      window.location.href = ROLE_ROUTES[data.role];
    } else {
      attempts++;
      if (attempts >= 5) {
        lockUntil = Date.now() + 30000;
        attempts = 0;
        errorDiv.textContent = "Too many failed attempts. Locked for 30 seconds.";
      } else {
        errorDiv.textContent = data.error || "Invalid username or password.";
      }
    }
  } catch {
    errorDiv.textContent = "Network error. Please try again.";
  } finally {
    btn.disabled = false;
    btn.textContent = "Sign In";
    document.getElementById("password").value = "";
  }
}

document.addEventListener("DOMContentLoaded", function () {
  const loginBtn = document.getElementById("loginBtn");
  if (loginBtn) {
    loginBtn.addEventListener("click", handleLogin);
  }

  document.addEventListener("keydown", function (e) {
    if (e.key === "Enter") handleLogin();
  });
});