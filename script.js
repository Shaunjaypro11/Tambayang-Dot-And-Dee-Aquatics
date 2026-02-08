/* =========================================================
   LOADER
========================================================= */
const loader = document.getElementById("loader");

/* =========================================================
   HELPERS
========================================================= */
function getLoggedInUser() {
  return localStorage.getItem("loggedInUser");
}

function getUsers() {
  return JSON.parse(localStorage.getItem("users")) || {};
}

function saveUsers(users) {
  localStorage.setItem("users", JSON.stringify(users));
}

/* =========================================================
   MOBILE MENU
========================================================= */
const menuBtn = document.querySelector(".menu-toggle");
const navLinks = document.querySelector(".nav-links");

if (menuBtn && navLinks) {
  menuBtn.addEventListener("click", () => {
    navLinks.classList.toggle("show");
  });
}

/* =========================================================
   ACTIVE LINK
========================================================= */
let currentPage = location.pathname.split("/").pop();
if (!currentPage) currentPage = "index.html";

document.querySelectorAll(".nav-links a").forEach(link => {
  if (link.getAttribute("href") === currentPage) {
    link.classList.add("active-link");
  }
});

/* =========================================================
   PAGE ENTER
========================================================= */
window.addEventListener("load", () => {
  document.body.classList.add("page-loaded");
  document.body.classList.remove("page-exit");

  if (loader) {
    setTimeout(() => loader.classList.add("hide"), 300);
  }
});

/* =========================================================
   PAGE EXIT (IGNORE MODALS)
========================================================= */
document.addEventListener("click", (e) => {
  if (e.target.closest("#cartModal")) return;
  if (e.target.closest(".auth-modal")) return;

  const link = e.target.closest("a[href]");
  if (!link) return;

  const href = link.getAttribute("href");

  if (
    !href ||
    href.startsWith("#") ||
    link.target === "_blank" ||
    link.hasAttribute("download") ||
    /^https?:\/\//i.test(href)
  ) return;

  e.preventDefault();
  if (loader) loader.classList.remove("hide");
  document.body.classList.add("page-exit");

  setTimeout(() => {
    window.location.href = href;
  }, 400);
});

/* =========================================================
   SIGNUP HANDLER
========================================================= */
const signupForm = document.getElementById("signupForm");

if (signupForm) {
  signupForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const username = document.getElementById("signupUsername").value.trim();
    const password = document.getElementById("signupPassword").value;

    if (!username || !password) {
      alert("Please fill all fields");
      return;
    }

    const users = getUsers();

    if (users[username]) {
      alert("Username already exists ❌");
      return;
    }

    users[username] = password;
    saveUsers(users);

    alert("Account created! Please login ✅");
    window.location.href = "#loginModal";
  });
}

/* =========================================================
   LOGIN HANDLER (VALIDATED)
========================================================= */
const loginForm = document.getElementById("loginForm");

if (loginForm) {
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const username = document.getElementById("loginUsername").value.trim();
    const password = document.getElementById("loginPassword").value;

    const users = getUsers();

    if (!users[username]) {
      alert("Account does not exist. Please sign up first ❌");
      return;
    }

    if (users[username] !== password) {
      alert("Incorrect password ❌");
      return;
    }

    localStorage.setItem("loggedInUser", username);

    const redirect =
      localStorage.getItem("redirectAfterLogin") || "shop.html";

    localStorage.removeItem("redirectAfterLogin");
    window.location.href = redirect;
  });
}

/* =========================================================
   USER PROFILE (SHOP PAGE)
========================================================= */
const userProfile = document.getElementById("userProfile");

if (userProfile) {
  const user = getLoggedInUser();

  if (user) {
    userProfile.innerHTML = `
      <span>👤 ${user}</span>
      <button id="logoutBtn">Logout</button>
    `;

    document.getElementById("logoutBtn").addEventListener("click", () => {
      localStorage.removeItem("loggedInUser");
      location.reload();
    });
  } else {
    userProfile.innerHTML = `<span>👥 Guest</span>`;
  }
}

