import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

import {
  firebaseConfig
} from "./firebase-config.js";


/* =========================
   FIREBASE
========================= */

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);


/* =========================
   DATA
========================= */

const SHOPS = [

  {
    id:"techzone",
    name:"TechZone LK",
    category:"Electronics",
    icon:"📱",
    rating:"4.8",
    location:"Colombo",
    description:"Phones, accessories and electronics."
  },

  {
    id:"urbanfashion",
    name:"Urban Fashion LK",
    category:"Fashion",
    icon:"👕",
    rating:"4.7",
    location:"Colombo",
    description:"Fashion and lifestyle products."
  },

  {
    id:"beautyhub",
    name:"Beauty Hub",
    category:"Beauty",
    icon:"💄",
    rating:"4.9",
    location:"Kandy",
    description:"Beauty and skincare."
  },

  {
    id:"homeliving",
    name:"Home Living",
    category:"Home",
    icon:"🏠",
    rating:"4.6",
    location:"Galle",
    description:"Home appliances and products."
  },

  {
    id:"foodcorner",
    name:"Food Corner",
    category:"Food",
    icon:"🍔",
    rating:"4.8",
    location:"Colombo",
    description:"Food and beverages."
  }

];


const PRODUCTS = [

  {
    id:"phone-pro",
    shopId:"techzone",
    name:"Smartphone Pro",
    category:"Electronics",
    price:60000,
    icon:"📱",
    rating:"4.8"
  },

  {
    id:"headphones",
    shopId:"techzone",
    name:"Wireless Headphones",
    category:"Electronics",
    price:12000,
    icon:"🎧",
    rating:"4.7"
  },

  {
    id:"sneakers",
    shopId:"urbanfashion",
    name:"Premium Sneakers",
    category:"Fashion",
    price:12000,
    icon:"👟",
    rating:"4.6"
  },

  {
    id:"watch",
    shopId:"techzone",
    name:"Smart Watch",
    category:"Electronics",
    price:18000,
    icon:"⌚",
    rating:"4.7"
  },

  {
    id:"perfume",
    shopId:"beautyhub",
    name:"Premium Perfume",
    category:"Beauty",
    price:8500,
    icon:"🧴",
    rating:"4.9"
  },

  {
    id:"speaker",
    shopId:"homeliving",
    name:"Bluetooth Speaker",
    category:"Home",
    price:15000,
    icon:"🔊",
    rating:"4.7"
  },

  {
    id:"laptop",
    shopId:"techzone",
    name:"Laptop Air",
    category:"Electronics",
    price:145000,
    icon:"💻",
    rating:"4.8"
  },

  {
    id:"airfryer",
    shopId:"homeliving",
    name:"Air Fryer",
    category:"Home",
    price:24000,
    icon:"🍳",
    rating:"4.7"
  }

];


let currentUser=null;

let cart=[];

let checkoutItems=[];

let selectedPlan=3;


/* =========================
   HELPERS
========================= */

function money(value){

  return "Rs. " +
    Number(value || 0)
      .toLocaleString("en-LK");

}


function toast(message){

  const box=document.getElementById("toastBox");

  const el=document.createElement("div");

  el.className="toast";

  el.textContent=message;

  box.appendChild(el);

  setTimeout(()=>{
    el.remove();
  },3000);

}


function initial(name){

  return String(name || "U")
    .trim()
    .charAt(0)
    .toUpperCase();

}


/* =========================
   AUTH UI
========================= */

document
  .getElementById("showRegisterBtn")
  .onclick=()=>{

    document
      .getElementById("loginBox")
      .classList.add("hidden");

    document
      .getElementById("registerBox")
      .classList.remove("hidden");

  };


document
  .getElementById("showLoginBtn")
  .onclick=()=>{

    document
      .getElementById("registerBox")
      .classList.add("hidden");

    document
      .getElementById("loginBox")
      .classList.remove("hidden");

  };


/* =========================
   REGISTER
========================= */

