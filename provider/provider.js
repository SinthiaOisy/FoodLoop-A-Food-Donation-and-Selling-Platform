function getList(key) {
  const text = localStorage.getItem(key);
  if (!text) return [];
  return text.split("\n").map(function (line) { return line.split("|"); });
}

function saveList(key, rows) {
  localStorage.setItem(key, rows.map(function (row) { return row.join("|"); }).join("\n"));
}

// remove characters that would break the saved format
function clean(text) {
  return String(text).replace(/[|\n\r]/g, " ").trim();
}

// make text safe to show inside HTML
function esc(text) {
  return String(text).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}

// Index	Data
// [0]	Food ID
// [1]	Food Name
// [2]	Type (sale/free)
// [3]	Price
// [4]	Location
// [5]	Quantity
// [6]	Emoji
// [7]	Collect-by Date
// [8]	Provider ID
// [9]	Category

const userId = localStorage.getItem("userId");
const userName = localStorage.getItem("userName");
const userRole = localStorage.getItem("userRole");

if (!userId || userRole !== "provider") {
  window.location.href = "../login/login1.html";
}

const EMOJI = { Bakery: "🥐", Meals: "🍛", Fruits: "🍎", Snacks: "🍪", Drinks: "🥤", Other: "🍱" };

/* ---------- show everything on the page ---------- */
function showAll() {
  const foods = getList("foods");
  const requests = getList("requests");
  const users = getList("users");

  // 1. find my foods
  const myFoods = [];
  const myFoodById = {};
  for (let i = 0; i < foods.length; i++) {
    if (foods[i].length >= 10 && foods[i][8] === userId) {
      myFoods.push(foods[i]);
      myFoodById[foods[i][0]] = foods[i];
    }
  }

  // 2. requests for my foods
  let pending = 0, completed = 0, requestRows = "";

// Index	Data
// [0]	Request ID
// [1]	Food ID
// [2]	Customer ID
// [3]	Requested Quantity
// [4]	Request Status
// [5]	Request Date

  for (let i = requests.length - 1; i >= 0; i--) {
    const r = requests[i];
    if (r.length < 6 || !myFoodById[r[1]]) continue;

    const food = myFoodById[r[1]];

    let customer = "?";
    for (let u = 0; u < users.length; u++) {
      if (users[u][0] === r[2]) customer = users[u][1];
    }

    const total = food[2] === "sale" ? "৳" + Number(food[3]) * Number(r[3]) : "Free";
    const date = new Date(r[5]).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

    if (r[4] === "pending") pending++;
    if (r[4] === "completed") completed++;

    let actions = "";
    if (r[4] === "pending") {
      actions =
        "<button class='mini' onclick=\"setStatus('" + r[0] + "','accepted')\">Accept</button>" +
        "<button class='mini red' onclick=\"setStatus('" + r[0] + "','rejected')\">Reject</button>";
    } else if (r[4] === "accepted") {
      actions = "<button class='mini' onclick=\"setStatus('" + r[0] + "','completed')\">Mark collected</button>";
    }

    requestRows +=
      "<tr>" +
      "<td>" + food[6] + " " + esc(food[1]) + "</td>" +
      "<td>" + esc(customer) + "</td>" +
      "<td>" + esc(r[3]) + "</td>" +
      "<td>" + total + "</td>" +
      "<td>" + date + "</td>" +
      "<td><span class='status " + esc(r[4]) + "'>" + esc(r[4]) + "</span></td>" +
      "<td>" + actions + "</td>" +
      "</tr>";
  }

  if (requestRows === "") {
    requestRows = "<tr><td colspan='7' class='empty'>No requests yet.</td></tr>";
  }

  // 3. my listings
  let foodRows = "";
  for (let i = myFoods.length - 1; i >= 0; i--) {
    const f = myFoods[i];
    const isSale = f[2] === "sale";

    foodRows +=
      "<tr>" +
      "<td>" + f[6] + " " + esc(f[1]) + "</td>" +
      "<td><span class='tag " + (isSale ? "tag-sale'>FOR SALE" : "tag-free'>FREE") + "</span></td>" +
      "<td>" + (isSale ? "৳" + esc(f[3]) : "Free") + "</td>" +
      "<td>" + esc(f[5]) + "</td>" +
      "<td>" + esc(f[7]) + "</td>" +
      "<td>" +
      "<button class='mini grey' onclick=\"editFood('" + f[0] + "')\">Edit</button>" +
      "<button class='mini red' onclick=\"deleteFood('" + f[0] + "')\">Delete</button>" +
      "</td>" +
      "</tr>";
  }

  if (foodRows === "") {
    foodRows = "<tr><td colspan='6' class='empty'>You have not added any food yet.</td></tr>";
  }

  // 4.update and put it on the page
  document.getElementById("requestList").innerHTML = requestRows;
  document.getElementById("foodList").innerHTML = foodRows;
  document.getElementById("listingCount").textContent = myFoods.length;
  document.getElementById("pendingCount").textContent = pending;
  document.getElementById("completedCount").textContent = completed;
}