/* =========================================================
   CART STORAGE
========================================================= */
function getCart() {
  return JSON.parse(localStorage.getItem("cart")) || [];
}

function saveCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
}

/* =========================================================
   REQUIRE LOGIN
========================================================= */
function requireLogin() {
  localStorage.setItem("redirectAfterLogin", "shop.html");
  window.location.href = "index.html#loginModal";
}

/* =========================================================
   CART ACTIONS
========================================================= */
function addToCart(name, price) {
  if (!getLoggedInUser()) {
    alert("Please login to add items to cart 🔐");
    requireLogin();
    return;
  }

  const cart = getCart();
  const existing = cart.find(item => item.name === name);

  if (existing) existing.quantity++;
  else cart.push({ name, price, quantity: 1 });

  saveCart(cart);
  alert(`${name} added to cart 🛒`);
}

/* =========================================================
   PRODUCT DATA
========================================================= */
function getProductData(btn) {
  const card = btn.closest(".product-card");
  if (!card) return null;

  const name =
    btn.dataset.name ||
    card.querySelector(".product-title")?.innerText.trim();

  const priceText =
    btn.dataset.price ||
    card.querySelector(".price")?.innerText.replace(/[₱,]/g, "");

  const price = Number(priceText);
  if (!name || isNaN(price)) return null;

  return { name, price };
}

/* =========================================================
   BUY NOW
========================================================= */
function buyNow(name, price) {
  if (!getLoggedInUser()) {
    alert("Please login to continue 🔐");
    requireLogin();
    return;
  }

  if (confirm(`Buy "${name}" for ₱${price}?`)) {
    alert(`Thank you for buying ${name} 🐟`);
  }
}

/* =========================================================
   PRODUCT BUTTONS
========================================================= */
document.querySelectorAll(".add-cart-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const product = getProductData(btn);
    if (product) addToCart(product.name, product.price);
  });
});

document.querySelectorAll(".buy-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const product = getProductData(btn);
    if (product) buyNow(product.name, product.price);
  });
});

/* =========================================================
   CART MODAL
========================================================= */
function viewCart() {
  const cart = getCart();
  const modal = document.getElementById("cartModal");
  const items = document.getElementById("cartItems");
  const totalEl = document.getElementById("cartTotal");

  if (!modal || !items || !totalEl) return;

  items.innerHTML = "";
  let total = 0;

  if (cart.length === 0) {
    items.innerHTML = "<p>Your cart is empty 🛒</p>";
    totalEl.textContent = "";
    modal.classList.add("show");
    return;
  }

  cart.forEach((item, index) => {
    total += item.price * item.quantity;

    const div = document.createElement("div");
    div.className = "cart-item";
    div.innerHTML = `
      <span>${item.name} x${item.quantity}</span>
      <span>₱${item.price * item.quantity}</span>
      <button>❌</button>
    `;

    div.querySelector("button").addEventListener("click", () => {
      removeFromCart(index);
    });

    items.appendChild(div);
  });

  totalEl.textContent = `Total: ₱${total}`;
  modal.classList.add("show");
}

function closeCart() {
  document.getElementById("cartModal")?.classList.remove("show");
}

function removeFromCart(index) {
  const cart = getCart();
  cart.splice(index, 1);
  saveCart(cart);
  viewCart();
}

/* =========================================================
   CHECKOUT
========================================================= */
function checkout() {
  if (!getLoggedInUser()) {
    alert("Please login to checkout 🔐");
    requireLogin();
    return;
  }

  if (getCart().length === 0) {
    alert("Your cart is empty");
    return;
  }

  localStorage.removeItem("cart");
  closeCart();
  alert("Checkout successful 🐠");
}

/* =========================================================
   ESC KEY CLOSE CART
========================================================= */
document.addEventListener("keydown", (e) => {
  const modal = document.getElementById("cartModal");
  if (e.key === "Escape" && modal?.classList.contains("show")) {
    closeCart();
  }
});