document
  .getElementById("registerBtn")
  .onclick=async()=>{

    const name=
      document.getElementById("regName")
        .value.trim();

    const email=
      document.getElementById("regEmail")
        .value.trim();

    const password=
      document.getElementById("regPassword")
        .value;

    const role=
      document.getElementById("regRole")
        .value;


    if(!name || !email || !password){

      toast("Please complete all fields");

      return;

    }


    if(password.length<6){

      toast("Password must be at least 6 characters");

      return;

    }


    try{

      const result=
        await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );


      const user=result.user;


      await setDoc(
        doc(db,"users",user.uid),
        {

          uid:user.uid,

          name,

          email,

          role,

          creditLimit:
            role==="customer"
              ?100000
              :0,

          createdAt:
            new Date().toISOString()

        }
      );


      toast("Account created");

    }
    catch(error){

      console.error(error);

      toast(firebaseError(error));

    }

  };


/* =========================
   LOGIN
========================= */

document
  .getElementById("loginBtn")
  .onclick=async()=>{

    const email=
      document.getElementById("loginEmail")
        .value.trim();

    const password=
      document.getElementById("loginPassword")
        .value;


    if(!email || !password){

      toast("Enter email and password");

      return;

    }


    try{

      await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

    }
    catch(error){

      console.error(error);

      toast(firebaseError(error));

    }

  };


function firebaseError(error){

  switch(error.code){

    case "auth/invalid-credential":
      return "Invalid email or password.";

    case "auth/email-already-in-use":
      return "Email is already registered.";

    case "auth/invalid-email":
      return "Invalid email address.";

    case "auth/weak-password":
      return "Password is too weak.";

    case "auth/network-request-failed":
      return "Network error.";

    default:
      return error.message || "Authentication error.";

  }

}


/* =========================
   AUTH STATE
========================= */

onAuthStateChanged(
  auth,
  async(user)=>{

    if(user){

      await loadUser(user);

      document
        .getElementById("authScreen")
        .classList.add("hidden");

      document
        .getElementById("app")
        .classList.remove("hidden");

      setupUser();

      if(currentUser.role==="merchant"){

        showRole("merchant");

        openPage("merchantDashboard");

        loadMerchantDashboard();

      }
      else if(currentUser.role==="admin"){

        showRole("admin");

        openPage("adminDashboard");

        loadAdminDashboard();

      }
      else{

        showRole("customer");

        openPage("homePage");

        await loadCustomerOrders();

        renderHome();

      }

    }
    else{

      document
        .getElementById("app")
        .classList.add("hidden");

      document
        .getElementById("authScreen")
        .classList.remove("hidden");

    }

  }
);


/* =========================
   LOAD USER
========================= */

async function loadUser(user){

  const snap=
    await getDoc(
      doc(db,"users",user.uid)
    );


  if(snap.exists()){

    currentUser={
      ...snap.data(),
      uid:user.uid
    };

  }
  else{

    currentUser={
      uid:user.uid,
      name:user.email.split("@")[0],
      email:user.email,
      role:"customer",
      creditLimit:100000
    };

  }

}


/* =========================
   SETUP USER
========================= */

function setupUser(){

  const name=currentUser.name;

  const init=initial(name);


  document
    .getElementById("userInitial")
    .textContent=init;

  document
    .getElementById("sideAvatar")
    .textContent=init;

  document
    .getElementById("sideName")
    .textContent=name;

  document
    .getElementById("sideRole")
    .textContent=currentUser.role;

  document
    .getElementById("welcomeName")
    .textContent=name.split(" ")[0];

  document
    .getElementById("profileAvatar")
    .textContent=init;

  document
    .getElementById("profileName")
    .textContent=name;

  document
    .getElementById("profileEmail")
    .textContent=currentUser.email;

  document
    .getElementById("profileRole")
    .textContent=currentUser.role;

}


/* =========================
   ROLE MENU
========================= */

function showRole(role){

  document
    .getElementById("customerMenu")
    .classList.toggle(
      "hidden",
      role!=="customer"
    );

  document
    .getElementById("merchantMenu")
    .classList.toggle(
      "hidden",
      role!=="merchant"
    );

  document
    .getElementById("adminMenu")
    .classList.toggle(
      "hidden",
      role!=="admin"
    );

}


/* =========================
   LOGOUT
========================= */

document
  .getElementById("logoutBtn")
  .onclick=async()=>{

    await signOut(auth);

    toast("Logged out");

  };


/* =========================
   NAVIGATION
========================= */

