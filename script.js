/* =========================================================
   NORRA — script.js
   Vanilla JS SPA. No backend. All state in localStorage.
   ========================================================= */
(function(){
"use strict";

/* ---------------------------------------------------------
   0. SHORTHANDS + STORAGE HELPERS
--------------------------------------------------------- */
const $  = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
const fmt = n => "₹" + Number(n).toLocaleString("en-IN");
const uid = (p="") => p + Date.now().toString(36) + Math.random().toString(36).slice(2,7);

const LS = {
  get(key, fallback){
    try{
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    }catch(e){ return fallback; }
  },
  set(key, value){
    try{ localStorage.setItem(key, JSON.stringify(value)); }
    catch(e){ console.error("NORRA storage error:", e); }
  }
};
const KEYS = {
  cart:"norra_cart", favs:"norra_favs", orders:"norra_orders",
  reviews:"norra_reviews", customer:"norra_customer", products:"norra_products",
  admin:"norra_admin_session", contacts:"norra_contacts", newsletter:"norra_newsletter"
};

function toast(msg){
  const host = $("#toastHost");
  const t = document.createElement("div");
  t.className = "toast";
  t.textContent = msg;
  host.appendChild(t);
  setTimeout(()=>{ t.style.opacity="0"; t.style.transition=".3s"; setTimeout(()=>t.remove(),300); }, 2400);
}

let confirmResolver = null;
function confirmDialog(text){
  $("#confirmText").textContent = text;
  $("#confirmOverlay").classList.add("open");
  return new Promise(res=>{ confirmResolver = res; });
}
$("#confirmOk").addEventListener("click", ()=>{ $("#confirmOverlay").classList.remove("open"); if(confirmResolver) confirmResolver(true); });
$("#confirmCancel").addEventListener("click", ()=>{ $("#confirmOverlay").classList.remove("open"); if(confirmResolver) confirmResolver(false); });

/* ---------------------------------------------------------
   1. PRODUCT DATA (24+ items, data-driven)
--------------------------------------------------------- */
const RAW_PRODUCTS = [
  ["Wool Tailored Coat","Jackets","Women",7999,9999,4.7,128,"new"],
  ["Silk Slip Dress","Dresses","Women",4599,null,4.5,86,"trending"],
  ["Linen Wide Shirt","Shirts","Women",2299,2899,4.3,64,"new"],
  ["Relaxed Denim Jeans","Jeans","Women",3199,null,4.4,152,"bestseller"],
  ["Pleated Midi Skirt","Dresses","Women",2799,3499,4.2,41,"seasonal"],
  ["Cashmere Blend Sweater","Tops","Women",5299,null,4.8,201,"bestseller"],
  ["Tailored Trousers","Trousers","Women",3499,3999,4.5,73,"trending"],
  ["Oversized Blazer","Jackets","Women",6299,null,4.6,98,"new"],
  ["Merino Wool Hoodie","Hoodies","Men",3899,4599,4.4,110,"trending"],
  ["Classic Oxford Shirt","Shirts","Men",2499,null,4.6,187,"bestseller"],
  ["Slim Fit Chinos","Trousers","Men",2799,3299,4.3,95,"new"],
  ["Selvedge Denim Jeans","Jeans","Men",4199,null,4.7,143,"bestseller"],
  ["Overshirt Jacket","Jackets","Men",5499,6299,4.5,58,"seasonal"],
  ["Cotton Crewneck Tee","Tops","Men",1499,null,4.2,264,"bestseller"],
  ["Quilted Bomber","Jackets","Men",6799,null,4.6,47,"new"],
  ["Linen Blend Trousers","Trousers","Men",2999,3499,4.4,66,"seasonal"],
  ["Structured Tote Bag","Bags","Unisex",4299,null,4.7,132,"trending"],
  ["Leather Crossbody Bag","Bags","Unisex",5299,5999,4.6,89,"bestseller"],
  ["Minimal Leather Belt","Accessories","Unisex",1299,null,4.3,54,"new"],
  ["Wool Scarf","Accessories","Unisex",1899,2299,4.5,71,"seasonal"],
  ["Gold-Tone Hoop Earrings","Accessories","Women",999,1299,4.4,112,"trending"],
  ["Leather Ankle Boots","Shoes","Women",6499,7499,4.6,97,"bestseller"],
  ["Canvas Low-Top Sneakers","Shoes","Unisex",3499,null,4.3,168,"new"],
  ["Leather Derby Shoes","Shoes","Men",5999,6799,4.5,84,"trending"],
  ["Ribbed Knit Dress","Dresses","Women",3799,null,4.4,52,"seasonal"],
  ["Utility Cargo Trousers","Trousers","Men",3299,null,4.2,39,"new"]
];
const fashionImages = [
  // 1. Wool Tailored Coat
  "https://images.unsplash.com/photo-1548126032-079a0fb0099d?auto=format&fit=crop&w=600&q=80",

  // 2. Silk Slip Dress
  "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=600&q=80",

  // 3. Linen Wide Shirt
  "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=600&q=80",

  // 4. Relaxed Denim Jeans
  "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=600&q=80",

  // 5. Pleated Midi Skirt
  "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?auto=format&fit=crop&w=600&q=80",

  // 6. Cashmere Blend Sweater
  "https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=600&q=80",

  // 7. Tailored Trousers
  "https://images.unsplash.com/photo-1506629905607-d9a7e6e0e8c6?auto=format&fit=crop&w=600&q=80",

  // 8. Oversized Blazer
  "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=600&q=80",

  // 9. Merino Wool Hoodie
  "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=600&q=80",

  // 10. Classic Oxford Shirt
  "https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&w=600&q=80",

  // 11. Slim Fit Chinos
  "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=600&q=80",

  // 12. Selvedge Denim Jeans
  "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=600&q=80",

  // 13. Overshirt Jacket
  "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=600&q=80",

  // 14. Cotton Crewneck Tee
  "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=600&q=80",

  // 15. Quilted Bomber
  "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=600&q=80",

  // 16. Linen Blend Trousers
  "https://images.unsplash.com/photo-1517438476312-10d79c077509?auto=format&fit=crop&w=600&q=80",

  // 17. Structured Tote Bag
  "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=600&q=80",

  // 18. Leather Crossbody Bag
  "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=600&q=80",

  // 19. Minimal Leather Belt
  "https://images.unsplash.com/photo-1624222247344-550fb8d5b5f1?auto=format&fit=crop&w=600&q=80",

  // 20. Wool Scarf
  "https://images.unsplash.com/photo-1601924994987-69e26d50dc26?auto=format&fit=crop&w=600&q=80",

  // 21. Gold-Tone Hoop Earrings
  "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=600&q=80",

  // 22. Leather Ankle Boots
  "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=600&q=80",

  // 23. Canvas Low-Top Sneakers
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80",

  // 24. Leather Derby Shoes
  "https://images.unsplash.com/photo-1614252369475-531eba835eb1?auto=format&fit=crop&w=600&q=80",

  // 25. Ribbed Knit Dress
  "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=600&q=80",

  // 26. Utility Cargo Trousers
  "https://images.unsplash.com/photo-1517438476312-10d79c077509?auto=format&fit=crop&w=600&q=80"
];
const SIZES = ["XS","S","M","L","XL","XXL"];
const COLORS = ["#161513","#A9834C","#E4DED2","#4A473F","#8A6B4A"];
const DEMO_REVIEW_NAMES = ["Aarav Mehta","Priya Nair","Kabir Shah","Ananya Iyer","Rohan Gupta","Meera Pillai","Devansh Rao","Sanya Kapoor"];
const DEMO_REVIEW_TEXTS = [
  "Fabric quality is excellent, fits true to size and feels premium.",
  "Loved the finish and the stitching detail — arrived well packaged.",
  "Great everyday piece, versatile and easy to style.",
  "Slightly runs large, ordered a size down and it's perfect now.",
  "Exactly like the photos, colour is rich and doesn't fade after wash.",
  "Comfortable fabric, would definitely buy another colour."
];
function buildProducts(){
  return RAW_PRODUCTS.map((p, i)=>{
    const [name, category, gender, price, oldPrice, rating, reviewCount, tag] = p;
    const off = oldPrice
      ? Math.round(((oldPrice-price)/oldPrice)*100)
      : 0;

    return {
      id: "p"+(i+1),
      name,
      category,
      gender,
      price,
      oldPrice,
      rating,
      reviewCount,
      tag,

      // Correct image according to product order
      image: fashionImages[i],

      // Use the next product image as secondary image
      image2: fashionImages[(i+1) % fashionImages.length],

      off,

      description: `The ${name} is designed in a considered fit with honest materials — a NORRA staple built to be worn season after season. Pairs effortlessly with the rest of the ${gender === "Unisex" ? "collection" : gender + "'s edit"}.`,

      stock: 8 + (i % 12)
    };
  });
}
function loadProducts(){
  const base = buildProducts();
  const overrides = LS.get(KEYS.products, {});
  return base
    .filter(p => !overrides[p.id] || overrides[p.id].status !== "deleted")
    .map(p => overrides[p.id] ? {...p, ...overrides[p.id]} : p)
    .concat(Object.values(overrides).filter(o => o.isNew && o.status !== "deleted"));
}
function saveProductOverride(id, patch){
  const o = LS.get(KEYS.products, {});
  o[id] = {...(o[id]||{}), ...patch, id};
  LS.set(KEYS.products, o);
}

let PRODUCTS = loadProducts();
const productById = id => PRODUCTS.find(p => p.id === id);

/* ---------------------------------------------------------
   2. CAMPAIGN + ANALYTICS DATA
--------------------------------------------------------- */
const PLATFORMS = [
  { key:"instagram", name:"Instagram", icon:"📸",
    objective:"Drive brand awareness and new-season product discovery.",
    contentType:"Reels, fashion carousels, Stories, influencer collaborations.",
    audience:"Women & men, 20–34, urban, fashion-conscious.",
    posting:"1 Reel + 1 carousel daily, 3–5 Stories daily.",
    hashtags:"#NORRAStyle #DefineYourStyle #NewSeasonEdit",
    engagement:"Poll & quiz stickers in Stories, comment-to-win giveaways, reply to DMs within 2 hours.",
    example:"“This coat does the talking. 🧥 Shop the New Season Edit — link in bio. #NORRAStyle”" },
  { key:"tiktok", name:"TikTok", icon:"🎵",
    objective:"Reach Gen-Z audiences with fast, trend-led fashion content.",
    contentType:"Styling transitions, get-ready-with-me videos, trending sounds, UGC challenges.",
    audience:"Gen-Z, 16–26, trend-driven, mobile-first.",
    posting:"5 short videos per week, riding current trending sounds.",
    hashtags:"#NORRAxTikTok #OOTD #StyleTransition",
    engagement:"Duet & stitch challenges, respond to top comments on-camera, creator partnerships.",
    example:"“3 outfits, 1 coat. Which fit wins? 👇 #NORRAxTikTok”" },
  { key:"youtube", name:"YouTube", icon:"▶️",
    objective:"Build long-form brand storytelling and styling authority.",
    contentType:"Lookbooks, styling tutorials, behind-the-scenes shoot footage.",
    audience:"25–40, considered shoppers researching before purchase.",
    posting:"1 long-form video weekly + 2 Shorts.",
    hashtags:"#NORRALookbook #StyleGuide",
    engagement:"Pinned comment with shop links, community tab polls, end-screen cross-links.",
    example:"“New Season Lookbook: 10 ways to wear the tailored coat.”" },
  { key:"facebook", name:"Facebook", icon:"👍",
    objective:"Reach an older core demographic and drive direct offers.",
    contentType:"Product campaigns, community posts, seasonal offers.",
    audience:"28–45, existing customers and lookalike audiences.",
    posting:"4 posts per week + boosted offer campaigns.",
    hashtags:"#NORRA #NewSeasonOffer",
    engagement:"Facebook Groups for loyal customers, event promotion, responsive page-messaging.",
    example:"“New Season Edit is here — 10% off for our Facebook community this week only.”" },
  { key:"pinterest", name:"Pinterest", icon:"📌",
    objective:"Drive discovery through outfit inspiration and seasonal planning.",
    contentType:"Outfit inspiration boards, seasonal look pins, styling guides.",
    audience:"22–38, planners, mood-board and home/style curators.",
    posting:"10 pins weekly across themed boards.",
    hashtags:"#NORRAInspo #SeasonalStyle",
    engagement:"Rich pins linked to product pages, seasonal idea boards, collaborative boards with stylists.",
    example:"“Autumn capsule wardrobe: 8 pieces, 20 outfits. Pin for later.”" }
];

const ANALYTICS = {
  instagram:{reach:182000,impressions:410000,engagement:6.8,clicks:9400,followers:52000,conversion:3.1,sales:412000},
  tiktok:{reach:265000,impressions:610000,engagement:9.4,clicks:14200,followers:71000,conversion:2.4,sales:298000},
  youtube:{reach:64000,impressions:120000,engagement:5.2,clicks:3100,followers:18500,conversion:4.6,sales:186000},
  facebook:{reach:97000,impressions:158000,engagement:3.1,clicks:5200,followers:38000,conversion:2.9,sales:224000},
  pinterest:{reach:71000,impressions:139000,engagement:4.4,clicks:6600,followers:24500,conversion:3.8,sales:151000}
};

/* ---------------------------------------------------------
   3. STATE
--------------------------------------------------------- */
let cart = LS.get(KEYS.cart, []);
let favs = LS.get(KEYS.favs, []);
let orders = LS.get(KEYS.orders, []);
let reviews = LS.get(KEYS.reviews, null);
let customer = LS.get(KEYS.customer, {name:"",email:"",phone:""});
let appliedCoupon = null;

if(!reviews){
  reviews = {};
  PRODUCTS.forEach(p=>{
    const count = 2 + Math.floor(Math.random()*2);
    reviews[p.id] = Array.from({length:count}).map((_,i)=>({
      id: uid("r"),
      name: DEMO_REVIEW_NAMES[Math.floor(Math.random()*DEMO_REVIEW_NAMES.length)],
      rating: 4 + Math.round(Math.random()),
      text: DEMO_REVIEW_TEXTS[Math.floor(Math.random()*DEMO_REVIEW_TEXTS.length)],
      date: new Date(Date.now() - Math.random()*30*86400000).toISOString(),
      approved: true
    }));
  });
  LS.set(KEYS.reviews, reviews);
}
function persistCart(){ LS.set(KEYS.cart, cart); updateBadges(); }
function persistFavs(){ LS.set(KEYS.favs, favs); updateBadges(); }
function persistOrders(){ LS.set(KEYS.orders, orders); }
function persistReviews(){ LS.set(KEYS.reviews, reviews); }
function persistCustomer(){ LS.set(KEYS.customer, customer); }

function updateBadges(){
  $("#cartCount").textContent = cart.reduce((s,i)=>s+i.qty,0);
  $("#favCount").textContent = favs.length;
}

/* ---------------------------------------------------------
   4. ROUTER
--------------------------------------------------------- */
const PAGES = ["home","shop","product","favourites","cart","checkout","success","orders","about","campaign","security","admin-login","admin","account","contact"];
let currentProductId = null;
let pendingCollectionFilter = null;

function navigate(page, opts={}){
  if(!PAGES.includes(page)) page = "home";
  if(page === "admin" && !LS.get(KEYS.admin, false)){ page = "admin-login"; }
  $$(".page").forEach(p=>p.classList.remove("active"));
  $("#page-"+page).classList.add("active");
  closeMobileMenu();
  closeFilters();
  window.scrollTo({top:0, behavior:"instant" in window ? "instant":"auto"});

  if(page === "shop") renderShop(opts);
  if(page === "product") renderProductDetail(opts.id || currentProductId);
  if(page === "favourites") renderFavourites();
  if(page === "cart") renderCart();
  if(page === "checkout") renderCheckout();
  if(page === "orders") renderOrders();
  if(page === "campaign") renderCampaign();
  if(page === "admin") renderAdmin();
  if(page === "account") renderAccount();
  if(page === "home") renderHome();
}

function parseHash(){
  const raw = location.hash.replace("#","") || "home";
  const [page, query] = raw.split("?");
  const params = new URLSearchParams(query||"");
  return {page, params};
}
window.addEventListener("hashchange", ()=>{
  const {page, params} = parseHash();
  const opts = {};
  if(params.get("id")) opts.id = params.get("id");
  navigate(page, opts);
});

document.addEventListener("click", (e)=>{
  const navEl = e.target.closest("[data-nav]");
  if(!navEl) return;
  const page = navEl.dataset.nav;
  if(navEl.dataset.gender) pendingCollectionFilter = {type:"gender", value:navEl.dataset.gender};
  else if(navEl.dataset.category) pendingCollectionFilter = {type:"category", value:navEl.dataset.category};
  else pendingCollectionFilter = null;
});

/* ---------------------------------------------------------
   5. NAVBAR / MOBILE MENU / SEARCH
--------------------------------------------------------- */
const hamburgerBtn = $("#hamburgerBtn"), mobileMenu = $("#mobileMenu"), scrim = $("#scrim");
function openMobileMenu(){ mobileMenu.classList.add("open"); scrim.classList.add("open"); hamburgerBtn.classList.add("open"); hamburgerBtn.setAttribute("aria-expanded","true"); }
function closeMobileMenu(){ mobileMenu.classList.remove("open"); scrim.classList.remove("open"); hamburgerBtn.classList.remove("open"); hamburgerBtn.setAttribute("aria-expanded","false"); }
hamburgerBtn.addEventListener("click", ()=> mobileMenu.classList.contains("open") ? closeMobileMenu() : openMobileMenu());
scrim.addEventListener("click", closeMobileMenu);

$("#searchToggle").addEventListener("click", ()=> $("#searchPanel").classList.toggle("open"));
function goSearch(){
  const q = $("#searchInput").value.trim();
  $("#searchPanel").classList.remove("open");
  location.hash = "shop";
  navigate("shop", {search:q});
}
$("#searchGo").addEventListener("click", goSearch);
$("#searchInput").addEventListener("keydown", e=>{ if(e.key==="Enter") goSearch(); });

let backTopBtn = $("#backTop");
window.addEventListener("scroll", ()=> backTopBtn.classList.toggle("show", window.scrollY > 500));
backTopBtn.addEventListener("click", ()=> window.scrollTo({top:0, behavior:"smooth"}));

/* ---------------------------------------------------------
   6. PRODUCT CARD RENDERER (shared)
--------------------------------------------------------- */
function productCard(p){
  const isFav = favs.includes(p.id);
  const badge = p.tag === "new" ? "New" : p.tag === "bestseller" ? "Bestseller" : p.tag === "trending" ? "Trending" : p.tag === "seasonal" ? "Seasonal" : "";
  return `
  <div class="product-card" data-id="${p.id}">
    <div class="product-media">
      <img src="${p.image}" alt="${p.name}" loading="lazy">
      <div class="product-badges">${badge?`<span>${badge}</span>`:""}${p.off?`<span>-${p.off}%</span>`:""}</div>
      <button class="fav-btn ${isFav?"active":""}" data-fav="${p.id}" aria-label="Toggle favourite">
        <svg viewBox="0 0 24 24"><path d="M12 21s-7.5-4.6-10-9.3C.4 8 2 4.5 5.6 4c2-.3 3.7.7 4.4 2.2C10.7 4.7 12.4 3.7 14.4 4c3.6.5 5.2 4 3.6 7.7C15.5 16.4 12 21 12 21z"/></svg>
      </button>
      <button class="qv-btn" data-quickview="${p.id}">Quick View</button>
    </div>
    <div class="product-info">
      <p class="product-cat">${p.category} · ${p.gender}</p>
      <p class="product-name" data-open="${p.id}">${p.name}</p>
      <p class="product-rating">★ ${p.rating} (${p.reviewCount})</p>
      <div class="product-price">
        <span class="price-now">${fmt(p.price)}</span>
        ${p.oldPrice?`<span class="price-old">${fmt(p.oldPrice)}</span><span class="price-off">-${p.off}%</span>`:""}
      </div>
      <button class="add-cart-btn" data-addcart="${p.id}">Add to Cart</button>
    </div>
  </div>`;
}

document.addEventListener("click", (e)=>{
  const favBtn = e.target.closest("[data-fav]");
  if(favBtn){ toggleFav(favBtn.dataset.fav); return; }
  const addBtn = e.target.closest("[data-addcart]");
  if(addBtn){ addToCart(addBtn.dataset.addcart, 1, null, null); return; }
  const openEl = e.target.closest("[data-open]");
  if(openEl){ currentProductId = openEl.dataset.open; location.hash = "product?id="+currentProductId; navigate("product",{id:currentProductId}); return; }
  const qv = e.target.closest("[data-quickview]");
  if(qv){ openQuickView(qv.dataset.quickview); return; }
});

function toggleFav(id){
  if(favs.includes(id)){ favs = favs.filter(f=>f!==id); toast("Removed from favourites"); }
  else { favs.push(id); toast("Added to favourites"); }
  persistFavs();
  refreshVisibleCards();
}
function refreshVisibleCards(){
  $$(".fav-btn").forEach(btn=>{
    const id = btn.dataset.fav;
    btn.classList.toggle("active", favs.includes(id));
  });
}
function addToCart(id, qty=1, size=null, color=null){
  const existing = cart.find(c=>c.id===id && c.size===size && c.color===color);
  if(existing) existing.qty += qty;
  else cart.push({id, qty, size: size||SIZES[2], color: color||COLORS[0]});
  persistCart();
  toast("Added to cart");
}

/* ---------------------------------------------------------
   7. QUICK VIEW MODAL
--------------------------------------------------------- */
function openQuickView(id){
  const p = productById(id);
  if(!p) return;
  $("#quickViewModal").innerHTML = `
    <button class="qv-close" id="qvClose" aria-label="Close">✕</button>
    <div class="qv-layout">
      <img src="${p.image}" alt="${p.name}">
      <div>
        <p class="product-cat">${p.category} · ${p.gender}</p>
        <h3>${p.name}</h3>
        <div class="pd-price"><span class="price-now">${fmt(p.price)}</span>${p.oldPrice?`<span class="price-old">${fmt(p.oldPrice)}</span>`:""}</div>
        <p class="muted" style="margin:10px 0 16px;">${p.description}</p>
        <div class="pd-actions">
          <button class="btn btn-dark" data-addcart="${p.id}">Add to Cart</button>
          <a href="#product?id=${p.id}" class="btn btn-outline" data-open="${p.id}" id="qvViewFull">View full details</a>
        </div>
      </div>
    </div>`;
  $("#quickViewOverlay").classList.add("open");
  $("#qvClose").addEventListener("click", closeQuickView);
  $("#qvViewFull").addEventListener("click", closeQuickView);
}
function closeQuickView(){ $("#quickViewOverlay").classList.remove("open"); }
$("#quickViewOverlay").addEventListener("click", e=>{ if(e.target.id === "quickViewOverlay") closeQuickView(); });

/* ---------------------------------------------------------
   8. HOME PAGE
--------------------------------------------------------- */
function renderHome(){
  $("#row-new").innerHTML = PRODUCTS.filter(p=>p.tag==="new").map(productCard).join("");
  $("#row-trending").innerHTML = PRODUCTS.filter(p=>p.tag==="trending").map(productCard).join("");
  $("#row-bestsellers").innerHTML = PRODUCTS.filter(p=>p.tag==="bestseller").map(productCard).join("");
  $("#row-seasonal").innerHTML = PRODUCTS.filter(p=>p.tag==="seasonal").map(productCard).join("");

  const allReviews = [];
  Object.entries(reviews).forEach(([pid, list])=> list.forEach(r=> allReviews.push({...r, pid})));
  allReviews.sort((a,b)=> new Date(b.date)-new Date(a.date));
  $("#homeReviews").innerHTML = allReviews.slice(0,6).map(r=>`
    <div class="review-card">
      <div class="review-stars">${"★".repeat(r.rating)}${"☆".repeat(5-r.rating)}</div>
      <p class="review-name">${escapeHtml(r.name)}</p>
      <p class="review-date">${new Date(r.date).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})} · ${productById(r.pid)?.name||""}</p>
      <p class="review-text">${escapeHtml(r.text)}</p>
    </div>`).join("");
}
function escapeHtml(s){ const d=document.createElement("div"); d.textContent=s; return d.innerHTML; }

$("#newsletterForm").addEventListener("submit", e=>{
  e.preventDefault();
  const list = LS.get(KEYS.newsletter, []);
  list.push({email: $("#newsletterEmail").value, date: new Date().toISOString()});
  LS.set(KEYS.newsletter, list);
  toast("Subscribed! Welcome to NORRA.");
  e.target.reset();
});

/* ---------------------------------------------------------
   9. SHOP PAGE (search, filter, sort)
--------------------------------------------------------- */
const shopState = { search:"", categories:new Set(), genders:new Set(), maxPrice:10000, minRating:0, sort:"featured" };

function renderShop(opts={}){
  if(opts.search !== undefined) shopState.search = opts.search;
  if(pendingCollectionFilter){
    if(pendingCollectionFilter.type==="gender"){ shopState.genders = new Set([pendingCollectionFilter.value]); }
    if(pendingCollectionFilter.type==="category"){ shopState.categories = new Set([pendingCollectionFilter.value]); }
    pendingCollectionFilter = null;
  }
  $("#shopSearch").value = shopState.search;

  const cats = [...new Set(PRODUCTS.map(p=>p.category))].sort();
  $("#categoryFilters").innerHTML = cats.map(c=>`
    <label class="filter-chip"><input type="checkbox" value="${c}" ${shopState.categories.has(c)?"checked":""} class="cat-check"> ${c}</label>`).join("");
  const genders = [...new Set(PRODUCTS.map(p=>p.gender))];
  $("#genderFilters").innerHTML = genders.map(g=>`
    <label class="filter-chip"><input type="checkbox" value="${g}" ${shopState.genders.has(g)?"checked":""} class="gender-check"> ${g}</label>`).join("");
  $("#ratingFilters").innerHTML = [4,3,2].map(r=>`
    <label class="filter-chip"><input type="radio" name="ratingf" value="${r}" ${shopState.minRating==r?"checked":""} class="rating-check"> ${r}★ &amp; up</label>`).join("")
    + `<label class="filter-chip"><input type="radio" name="ratingf" value="0" ${shopState.minRating==0?"checked":""} class="rating-check"> All ratings</label>`;
  $("#priceRange").value = shopState.maxPrice;
  $("#priceLabel").textContent = "Up to " + fmt(shopState.maxPrice);
  $("#sortSelect").value = shopState.sort;

  applyShopFilters();
}

function applyShopFilters(){
  let list = PRODUCTS.filter(p=>{
    if(shopState.search && !(`${p.name} ${p.category} ${p.gender}`.toLowerCase().includes(shopState.search.toLowerCase()))) return false;
    if(shopState.categories.size && !shopState.categories.has(p.category)) return false;
    if(shopState.genders.size && !shopState.genders.has(p.gender)) return false;
    if(p.price > shopState.maxPrice) return false;
    if(p.rating < shopState.minRating) return false;
    return true;
  });
  switch(shopState.sort){
    case "price-asc": list.sort((a,b)=>a.price-b.price); break;
    case "price-desc": list.sort((a,b)=>b.price-a.price); break;
    case "rating": list.sort((a,b)=>b.rating-a.rating); break;
    case "newest": list = list.slice().reverse(); break;
    default: break;
  }
  $("#shopGrid").innerHTML = list.length ? list.map(productCard).join("") : `<p class="muted" style="grid-column:1/-1;padding:40px 0;">No products match your filters.</p>`;
  $("#shopCount").textContent = list.length + " product" + (list.length===1?"":"s");
}

$("#shopSearch").addEventListener("input", e=>{ shopState.search = e.target.value; applyShopFilters(); });
document.addEventListener("change", e=>{
  if(e.target.classList.contains("cat-check")){
    e.target.checked ? shopState.categories.add(e.target.value) : shopState.categories.delete(e.target.value);
    applyShopFilters();
  }
  if(e.target.classList.contains("gender-check")){
    e.target.checked ? shopState.genders.add(e.target.value) : shopState.genders.delete(e.target.value);
    applyShopFilters();
  }
  if(e.target.classList.contains("rating-check")){ shopState.minRating = Number(e.target.value); applyShopFilters(); }
  if(e.target.id === "priceRange"){ shopState.maxPrice = Number(e.target.value); $("#priceLabel").textContent = "Up to " + fmt(shopState.maxPrice); applyShopFilters(); }
  if(e.target.id === "sortSelect"){ shopState.sort = e.target.value; applyShopFilters(); }
});
$("#clearFilters").addEventListener("click", ()=>{
  shopState.categories.clear(); shopState.genders.clear(); shopState.maxPrice=10000; shopState.minRating=0; shopState.search=""; shopState.sort="featured";
  renderShop();
});
const filterDrawer = $("#filterDrawer"), filterScrim = $("#filterScrim");
function openFilters(){ filterDrawer.classList.add("open"); filterScrim.classList.add("open"); }
function closeFilters(){ filterDrawer.classList.remove("open"); filterScrim.classList.remove("open"); }
$("#filterToggle").addEventListener("click", openFilters);
$("#closeFilters").addEventListener("click", closeFilters);
filterScrim.addEventListener("click", closeFilters);

/* ---------------------------------------------------------
   10. PRODUCT DETAIL PAGE
--------------------------------------------------------- */
let pdState = {size:null, color:null, qty:1};

function renderProductDetail(id){
  const p = productById(id) || PRODUCTS[0];
  currentProductId = p.id;
  pdState = {size:SIZES[2], color:COLORS[0], qty:1};
  const isFav = favs.includes(p.id);
  const productReviews = (reviews[p.id]||[]).slice().sort((a,b)=> new Date(b.date)-new Date(a.date));

  $("#productDetailRoot").innerHTML = `
    <div class="pd-wrap">
      <div class="pd-media"><img src="${p.image}" alt="${p.name}" id="pdImage"></div>
      <div class="pd-info">
        <p class="product-cat">${p.category} · ${p.gender}</p>
        <h1>${p.name}</h1>
        <div class="pd-rating-line">★ ${p.rating} · ${p.reviewCount} ratings</div>
        <div class="pd-price">
          <span class="price-now">${fmt(p.price)}</span>
          ${p.oldPrice?`<span class="price-old">${fmt(p.oldPrice)}</span><span class="price-off">-${p.off}%</span>`:""}
        </div>
        <p class="pd-desc">${p.description}</p>

        <div class="pd-block">
          <h4>Size</h4>
          <div class="size-row" id="sizeRow">
            ${SIZES.map(s=>`<button class="size-chip ${s===pdState.size?"active":""}" data-size="${s}">${s}</button>`).join("")}
          </div>
        </div>
        <div class="pd-block">
          <h4>Colour</h4>
          <div class="color-row" id="colorRow">
            ${COLORS.map(c=>`<button class="color-chip ${c===pdState.color?"active":""}" style="background:${c}" data-color="${c}" aria-label="Colour ${c}"></button>`).join("")}
          </div>
        </div>
        <div class="pd-block">
          <h4>Quantity</h4>
          <div class="qty-row">
            <button id="pdQtyMinus" aria-label="Decrease quantity">−</button>
            <span id="pdQtyVal">1</span>
            <button id="pdQtyPlus" aria-label="Increase quantity">+</button>
            <span class="muted">${p.stock} in stock</span>
          </div>
        </div>
        <div class="pd-actions">
          <button class="btn btn-dark" id="pdAddCart">Add to Cart</button>
          <button class="btn btn-outline" id="pdBuyNow">Buy Now</button>
          <button class="fav-btn ${isFav?"active":""}" id="pdFav" data-fav="${p.id}" aria-label="Toggle favourite">
            <svg viewBox="0 0 24 24"><path d="M12 21s-7.5-4.6-10-9.3C.4 8 2 4.5 5.6 4c2-.3 3.7.7 4.4 2.2C10.7 4.7 12.4 3.7 14.4 4c3.6.5 5.2 4 3.6 7.7C15.5 16.4 12 21 12 21z"/></svg>
          </button>
        </div>
      </div>
    </div>

    <section class="strip-section">
      <div class="section-head"><h2>Ratings &amp; Reviews</h2></div>
      <div class="reviews-grid">
        ${productReviews.length ? productReviews.map(r=>`
          <div class="review-card">
            <div class="review-stars">${"★".repeat(r.rating)}${"☆".repeat(5-r.rating)}</div>
            <p class="review-name">${escapeHtml(r.name)}</p>
            <p class="review-date">${new Date(r.date).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}</p>
            <p class="review-text">${escapeHtml(r.text)}</p>
          </div>`).join("") : `<p class="muted">No reviews yet — be the first to review this product.</p>`}
      </div>
      <div class="review-form">
        <h3>Write a review</h3>
        <div class="star-input" id="starInput">
          ${[1,2,3,4,5].map(n=>`<span data-star="${n}">★</span>`).join("")}
        </div>
        <input type="text" id="reviewName" placeholder="Your name">
        <textarea id="reviewText" rows="3" placeholder="Share your experience..."></textarea>
        <button class="btn btn-dark" id="submitReview">Submit Review</button>
      </div>
    </section>
  `;

  $$("#sizeRow .size-chip").forEach(b=> b.addEventListener("click", ()=>{ pdState.size=b.dataset.size; $$("#sizeRow .size-chip").forEach(x=>x.classList.remove("active")); b.classList.add("active"); }));
  $$("#colorRow .color-chip").forEach(b=> b.addEventListener("click", ()=>{ pdState.color=b.dataset.color; $$("#colorRow .color-chip").forEach(x=>x.classList.remove("active")); b.classList.add("active"); }));
  $("#pdQtyMinus").addEventListener("click", ()=>{ pdState.qty=Math.max(1,pdState.qty-1); $("#pdQtyVal").textContent=pdState.qty; });
  $("#pdQtyPlus").addEventListener("click", ()=>{ pdState.qty=Math.min(p.stock,pdState.qty+1); $("#pdQtyVal").textContent=pdState.qty; });
  $("#pdAddCart").addEventListener("click", ()=> addToCart(p.id, pdState.qty, pdState.size, pdState.color));
  $("#pdBuyNow").addEventListener("click", ()=>{ addToCart(p.id, pdState.qty, pdState.size, pdState.color); location.hash="checkout"; navigate("checkout"); });

  let starVal = 0;
  $$("#starInput span").forEach(s=> s.addEventListener("click", ()=>{
    starVal = Number(s.dataset.star);
    $$("#starInput span").forEach(x=> x.classList.toggle("active", Number(x.dataset.star) <= starVal));
  }));
  $("#submitReview").addEventListener("click", ()=>{
    const name = $("#reviewName").value.trim();
    const text = $("#reviewText").value.trim();
    if(!starVal || !name || !text){ toast("Please add a rating, name and review text"); return; }
    reviews[p.id] = reviews[p.id] || [];
    reviews[p.id].unshift({id:uid("r"), name, rating:starVal, text, date:new Date().toISOString(), approved:true});
    persistReviews();
    toast("Review submitted — thank you!");
    renderProductDetail(p.id);
  });

  const related = PRODUCTS.filter(x=>x.category===p.category && x.id!==p.id).slice(0,8);
  $("#relatedRow").innerHTML = (related.length?related:PRODUCTS.filter(x=>x.id!==p.id).slice(0,8)).map(productCard).join("");
}

/* ---------------------------------------------------------
   11. FAVOURITES PAGE
--------------------------------------------------------- */
function renderFavourites(){
  const items = favs.map(productById).filter(Boolean);
  $("#favSummary").textContent = items.length + " item" + (items.length===1?"":"s");
  $("#favGrid").innerHTML = items.map(productCard).join("");
  $("#favGrid").style.display = items.length ? "grid" : "none";
  $("#favEmpty").hidden = items.length > 0;
  $("#favActions").hidden = items.length === 0;
}
$("#clearFavs").addEventListener("click", async ()=>{
  if(await confirmDialog("Remove all items from your favourites?")){
    favs = []; persistFavs(); renderFavourites(); toast("Favourites cleared");
  }
});

/* ---------------------------------------------------------
   12. CART PAGE
--------------------------------------------------------- */
const COUPONS = { "NORRA10":0.10, "WELCOME15":0.15 };
function cartLineTotal(){ return cart.reduce((s,i)=>{ const p=productById(i.id); return p ? s + p.price*i.qty : s; },0); }

function renderCart(){
  const hasItems = cart.length>0;
  $("#cartLayout").style.display = hasItems ? "grid" : "none";
  $("#cartEmpty").hidden = hasItems;
  if(!hasItems) return;

  $("#cartItems").innerHTML = cart.map((item,idx)=>{
    const p = productById(item.id);
    if(!p) return "";
    return `
    <div class="cart-item">
      <img src="${p.image}" alt="${p.name}">
      <div>
        <p class="cart-item-name">${p.name}</p>
        <p class="cart-item-meta">Size: ${item.size||"M"} &nbsp;·&nbsp; Colour: <span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:${item.color||"#161513"};vertical-align:middle;"></span></p>
        <p class="cart-item-meta">${fmt(p.price)} each</p>
        <div class="cart-item-row">
          <div class="qty-mini">
            <button data-qty="dec" data-idx="${idx}">−</button>
            <span>${item.qty}</span>
            <button data-qty="inc" data-idx="${idx}">+</button>
          </div>
          <span>${fmt(p.price*item.qty)}</span>
          <button class="remove-link" data-remove="${idx}">Remove</button>
        </div>
      </div>
    </div>`;
  }).join("");

  const subtotal = cartLineTotal();
  const discount = appliedCoupon ? Math.round(subtotal*appliedCoupon) : 0;
  const delivery = subtotal - discount > 2999 || subtotal===0 ? 0 : 149;
  const total = subtotal - discount + delivery;

  $("#cartSubtotal").textContent = fmt(subtotal);
  $("#discountRow").hidden = !discount;
  $("#cartDiscount").textContent = "-"+fmt(discount);
  $("#cartDelivery").textContent = delivery===0 ? "Free" : fmt(delivery);
  $("#cartTotal").textContent = fmt(total);
}
$("#cartItems")?.addEventListener?.("click", ()=>{});
document.addEventListener("click", e=>{
  const dec = e.target.closest('[data-qty="dec"]'), inc = e.target.closest('[data-qty="inc"]'), rem = e.target.closest("[data-remove]");
  if(dec){ const i=Number(dec.dataset.idx); cart[i].qty=Math.max(1,cart[i].qty-1); persistCart(); renderCart(); }
  if(inc){ const i=Number(inc.dataset.idx); cart[i].qty+=1; persistCart(); renderCart(); }
  if(rem){ const i=Number(rem.dataset.remove); cart.splice(i,1); persistCart(); renderCart(); toast("Item removed"); }
});
$("#applyCoupon").addEventListener("click", ()=>{
  const code = $("#couponInput").value.trim().toUpperCase();
  if(COUPONS[code]){ appliedCoupon = COUPONS[code]; $("#couponMsg").textContent = `Coupon applied — ${COUPONS[code]*100}% off`; }
  else { appliedCoupon = null; $("#couponMsg").textContent = "Invalid coupon code"; $("#couponMsg").style.color = "var(--danger)"; }
  renderCart();
});
$("#checkoutBtn").addEventListener("click", ()=>{
  if(!cart.length){ toast("Your cart is empty"); return; }
  location.hash = "checkout"; navigate("checkout");
});

/* ---------------------------------------------------------
   13. CHECKOUT + ORDER PLACEMENT
--------------------------------------------------------- */
function renderCheckout(){
  if(!cart.length){ location.hash="cart"; navigate("cart"); return; }
  $("#custName").value = customer.name||"";
  $("#custEmail").value = customer.email||"";
  $("#custPhone").value = customer.phone||"";

  $("#checkoutItems").innerHTML = cart.map(item=>{
    const p = productById(item.id); if(!p) return "";
    return `<div class="row"><span>${p.name} × ${item.qty}</span><span>${fmt(p.price*item.qty)}</span></div>`;
  }).join("");
  const subtotal = cartLineTotal();
  const discount = appliedCoupon ? Math.round(subtotal*appliedCoupon) : 0;
  const delivery = subtotal - discount > 2999 ? 0 : 149;
  const total = subtotal - discount + delivery;
  $("#checkoutTotal").textContent = fmt(total);
  $("#checkoutForm").dataset.total = total;
}

$("#checkoutForm").addEventListener("submit", e=>{
  e.preventDefault();
  customer = { name:$("#custName").value, email:$("#custEmail").value, phone:$("#custPhone").value };
  persistCustomer();
  const payment = $('input[name="payment"]:checked').value;
  const order = {
    id: "NORRA-" + Math.floor(100000+Math.random()*900000),
    date: new Date().toISOString(),
    customer: {...customer},
    address: { line:$("#custAddress").value, city:$("#custCity").value, state:$("#custState").value, pincode:$("#custPincode").value },
    payment,
    items: cart.map(i=>{ const p=productById(i.id); return { id:i.id, name:p?.name, price:p?.price, qty:i.qty, size:i.size, color:i.color, image:p?.image }; }),
    total: Number($("#checkoutForm").dataset.total || cartLineTotal()),
    status: "Pending",
    estDelivery: new Date(Date.now()+5*86400000).toISOString()
  };
  orders.unshift(order);
  persistOrders();
  cart = []; persistCart(); appliedCoupon = null;
  renderSuccess(order);
  location.hash = "success";
  navigate("success");
});

function renderSuccess(order){
  $("#successBox").innerHTML = `
    <div class="check">✓</div>
    <h1>Order Placed Successfully!</h1>
    <p class="muted" style="margin:10px 0 24px;">Thank you, ${escapeHtml(order.customer.name)} — your NORRA order is confirmed.</p>
    <div style="text-align:left;">
      <div class="order-line"><span>Order ID</span><span>${order.id}</span></div>
      <div class="order-line"><span>Order date</span><span>${new Date(order.date).toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric"})}</span></div>
      <div class="order-line"><span>Estimated delivery</span><span>${new Date(order.estDelivery).toLocaleDateString("en-IN",{day:"numeric",month:"long"})}</span></div>
      <div class="order-line"><span>Items</span><span>${order.items.length}</span></div>
      <div class="order-line"><span>Total paid</span><span>${fmt(order.total)}</span></div>
    </div>
    <div class="hero-cta" style="justify-content:center;margin-top:26px;">
      <a href="#orders" class="btn btn-dark" data-nav="orders">View My Orders</a>
      <a href="#shop" class="btn btn-outline" data-nav="shop">Continue Shopping</a>
    </div>`;
}

/* ---------------------------------------------------------
   14. MY ORDERS
--------------------------------------------------------- */
function renderOrders(){
  $("#ordersEmpty").hidden = orders.length>0;
  $("#ordersList").innerHTML = orders.map(o=>`
    <div class="order-card">
      <div class="order-card-head">
        <div><strong>${o.id}</strong> <span class="muted"> · ${new Date(o.date).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}</span></div>
        <span class="status-chip ${o.status}">${o.status}</span>
      </div>
      <p class="muted">${o.items.map(i=>i.name+" × "+i.qty).join(", ")}</p>
      <div class="order-card-head" style="margin-top:8px;">
        <span class="muted">Payment: ${o.payment}</span>
        <strong>${fmt(o.total)}</strong>
      </div>
    </div>`).join("");
}

/* ---------------------------------------------------------
   15. CAMPAIGN + ANALYTICS PAGE
--------------------------------------------------------- */
function renderCampaign(){
  $("#platformCards").innerHTML = PLATFORMS.map(pl=>`
    <div class="platform-card">
      <h3><span class="plat-icon">${pl.icon}</span> ${pl.name}</h3>
      <dl>
        <div><dt>Objective</dt><dd>${pl.objective}</dd></div>
        <div><dt>Content Type</dt><dd>${pl.contentType}</dd></div>
        <div><dt>Target Audience</dt><dd>${pl.audience}</dd></div>
        <div><dt>Posting Strategy</dt><dd>${pl.posting}</dd></div>
        <div><dt>Hashtag Strategy</dt><dd>${pl.hashtags}</dd></div>
        <div><dt>Engagement Strategy</dt><dd>${pl.engagement}</dd></div>
      </dl>
      <div class="example-post">${pl.example}</div>
    </div>`).join("");

  const totals = Object.values(ANALYTICS).reduce((s,a)=>({
    reach:s.reach+a.reach, clicks:s.clicks+a.clicks, followers:s.followers+a.followers, sales:s.sales+a.sales
  }),{reach:0,clicks:0,followers:0,sales:0});
  const avgEngagement = (Object.values(ANALYTICS).reduce((s,a)=>s+a.engagement,0)/5).toFixed(1);
  const avgConversion = (Object.values(ANALYTICS).reduce((s,a)=>s+a.conversion,0)/5).toFixed(1);

  $("#kpiCards").innerHTML = `
    <div class="kpi-card"><div class="val">${(totals.reach/1000).toFixed(0)}K</div><div class="lbl">Total Reach</div></div>
    <div class="kpi-card"><div class="val">${(totals.clicks/1000).toFixed(1)}K</div><div class="lbl">Total Clicks</div></div>
    <div class="kpi-card"><div class="val">${(totals.followers/1000).toFixed(0)}K</div><div class="lbl">New Followers</div></div>
    <div class="kpi-card"><div class="val">${avgEngagement}%</div><div class="lbl">Avg Engagement</div></div>
    <div class="kpi-card"><div class="val">${avgConversion}%</div><div class="lbl">Avg Conversion</div></div>
    <div class="kpi-card"><div class="val">${fmt(totals.sales)}</div><div class="lbl">Sales Generated</div></div>`;

  drawBarChart("chartReach", PLATFORMS.map(p=>({label:p.name.slice(0,4), value:ANALYTICS[p.key].reach})), v=>(v/1000).toFixed(0)+"K");
  drawBarChart("chartEngagement", PLATFORMS.map(p=>({label:p.name.slice(0,4), value:ANALYTICS[p.key].engagement})), v=>v+"%");
  drawFunnel("chartFunnel", [
    {label:"Impressions", value: totals.reach*2.1},
    {label:"Clicks", value: totals.clicks},
    {label:"Conversions", value: totals.clicks*(avgConversion/100)}
  ]);
}

function drawBarChart(svgId, data, labelFn){
  const svg = document.getElementById(svgId);
  const w=320,h=200,padB=28,padT=10,barGap=10;
  const max = Math.max(...data.map(d=>d.value)) || 1;
  const barW = (w - (data.length+1)*barGap)/data.length;
  let bars = "";
  data.forEach((d,i)=>{
    const bh = ((h-padB-padT) * d.value)/max;
    const x = barGap + i*(barW+barGap);
    const y = h-padB-bh;
    bars += `<rect x="${x}" y="${y}" width="${barW}" height="${bh}" rx="2" fill="${i%2===0?'#A9834C':'#161513'}"></rect>`;
    bars += `<text x="${x+barW/2}" y="${h-padB+14}" font-size="9" text-anchor="middle" fill="#4A473F">${d.label}</text>`;
    bars += `<text x="${x+barW/2}" y="${y-5}" font-size="9" text-anchor="middle" fill="#161513">${labelFn(d.value)}</text>`;
  });
  svg.innerHTML = bars;
}
function drawFunnel(svgId, data){
  const svg = document.getElementById(svgId);
  const w=320,h=200;
  const max = data[0].value || 1;
  let out = "";
  data.forEach((d,i)=>{
    const ratio = d.value/max;
    const barW = Math.max(40, ratio*260);
    const x = (w-barW)/2;
    const y = 14 + i*62;
    out += `<rect x="${x}" y="${y}" width="${barW}" height="42" rx="2" fill="${['#161513','#A9834C','#D8C6A6'][i]}"></rect>`;
    out += `<text x="${w/2}" y="${y+26}" font-size="10" text-anchor="middle" fill="${i===2?'#161513':'#fff'}">${d.label}: ${Math.round(d.value).toLocaleString('en-IN')}</text>`;
  });
  svg.innerHTML = out;
}

/* ---------------------------------------------------------
   16. ADMIN LOGIN + DASHBOARD
--------------------------------------------------------- */
$("#adminLoginForm").addEventListener("submit", e=>{
  e.preventDefault();
  const u = $("#adminUser").value.trim(), p = $("#adminPass").value.trim();
  if(u==="admin" && p==="norra123"){
    LS.set(KEYS.admin, true);
    $("#adminLoginError").textContent = "";
    location.hash = "admin"; navigate("admin");
    toast("Welcome back, admin");
  } else {
    $("#adminLoginError").textContent = "Invalid demo credentials. Try admin / norra123.";
  }
});
$("#adminLogout").addEventListener("click", ()=>{
  LS.set(KEYS.admin, false);
  location.hash = "admin-login"; navigate("admin-login");
});

let adminTab = "dashboard";
document.addEventListener("click", e=>{
  const tabBtn = e.target.closest("[data-admin-tab]");
  if(tabBtn){
    adminTab = tabBtn.dataset.adminTab;
    $$("#adminSidebar button[data-admin-tab]").forEach(b=>b.classList.toggle("active", b===tabBtn));
    renderAdminContent();
  }
});

function renderAdmin(){
  $$("#adminSidebar button[data-admin-tab]").forEach(b=>b.classList.toggle("active", b.dataset.adminTab===adminTab));
  renderAdminContent();
}

function renderAdminContent(){
  const root = $("#adminContent");
  const totalSales = orders.reduce((s,o)=>s+o.total,0);
  const avgRating = (PRODUCTS.reduce((s,p)=>s+p.rating,0)/PRODUCTS.length).toFixed(1);

  if(adminTab === "dashboard"){
    root.innerHTML = `
      <h2>Dashboard</h2>
      <div class="admin-cards">
        <div class="admin-card"><div class="val">${fmt(totalSales)}</div><div class="lbl">Total Sales</div></div>
        <div class="admin-card"><div class="val">${orders.length}</div><div class="lbl">Total Orders</div></div>
        <div class="admin-card"><div class="val">${new Set(orders.map(o=>o.customer.email)).size}</div><div class="lbl">Total Customers</div></div>
        <div class="admin-card"><div class="val">${PRODUCTS.length}</div><div class="lbl">Total Products</div></div>
        <div class="admin-card"><div class="val">${favs.length}</div><div class="lbl">Favourite Products</div></div>
        <div class="admin-card"><div class="val">${avgRating}</div><div class="lbl">Average Rating</div></div>
      </div>
      <div class="chart-card">
        <h3>Sales Overview (demo)</h3>
        <svg viewBox="0 0 320 200" id="adminSalesChart" class="bar-chart"></svg>
      </div>`;
    drawBarChart("adminSalesChart",
      ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d=>({label:d, value: 5000+Math.round(Math.random()*15000)})),
      v=>fmt(v));
  }

  if(adminTab === "products"){
    root.innerHTML = `
      <div class="admin-section-head"><h2>Products</h2><button class="admin-btn" id="addProductBtn">+ Add Product</button></div>
      <div class="table-scroll"><table class="admin-table">
        <thead><tr><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>${PRODUCTS.map(p=>`
          <tr>
            <td>${p.name}</td><td>${p.category}</td><td>${fmt(p.price)}</td>
            <td>${p.stock}</td>
            <td>${p.stock>0?"In Stock":"Out of Stock"}</td>
            <td><button class="admin-btn outline" data-edit-product="${p.id}">Edit</button>
                <button class="admin-btn danger" data-delete-product="${p.id}">Delete</button></td>
          </tr>`).join("")}</tbody>
      </table></div>`;
  }

  if(adminTab === "orders"){
    root.innerHTML = `
      <h2>Orders</h2>
      <div class="table-scroll"><table class="admin-table">
        <thead><tr><th>Order ID</th><th>Customer</th><th>Products</th><th>Total</th><th>Status</th></tr></thead>
        <tbody>${orders.length ? orders.map(o=>`
          <tr>
            <td>${o.id}</td><td>${escapeHtml(o.customer.name||"—")}</td>
            <td>${o.items.length} item(s)</td><td>${fmt(o.total)}</td>
            <td><select class="status-select" data-order-status="${o.id}">
              ${["Pending","Confirmed","Packed","Shipped","Delivered","Cancelled"].map(s=>`<option ${s===o.status?"selected":""}>${s}</option>`).join("")}
            </select></td>
          </tr>`).join("") : `<tr><td colspan="5">No orders yet.</td></tr>`}</tbody>
      </table></div>`;
  }

  if(adminTab === "customers"){
    const map = {};
    orders.forEach(o=>{ const key=o.customer.email||"guest"; map[key] = map[key] || {...o.customer, orders:0, spent:0}; map[key].orders++; map[key].spent+=o.total; });
    const rows = Object.values(map);
    root.innerHTML = `
      <h2>Customers</h2>
      <div class="table-scroll"><table class="admin-table">
        <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Orders</th><th>Spent</th></tr></thead>
        <tbody>${rows.length?rows.map(c=>`<tr><td>${escapeHtml(c.name||"—")}</td><td>${escapeHtml(c.email||"—")}</td><td>${escapeHtml(c.phone||"—")}</td><td>${c.orders}</td><td>${fmt(c.spent)}</td></tr>`).join(""):`<tr><td colspan="5">No customers yet.</td></tr>`}</tbody>
      </table></div>`;
  }

  if(adminTab === "reviews"){
    const rows = [];
    Object.entries(reviews).forEach(([pid,list])=> list.forEach(r=> rows.push({...r,pid})));
    root.innerHTML = `
      <h2>Reviews</h2>
      <div class="table-scroll"><table class="admin-table">
        <thead><tr><th>Product</th><th>Name</th><th>Rating</th><th>Review</th><th>Actions</th></tr></thead>
        <tbody>${rows.map(r=>`
          <tr>
            <td>${productById(r.pid)?.name||"—"}</td><td>${escapeHtml(r.name)}</td><td>${"★".repeat(r.rating)}</td>
            <td style="max-width:220px;white-space:normal;">${escapeHtml(r.text)}</td>
            <td><button class="admin-btn danger" data-delete-review="${r.pid}|${r.id}">Delete</button></td>
          </tr>`).join("")}</tbody>
      </table></div>`;
  }

  if(adminTab === "favourites"){
    const items = favs.map(productById).filter(Boolean);
    root.innerHTML = `<h2>Favourited Products</h2>
      <div class="table-scroll"><table class="admin-table">
        <thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Rating</th></tr></thead>
        <tbody>${items.length?items.map(p=>`<tr><td>${p.name}</td><td>${p.category}</td><td>${fmt(p.price)}</td><td>★ ${p.rating}</td></tr>`).join(""):`<tr><td colspan="4">No favourites yet.</td></tr>`}</tbody>
      </table></div>`;
  }

  if(adminTab === "campaigns"){
    root.innerHTML = `<h2>Campaign Management</h2>
      <div class="table-scroll"><table class="admin-table">
        <thead><tr><th>Platform</th><th>Campaign</th><th>Reach</th><th>Engagement</th><th>Clicks</th><th>Conversion</th></tr></thead>
        <tbody>${PLATFORMS.map(pl=>{const a=ANALYTICS[pl.key]; return `
          <tr><td>${pl.icon} ${pl.name}</td><td>NORRA New Season</td><td>${a.reach.toLocaleString('en-IN')}</td><td>${a.engagement}%</td><td>${a.clicks.toLocaleString('en-IN')}</td><td>${a.conversion}%</td></tr>`}).join("")}</tbody>
      </table></div>`;
  }

  if(adminTab === "analytics"){
    root.innerHTML = `<h2>Platform Analytics</h2>
      <div class="chart-card"><h3>Reach by Platform</h3><svg viewBox="0 0 320 200" id="adminReachChart" class="bar-chart"></svg></div>
      <div class="chart-card" style="margin-top:16px;"><h3>Sales Generated by Platform</h3><svg viewBox="0 0 320 200" id="adminSalesByPlatform" class="bar-chart"></svg></div>`;
    drawBarChart("adminReachChart", PLATFORMS.map(p=>({label:p.name.slice(0,4), value:ANALYTICS[p.key].reach})), v=>(v/1000).toFixed(0)+"K");
    drawBarChart("adminSalesByPlatform", PLATFORMS.map(p=>({label:p.name.slice(0,4), value:ANALYTICS[p.key].sales})), v=>"₹"+(v/1000).toFixed(0)+"K");
  }

  if(adminTab === "settings"){
    root.innerHTML = `<h2>Settings</h2>
      <p class="muted" style="max-width:60ch;">This is a static, frontend-only academic project. Admin data (products, orders, reviews) is stored in this browser's <code>localStorage</code> — it is not a secure, real-world admin system and has no server-side authentication.</p>
      <button class="admin-btn danger" id="resetDataBtn" style="margin-top:16px;">Reset all demo data</button>`;
  }
}

document.addEventListener("click", async e=>{
  const del = e.target.closest("[data-delete-product]");
  if(del){
    if(await confirmDialog("Delete this product? This cannot be undone.")){
      saveProductOverride(del.dataset.deleteProduct, {status:"deleted"});
      PRODUCTS = loadProducts();
      renderAdminContent();
      toast("Product deleted");
    }
  }
  const edit = e.target.closest("[data-edit-product]");
  if(edit){
    const p = productById(edit.dataset.editProduct);
    const newPrice = prompt(`New price for "${p.name}"`, p.price);
    if(newPrice && !isNaN(newPrice)){
      saveProductOverride(p.id, {price:Number(newPrice)});
      PRODUCTS = loadProducts();
      renderAdminContent();
      toast("Product updated");
    }
  }
  const addP = e.target.closest("#addProductBtn");
  if(addP){
    const name = prompt("New product name:");
    if(name){
      const id = uid("pnew");
      saveProductOverride(id, {
        id, name, category:"Tops", gender:"Unisex", price:1999, oldPrice:null, rating:4.5, reviewCount:0,
        tag:"new", image:`https://picsum.photos/seed/${id}/600/800`, off:0,
        description:"Newly added product.", stock:10, isNew:true, status:"active"
      });
      PRODUCTS = loadProducts();
      renderAdminContent();
      toast("Product added");
    }
  }
  const delRev = e.target.closest("[data-delete-review]");
  if(delRev){
    const [pid, rid] = delRev.dataset.deleteReview.split("|");
    if(await confirmDialog("Delete this review?")){
      reviews[pid] = (reviews[pid]||[]).filter(r=>r.id!==rid);
      persistReviews();
      renderAdminContent();
      toast("Review deleted");
    }
  }
  const resetBtn = e.target.closest("#resetDataBtn");
  if(resetBtn){
    if(await confirmDialog("Reset ALL demo data (cart, orders, favourites, reviews, products)?")){
      Object.values(KEYS).forEach(k=> localStorage.removeItem(k));
      toast("Demo data reset — reloading...");
      setTimeout(()=> location.reload(), 800);
    }
  }
});
document.addEventListener("change", e=>{
  const sel = e.target.closest("[data-order-status]");
  if(sel){
    const order = orders.find(o=>o.id===sel.dataset.orderStatus);
    if(order){ order.status = sel.value; persistOrders(); toast("Order status updated"); }
  }
});

/* ---------------------------------------------------------
   17. ACCOUNT PAGE
--------------------------------------------------------- */
function renderAccount(){
  $("#accName").value = customer.name||"";
  $("#accEmail").value = customer.email||"";
  $("#accPhone").value = customer.phone||"";
  $("#accOrdersCount").textContent = orders.length;
  $("#accFavCount").textContent = favs.length;
  const myReviewCount = Object.values(reviews).flat().length;
  $("#accReviewsCount").textContent = myReviewCount;
}
$("#accountForm").addEventListener("submit", e=>{
  e.preventDefault();
  customer = { name:$("#accName").value, email:$("#accEmail").value, phone:$("#accPhone").value };
  persistCustomer();
  toast("Profile saved");
});

/* ---------------------------------------------------------
   18. CONTACT PAGE
--------------------------------------------------------- */
$("#contactForm").addEventListener("submit", e=>{
  e.preventDefault();
  const list = LS.get(KEYS.contacts, []);
  list.push({ name:$("#contactName").value, email:$("#contactEmail").value, message:$("#contactMessage").value, date:new Date().toISOString() });
  LS.set(KEYS.contacts, list);
  $("#contactSuccess").hidden = false;
  e.target.reset();
  toast("Message sent");
});

/* ---------------------------------------------------------
   19. INIT
--------------------------------------------------------- */
updateBadges();
const {page:initPage, params:initParams} = parseHash();
navigate(initPage, initParams.get("id") ? {id:initParams.get("id")} : {});

})();