/* --accept / reject / mark collected-- */
function setStatus(requestId, newStatus) {
  const requests = getList("requests");
  const foods = getList("foods");

  for (let i = 0; i < requests.length; i++) {
    if (requests[i][0] !== requestId) continue;

    if (newStatus === "accepted") {
      // take the portions out of the stock
      for (let j = 0; j < foods.length; j++) {
        if (foods[j][0] === requests[i][1]) {
          const left = Number(foods[j][5]);
          const wanted = Number(requests[i][3]);

          if (wanted > left) {
            alert("Not enough food left. Only " + left + " portions remain.");
            return;
          }
          foods[j][5] = String(left - wanted);
        }
      }
      saveList("foods", foods);
    }

    requests[i][4] = newStatus;
  }

  saveList("requests", requests);
  showAll();
}

/* ---------- add / edit food form ---------- */
const form = document.getElementById("foodForm");
const typeSelect = document.getElementById("fType");

// price box is only for "sale" food
function togglePrice() {
  document.getElementById("priceGroup").style.display = typeSelect.value === "sale" ? "" : "none";
}
typeSelect.addEventListener("change", togglePrice);

// can't pick a date in the past
document.getElementById("fDate").min = new Date().toISOString().slice(0, 10);

function resetForm() {
  form.reset();
  document.getElementById("editId").value = "";
  document.getElementById("formTitle").textContent = "Add new food";
  document.getElementById("saveBtn").textContent = "Publish food";
  document.getElementById("cancelEdit").style.display = "none";
  document.getElementById("formMsg").textContent = "";
  togglePrice();
}

form.addEventListener("submit", function (e) {
  e.preventDefault();
  const msg = document.getElementById("formMsg");

  const name = clean(document.getElementById("fName").value);
  const category = document.getElementById("fCategory").value;
  const type = typeSelect.value;
  const price = Number(document.getElementById("fPrice").value);
  const qty = parseInt(document.getElementById("fQty").value, 10);
  const location = clean(document.getElementById("fLocation").value);
  const date = document.getElementById("fDate").value;
  const editId = document.getElementById("editId").value;

  if (name === "" || location === "" || date === "") {
    msg.textContent = "Please fill in the food name, location and collect-by date.";
    return;
  }
  if (!(qty >= 1)) {
    msg.textContent = "Quantity must be at least 1.";
    return;
  }
  if (type === "sale" && !(price >= 1)) {
    msg.textContent = "Please enter a sale price.";
    return;
  }
  msg.textContent = "";

  const priceText = type === "sale" ? String(price) : "0";
  const foods = getList("foods");

  if (editId) {
    // update an existing food
    for (let i = 0; i < foods.length; i++) {
      if (foods[i][0] === editId) {
        foods[i] = [editId, name, type, priceText, location, String(qty), EMOJI[category], date, userId, category];
      }
    }
    document.getElementById("notice").textContent = "✅ Listing updated.";
  } else {
    // add a new food
    foods.push([String(Date.now()), name, type, priceText, location, String(qty), EMOJI[category], date, userId, category]);
    document.getElementById("notice").textContent = "✅ Food published. Customers can now see it on Explore Food.";
  }

  saveList("foods", foods);
  resetForm();
  showAll();
  window.scrollTo(0, 0);
});

/* ---------- edit and delete ---------- */
function editFood(id) {
  const foods = getList("foods");

  for (let i = 0; i < foods.length; i++) {
    if (foods[i][0] === id) {
      const f = foods[i];

      document.getElementById("fName").value = f[1];
      document.getElementById("fCategory").value = f[9];
      typeSelect.value = f[2];
      document.getElementById("fPrice").value = f[2] === "sale" ? f[3] : 50;
      document.getElementById("fQty").value = f[5];
      document.getElementById("fLocation").value = f[4];
      document.getElementById("fDate").value = f[7];
      document.getElementById("editId").value = id;

      document.getElementById("formTitle").textContent = "Edit food";
      document.getElementById("saveBtn").textContent = "Save changes";
      document.getElementById("cancelEdit").style.display = "";
      togglePrice();
      document.getElementById("formTitle").scrollIntoView();
    }
  }
}

document.getElementById("cancelEdit").addEventListener("click", resetForm);

function deleteFood(id) {
  if (!confirm("Delete this listing?")) return;

  const foods = getList("foods");
  const remaining = [];
  for (let i = 0; i < foods.length; i++) {
    if (foods[i][0] !== id) remaining.push(foods[i]);
  }

  saveList("foods", remaining);
  document.getElementById("notice").textContent = "Listing deleted.";
  showAll();
}

/* ---------- start ---------- */
if (userId && userRole === "provider") {
  document.getElementById("greeting").textContent = "Hi " + userName;
  togglePrice();
  showAll();
}