function openPage(pageId){

  document
    .querySelectorAll(".page")
    .forEach(page=>{
      page.classList.add("hidden");
    });


  const page=
    document.getElementById(pageId);


  if(!page)return;


  page.classList.remove("hidden");


  document
    .querySelectorAll(".side-link")
    .forEach(btn=>{
      btn.classList.remove("active");
    });


  document
    .querySelectorAll(
      `[data-page="${pageId}"]`
    )
    .forEach(btn=>{
      btn.classList.add("active");
    });


  if(pageId==="homePage")
    renderHome();

  if(pageId==="storesPage")
    renderStores();

  if(pageId==="shopPage")
    renderProducts();

  if(pageId==="cartPage")
    renderCart();

  if(pageId==="ordersPage")
    renderOrders();

  if(pageId==="creditPage")
    renderCredit();

  if(pageId==="merchantDashboard")
    loadMerchantDashboard();

  if(pageId==="merchantProducts")
    loadMerchantProducts();

  if(pageId==="merchantOrders")
    loadMerchantOrders();

  if(pageId==="merchantCustomers")
    loadMerchantCustomers();

  if(pageId==="merchantEarnings")
    loadMerchantEarnings();

  if(pageId==="adminDashboard")
    loadAdminDashboard();

  if(pageId==="adminCustomers")
    loadAdminCustomers();

  if(pageId==="adminMerchants")
    loadAdminMerchants();

  if(pageId==="adminOrders")
    loadAdminOrders();

  if(pageId==="adminPayments")
    loadAdminPayments();

}


document
  .querySelectorAll("[data-page]")
  .forEach(btn=>{

    btn.addEventListener(
      "click",
      ()=>{
        openPage(
          btn.dataset.page
        );
      }
    );

  });


document
  .getElementById("profileBtn")
  .onclick=()=>{
    openPage("profilePage");
  };


/* =========================
   CREDIT
========================= */

async function getCustomerOrders(){

  if(!currentUser)return [];

  const q=query(
    collection(db,"orders"),
    where(
      "customerId",
      "==",
      currentUser.uid
    )
  );


  const snap=await getDocs(q);

  return snap.docs.map(
    d=>({
      id:d.id,
      ...d.data()
    })
  );

}


async function calculateCredit(){

  const limit=
    Number(
      currentUser.creditLimit || 100000
    );

  const orders=
    await getCustomerOrders();


  const used=
    orders.reduce(
      (sum,o)=>
        sum+Number(o.total || 0),
      0
    );


  return {

    limit,

    used,

    available:
      Math.max(
        0,
        limit-used
      )

  };

}


async function renderCredit(){

  const credit=
    await calculateCredit();


  document
    .getElementById("creditAvailableLarge")
    .textContent=
      money(credit.available);


  document
    .getElementById("creditLimit")
    .textContent=
      money(credit.limit);


  document
    .getElementById("creditUsed")
    .textContent=
      money(credit.used);


  document
    .getElementById("creditOutstanding")
    .textContent=
      money(credit.used);

}


/* =========================
   CUSTOMER HOME
========================= */

async function renderHome(){

  const credit=
    await calculateCredit();


  document
    .getElementById("availableCredit")
    .textContent=
      money(credit.available);


  document
    .getElementById("creditPercent")
    .textContent=
      Math.round(
        credit.available/
        credit.limit*
        100
      )+"%";


  renderHomeStores();

  renderHomeProducts();

  renderNextPayment();

}


function renderHomeStores(){

  document
    .getElementById("homeStores")
    .innerHTML=
      SHOPS
        .slice(0,4)
        .map(shopHTML)
        .join("");

}


function renderHomeProducts(){

  document
    .getElementById("homeProducts")
    .innerHTML=
      PRODUCTS
        .slice(0,8)
        .map(productHTML)
        .join("");

}


async function renderNextPayment(){

  const orders=
    await getCustomerOrders();


  const box=
    document.getElementById(
      "nextPayment"
    );


  if(!orders.length){

    box.innerHTML=`

      <div class="payment-card">

        <div>

          <strong>
            No payment due
          </strong>

          <small>
            Start shopping with Payko.
          </small>

        </div>

      </div>

    `;

    return;

  }


  const order=orders[0];


  box.innerHTML=`

    <div class="payment-card">

      <div>

        <strong>
          ${money(order.installment)}
        </strong>

        <small>
          Pay in ${order.plan}
        </small>

      </div>

      <button
        class="primary-btn"
        data-page="ordersPage">

        View

      </button>

    </div>

  `;

}


/* =========================
   STORES
========================= */

