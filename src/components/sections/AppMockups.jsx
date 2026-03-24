import { useState, useRef, useCallback } from 'react'
import useScrollReveal from '../../lib/useScrollReveal'
import useParallax from '../../lib/useParallax'
import './AppMockups.css'

const screens = [
  { id: 'generate', label: 'Generate' },
  { id: 'home', label: 'Home' },
  { id: 'shop', label: 'Shop' },
  { id: 'closet', label: 'Closet' },
  { id: 'runway', label: 'Runway' },
  { id: 'moodboard', label: 'Moodboard' }
]

const screenContent = {
  generate: {
    title: "Style for any moment.",
    desc: "Tell Oro where you're headed. It builds the perfect outfit from your closet, tailored to the occasion."
  },
  home: {
    title: "Your taste, decoded.",
    desc: "Upload moodboards. Oro learns what you like, using our own AI model, built to understand taste, not trends."
  },
  shop: {
    title: "A wardrobe that fits.",
    desc: "Set a budget. Oro finds capsule pieces across the web that match your style and your price."
  },
  closet: {
    title: "Your closet, remembered.",
    desc: "Upload your outfits. Oro learns what you own and how you actually dress."
  },
  moodboard: {
    title: "Curate your vision.",
    desc: "Attach your moodboards, Pinterest boards, or inspiration images. Oro analyzes your taste for perfect style recs."
  },
  runway: {
    title: "Outfits for every context.",
    desc: "Tell Oro the occasion. It styles what you already have, tuned to the moment."
  }
}

