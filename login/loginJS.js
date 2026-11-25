/* ---------- ADMIN EMAIL AND PASSWORD ---------- */
const ADMIN_EMAIL = "admin@foodloop.com";
const ADMIN_PASSWORD = "admin123";

function getList(key) {
  const text = localStorage.getItem(key);
  if (!text) return [];
  return text.split("\n").map(function (line) { return line.split("|"); });
}

function saveList(key, rows) {
  localStorage.setItem(key, rows.map(function (row) { return row.join("|"); }).join("\n"));
}

function clean(text) {
  return String(text).replace(/[|\n\r]/g, " ").trim();
}


(function () {
  const users = getList("users");
  let adminFound = false;

  for (let i = 0; i < users.length; i++) {
    if (users[i][4] === "admin") {
      users[i][2] = ADMIN_EMAIL;
      users[i][3] = ADMIN_PASSWORD;
      users[i][5] = "active";
      adminFound = true;
    }
  }

  if (!adminFound) {
    users.push(["1", "Admin", ADMIN_EMAIL, ADMIN_PASSWORD, "admin", "active"]);
  }
  saveList("users", users);
})();

/* ---------- login ---------- */
function validateForm(event) {
  event.preventDefault();   // stop the page from reloading

  // 1. what the person typed
  const email = clean(document.getElementById("email").value).toLowerCase();
  const password = clean(document.getElementById("pass").value);

  if (email === "" || password === "") {
    alert("Please enter your email and password.");
    return false;
  }

  // 2. look for this user
  const users = getList("users");
  let found = null;

  for (let i = 0; i < users.length; i++) {
    if (users[i][2] === email && users[i][3] === password) {
      found = users[i];
    }
  }

  if (!found) {
    alert("Wrong email or password.");
    return false;
  }

  // 3. blocked users cannot log in
  if (found[5] === "blocked") {
    alert("This account has been blocked by the admin.");
    return false;
  }

  // 4. remember me (only the email is saved, never the password)
  if (document.getElementById("radio").checked) {
    localStorage.setItem("rememberedEmail", email);
  } else {
    localStorage.removeItem("rememberedEmail");
  }

  // 5. log the user in
  localStorage.setItem("userId", found[0]);
  localStorage.setItem("userName", found[1]);
  localStorage.setItem("userRole", found[4]);

  // 6. go to the right page
  if (found[4] === "customer") {
    window.location.href = "../customer/customer.html";
  } else if (found[4] === "provider") {
    window.location.href = "../provider/provider.html";
  } else {
    window.location.href = "../admin/admin.html";
  }

  return false;
}

/* -- fill in the email if "Remember me" was used -- */
const savedEmail = localStorage.getItem("rememberedEmail");
if (savedEmail) {
  document.getElementById("email").value = savedEmail;
  document.getElementById("radio").checked = true;
}