function shopHTML(shop){

  return `

    <div
      class="store-card"
      data-shop="${shop.id}">

      <div class="shop-icon">
        ${shop.icon}
      </div>

      <h3>${shop.name}</h3>

      <p>${shop.category}</p>

      <p>📍 ${shop.location}</p>

      <div class="rating">
        ★ ${shop.rating}
      </div>

    </div>

  `;

}


function renderStores(){

  const search=
    document
      .getElementById("storeSearch")
      .value
      .toLowerCase()
      .trim();


  const category=
    document
      .getElementById("storeCategory")
      .value;


  const list=
    SHOPS.filter(shop=>{

      const searchMatch=
        shop.name
          .toLowerCase()
          .includes(search);


      const categoryMatch=
        category==="all" ||
        shop.category===category;


      return searchMatch &&
        categoryMatch;

    });


  document
    .getElementById("storesGrid")
    .innerHTML=
      list.length
        ?list.map(shopHTML).join("")
        :`<p class="muted">
            No stores found.
          </p>`;

}


document
  .getElementById("storeSearch")
  .addEventListener(
    "input",
    renderStores
  );


document
  .getElementById("storeCategory")
  .addEventListener(
    "change",
    renderStores
  );


/* =========================
   PRODUCTS
========================= */

function productHTML(product){

  return `

    <div class="product-card">

      <div
        class="product-image"
        data-product="${product.id}">

        ${product.icon}

      </div>

      <div class="product-info">

        <h3>${product.name}</h3>

        <p>
          ★ ${product.rating}
          • ${product.category}
        </p>

        <div class="product-price">
          ${money(product.price)}
        </div>

        <div class="installment">
          From
          ${money(
            Math.ceil(product.price/3)
          )}
          /payment
        </div>

        <div class="product-actions">

          <button
            data-product-view="${product.id}">

            View

          </button>

          <button
            data-add-product="${product.id}">

            Add

          </button>

        </div>

      </div>

    </div>

  `;

}


function renderProducts(){

  const search=
    document
      .getElementById("productSearch")
      .value
      .toLowerCase()
      .trim();


  const category=
    document
      .getElementById("productCategory")
      .value;


  const list=
    PRODUCTS.filter(product=>{

      const searchMatch=
        product.name
          .toLowerCase()
          .includes(search);


      const categoryMatch=
        category==="all" ||
        product.category===category;


      return searchMatch &&
        categoryMatch;

    });


  document
    .getElementById("productsGrid")
    .innerHTML=
      list.length
        ?list.map(productHTML).join("")
        :`<p class="muted">
            No products found.
          </p>`;

}


document
  .getElementById("productSearch")
  .addEventListener(
    "input",
    renderProducts
  );


document
  .getElementById("productCategory")
  .addEventListener(
    "change",
    renderProducts
  );


/* =========================
   PRODUCT EVENTS
========================= */

document.addEventListener(
  "click",
  event=>{

    const add=
      event.target.closest(
        "[data-add-product]"
      );

    if(add){

      addToCart(
        add.dataset.addProduct
      );

      return;

    }


    const view=
      event.target.closest(
        "[data-product-view]"
      );

    if(view){

      viewProduct(
        view.dataset.productView
      );

      return;

    }


    const image=
      event.target.closest(
        "[data-product]"
      );

    if(image){

      viewProduct(
        image.dataset.product
      );

    }

  }
);


/* =========================
   PRODUCT DETAIL
========================= */

function viewProduct(id){

  const product=
    PRODUCTS.find(
      p=>p.id===id
    );


  if(!product)return;


  const shop=
    SHOPS.find(
      s=>s.id===product.shopId
    );


  openPage("productPage");


  document
    .getElementById("productDetails")
    .innerHTML=`

      <div class="detail-card">

        <div class="detail-image">
          ${product.icon}
        </div>

        <div class="detail-info">

          <p class="eyebrow">
            ${product.category}
          </p>

          <h1>
            ${product.name}
          </h1>

          <div class="rating">
            ★ ${product.rating}
          </div>

          <div class="detail-price">
            ${money(product.price)}
          </div>

          <p>
            ${product.description ||
              "Quality product available through Payko."}
          </p>

          <p>
            <strong>Store:</strong>
            ${shop?.name || "Payko Store"}
          </p>

          <div class="plan-note">

            💳 Pay in 3 from
            <strong>
              ${money(
                Math.ceil(
                  product.price/3
                )
              )}
            </strong>
            per payment.

          </div>

          <div class="detail-buttons">

            <button
              data-add-product="${product.id}">

              Add to cart

            </button>

            <button
              data-buy-product="${product.id}">

              Buy now

            </button>

          </div>

        </div>

      </div>

    `;

}


