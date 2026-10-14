const icons = {
    back: (<svg className="oro-wa-back" viewBox="0 0 12 20" aria-hidden="true"><path d="M10 2 2 10l8 8" fill="none" stroke="#111b21" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg>),
    video: (<svg className="oro-wa-icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="6" width="13" height="12" rx="3" fill="none" stroke="#111b21" strokeWidth="1.7"/><path d="m15.5 10.5 5-3v9l-5-3z" fill="none" stroke="#111b21" strokeWidth="1.7" strokeLinejoin="round"/></svg>),
    call: (<svg className="oro-wa-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M6.6 3.5h2.6l1.5 4-2 1.4a11 11 0 0 0 6.4 6.4l1.4-2 4 1.5v2.6a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.6 5.7a2 2 0 0 1 2-2.2Z" fill="none" stroke="#111b21" strokeWidth="1.7" strokeLinejoin="round"/></svg>),
    plus: (<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v16M4 12h16" stroke="#111b21" strokeWidth="1.8" strokeLinecap="round"/></svg>),
    sticker: (<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h14v8.5L12.5 19H5z" fill="none" stroke="#54656f" strokeWidth="1.6" strokeLinejoin="round"/><path d="M19 12.5h-6.5V19" fill="none" stroke="#54656f" strokeWidth="1.6" strokeLinejoin="round"/></svg>),
    camera: (<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h3l1.6-2.5h6.8L17 8h3v11H4z" fill="none" stroke="#111b21" strokeWidth="1.7" strokeLinejoin="round"/><circle cx="12" cy="13.2" r="3.4" fill="none" stroke="#111b21" strokeWidth="1.7"/></svg>),
    mic: (<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3" fill="none" stroke="#111b21" strokeWidth="1.7"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" fill="none" stroke="#111b21" strokeWidth="1.7" strokeLinecap="round"/></svg>),
    ticks: (<svg viewBox="0 0 18 12" aria-hidden="true"><path d="m1 6.5 3.2 3.2L10.5 2.5M7.5 9.7l1 1L16.8 2.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>)
}

export default function WhatsAppIcon({ name }) { return icons[name] }
