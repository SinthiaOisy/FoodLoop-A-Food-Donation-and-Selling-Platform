function getList(key) {
  const text = localStorage.getItem(key);
  if (!text) return [];
  return text.split("\n").map(function (line) { return line.split("|"); });
}

function saveList(key, rows) {
  localStorage.setItem(key, rows.map(function (row) { return row.join("|"); }).join("\n"));
}

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

const savedFoods = getList("foods");
if (savedFoods.length === 0 || savedFoods[0].length < 10) {
  saveList("foods", [
    ["1", "Assorted Bread & Buns",  "free", "0",  "Star Bakery, Dhanmondi", "12", "🥐", "Tomorrow",      "seed", "Bakery"],
    ["2", "Khichuri & Beef Curry",  "free", "0",  "Spice Garden, Gulshan",  "8",  "🍛", "Today",         "seed", "Meals"],
    ["3", "Fresh Apples & Bananas", "free", "0",  "Fresh Mart, Mirpur",     "10", "🍎", "Tomorrow",      "seed", "Fruits"],
    ["4", "Chicken Biryani Box",    "sale", "90", "Spice Garden, Gulshan",  "15", "🍛", "Tomorrow",      "seed", "Meals"],
    ["5", "Cream Cake Slices",      "sale", "50", "Star Bakery, Dhanmondi", "20", "🍰", "Within 2 days", "seed", "Bakery"],
    ["6", "Fruit Juice Bottles",    "sale", "40", "Cafe Rio, Banani",       "25", "🥤", "Within 3 days", "seed", "Drinks"]
  ]);
}

const grid = document.getElementById("foodGrid");

/* ---------- show the food cards ---------- */
function render() {
  const query = document.getElementById("search").value.trim().toLowerCase();
  const category = document.getElementById("category").value;
  const type = document.getElementById("type").value;
  const foods = getList("foods");

  let html = "";
  let shown = 0;

  for (let i = foods.length - 1; i >= 0; i--) {
    const f = foods[i];
    if (f.length < 10 || Number(f[5]) < 1) continue;   // sold out
    if (!(f[1].toLowerCase().includes(query) || f[4].toLowerCase().includes(query))) continue;
    if (category && f[9] !== category) continue;
    if (type && f[2] !== type) continue;

    shown++;
    const sale = f[2] === "sale";
    const price = Number(f[3]);

    html +=
      "<article class='food-card' data-id='" + esc(f[0]) + "' data-type='" + f[2] +
      "' data-price='" + price + "' data-max='" + Number(f[5]) + "'>" +
      "<div class='food-pic" + (sale ? " sale" : "") + "'>" + f[6] + "</div>" +
      "<div class='food-body'>" +
      "<span class='tag " + (sale ? "tag-sale'>FOR SALE" : "tag-free'>FREE") + "</span>" +
      "<h3>" + esc(f[1]) + "</h3>" +
      "<p class='muted'>" + esc(f[4]) + "</p>" +
      "<p class='price'><strong>" + (sale ? "৳" + price : "Free") + "</strong></p>" +
      "<p class='muted'>" + esc(f[5]) + " left · collect by " + esc(f[7]) + "</p>" +
      "<div class='qty-box'>" +
      "<span class='qty-label'>Quantity</span>" +
      "<div class='qty-row'>" +
      "<button type='button' class='qty-minus' aria-label='Less'>−</button>" +
      "<input type='number' class='qty-input' min='1' max='" + Number(f[5]) + "' value='1'>" +
      "<button type='button' class='qty-plus' aria-label='More'>+</button>" +
      "</div>" +
      "<span class='qty-total'>Total: " + (sale ? "৳" + price : "Free") + "</span>" +
      "</div>" +
      "<a href='#' class='btn btn-small order-btn'>" + (sale ? "Order now" : "Request food") + "</a>" +
      "</div></article>";
  }

  grid.innerHTML = html;
  document.getElementById("count").textContent = shown + (shown === 1 ? " item found" : " items found");
  document.getElementById("empty").hidden = shown > 0;
}

/* ---------- quantity box ---------- */
function setQty(card, wanted) {
  const max = Number(card.dataset.max);
  let n = Math.round(Number(wanted));
  if (!(n >= 1)) n = 1;
  if (n > max) n = max;

  card.querySelector(".qty-input").value = n;
  card.querySelector(".qty-total").textContent =
    card.dataset.type === "sale" ? "Total: ৳" + Number(card.dataset.price) * n : "Total: Free";
}

grid.addEventListener("click", function (e) {
  const card = e.target.closest(".food-card");
  if (!card) return;
  const input = card.querySelector(".qty-input");

  if (e.target.closest(".qty-minus")) { setQty(card, Number(input.value) - 1); return; }
  if (e.target.closest(".qty-plus"))  { setQty(card, Number(input.value) + 1); return; }

  if (e.target.closest(".order-btn")) {
    e.preventDefault();
    placeOrder(card.dataset.id, Number(input.value));
  }
});

grid.addEventListener("change", function (e) {
  if (e.target.classList.contains("qty-input")) {
    setQty(e.target.closest(".food-card"), e.target.value);
  }
});

/* ---------- place the request or order ---------- */
function placeOrder(foodId, qty) {
  const userId = localStorage.getItem("userId");
  const userRole = localStorage.getItem("userRole");

  if (!userId) {
    alert("Please log in first.");
    window.location.href = "../login/login1.html";
    return;
  }
  if (userRole !== "customer") {
    alert("Only customer accounts can order food.");
    return;
  }

  const foods = getList("foods");
  let food = null;
  for (let i = 0; i < foods.length; i++) {
    if (foods[i][0] === foodId) food = foods[i];
  }

  if (!food || Number(food[5]) < 1) {
    alert("Sorry, this food is not available.");
    return;
  }
  if (!(qty >= 1 && qty <= Number(food[5]))) {
    alert("Please choose a quantity from 1 to " + food[5] + ".");
    return;
  }

  const requests = getList("requests");
  requests.push([String(Date.now()), foodId, userId, String(qty), "pending", new Date().toISOString()]);
  saveList("requests", requests);

  const action = food[2] === "sale" ? "Order placed: " : "Request sent: ";
  localStorage.setItem("justOrdered", action + qty + " x " + food[1] + ". Status: pending.");
  window.location.href = "../customer/customer.html";
}

/* ---------- search and filters ---------- */
document.getElementById("search").addEventListener("input", render);
document.getElementById("category").addEventListener("change", render);
document.getElementById("type").addEventListener("change", render);

document.getElementById("clear").addEventListener("click", function () {
  document.getElementById("search").value = "";
  document.getElementById("category").value = "";
  document.getElementById("type").value = "";
  render();
});

// links like explore1.html?type=free
const urlType = new URLSearchParams(window.location.search).get("type");
if (urlType === "free" || urlType === "sale") document.getElementById("type").value = urlType;

render();