/* =========================
   BUY NOW
========================= */

document.addEventListener(
  "click",
  event=>{

    const btn=
      event.target.closest(
        "[data-buy-product]"
      );

    if(!btn)return;


    cart=[
      {
        id:btn.dataset.buyProduct,
        qty:1
      }
    ];


    renderCart();

    openPage("checkoutPage");

    checkoutItems=
      getCartProducts();


    renderCheckout();

  }
);


/* =========================
   CART
========================= */

function getCartProducts(){

  return cart
    .map(item=>{

      const product=
        PRODUCTS.find(
          p=>p.id===item.id
        );


      if(!product)return null;


      return {

        ...product,

        qty:item.qty,

        subtotal:
          product.price*
          item.qty

      };

    })
    .filter(Boolean);

}


function addToCart(id){

  const item=
    cart.find(
      x=>x.id===id
    );


  if(item){

    item.qty++;

  }
  else{

    cart.push({
      id,
      qty:1
    });

  }


  updateCartBadge();

  toast("Added to cart");

}


function removeFromCart(id){

  cart=
    cart.filter(
      x=>x.id!==id
    );


  renderCart();

  updateCartBadge();

}


function changeQty(id,value){

  const item=
    cart.find(
      x=>x.id===id
    );


  if(!item)return;


  item.qty+=value;


  if(item.qty<=0){

    removeFromCart(id);

    return;

  }


  renderCart();

  updateCartBadge();

}


function updateCartBadge(){

  const count=
    cart.reduce(
      (sum,item)=>
        sum+item.qty,
      0
    );


  document
    .getElementById("cartBadge")
    .textContent=count;

}


function renderCart(){

  const items=
    getCartProducts();


  const box=
    document.getElementById(
      "cartContent"
    );


  if(!items.length){

    box.innerHTML=`

      <div class="dashboard-card"
        style="text-align:center;padding:50px">

        <div style="font-size:60px">
          🛒
        </div>

        <h2>
          Your cart is empty
        </h2>

        <button
          class="primary-btn"
          data-page="shopPage">

          Start shopping

        </button>

      </div>

    `;

    return;

  }


  const total=
    items.reduce(
      (sum,item)=>
        sum+item.subtotal,
      0
    );


  box.innerHTML=`

    <div class="cart-layout">

      <div class="cart-items">

        ${items.map(item=>`

          <div class="cart-item">

            <div class="cart-item-icon">
              ${item.icon}
            </div>

            <div class="cart-item-info">

              <h3>
                ${item.name}
              </h3>

              <small>
                ${money(item.price)}
              </small>

              <div class="qty">

                <button
                  data-qty-minus="${item.id}">
                  −
                </button>

                <strong>
                  ${item.qty}
                </strong>

                <button
                  data-qty-plus="${item.id}">
                  +
                </button>

                <button
                  class="remove"
                  data-remove-cart="${item.id}">

                  Remove

                </button>

              </div>

            </div>

            <strong>
              ${money(item.subtotal)}
            </strong>

          </div>

        `).join("")}

      </div>


      <div class="summary-card">

        <h2>Summary</h2>

        <div class="summary-row">

          <span>Subtotal</span>

          <strong>
            ${money(total)}
          </strong>

        </div>

        <div class="summary-row">

          <span>Pay in 3</span>

          <strong>
            ${money(
              Math.ceil(total/3)
            )}
          </strong>

        </div>

        <div class="summary-total">

          ${money(total)}

        </div>

        <button
          class="primary-btn full"
          id="checkoutBtn">

          Continue

        </button>

      </div>

    </div>

  `;


  document
    .getElementById("checkoutBtn")
    .onclick=startCheckout;

}


document.addEventListener(
  "click",
  event=>{

    const minus=
      event.target.closest(
        "[data-qty-minus]"
      );

    if(minus){

      changeQty(
        minus.dataset.qtyMinus,
        -1
      );

    }


    const plus=
      event.target.closest(
        "[data-qty-plus]"
      );

    if(plus){

      changeQty(
        plus.dataset.qtyPlus,
        1
      );

    }


    const remove=
      event.target.closest(
        "[data-remove-cart]"
      );

    if(remove){

      removeFromCart(
        remove.dataset.removeCart
      );

    }

  }
);


