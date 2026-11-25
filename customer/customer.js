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

function esc(text) {
  return String(text).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}

const userId = localStorage.getItem("userId");
const userName = localStorage.getItem("userName");
const userRole = localStorage.getItem("userRole");

if (!userId || userRole !== "customer") {
  window.location.href = "../login/login1.html";
}

function logout() {
  localStorage.removeItem("userId");
  localStorage.removeItem("userName");
  localStorage.removeItem("userRole");
  window.location.href = "../login/login1.html";
}

function findFood(foodId) {
  const foods = getList("foods");
  for (let i = 0; i < foods.length; i++) {
    if (foods[i][0] === foodId) return foods[i];
  }
  return null;
}

function cancelRequest(requestId) {
  if (!confirm("Cancel this request?")) return;
  const requests = getList("requests");
  const remaining = [];
  for (let i = 0; i < requests.length; i++) {
    if (requests[i][0] !== requestId) remaining.push(requests[i]);
  }
  saveList("requests", remaining);
  showRequests();
}

function showRequests() {
  const requests = getList("requests");
  let requestCount = 0, orderCount = 0, collectedCount = 0, rows = "";

  for (let i = requests.length - 1; i >= 0; i--) {
    const r = requests[i];
    if (r.length < 6 || r[2] !== userId) continue;

    const food = findFood(r[1]);
    let foodName = "(deleted food)", place = "-", total = "-";

    if (food) {
      foodName = food[1];
      place = food[4];
      if (food[2] === "free") {
        requestCount++;
        total = "Free";
      } else {
        orderCount++;
        total = "৳" + Number(food[3]) * Number(r[3]);
      }
    }

    if (r[4] === "completed") collectedCount++;

    let cancelButton = "";
    if (r[4] === "pending") {
      cancelButton = "<button class='cancel-link' onclick=\"cancelRequest('" + r[0] + "')\">Cancel</button>";
    }

    const date = new Date(r[5]).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

    rows += "<tr><td>" + esc(foodName) + "</td><td>" + esc(place) + "</td><td>" + esc(r[3]) +
      "</td><td>" + total + "</td><td>" + date +
      "</td><td><span class='status " + esc(r[4]) + "'>" + esc(r[4]) + "</span>" + cancelButton + "</td></tr>";
  }

  if (rows === "") {
    rows = "<tr><td colspan='6' class='empty'>Nothing here yet.</td></tr>";
  }

  document.getElementById("requestList").innerHTML = rows;
  document.getElementById("requestCount").textContent = requestCount;
  document.getElementById("orderCount").textContent = orderCount;
  document.getElementById("collectedCount").textContent = collectedCount;
}

if (userId && userRole === "customer") {
  document.getElementById("greeting").textContent = "Hi " + userName;
  document.getElementById("logoutLink").addEventListener("click", function (e) {
    e.preventDefault();
    logout();
  });
  showRequests();
}