export default function AppMockups() {
  const [active, setActive] = useState(0)
  const [dragX, setDragX] = useState(0)
  const [dragging, setDragging] = useState(false)
  const startX = useRef(0)
  const ref = useRef(null)
  const visible = useScrollReveal(ref, { threshold: 0.18 })
  const phoneParaRef = useParallax(0.08)
  const contentParaRef = useParallax(0.14)
  
  const go = useCallback((i) => {
    setActive(i < 0 ? screens.length - 1 : i >= screens.length ? 0 : i)
    setDragX(0)
  }, [])
  
  const onStart = (e) => {
    startX.current = e.touches?.[0]?.clientX ?? e.clientX
    setDragging(true)
  }
  
  const onMove = (e) => {
    if (!dragging) return
    const x = e.touches?.[0]?.clientX ?? e.clientX
    setDragX((x - startX.current) * 0.35)
  }
  
  const onEnd = () => {
    if (!dragging) return
    dragX < -35 ? go(active + 1) : dragX > 35 ? go(active - 1) : null
    setDragX(0)
    setDragging(false)
  }

  const currentContent = screenContent[screens[active].id]

  const goToScreen = (index) => {
    go(index)
  }

  return (
    <section ref={ref} className={`mockup-section${visible ? ' in' : ''}`}>
      <div className="mockup-bg" />
      
      <div className="mockup-container-side">
        {/* Phone Left */}
        <div ref={phoneParaRef} className="phone-center">
          <p className="mockup-label">The App</p>
          
          <div className="phone-wrap">
            <div 
              className={`phone${dragging ? ' drag' : ''}`}
              onTouchStart={onStart} onTouchMove={onMove} onTouchEnd={onEnd}
              onMouseDown={onStart} onMouseMove={dragging ? onMove : null} onMouseUp={onEnd} onMouseLeave={onEnd}
            >
              <div className="phone-body">
                <div className="phone-speaker" />
                <div className="phone-screen">
                  <div 
                    className="screen-inner"
                    style={{ 
                      transform: `translateX(calc(-${active * 100}% + ${dragX}px))`,
                      transition: dragging ? 'none' : 'transform 0.55s cubic-bezier(.4,.0,.2,1)'
                    }}
                  >
                    <GenerateScreen goToScreen={goToScreen} />
                    <HomeScreen goToScreen={goToScreen} />
                    <ShopScreen goToScreen={goToScreen} />
                    <ClosetScreen goToScreen={goToScreen} />
                    <RunwayScreen goToScreen={goToScreen} />
                    <MoodboardScreen goToScreen={goToScreen} />
                  </div>
                </div>
                <div className="phone-bar" />
              </div>
            </div>
          </div>

          <nav className="mockup-nav">
            {screens.map((s, i) => (
              <button key={s.id} onClick={() => go(i)} className={`nav-pill${i === active ? ' on' : ''}`}>
                {s.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content Right */}
        <div ref={contentParaRef} className="content-side">
          <h3 className="content-title">{currentContent.title}</h3>
          <p className="content-desc">{currentContent.desc}</p>
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════════
   RUNWAY SCREEN — Your Outfits of the Month
   ═══════════════════════════════════════════════════════════ */
function RunwayScreen({ goToScreen }) {
  const [currentLook, setCurrentLook] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [isMuted, setIsMuted] = useState(true)
  
  const looks = [
    {
      image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&q=80',
      title: ['January', 'Runway'],
      outfit: 'Wide Top, Wide Trousers, Converse All Star, Red Sunglasses & Red Belt Bag',
      date: 'Look 1 of 4'
    },
    {
      image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80',
      title: ['Your', 'Best Looks'],
      outfit: 'Cropped Sweatset & White Heels',
      date: 'Look 2 of 4'
    },
    {
      image: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800&q=80',
      title: ['OOTD,', 'Monday'],
      outfit: 'Floral Sundress with Gold Jewelry',
      date: 'Look 3 of 4'
    },
    {
      image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800&q=80',
      title: ['Parisian', 'Chic'],
      outfit: 'Trench Coat, Denim, White Tee',
      date: 'Look 4 of 4'
    }
  ]
  
  const look = looks[currentLook]
  
  const nextLook = () => setCurrentLook((currentLook + 1) % looks.length)
  const prevLook = () => setCurrentLook(currentLook === 0 ? looks.length - 1 : currentLook - 1)
  
  return (
    <div className="screen runway">
      {/* Full Bleed Video/Image */}
      <div className="runway-hero">
        <img 
          src={look.image} 
          alt="" 
          className="runway-media"
          onClick={nextLook}
        />
        <div className="runway-gradient" />
        
        {/* Top Badge */}
        <div className="runway-badge">
          <span className="badge-dot" />
          Your Runway
        </div>
        
        {/* Editorial Title */}
        <div className="runway-content">
          <p className="runway-date">{look.date}</p>
          <h1 className="runway-title">
            <span>{look.title[0]}</span>
            <span className="indent">{look.title[1]}</span>
          </h1>
          <p className="runway-outfit">{look.outfit}</p>
        </div>
        
        {/* Video Controls */}
        <div className="runway-controls">
          <button 
            className="ctrl-btn"
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" rx="1"/>
                <rect x="14" y="4" width="4" height="16" rx="1"/>
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
            )}
          </button>
          <button 
            className="ctrl-btn"
            onClick={() => setIsMuted(!isMuted)}
          >
            {isMuted ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 5L6 9H2v6h4l5 4V5z"/>
                <line x1="23" y1="9" x2="17" y2="15"/>
                <line x1="17" y1="9" x2="23" y2="15"/>
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 5L6 9H2v6h4l5 4V5z"/>
                <path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"/>
              </svg>
            )}
          </button>
        </div>
        
        {/* Pagination Dots */}
        <div className="runway-pagination">
          {looks.map((_, i) => (
            <button 
              key={i} 
              className={`runway-dot${i === currentLook ? ' on' : ''}`}
              onClick={() => setCurrentLook(i)}
            />
          ))}
        </div>
        
        {/* Progress Bar */}
        <div className="runway-progress">
          <div 
            className="progress-fill" 
            style={{ width: `${((currentLook + 1) / looks.length) * 100}%` }}
          />
        </div>
        
        {/* Outfit Tag */}
        <button className="outfit-tag" onClick={nextLook}>
          <div className="tag-preview">
            <img src={looks[(currentLook + 1) % looks.length].image} alt="" />
          </div>
          <div className="tag-next">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </div>
        </button>
      </div>
      
      <UnifiedNav active="runway" onNavigate={goToScreen} />
    </div>
  )
}

/* Unified Bottom Tab Bar */
function UnifiedNav({ active, onNavigate }) {
  const handleNav = (screenId) => {
    const screenIndex = screens.findIndex(s => s.id === screenId)
    if (screenIndex !== -1 && onNavigate) {
      onNavigate(screenIndex)
    }
  }

  return (
    <nav className="unified-nav">
      <button 
        className={`unav-item${active === 'generate' ? ' on' : ''}`}
        onClick={() => handleNav('generate')}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        {active === 'generate' && <span className="unav-dot" />}
      </button>
      <button 
        className={`unav-item unav-text${active === 'home' ? ' on' : ''}`}
        onClick={() => handleNav('home')}
      >
        Home
        {active === 'home' && <span className="unav-dot" />}
      </button>
      <button 
        className={`unav-item unav-text${active === 'shop' ? ' on' : ''}`}
        onClick={() => handleNav('shop')}
      >
        Shop
        {active === 'shop' && <span className="unav-dot" />}
      </button>
      <button 
        className={`unav-item unav-text${active === 'closet' ? ' on' : ''}`}
        onClick={() => handleNav('closet')}
      >
        You
        {active === 'closet' && <span className="unav-dot" />}
      </button>
      <button 
        className={`unav-item unav-text${active === 'runway' ? ' on' : ''}`}
        onClick={() => handleNav('runway')}
      >
        Runway
        {active === 'runway' && <span className="unav-dot" />}
      </button>
      <button 
        className={`unav-item${active === 'moodboard' ? ' on' : ''}`}
        onClick={() => handleNav('moodboard')}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="3" width="7" height="7" rx="1"/>
          <rect x="14" y="3" width="7" height="7" rx="1"/>
          <rect x="3" y="14" width="7" height="7" rx="1"/>
          <rect x="14" y="14" width="7" height="7" rx="1"/>
        </svg>
        {active === 'moodboard' && <span className="unav-dot" />}
      </button>
    </nav>
  )
}

/* ═══════════════════════════════════════════════════════════
   GENERATE SCREEN — Uber-style occasion search
   ═══════════════════════════════════════════════════════════ */
function GenerateScreen({ goToScreen }) {
  const [searchValue, setSearchValue] = useState('')
  const [selectedOccasion, setSelectedOccasion] = useState(null)
  
  const occasions = [
    { id: 'work', label: 'Work' },
    { id: 'date', label: 'Date' },
    { id: 'party', label: 'Party' },
    { id: 'casual', label: 'Casual' },
    { id: 'brunch', label: 'Brunch' },
    { id: 'formal', label: 'Formal' },
  ]
  
  const recentPlaces = [
    { name: 'Dinner at Nobu', time: 'Last week' },
    { name: 'Office - Downtown', time: '2 days ago' },
  ]
  
  return (
    <div className="screen generate">
      {/* Header with gradient */}
      <div className="gen-header">
        <p className="gen-label">Generate</p>
        <h1 className="gen-title">Where are you<br/>going, Sarah?</h1>
        <p className="gen-sub">We'll style the perfect outfit</p>
      </div>
      
      {/* Search Box */}
      <div className="gen-search-wrap">
        <div className="gen-search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input 
            type="text"
            className="gen-search-input"
            placeholder="Type an occasion..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
        </div>
      </div>
      
      {/* Quick Occasions */}
      <div className="gen-occasions">
        <div className="gen-occasion-row">
          {occasions.slice(0, 3).map(o => (
            <button 
              key={o.id}
              className={`gen-pill${selectedOccasion === o.id ? ' on' : ''}`}
              onClick={() => setSelectedOccasion(o.id)}
            >
              {o.label}
            </button>
          ))}
        </div>
        <div className="gen-occasion-row">
          {occasions.slice(3).map(o => (
            <button 
              key={o.id}
              className={`gen-pill${selectedOccasion === o.id ? ' on' : ''}`}
              onClick={() => setSelectedOccasion(o.id)}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Generate CTA */}
      <button className="gen-cta">
        Generate Outfit
      </button>
      
      <UnifiedNav active="generate" onNavigate={goToScreen} />
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   HOME SCREEN
   ═══════════════════════════════════════════════════════════ */
function HomeScreen({ goToScreen }) {
  return (
    <div className="screen home">
      <div className="home-hero">
        <img src="https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&q=80" alt="" />
        <div className="home-hero-fade" />
        <div className="home-hero-content">
          <p className="home-tag">Good Morning</p>
          <h1 className="home-title">Hi Sarah,<br/>what are you<br/>wearing today?</h1>
          <button className="home-cta">Take a picture</button>
        </div>
      </div>
      
      <div className="home-scroll">
        <div className="scroll-header">
          <span className="scroll-title">For You</span>
          <button className="scroll-link">See All</button>
        </div>
        <div className="scroll-track">
          {[
            { img: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400&q=80', name: 'Wool Coat', price: '$289' },
            { img: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400&q=80', name: 'Cashmere Knit', price: '$165' },
            { img: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&q=80', name: 'Wide Trousers', price: '$128' },
          ].map((item, i) => (
            <div key={i} className="scroll-card">
              <div className="scroll-img"><img src={item.img} alt="" /></div>
              <p className="scroll-name">{item.name}</p>
              <p className="scroll-price">{item.price}</p>
            </div>
          ))}
        </div>
      </div>
      
      <UnifiedNav active="home" onNavigate={goToScreen} />
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   SHOP SCREEN
   ═══════════════════════════════════════════════════════════ */
function ShopScreen({ goToScreen }) {
  const [maxPrice, setMaxPrice] = useState(300)
  const [showFilter, setShowFilter] = useState(false)
  const [activeCat, setActiveCat] = useState(0)
  const items = [
    { img: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=500&q=80', name: 'Tailored Wool Coat', brand: 'COS', price: '$350', sale: '$245' },
    { img: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=500&q=80', name: 'Relaxed Cashmere', brand: 'ARKET', price: '$189', sale: null },
    { img: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=500&q=80', name: 'Pleated Trousers', brand: 'ZARA', price: '$79', sale: '$59' },
  ]

  return (
    <div className="screen shop">
      <div className="shop-header">
        <h1 className="shop-title">Shop</h1>
        <button className="shop-filter" onClick={() => setShowFilter(!showFilter)}>
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 5h10M5 9h6M7 13h2"/></svg>
        </button>
      </div>
      
      {/* Price Filter */}
      {showFilter && (
        <div className="price-filter">
          <div className="price-filter-row">
            <span className="price-label">Max budget</span>
            <span className="price-value">${maxPrice}</span>
          </div>
          <input 
            type="range" 
            className="price-slider"
            min="50"
            max="500"
            step="10"
            value={maxPrice}
            onChange={(e) => setMaxPrice(Number(e.target.value))}
          />
          <div className="price-range">
            <span>$50</span>
            <span>$500</span>
          </div>
        </div>
      )}
      
      <div className="shop-cats">
        {['All', 'Coats', 'Knitwear', 'Trousers', 'Bags'].map((c, i) => (
          <button key={c} className={`cat${i === activeCat ? ' on' : ''}`} onClick={() => setActiveCat(i)}>{c}</button>
        ))}
      </div>
      
      <div className="shop-grid">
        {items.map((item, i) => (
          <div key={i} className="product">
            <div className="product-img">
              <img src={item.img} alt="" />
              <button className="product-heart">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 13.7l-5.3-5.4a3.1 3.1 0 014.4-4.4L8 4.8l.9-.9a3.1 3.1 0 014.4 4.4L8 13.7z"/></svg>
              </button>
            </div>
            <p className="product-brand">{item.brand}</p>
            <p className="product-name">{item.name}</p>
            <p className="product-price">
              {item.sale ? <><s>{item.price}</s><span className="sale">{item.sale}</span></> : item.price}
            </p>
          </div>
        ))}
      </div>
      
      <UnifiedNav active="shop" onNavigate={goToScreen} />
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   CLOSET SCREEN
   ═══════════════════════════════════════════════════════════ */
function ClosetScreen({ goToScreen }) {
  const pieces = [
    { img: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400&q=80', name: 'Cashmere Sweater' },
    { img: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&q=80', name: 'Wide Leg Pants' },
    { img: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400&q=80', name: 'Wool Coat' },
    { img: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&q=80', name: 'Leather Bag' },
    { img: 'https://images.unsplash.com/photo-1598554747436-c9293d6a588f?w=400&q=80', name: 'Silk Blouse' },
  ]
  
  return (
    <div className="screen closet">
      <div className="closet-top">
        <h1 className="closet-title">My Closet</h1>
        <button className="closet-add">
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10 4v12M4 10h12"/></svg>
        </button>
      </div>
      
      <div className="closet-stats">
        <div className="stat"><span className="stat-num">12</span><span className="stat-label">Items</span></div>
        <div className="stat"><span className="stat-num">4</span><span className="stat-label">Outfits</span></div>
        <div className="stat"><span className="stat-num">3</span><span className="stat-label">Looks</span></div>
      </div>
      
      <div className="closet-grid">
        {pieces.map((p, i) => (
          <div key={i} className="piece">
            <div className="piece-img"><img src={p.img} alt="" /></div>
            <p className="piece-name">{p.name}</p>
          </div>
        ))}
        <button className="piece piece-add">
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M12 5v14M5 12h14"/></svg>
        </button>
      </div>
      
      <div className="closet-cta">
        <span className="cta-spark">✦</span>
        <div className="cta-info">
          <span className="cta-label">Style me for</span>
          <span className="cta-placeholder">A dinner date...</span>
        </div>
        <button className="cta-go">→</button>
      </div>
      
      <UnifiedNav active="closet" onNavigate={goToScreen} />
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   MOODBOARD SCREEN — Your Style Vision
   ═══════════════════════════════════════════════════════════ */
function MoodboardScreen({ goToScreen }) {
  const moodImages = [
    { img: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400&q=80' },
    { img: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&q=80' },
    { img: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=400&q=80' },
  ]
  
  return (
    <div className="screen moodboard">
      <div className="mood-header">
        <h1 className="mood-title">Moodboard</h1>
        <p className="mood-sub">Curate your style vision</p>
      </div>
      
      {/* Upload Zone */}
      <div className="mood-upload">
        <div className="upload-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
            <polyline points="17,8 12,3 7,8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
        </div>
        <p className="upload-text">Drop images or tap to upload</p>
        <p className="upload-hint">PNG, JPG up to 10MB</p>
      </div>
      
      {/* Pinterest Link */}
      <div className="mood-link">
        <div className="link-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0a12 12 0 00-4.37 23.17c-.1-.94-.2-2.4.04-3.44l1.4-5.96s-.35-.71-.35-1.78c0-1.67.97-2.92 2.17-2.92 1.02 0 1.52.77 1.52 1.7 0 1.03-.66 2.58-1 4.01-.28 1.2.6 2.17 1.78 2.17 2.14 0 3.78-2.26 3.78-5.52 0-2.89-2.08-4.9-5.05-4.9-3.44 0-5.46 2.58-5.46 5.25 0 1.04.4 2.16.9 2.77a.36.36 0 01.08.34l-.33 1.36c-.05.22-.18.27-.4.16-1.5-.7-2.44-2.89-2.44-4.65 0-3.78 2.75-7.26 7.93-7.26 4.16 0 7.4 2.97 7.4 6.93 0 4.14-2.6 7.46-6.22 7.46-1.21 0-2.36-.63-2.75-1.38l-.75 2.85c-.27 1.04-1 2.35-1.5 3.15A12 12 0 1012 0z"/>
          </svg>
        </div>
        <input 
          type="text" 
          className="link-input" 
          placeholder="Paste Pinterest board link..."
        />
        <button className="link-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </button>
      </div>
      
      {/* Recent Uploads */}
      <div className="mood-recent">
        <div className="recent-head">
          <span className="recent-title">Your Inspiration</span>
          <span className="recent-count">3 images</span>
        </div>
        <div className="recent-grid">
          {moodImages.map((m, i) => (
            <div key={i} className="recent-img">
              <img src={m.img} alt="" />
            </div>
          ))}
          <button className="recent-add">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M10 4v12M4 10h12"/>
            </svg>
          </button>
        </div>
      </div>
      
      {/* CTA */}
      <button className="mood-cta">
        <span>Analyze My Style</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      </button>
      
      <UnifiedNav active="moodboard" onNavigate={goToScreen} />
    </div>
  )
}