/* =========================
   CHECKOUT
========================= */

function startCheckout(){

  checkoutItems=
    getCartProducts();


  if(!checkoutItems.length){

    toast("Cart is empty");

    return;

  }


  selectedPlan=3;

  openPage("checkoutPage");

  renderCheckout();

}


function renderCheckout(){

  const total=
    checkoutItems.reduce(
      (sum,item)=>
        sum+item.subtotal,
      0
    );


  document
    .getElementById("checkoutContent")
    .innerHTML=`

      <div class="cart-layout">

        <div>

          <div class="plan-grid">

            <div
              class="plan ${
                selectedPlan===3
                  ?"selected":""
              }"
              data-plan="3">

              <h3>
                Pay in 3
              </h3>

              <strong>
                ${money(
                  Math.ceil(
                    total/3
                  )
                )}
              </strong>

              <p>
                3 equal payments
              </p>

            </div>


            <div
              class="plan ${
                selectedPlan===4
                  ?"selected":""
              }"
              data-plan="4">

              <h3>
                Pay in 4
              </h3>

              <strong>
                ${money(
                  Math.ceil(
                    total/4
                  )
                )}
              </strong>

              <p>
                4 equal payments
              </p>

            </div>

          </div>


          <div
            class="dashboard-card"
            style="margin-top:20px">

            <h2>
              Payment schedule
            </h2>

            ${Array.from(
              {length:selectedPlan},
              (_,i)=>`

                <div class="summary-row">

                  <span>
                    Payment ${i+1}
                  </span>

                  <strong>
                    ${money(
                      Math.ceil(
                        total/
                        selectedPlan
                      )
                    )}
                  </strong>

                </div>

              `
            ).join("")}

          </div>

        </div>


        <div class="summary-card">

          <h2>
            Order summary
          </h2>

          ${checkoutItems.map(item=>`

            <div class="summary-row">

              <span>
                ${item.name}
                × ${item.qty}
              </span>

              <strong>
                ${money(
                  item.subtotal
                )}
              </strong>

            </div>

          `).join("")}


          <div class="summary-total">

            ${money(total)}

          </div>


          <button
            class="primary-btn full"
            id="confirmOrderBtn">

            Confirm Payko Purchase

          </button>

        </div>

      </div>

    `;

}


document.addEventListener(
  "click",
  event=>{

    const plan=
      event.target.closest(
        "[data-plan]"
      );

    if(plan){

      selectedPlan=
        Number(plan.dataset.plan);

      renderCheckout();

    }


    if(
      event.target.closest(
        "#confirmOrderBtn"
      )
    ){

      confirmOrder();

    }

  }
);


/* =========================
   FIRESTORE ORDER
========================= */

async function confirmOrder(){

  const total=
    checkoutItems.reduce(
      (sum,item)=>
        sum+item.subtotal,
      0
    );


  const credit=
    await calculateCredit();


  if(total>credit.available){

    toast(
      "Purchase exceeds available credit."
    );

    return;

  }


  try{

    const order={

      customerId:
        currentUser.uid,

      customerName:
        currentUser.name,

      customerEmail:
        currentUser.email,

      items:
        checkoutItems.map(item=>({

          productId:item.id,

          name:item.name,

          price:item.price,

          qty:item.qty

        })),

      total,

      plan:selectedPlan,

      installment:
        Math.ceil(
          total/
          selectedPlan
        ),

      status:"Confirmed",

      createdAt:
        new Date().toISOString()

    };


    await addDoc(
      collection(db,"orders"),
      order
    );


    cart=[];

    checkoutItems=[];

    updateCartBadge();

    toast(
      "Purchase saved to Firebase 🎉"
    );


    openPage("ordersPage");

    renderOrders();

  }
  catch(error){

    console.error(error);

    toast(
      "Could not save order."
    );

  }

}


/* =========================
   ORDERS
========================= */

async function loadCustomerOrders(){

  try{

    const orders=
      await getCustomerOrders();


    currentUser.orders=orders;

  }
  catch(error){

    console.error(error);

  }

}


