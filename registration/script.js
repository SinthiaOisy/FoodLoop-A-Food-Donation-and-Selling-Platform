// script.js (registration page)

function setError(id, message) {
  document.getElementById(id).textContent = message;
}

function clearErrors() {
  const ids = ["nameError", "emailError", "roleError", "passwordError", "confirmPasswordError", "termsError"];
  for (let i = 0; i < ids.length; i++) {
    setError(ids[i], "");
  }
}

function validateRegister(event) {
  event.preventDefault();   // stop the page from reloading
  clearErrors();

  // 1. Read what the person typed
  const name = document.getElementById("name").value.trim();
  const email = clean(document.getElementById("email").value).toLowerCase();
  const role = document.getElementById("role").value;
  const password = clean(document.getElementById("password").value);
  const confirmPassword = clean(document.getElementById("confirmPassword").value);
  const terms = document.getElementById("terms").checked;

  // 2. Check everything
  let ok = true;

  if (name.length < 2) {
    setError("nameError", "Please enter your name.");
    ok = false;
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    setError("emailError", "Please enter a valid email.");
    ok = false;
  }

  if (role === "") {
    setError("roleError", "Please choose Customer or Food Provider.");
    ok = false;
  }

  if (password.length < 6) {
    setError("passwordError", "Password must be at least 6 characters.");
    ok = false;
  }

  if (confirmPassword !== password) {
    setError("confirmPasswordError", "Passwords do not match.");
    ok = false;
  }

  if (!terms) {
    setError("termsError", "You must accept the terms.");
    ok = false;
  }

  if (!ok) {
    return false;
  }

  // 3. Make sure the email is not already used
  const users = getList("users");   // each user: [id, name, email, password, role]

  for (let i = 0; i < users.length; i++) {
    if (users[i][2] === email) {
      setError("emailError", "This email is already registered. Please log in.");
      return false;
    }
  }

  // 4. Save the new user
  const id = String(Date.now());
  users.push([id, clean(name), email, password, role]);
  saveList("users", users);

  // 5. Log the user in
  localStorage.setItem("userId", id);
  localStorage.setItem("userName", clean(name));
  localStorage.setItem("userRole", role);

  // 6. Go to the right page
  if (role === "customer") {
  window.location.href = "../customer/customer.html";
} else {
  window.location.href = "../provider/provider.html";
}

  return false;
}