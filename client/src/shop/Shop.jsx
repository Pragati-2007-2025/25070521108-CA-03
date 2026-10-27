import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Headphones3D from './Headphones3D.jsx';
import useScrollReveal from '../hooks/useScrollReveal.js';
import { categories, products } from './products.js';
import './store-base.css';
import './store-hero.css';
import './store-catalog.css';
import './store-overlays.css';
import './store-noir.css';

const HeroHeadphones3D = lazy(() => import('./HeroHeadphones3D.jsx'));

const money = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
const CART_STORAGE_KEY = 'nexoraCart';
const FAVORITES_STORAGE_KEY = 'nexoraFavorites';
const MAX_QUANTITY = 20;

function readSessionList(key) {
  try {
    const value = JSON.parse(sessionStorage.getItem(key) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function Icon({ name, size = 19 }) {
  const paths = {
    search: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5" /></>,
    bag: <><path d="M5 8h14l1 13H4L5 8Z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></>,
    user: <><circle cx="12" cy="8" r="3.4" /><path d="M5 20c.7-3.3 3.2-5 7-5s6.3 1.7 7 5" /></>,
    close: <><path d="m6 6 12 12M18 6 6 18" /></>,
    arrow: <><path d="M5 12h14M13 5l7 7-7 7" /></>,
    heart: <path d="M20.8 8.6c0 4.2-8.8 10-8.8 10s-8.8-5.8-8.8-10A4.6 4.6 0 0 1 12 6.4a4.6 4.6 0 0 1 8.8 2.2Z" />,
    menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    minus: <path d="M5 12h14" />,
    chevron: <path d="m7 10 5 5 5-5" />,
    sparkle: <><path d="m12 3 1.5 6.5L20 12l-6.5 1.5L12 20l-1.5-6.5L4 12l6.5-2.5L12 3Z" /><path d="m19 3 .6 2.4L22 6l-2.4.6L19 9l-.6-2.4L16 6l2.4-.6L19 3Z" /></>,
  };
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

function ProductCard({ product, onOpen, onAdd, onFavorite, favorite }) {
  function tilt(event) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    event.currentTarget.style.setProperty('--card-rx', `${y * -7}deg`);
    event.currentTarget.style.setProperty('--card-ry', `${x * 9}deg`);
  }

  function reset(event) {
    event.currentTarget.style.setProperty('--card-rx', '0deg');
    event.currentTarget.style.setProperty('--card-ry', '0deg');
  }

  return (
    <article className="product-card" onClick={() => onOpen(product)} onPointerMove={tilt} onPointerLeave={reset}>
      <div className={`product-art tone-${product.tone}`}>
        <img src={product.image} alt={product.name} loading="lazy" />
        <span className="product-shine" aria-hidden="true" />
        <span className="product-label">{product.label}</span>
        <button className={`favorite-button ${favorite ? 'is-favorite' : ''}`} onClick={(event) => { event.stopPropagation(); onFavorite(product.id); }} aria-label={favorite ? 'Remove from saved pieces' : 'Save this piece'}><Icon name="heart" size={17} /></button>
        <button className="quick-add" onClick={(event) => { event.stopPropagation(); onAdd(product); }}>QUICK ADD <span>+</span></button>
      </div>
      <div className="product-info">
        <div className="product-kicker"><span>{product.category}</span><span className="rating">★ {product.rating} <i>({product.reviews})</i></span></div>
        <h3>{product.name}</h3>
        <p>{product.detail}</p>
        <div className="product-price"><strong>{money(product.price)}</strong>{product.oldPrice && <del>{money(product.oldPrice)}</del>}</div>
      </div>
    </article>
  );
}

function DimensionalProduct({ product, index, onOpen }) {
  function tilt(event) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    event.currentTarget.style.setProperty('--tilt-x', `${y * -18}deg`);
    event.currentTarget.style.setProperty('--tilt-y', `${x * 24}deg`);
  }

  function reset(event) {
    event.currentTarget.style.setProperty('--tilt-x', '0deg');
    event.currentTarget.style.setProperty('--tilt-y', '0deg');
  }

  return (
    <article className="dimension-card">
      <button className={`dimension-model tone-${product.tone}`} style={{ '--model-index': index }} onPointerMove={tilt} onPointerLeave={reset} onClick={() => onOpen(product)} aria-label={`Explore ${product.name}`}>
        <span className="dimension-aura" />
        <span className="dimension-orbit" />
        <img src={product.image} alt="" loading="lazy" />
        <span className="dimension-model-label">MOVE TO EXPLORE · 3D</span>
        <span className="dimension-model-arrow">↗</span>
      </button>
      <div className="dimension-copy"><span>{product.category} · INTERACTIVE OBJECT 0{index + 1}</span><h3>{product.name}</h3><p>{product.detail}</p><strong>{money(product.price)}</strong></div>
    </article>
  );
}
export default function Shop() {
  const navigate = useNavigate();
  const location = useLocation();
  const productId = location.pathname.startsWith('/product/') ? decodeURIComponent(location.pathname.slice('/product/'.length)) : '';
  const isDealsPage = location.pathname === '/deals';
  const isMainStorefront = location.pathname === '/' || location.pathname === '/shop';
  const isAuthenticated = Boolean(sessionStorage.getItem('nexoraToken') && sessionStorage.getItem('nexoraToken') !== 'undefined');
  const [authPrompt, setAuthPrompt] = useState('');
  const [user, setUser] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('nexoraUser') || 'null'); } catch { return null; }
  });
  const category = location.pathname.startsWith('/category/')
    ? categories.find((item) => item.toLowerCase().replace(/\s+/g, '-') === decodeURIComponent(location.pathname.slice('/category/'.length))) || 'All pieces'
    : 'All pieces';
  const [sort, setSort] = useState('featured');

  const [search, setSearch] = useState(() => new URLSearchParams(location.search).get('q') || '');
  const [recentlyViewedIds, setRecentlyViewedIds] = useState(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem('nexoraRecentItems') || '[]');
      return Array.isArray(saved) ? saved.filter((id) => products.some((product) => product.id === id)).slice(0, 4) : [];
    } catch { return []; }
  });
  const recentlyViewedProducts = recentlyViewedIds.map((id) => products.find((product) => product.id === id)).filter(Boolean);  const [activeMenu, setActiveMenu] = useState('');
  const [accountOpen, setAccountOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [placingOrder, setPlacingOrder] = useState(false);
  const [cart, setCart] = useState(() => readSessionList(CART_STORAGE_KEY).map((entry) => {
    const product = products.find((item) => item.id === entry?.productId);
    const quantity = Number(entry?.quantity);
    return product && Number.isInteger(quantity) && quantity > 0 ? { product, quantity: Math.min(quantity, MAX_QUANTITY) } : null;
  }).filter(Boolean));
  const activeProduct = productId ? products.find((item) => item.id === productId) || null : null;
  const [favorites, setFavorites] = useState(() => readSessionList(FAVORITES_STORAGE_KEY).filter((id) => products.some((product) => product.id === id)));
  const [toast, setToast] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [galleryView, setGalleryView] = useState(0);
  const [finish, setFinish] = useState('midnight');
  const searchInputRef = useRef(null);
  const heroRef = useRef(null);

  useScrollReveal();

  useEffect(() => {
    if (!searchOpen) return undefined;
    const timeout = window.setTimeout(() => searchInputRef.current?.focus(), 40);
    return () => window.clearTimeout(timeout);
  }, [searchOpen]);

  function handleHeroPointer(event) {
    const hero = heroRef.current;
    if (!hero) return;
    const bounds = hero.getBoundingClientRect();
    hero.style.setProperty('--hero-px', `${((event.clientX - bounds.left) / bounds.width) * 100}%`);
    hero.style.setProperty('--hero-py', `${((event.clientY - bounds.top) / bounds.height) * 100}%`);
  }

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = window.setTimeout(() => setToast(''), 2600);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    try {
      sessionStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart.map(({ product, quantity }) => ({ productId: product.id, quantity }))));
    } catch { /* The bag remains in memory when storage is unavailable. */ }
  }, [cart]);

  useEffect(() => {
    try {
      sessionStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
    } catch { /* Saved pieces remain in memory when storage is unavailable. */ }
  }, [favorites]);

  useEffect(() => {
    function handleKeyDown(event) {
      const activeTag = document.activeElement?.tagName;
      const typing = activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeTag === 'SELECT';
      if (event.key === '/' && !typing) {
        event.preventDefault();
        setSearchOpen(true);
        return;
      }
      if (event.key !== 'Escape') return;
      if (searchOpen) { setSearchOpen(false); return; }
      if (activeProduct) { navigate('/shop'); return; }
      if (checkoutOpen) { setCheckoutOpen(false); return; }
      if (cartOpen) { setCartOpen(false); return; }
      if (authPrompt) { setAuthPrompt(''); return; }
      if (accountOpen) { setAccountOpen(false); return; }
      if (mobileOpen) { setMobileOpen(false); return; }
      if (activeMenu) setActiveMenu('');
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [accountOpen, activeMenu, activeProduct, authPrompt, cartOpen, checkoutOpen, mobileOpen, navigate, searchOpen]);

  const shownProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    let result = products.filter((product) => (category === 'All pieces' || product.category === category)
      && (!isDealsPage || Boolean(product.oldPrice))
      && (!query || `${product.name} ${product.category} ${product.detail}`.toLowerCase().includes(query)));
    if (sort === 'price-low') result = [...result].sort((a, b) => a.price - b.price);
    if (sort === 'price-high') result = [...result].sort((a, b) => b.price - a.price);
    if (sort === 'top-rated') result = [...result].sort((a, b) => Number(b.rating) - Number(a.rating));
    return result;
  }, [category, isDealsPage, search, sort]);

  const searchPreview = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return [];
    return products
      .filter((product) => `${product.name} ${product.category} ${product.detail}`.toLowerCase().includes(query))
      .slice(0, 4);
  }, [search]);

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = cart.reduce((total, item) => total + item.product.price * item.quantity, 0);

  function requireSignIn(feature) {
    if (isAuthenticated) return true;
    setAuthPrompt(feature);
    return false;
  }

  function addToCart(product) {
    if (!requireSignIn('adding items to your bag')) return false;
    const existing = cart.find((item) => item.product.id === product.id);
    if (existing && existing.quantity >= MAX_QUANTITY) {
      setToast(`You can add up to ${MAX_QUANTITY} of each piece.`);
      return false;
    }
    setCart((items) => {
      const found = items.find((item) => item.product.id === product.id);
      return found
        ? items.map((item) => item.product.id === product.id ? { ...item, quantity: Math.min(MAX_QUANTITY, item.quantity + 1) } : item)
        : [...items, { product, quantity: 1 }];
    });
    setToast(product.name + ' added to your bag');
    return true;
  }

  function changeQuantity(productId, amount) {
    setCart((items) => items.map((item) => item.product.id === productId ? { ...item, quantity: Math.min(MAX_QUANTITY, item.quantity + amount) } : item).filter((item) => item.quantity > 0));
  }

  async function placeOrder(event) {
    event.preventDefault(); setCheckoutError(''); setPlacingOrder(true);
    try {
      const response = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + sessionStorage.getItem('nexoraToken') }, body: JSON.stringify({ customer: { name: event.currentTarget.name.value, phone: event.currentTarget.phone.value, address: event.currentTarget.address.value }, items: cart.map(({ product, quantity }) => ({ productId: product.id, quantity })) }) });
      const result = await response.json(); if (!response.ok) throw new Error(result.message || 'Could not place your order.');
      setCart([]); setCheckoutOpen(false); setCartOpen(false); setToast('Order ' + result.orderId.slice(-8) + ' placed - Cash on delivery');
    } catch (error) { setCheckoutError(error.message); } finally { setPlacingOrder(false); }
  }

  function signOut() {
    sessionStorage.removeItem('nexoraToken');
    sessionStorage.removeItem('nexoraUser');
    sessionStorage.removeItem(CART_STORAGE_KEY);
    sessionStorage.removeItem(FAVORITES_STORAGE_KEY);
    sessionStorage.removeItem('nexoraRecentItems');
    setCart([]);
    setFavorites([]);
    setRecentlyViewedIds([]);
    setUser(null);
    navigate('/login', { replace: true });
  }

  function chooseCategory(nextCategory) {
    setSearch('');
    setActiveMenu('');
    setMobileOpen(false);
    const slug = nextCategory.toLowerCase().replace(/\s+/g, '-');
    navigate(nextCategory === 'All pieces' ? '/shop' : '/category/' + slug);
    window.setTimeout(() => document.getElementById('collection')?.scrollIntoView({ behavior: 'smooth' }), 0);
  }

  function submitSearch(event) {
    event.preventDefault();
    const query = search.trim();
    navigate(query ? '/search?q=' + encodeURIComponent(query) : '/shop');
    window.setTimeout(() => document.getElementById('collection')?.scrollIntoView({ behavior: 'smooth' }), 0);
  }

  function openProduct(product) {
    setGalleryView(0);
    setFinish('midnight');
    const nextItems = [product.id, ...recentlyViewedIds.filter((id) => id !== product.id)].slice(0, 4);
    setRecentlyViewedIds(nextItems);
    try { sessionStorage.setItem('nexoraRecentItems', JSON.stringify(nextItems)); } catch { /* Recent items remain available for this page session. */ }
    navigate('/product/' + product.id);
  }

  function closeProduct() {
    if (location.pathname.startsWith('/product/')) navigate('/shop');
  }
  if (location.pathname === '/about') {
    return (
      <main className="store-page about-page">
        <div className="announcement"><span className="announce-sparkle">✳</span> OBJECTS FOR THE NEXT ERA <span className="announce-link" onClick={() => navigate('/shop')}>BACK TO THE SHOWROOM <b>↗</b></span></div>
        <header className="store-header"><a className="store-brand" href="/" onClick={(event) => { event.preventDefault(); navigate('/'); }}><span className="store-brand-mark">N</span>NEXORA<span className="brand-dot">.</span></a><button className="nav-trigger" onClick={() => navigate('/shop')}>Back to the collection ↗</button></header>
        <section className="about-hero" data-reveal><span className="eyebrow">OUR POINT OF VIEW · 01</span><h1>Technology should feel like <em>possibility.</em></h1><p>Not more noise. Not more to figure out. Thoughtfully chosen technology that makes ordinary days feel a little more yours.</p><button className="dark-button" onClick={() => navigate('/shop')}>Explore the collection <Icon name="arrow" size={17} /></button></section>
        <section className="about-values" data-reveal><article><span>01 / CURATION</span><h2>Less, but considered.</h2><p>Discover useful, well-designed technology across audio, mobile, computing, home, gaming, and everyday accessories.</p></article><article><span>02 / EXPERIENCE</span><h2>Good tech, with room to breathe.</h2><p>Clear product information, thoughtful discovery, and a storefront designed to make finding your next favorite feel easy.</p></article><article><span>03 / NEXORA</span><h2>Objects for the next era.</h2><p>NEXORA is a college full-stack project exploring a more human way to discover everyday technology.</p></article></section>
        <footer className="store-footer"><a className="store-brand" href="/" onClick={(event) => { event.preventDefault(); navigate('/'); }}><span className="store-brand-mark">N</span>NEXORA<span className="brand-dot">.</span></a><span>OBJECTS FOR THE NEXT ERA.</span><span>© 2026 NEXORA · A PROJECT PREVIEW</span></footer>
      </main>
    );
  }
  return (
    <main className="store-page" onClick={() => { if (activeMenu) setActiveMenu(''); }}>
      <div className="announcement"><span className="announce-sparkle">✳</span> COMPLIMENTARY DELIVERY ON ORDERS OVER ₹10,000 <span className="announce-link" onClick={() => { document.getElementById('collection')?.scrollIntoView({ behavior: 'smooth' }); }}>DISCOVER THE EDIT <b>↗</b></span></div>
      <header className="store-header">
        <button className="mobile-menu icon-button" onClick={(event) => { event.stopPropagation(); setMobileOpen(!mobileOpen); }} aria-label="Toggle menu"><Icon name={mobileOpen ? 'close' : 'menu'} /></button>
        <a className="store-brand" href="#top" onClick={(event) => { event.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}><span className="store-brand-mark">N</span>NEXORA<span className="brand-dot">.</span></a>
        <nav className={`store-nav ${mobileOpen ? 'mobile-open' : ''}`} onClick={(event) => event.stopPropagation()}>
          <button className={activeMenu === 'shop' ? 'nav-trigger active' : 'nav-trigger'} onClick={() => { setActiveMenu(activeMenu === 'shop' ? '' : 'shop'); }}>Shop <Icon name="chevron" size={14} /></button>
          <button className={activeMenu === 'forYou' ? 'nav-trigger active' : 'nav-trigger'} onClick={() => { setActiveMenu(activeMenu === 'forYou' ? '' : 'forYou'); }}>For you <Icon name="chevron" size={14} /></button>
          <button className={activeMenu === 'discover' ? 'nav-trigger active' : 'nav-trigger'} onClick={() => { setActiveMenu(activeMenu === 'discover' ? '' : 'discover'); }}>Discover <Icon name="chevron" size={14} /></button>
          <button className="nav-trigger" onClick={() => { navigate('/shop'); document.getElementById('collection')?.scrollIntoView({ behavior: 'smooth' }); setMobileOpen(false); }}>The edit</button>
          <button className="nav-trigger" onClick={() => { navigate('/about'); }}>Our point of view</button>
          {activeMenu && <div className={`mega-menu ${activeMenu === 'forYou' ? 'for-you-menu' : ''}`}>
            {activeMenu === 'forYou' ? <>
              <div className="mega-intro"><span className="eyebrow">YOUR NEXORA SHORTCUTS</span><h3>Pick up where<br />you left off.</h3><p>Your recent finds, your bag, and a few thoughtful recommendations.</p><button onClick={() => { setActiveMenu(''); setSearch(''); navigate('/shop'); }}>Explore the storefront <Icon name="arrow" size={16} /></button></div>
              <div className="for-you-history"><span className="eyebrow">PREVIOUS ITEMS</span>{recentlyViewedProducts.length ? recentlyViewedProducts.map((product) => <button className="recent-item" key={product.id} onClick={() => { setActiveMenu(''); openProduct(product); }}><img src={product.image} alt="" /><span><strong>{product.name}</strong><small>{product.category} · {money(product.price)}</small></span><Icon name="arrow" size={14} /></button>) : <div className="recent-empty"><span className="recent-empty-mark">↗</span><strong>Your next favorite starts here.</strong><small>Open any piece and it will appear in this list.</small></div>}</div>
              <div className="for-you-actions"><button className="shortcut-card shortcut-bag" onClick={() => { setActiveMenu(''); if (requireSignIn('opening your bag')) setCartOpen(true); }}><span className="shortcut-icon"><Icon name="bag" size={18} /></span><span><small>YOUR CART</small><strong>{cartCount} {cartCount === 1 ? 'item' : 'items'} in your bag</strong></span><Icon name="arrow" size={15} /></button><button className="shortcut-card shortcut-recommendations" onClick={() => { setActiveMenu(''); setSearch(''); setSort('top-rated'); navigate('/shop'); window.setTimeout(() => document.getElementById('collection')?.scrollIntoView({ behavior: 'smooth' }), 0); }}><span className="shortcut-icon"><Icon name="sparkle" size={18} /></span><span><small>RECOMMENDATIONS</small><strong>Shop what people love</strong></span><Icon name="arrow" size={15} /></button><div className="shortcut-note">CURATED FOR GOOD DAYS <span>✦</span></div></div>
            </> : activeMenu === 'shop' ? <>
              <div className="mega-intro"><span className="eyebrow">THE NEXORA COLLECTION</span><h3>Find your<br />next favorite.</h3><p>Thoughtful technology, considered for every day.</p><button onClick={() => chooseCategory('All pieces')}>Shop all pieces <Icon name="arrow" size={16} /></button></div>
              <div className="mega-categories">{categories.slice(1).map((item, index) => <button key={item} onClick={() => chooseCategory(item)}><span className="mega-index">0{index + 1}</span><span>{item}</span><Icon name="arrow" size={15} /></button>)}</div>
              <div className="mega-feature" style={{ backgroundImage: `linear-gradient(0deg,#10231fdd,transparent 75%),url(${products[0].image})` }}><span>THE LISTENING ROOM</span><strong>Sound that<br />stays with you.</strong><button onClick={() => { chooseCategory('Audio'); }}>Explore audio ↗</button></div>
            </> : <>
              <div className="mega-intro"><span className="eyebrow">A LITTLE INSPIRATION</span><h3>Make room<br />for wonder.</h3><p>Stories and selections from the NEXORA team.</p></div>
              <div className="discover-links"><button onClick={() => chooseCategory('All pieces')}><span>01</span><strong>Just arrived</strong><small>The latest additions to our world</small><Icon name="arrow" size={16} /></button><button onClick={() => { chooseCategory('All pieces'); setSort('top-rated'); }}><span>02</span><strong>Most loved</strong><small>Customer favorites, all in one place</small><Icon name="arrow" size={16} /></button><button onClick={() => { setActiveMenu(''); setSearch('audio'); navigate('/search?q=audio'); }}><span>03</span><strong>The listening edit</strong><small>For the moments in between</small><Icon name="arrow" size={16} /></button></div>
              <div className="mega-note"><Icon name="sparkle" size={22} /><span>Less noise. More of what matters.</span></div>
            </>}
          </div>}
        </nav>
        <div className="header-actions">
          <button className="icon-button" aria-label="Search pieces" aria-expanded={searchOpen} onClick={() => { setAccountOpen(false); setMobileOpen(false); setSearchOpen(true); }}><Icon name="search" /></button>
          <div className="account-wrap">
            <button className="icon-button account-button" aria-label="Account menu" onClick={() => { if (!requireSignIn('opening your account')) return; setAccountOpen(!accountOpen); }}><Icon name="user" /></button>
            {accountOpen && <div className="account-menu"><span className="eyebrow">YOUR NEXORA ACCOUNT</span><strong>{user?.name || 'NEXORA member'}</strong><small>{user?.email}</small><button onClick={signOut}>Sign out <Icon name="arrow" size={14} /></button></div>}
          </div>
          <button className="icon-button bag-action" aria-label={`Shopping bag, ${cartCount} items`} onClick={() => { if (requireSignIn('opening your bag')) setCartOpen(true); }}><Icon name="bag" />{cartCount > 0 && <span className="bag-count">{cartCount}</span>}</button>
        </div>

      </header>

      <section className="hero" id="top" ref={heroRef} onPointerMove={handleHeroPointer}>
        <div className="hero-copy">
          <span className="hero-overline"><span /> NEXORA · OBJECTS FOR THE NEXT ERA</span>
          <h1>SHOP BEYOND<br />THE <em>ORDINARY.</em></h1>
          <p>Objects for the next era.</p>
          <div className="hero-actions"><button className="dark-button" onClick={() => { document.getElementById('collection')?.scrollIntoView({ behavior: 'smooth' }); }}>ENTER THE SHOWROOM <Icon name="arrow" size={17} /></button><button className="text-button" onClick={() => { document.getElementById('collections')?.scrollIntoView({ behavior: 'smooth' }); }}>EXPLORE COLLECTIONS <span>↗</span></button></div>
          <div className="hero-proof"><span className="proof-stars">★★★★★</span><span>CURATED FOR <b>2,400+</b> COLLECTORS</span></div>
        </div>
        <div className="hero-visual">
          <div className="hero-visual-glow" aria-hidden="true" />
          <div className="visual-caption caption-left"><span>01 / SONIC ARC</span><i /></div>
          <div className="hero-3d-wrap">
            <Suspense fallback={<Headphones3D />}>
              <HeroHeadphones3D />
            </Suspense>
          </div>
          <div className="visual-caption caption-right"><span>REAL-TIME 3D · MOVE TO EXPLORE</span><i /></div>
          <div className="hero-product-chip"><span className="chip-dot" /><span><b>SONIC ARC</b><small>PREMIUM WIRELESS · ₹14,990</small></span><button onClick={() => { openProduct(products[0]); }} aria-label="View Sonic Arc">↗</button></div>
        </div>
        <div className="hero-index">Nº 01 <span /> AUTUMN / WINTER 2026</div>
      </section>

      {isMainStorefront && <>
        <section className="rolling-edit" aria-label="Trending NEXORA products" data-reveal>
          <div className="rolling-edit-heading"><span className="eyebrow">THE CURRENT EDIT</span><span>GOOD TECH, IN MOTION <i>✳</i></span></div>
          <div className="rolling-edit-window">
            <div className="rolling-edit-track">
              {[...products.slice(0, 8), ...products.slice(0, 8)].map((product, index) => <button className="rolling-product" key={`${product.id}-${index}`} onClick={() => openProduct(product)} aria-label={`Explore ${product.name}`} aria-hidden={index >= 8} tabIndex={index >= 8 ? -1 : 0}>
                <span className="rolling-product-image"><img src={product.image} alt="" loading="lazy" /></span>
                <span className="rolling-product-copy"><small>{product.category}</small><strong>{product.name}</strong><b>{money(product.price)}</b></span>
                <span className="rolling-product-arrow">↗</span>
              </button>)}
            </div>
          </div>
        </section>

        <section className="collections" id="collections" aria-labelledby="collections-title" data-reveal>
          <div className="collections-head"><div><span className="eyebrow">THREE WORLDS · ONE SHOWROOM</span><h2 id="collections-title">Explore the <em>collections.</em></h2></div><p>Every object chosen for how it feels, not just how it works.</p></div>
          <div className="collection-panels">
            {[
              { label: 'AUDIO', title: 'Audio', copy: 'Sound, engineered for the after hours.', image: products[0].image, slug: 'Audio' },
              { label: 'WEARABLES', title: 'Wearables', copy: 'Time, reimagined on your wrist.', image: products[2].image, slug: 'Wearables' },
              { label: 'SMART OBJECTS', title: 'Smart objects', copy: 'A quieter intelligence for your space.', image: products[6].image, slug: 'Smart Home' },
            ].map((panel, index) => <button key={panel.slug} className="collection-panel" onClick={() => chooseCategory(panel.slug)} aria-label={`Explore the ${panel.title} collection`}>
              <img src={panel.image} alt="" loading="lazy" />
              <span className="collection-panel-index">0{index + 1}</span>
              <span className="collection-panel-copy"><small>{panel.label} · COLLECTION</small><strong>{panel.title}</strong><span>{panel.copy}</span><i>ENTER THE COLLECTION ↗</i></span>
            </button>)}
          </div>
        </section>

        <section className="diwali-edit" aria-labelledby="diwali-title" data-reveal>
          <div className="diwali-circuit" aria-hidden="true"><i /><i /><i /><i /><i /><i /></div>
          <div className="diwali-copy">
            <span className="diwali-kicker"><i>✦</i> THE FESTIVE EDIT · NEXORA <i>✦</i></span>
            <h2 id="diwali-title">Light up your<br /><em>next era.</em></h2>
            <p>Make the season brighter with next-era objects and considered prices on selected pieces.</p>
            <button className="diwali-cta" onClick={() => { setSearch(''); navigate('/deals'); }}>Explore the festive edit <Icon name="arrow" size={16} /></button>
            <span className="diwali-note">SELECTED SAVINGS · UP TO {money(Math.max(...products.filter((product) => product.oldPrice).map((product) => product.oldPrice - product.price)))} OFF</span>
          </div>
          <div className="diwali-art" aria-hidden="true">
            <div className="diwali-halo" /><div className="diwali-ring diwali-ring-one" /><div className="diwali-ring diwali-ring-two" />
            <svg viewBox="0 0 360 300" className="diwali-lamp" role="presentation">
              <path className="diwali-ray" d="M180 28v34M86 56l20 28M274 56l-20 28M40 139h38M282 139h38M79 218l27-23M281 218l-27-23" />
              <path className="diwali-flame" d="M180 88c-28 33-12 54 0 60 15-12 27-31 0-60Z" />
              <path className="diwali-flame-core" d="M180 109c-10 15-4 25 0 29 6-6 10-14 0-29Z" />
              <path className="diwali-lamp-body" d="M90 165h180c-13 48-46 74-90 74s-77-26-90-74Z" />
              <path className="diwali-lamp-rim" d="M79 160c30 17 132 17 202 0" />
              <path className="diwali-lamp-glow" d="M117 189c19 14 55 20 92 14" />
              <circle className="diwali-star" cx="77" cy="94" r="3" /><circle className="diwali-star" cx="286" cy="94" r="4" /><circle className="diwali-star" cx="113" cy="267" r="3" /><circle className="diwali-star" cx="253" cy="260" r="3" />
            </svg>
            <span className="diwali-art-label">A LITTLE SPARK<br />GOES A LONG WAY</span>
          </div>
        </section>

        <section className="festive-deals" aria-labelledby="festive-deals-title" data-reveal>
          <div className="festive-deals-heading"><div><span className="eyebrow">THE FESTIVE PRICE DROP · SELECTED PIECES</span><h2 id="festive-deals-title">Good tech. <em>Better prices.</em></h2><p>Real reductions on selected pieces. Find your next favourite before it’s gone.</p></div><button className="view-all" onClick={() => { setSearch(''); navigate('/deals'); }}>ALL FESTIVE DEALS <Icon name="arrow" size={16} /></button></div>
          <div className="festive-deal-grid">{products.filter((product) => product.oldPrice).slice(0, 4).map((product) => <button className="festive-deal-card" key={product.id} onClick={() => openProduct(product)}>
            <span className="festive-deal-art"><img src={product.image} alt="" loading="lazy" /><span className="deal-save">SAVE {money(product.oldPrice - product.price)}</span><span className="deal-corner">✦</span></span>
            <span className="festive-deal-info"><small>{product.category} · FESTIVE PRICE</small><strong>{product.name}</strong><span><b>{money(product.price)}</b><del>{money(product.oldPrice)}</del><i>↗</i></span></span>
          </button>)}</div>
        </section>
      </>}
      <section className="trust-row" data-reveal><div><span className="trust-icon">✳</span><span><b>Considered quality</b><small>Products worth keeping</small></span></div><div><span className="trust-icon">↗</span><span><b>Thoughtful delivery</b><small>At your door, with care</small></span></div><div><span className="trust-icon">◇</span><span><b>Here when you need us</b><small>People, not a chatbot</small></span></div><div className="trust-note">NEXT-ERA OBJECTS<br /><i>FOR EVERY DAY.</i></div></section>

      <section className="dimension-section" aria-labelledby="dimension-title" data-reveal>
        <div className="dimension-heading"><span className="eyebrow">TURN GOOD TECH AROUND</span><h2 id="dimension-title">A closer look, <em>in three dimensions.</em></h2><p>Move your pointer over each object to see it from another angle.</p></div>
        <div className="dimension-grid">{products.filter((product) => ['orbit-watch', 'nova-fold', 'prism-instant', 'playpad'].includes(product.id)).map((product, index) => <DimensionalProduct key={product.id} product={product} index={index} onOpen={openProduct} />)}</div>
      </section>      <section className="collection-section" id="collection" data-reveal>
        <div className="section-head"><div><span className="eyebrow">{isDealsPage ? 'THE NEXORA DEALS' : location.pathname === '/search' ? 'SEARCH THE EDIT' : category === 'All pieces' ? 'A CURATED COLLECTION' : category.toUpperCase()}</span><h2>{isDealsPage ? <>Good things, <em>on offer.</em></> : location.pathname === '/search' ? <>Results for <em>{search || 'everything'}</em></> : category === 'All pieces' ? <>Find your <em>everyday.</em></> : <>{category}, <em>thoughtfully chosen.</em></>}</h2><p>{isDealsPage ? 'Considered tech, at a better price.' : 'Useful, beautiful, and a little bit unexpected.'}</p></div><button className="view-all" onClick={() => chooseCategory('All pieces')}>VIEW ALL PIECES <Icon name="arrow" size={16} /></button></div>
        <div className="collection-toolbar"><div className="category-tabs" role="tablist" aria-label="Filter by category">{categories.map((item) => <button key={item} role="tab" aria-selected={category === item} className={category === item ? 'category-tab selected' : 'category-tab'} onClick={() => chooseCategory(item)}>{item}</button>)}</div><label className="sort-control"><span>SORT BY</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="featured">Featured</option><option value="top-rated">Top rated</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option></select><Icon name="chevron" size={13} /></label></div>
        <div className="result-line"><span>{search ? `RESULTS FOR “${search}”` : category === 'All pieces' ? 'THE FULL EDIT' : category.toUpperCase()}</span><span>{shownProducts.length.toString().padStart(2, '0')} PIECES</span></div>
        <div className="product-grid">{shownProducts.map((product, index) => <div className="grid-enter" style={{ '--delay': `${index * 55}ms` }} key={product.id}><ProductCard product={product} onOpen={openProduct} onAdd={addToCart} favorite={favorites.includes(product.id)} onFavorite={(id) => { if (!requireSignIn('saving pieces')) return; setFavorites((items) => items.includes(id) ? items.filter((savedId) => savedId !== id) : [...items, id]); }} /></div>)}</div>
        {shownProducts.length === 0 && <div className="empty-results"><Icon name="search" size={24} /><h3>No pieces found.</h3><p>Try another search or explore the full collection.</p><button className="text-button" onClick={() => chooseCategory('All pieces')}>Clear filters ↗</button></div>}
      </section>

      <section className="editorial" id="story" data-reveal><div className="editorial-image"><img src="https://images.unsplash.com/photo-1525004277915-9e455d05ca5d?auto=format&fit=crop&w=1400&q=84" alt="Minimal white speaker in a thoughtfully designed living space" loading="lazy" /><span className="image-stamp">THE<br />NEXORA<br />NOTE</span></div><div className="editorial-copy"><span className="eyebrow">OUR POINT OF VIEW · 01</span><h2>Technology should feel like <em>possibility.</em></h2><p>Not more noise. Not more to figure out. Just well-made things that make your day feel a little more yours.</p><button className="text-button" onClick={() => { document.getElementById('collection')?.scrollIntoView({ behavior: 'smooth' }); }}>Get to know our edit <Icon name="arrow" size={16} /></button><span className="editorial-number">N / 2026</span></div></section>

      <section className="newsletter" data-reveal><div><span className="eyebrow">A NOTE FROM NEXORA</span><h2>Good things, <em>occasionally.</em></h2><p>New discoveries, thoughtful stories, and a little room to breathe.</p></div><form onSubmit={(event) => { event.preventDefault(); if (!requireSignIn('joining the NEXORA list')) return; setToast('Thanks for your interest. Updates are coming soon.'); }}><label htmlFor="newsletter-email">YOUR EMAIL ADDRESS</label><div className="newsletter-input"><input id="newsletter-email" type="email" placeholder="you@example.com" required /><button type="submit" aria-label="Subscribe">↗</button></div><small>By subscribing, you agree to receive occasional notes from us.</small></form></section>

      <footer className="store-footer"><a className="store-brand" href="#top" onClick={(event) => { event.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}><span className="store-brand-mark">N</span>NEXORA<span className="brand-dot">.</span></a><span>OBJECTS FOR THE NEXT ERA.</span><span>© 2026 NEXORA · A PROJECT PREVIEW</span></footer>

      {searchOpen && <div className="search-overlay" role="dialog" aria-modal="true" aria-label="Search NEXORA" onClick={() => setSearchOpen(false)}>
        <div className="search-overlay-panel" onClick={(event) => event.stopPropagation()}>
          <div className="search-overlay-head"><span className="eyebrow">SEARCH THE SHOWROOM</span><button className="icon-button" onClick={() => setSearchOpen(false)} aria-label="Close search"><Icon name="close" /></button></div>
          <form className="search-overlay-form" onSubmit={(event) => { submitSearch(event); setSearchOpen(false); }}>
            <Icon name="search" size={26} />
            <input id="market-search-input" ref={searchInputRef} aria-label="Search NEXORA products" type="search" placeholder="Search the collection" value={search} onChange={(event) => setSearch(event.target.value)} />
            <button type="submit" aria-label="Search products"><Icon name="arrow" size={20} /></button>
          </form>
          {search.trim() ? (searchPreview.length > 0 ? <div className="search-preview">{searchPreview.map((product) => <button key={product.id} className="search-preview-item" onClick={() => { setSearchOpen(false); openProduct(product); }}><img src={product.image} alt="" /><span><strong>{product.name}</strong><small>{product.category} · {money(product.price)}</small></span><Icon name="arrow" size={15} /></button>)}</div> : <p className="search-empty">No pieces match “{search}”. Try another word.</p>) : null}
          <div className="search-overlay-links"><span className="eyebrow">EXPLORE</span><div><button onClick={() => { setSearch(''); setSearchOpen(false); navigate('/shop'); }}>For you</button><button onClick={() => { setSearch(''); setSearchOpen(false); navigate('/deals'); }}>Deals</button>{categories.slice(1).map((item) => <button key={item} onClick={() => { setSearch(''); setSearchOpen(false); chooseCategory(item); }}>{item}</button>)}</div></div>
          <div className="search-overlay-trending"><span className="eyebrow">TRENDING</span><div>{['Headphones', 'Watches', 'Cameras', 'Speakers'].map((term) => <button key={term} onClick={() => { setSearch(term.toLowerCase()); searchInputRef.current?.focus(); }}>{term}</button>)}</div></div>
          <div className="search-overlay-foot"><span>PRESS</span><kbd>ESC</kbd><span>TO CLOSE</span><span className="search-overlay-hint">Use <kbd>/</kbd> anywhere to search</span></div>
        </div>
      </div>}

      {authPrompt && <div className="modal-scrim" onClick={() => setAuthPrompt('')}><section className="auth-gate-modal" role="dialog" aria-modal="true" aria-labelledby="auth-gate-title" onClick={(event) => event.stopPropagation()}><button className="modal-close icon-button" onClick={() => setAuthPrompt('')} aria-label="Close sign-in prompt"><Icon name="close" /></button><span className="eyebrow">A LITTLE CLOSER TO NEXORA</span><h2 id="auth-gate-title">Make it yours.</h2><p>Sign in or create an account before {authPrompt}. Your NEXORA experience is waiting.</p><div className="auth-gate-actions"><button className="dark-button" onClick={() => navigate('/login')}>Sign in <Icon name="arrow" size={16} /></button><button className="text-button" onClick={() => navigate('/register')}>Create an account <span>↗</span></button></div></section></div>}      {cartOpen && <div className="drawer-scrim" onClick={() => setCartOpen(false)}><aside className="cart-drawer" onClick={(event) => event.stopPropagation()}><div className="drawer-head"><div><span className="eyebrow">YOUR SELECTION</span><h2>Your bag <small>({cartCount})</small></h2></div><button className="icon-button" onClick={() => setCartOpen(false)} aria-label="Close bag"><Icon name="close" /></button></div>{cart.length === 0 ? <div className="empty-bag"><span>✳</span><h3>A little room for something good.</h3><p>Your bag is waiting for its first find.</p><button className="dark-button" onClick={() => setCartOpen(false)}>Explore the edit <Icon name="arrow" size={16} /></button></div> : <><div className="cart-items">{cart.map(({ product, quantity }) => <div className="cart-item" key={product.id}><img src={product.image} alt="" /><div className="cart-item-info"><span>{product.category}</span><strong>{product.name}</strong><b>{money(product.price)}</b><div className="quantity-control"><button onClick={() => changeQuantity(product.id, -1)} aria-label={`Remove one ${product.name}`}><Icon name="minus" size={13} /></button><span>{quantity}</span><button onClick={() => changeQuantity(product.id, 1)} disabled={quantity >= MAX_QUANTITY} aria-label={`Add one ${product.name}`}><Icon name="plus" size={13} /></button></div></div></div>)}</div><div className="cart-summary"><div><span>Subtotal</span><b>{money(cartTotal)}</b></div><p>Shipping is calculated at checkout.</p><button className="dark-button" onClick={() => { setCheckoutError(''); setCheckoutOpen(true); }}>Continue to checkout <Icon name="arrow" size={16} /></button><small>Secure checkout · Thoughtful delivery</small></div></>}</aside></div>}

      {checkoutOpen && <div className="modal-scrim" onClick={() => setCheckoutOpen(false)}><section className="checkout-modal" role="dialog" aria-modal="true" aria-labelledby="checkout-title" onClick={(event) => event.stopPropagation()}><button className="modal-close icon-button" onClick={() => setCheckoutOpen(false)} aria-label="Close checkout"><Icon name="close" /></button><span className="eyebrow">THOUGHTFUL DELIVERY</span><h2 id="checkout-title">Where should we bring it?</h2><p>Complete your delivery details. Payment is collected on delivery.</p><form onSubmit={placeOrder}><label>FULL NAME<input name="name" autoComplete="name" required minLength="2" /></label><label>PHONE NUMBER<input name="phone" type="tel" autoComplete="tel" required minLength="7" /></label><label>DELIVERY ADDRESS<textarea name="address" autoComplete="street-address" required minLength="8" rows="3" /></label>{checkoutError && <p className="checkout-error" role="alert">{checkoutError}</p>}<button className="dark-button" type="submit" disabled={placingOrder}>{placingOrder ? 'PLACING ORDER...' : 'PLACE ORDER - ' + money(cartTotal)} <Icon name="arrow" size={16} /></button></form></section></div>}

      {activeProduct && <div className="modal-scrim" onClick={closeProduct}><section className="product-modal" role="dialog" aria-modal="true" aria-label={`${activeProduct.name} details`} onClick={(event) => event.stopPropagation()}><button className="modal-close icon-button" onClick={closeProduct} aria-label="Close details"><Icon name="close" /></button><div className={`modal-art tone-${activeProduct.tone} finish-${finish} gallery-view-${galleryView}`}><img src={activeProduct.image} alt={`${activeProduct.name}, view ${galleryView + 1}`} /><span>{activeProduct.label}</span><div className="gallery-thumbs" role="group" aria-label="Product gallery">{[0, 1, 2].map((view) => <button key={view} type="button" className={galleryView === view ? 'gallery-thumb selected' : 'gallery-thumb'} style={{ backgroundImage: `url(${activeProduct.image})` }} onClick={() => setGalleryView(view)} aria-label={`Show view ${view + 1}`} aria-pressed={galleryView === view} />)}</div><span className="gallery-count">VIEW 0{galleryView + 1} / 03</span></div><div className="modal-details"><span className="eyebrow">{activeProduct.category} · NEXORA EDIT</span><h2>{activeProduct.name}</h2><div className="modal-rating">★ {activeProduct.rating} <span>({activeProduct.reviews} thoughtful reviews)</span></div><strong className="modal-price">{money(activeProduct.price)} {activeProduct.oldPrice && <del>{money(activeProduct.oldPrice)}</del>}</strong><p>{activeProduct.detail}. A considered companion for your everyday rituals, made to sound and feel just right.</p><div className="color-choice"><span>FINISH</span>{[['midnight', 'Midnight'], ['stone', 'Stone'], ['sage', 'Sage']].map(([value, label]) => <button key={value} type="button" aria-label={`${label} finish`} aria-pressed={finish === value} className={`swatch swatch-${value} ${finish === value ? 'selected' : ''}`} onClick={() => setFinish(value)} />)}<small className="finish-name">{finish.toUpperCase()}</small></div><div className="delivery-note"><span>↗</span><div><b>Thoughtful delivery</b><small>Complimentary on orders over ₹10,000</small></div></div><button className="dark-button modal-add" onClick={() => { if (addToCart(activeProduct)) { closeProduct(); setCartOpen(true); } }}>Add to bag <span>{money(activeProduct.price)}</span></button><button className="modal-save" onClick={() => { if (!requireSignIn('saving pieces')) return; setFavorites((items) => items.includes(activeProduct.id) ? items.filter((id) => id !== activeProduct.id) : [...items, activeProduct.id]); }}><Icon name="heart" size={16} /> Save this piece</button></div></section></div>}

      {toast && <div className="toast-message" role="status"><span>✓</span>{toast}</div>}
    </main>
  );
}