async function renderOrders(){

  const orders=
    await getCustomerOrders();


  const box=
    document.getElementById(
      "ordersContent"
    );


  if(!orders.length){

    box.innerHTML=`

      <div class="dashboard-card"
        style="text-align:center;padding:45px">

        <div style="font-size:55px">
          📋
        </div>

        <h2>
          No purchases yet
        </h2>

        <p class="muted">
          Your Firebase orders will appear here.
        </p>

      </div>

    `;

    return;

  }


  box.innerHTML=
    orders.map(order=>`

      <div class="order-card">

        <div class="order-head">

          <div>

            <strong>
              ${order.id}
            </strong>

            <div class="order-items">
              ${new Date(
                order.createdAt
              ).toLocaleDateString("en-LK")}
            </div>

          </div>

          <span class="status success">
            ${order.status}
          </span>

        </div>


        <div class="order-items">

          ${order.items
            .map(
              item=>
                `${item.name} × ${item.qty}`
            )
            .join(", ")}

        </div>


        <div class="order-footer">

          <span>
            Pay in ${order.plan}
          </span>

          <strong>
            ${money(order.total)}
          </strong>

        </div>


        <div class="order-footer">

          <span>
            Installment
          </span>

          <strong>
            ${money(order.installment)}
          </strong>

        </div>

      </div>

    `).join("");

}


/* =========================
   MERCHANT
========================= */

async function getMerchantOrders(){

  const q=
    query(
      collection(db,"orders"),
      orderBy(
        "createdAt",
        "desc"
      ),
      limit(100)
    );


  const snap=
    await getDocs(q);


  return snap.docs.map(
    d=>({
      id:d.id,
      ...d.data()
    })
  );

}


async function loadMerchantDashboard(){

  const orders=
    await getMerchantOrders();


  const total=
    orders.reduce(
      (sum,o)=>
        sum+Number(o.total || 0),
      0
    );


  document
    .getElementById("merchantSales")
    .textContent=
      money(total);


  document
    .getElementById("merchantOrderCount")
    .textContent=
      orders.length;


  document
    .getElementById("merchantPaykoOrders")
    .textContent=
      orders.length;


  renderMerchantOrderTable(
    orders.slice(0,10),
    "merchantOrdersTable"
  );

}


async function loadMerchantOrders(){

  const orders=
    await getMerchantOrders();


  renderMerchantOrderTable(
    orders,
    "merchantOrdersFull"
  );

}


function renderMerchantOrderTable(
  orders,
  elementId
){

  const box=
    document.getElementById(
      elementId
    );


  box.innerHTML=
    orders.map(order=>`

      <tr>

        <td>
          ${order.id}
        </td>

        <td>
          ${order.customerName || "Customer"}
        </td>

        <td>
          ${money(order.total)}
        </td>

        <td>
          Pay in ${order.plan}
        </td>

        <td>

          <span class="status success">
            ${order.status}
          </span>

        </td>

      </tr>

    `).join("");

}


async function loadMerchantProducts(){

  const box=
    document.getElementById(
      "merchantProductsGrid"
    );


  box.innerHTML=
    PRODUCTS.map(product=>`

      <div class="product-card">

        <div class="product-image">
          ${product.icon}
        </div>

        <div class="product-info">

          <h3>
            ${product.name}
          </h3>

          <p>
            ${product.category}
          </p>

          <div class="product-price">
            ${money(product.price)}
          </div>

          <div class="product-actions">

            <button
              data-edit-product="${product.id}">
              Edit
            </button>

            <button
              data-delete-product="${product.id}">
              Manage
            </button>

          </div>

        </div>

      </div>

    `).join("");

}


async function loadMerchantCustomers(){

  const orders=
    await getMerchantOrders();


  const customers={};


  orders.forEach(order=>{

    customers[
      order.customerId
    ]={

      name:order.customerName,

      email:order.customerEmail,

      total:
        (customers[
          order.customerId
        ]?.total || 0)
        +
        Number(order.total || 0)

    };

  });


  document
    .getElementById(
      "merchantCustomersGrid"
    )
    .innerHTML=
      Object.values(customers)
        .map(c=>`

          <div class="customer-card">

            <div class="avatar">
              ${initial(c.name)}
            </div>

            <div>

              <strong>
                ${c.name}
              </strong>

              <small>
                ${c.email}
              </small>

            </div>

            <span>
              ${money(c.total)}
            </span>

          </div>

        `)
        .join("");

}


async function loadMerchantEarnings(){

  const orders=
    await getMerchantOrders();


  const total=
    orders.reduce(
      (sum,o)=>
        sum+Number(o.total || 0),
      0
    );


  document
    .getElementById(
      "merchantEarningsTotal"
    )
    .textContent=
      money(total);

}


document
  .getElementById(
    "merchantAddProductBtn"
  )
  .onclick=()=>{

    toast(
      "Product management can be connected to Firestore next."
    );

  };


document
  .getElementById(
    "merchantProductAdd"
  )
  .onclick=()=>{

    toast(
      "Add-product form ready for Firestore integration."
    );

  };


/* =========================
   ADMIN
========================= */

async function getAllUsers(){

  const snap=
    await getDocs(
      collection(db,"users")
    );


  return snap.docs.map(
    d=>({
      id:d.id,
      ...d.data()
    })
  );

}


async function loadAdminDashboard(){

  const users=
    await getAllUsers();


  const orders=
    await getMerchantOrders();


  const customers=
    users.filter(
      u=>u.role==="customer"
    );


  const merchants=
    users.filter(
      u=>u.role==="merchant"
    );


  const volume=
    orders.reduce(
      (sum,o)=>
        sum+Number(o.total || 0),
      0
    );


  document
    .getElementById(
      "adminCustomersCount"
    )
    .textContent=
      customers.length;


  document
    .getElementById(
      "adminMerchantsCount"
    )
    .textContent=
      merchants.length;


  document
    .getElementById(
      "adminOrdersCount"
    )
    .textContent=
      orders.length;


  document
    .getElementById(
      "adminVolume"
    )
    .textContent=
      money(volume);

}


async function loadAdminCustomers(){

  const users=
    await getAllUsers();


  const customers=
    users.filter(
      u=>u.role==="customer"
    );


  document
    .getElementById(
      "adminCustomersTable"
    )
    .innerHTML=
      customers.map(user=>`

        <tr>

          <td>
            ${user.name || "-"}
          </td>

          <td>
            ${user.email || "-"}
          </td>

          <td>
            ${user.role}
          </td>

          <td>
            <span class="status success">
              Active
            </span>
          </td>

        </tr>

      `).join("");

}


async function loadAdminMerchants(){

  const users=
    await getAllUsers();


  const merchants=
    users.filter(
      u=>u.role==="merchant"
    );


  document
    .getElementById(
      "adminMerchantsGrid"
    )
    .innerHTML=
      merchants.map(user=>`

        <div class="merchant-admin-card">

          <div class="shop-logo">
            ${initial(user.name)}
          </div>

          <div>

            <h3>
              ${user.name}
            </h3>

            <p>
              ${user.email}
            </p>

          </div>

          <span class="status success">
            Active
          </span>

        </div>

      `).join("");

}


async function loadAdminOrders(){

  const orders=
    await getMerchantOrders();


  renderMerchantOrderTable(
    orders,
    "adminOrdersTable"
  );

}


async function loadAdminPayments(){

  const orders=
    await getMerchantOrders();


  const volume=
    orders.reduce(
      (sum,o)=>
        sum+Number(o.total || 0),
      0
    );


  document
    .getElementById(
      "paymentVolume"
    )
    .textContent=
      money(volume);


  document
    .getElementById(
      "paymentOrders"
    )
    .textContent=
      orders.length;

}


/* =========================
   NOTIFICATIONS
========================= */

document
  .getElementById(
    "notificationBtn"
  )
  .onclick=async()=>{

    const orders=
      await getCustomerOrders();


    if(!orders.length){

      toast(
        "No payment notifications."
      );

      return;

    }


    toast(
      "Next installment: "+
      money(
        orders[0].installment
      )
    );

  };


/* =========================
   GLOBAL SEARCH
========================= */

document
  .getElementById(
    "globalSearch"
  )
  .addEventListener(
    "input",
    event=>{

      const value=
        event.target.value
          .trim();


      if(!value)return;


      openPage("shopPage");


      document
        .getElementById(
          "productSearch"
        )
        .value=value;


      renderProducts();

    }
  );


/* =========================
   SERVICE WORKER
========================= */

if(
  "serviceWorker" in navigator
){

  window.addEventListener(
    "load",
    ()=>{
      navigator.serviceWorker
        .register("./sw.js")
        .catch(
          error=>
            console.log(
              "SW:",
              error
            )
        );
    }
  );

}