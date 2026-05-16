import React, { useEffect, useState, useRef } from 'react';

// Lightweight client-side reviews store with real-time sync via BroadcastChannel.
import io from 'socket.io-client';
// Stores a map of productId -> reviews[] in localStorage under key 'dtb_reviews_v1'.
// Each review: { id, author, rating, text, createdAt }

const STORAGE_KEY = 'dtb_reviews_v1';
const CHANNEL_NAME = 'dtb_reviews_channel_v1';

function readStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.warn('Failed to read reviews store', e);
    return {};
  }
}

function writeStore(store) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    return true;
  } catch (e) {
    console.warn('Failed to write reviews store', e);
    return false;
  }
}

export default function Reviews({ productId, allowSubmit = true, filterVerified = false }) {
  const [reviews, setReviews] = useState(() => {
    try {
      const store = readStore();
      return store[productId] || [];
    } catch {
      return [];
    }
  });
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [author, setAuthor] = useState('');
  const channelRef = useRef(null);

  useEffect(() => {
    let socket = null;
    let bc = null;
    let mounted = true;

    async function init() {
      // try server
      try {
        const res = await fetch(`/api/reviews/${encodeURIComponent(productId)}`);
        if (res.ok) {
          const data = await res.json();
          if (mounted) setReviews(data.reviews || []);
          try {
            socket = io(undefined, { transports: ['websocket'] });
            socket.on('connect', () => socket.emit('subscribe', productId));
            socket.on('reviewAdded', (payload) => {
              if (payload && payload.productId === productId && mounted) setReviews(payload.reviews || []);
            });
            channelRef.current = socket;
          } catch (e) {
            console.warn('Socket.io connect failed, falling back to local sync', e);
          }
        }
      } catch (e) {
        // server not available; fallback to localStorage/BroadcastChannel
        console.debug('Reviews server unavailable', e && e.message);
      }

      try {
        bc = new BroadcastChannel(CHANNEL_NAME);
        bc.onmessage = (ev) => {
          const { type, payload } = ev.data || {};
          if (type === 'update' && payload && payload.productId === productId && mounted) {
            setReviews(payload.reviews || []);
          }
        };
        if (!channelRef.current) channelRef.current = bc;
      } catch (e) {
        // BroadcastChannel not available
        console.debug('BroadcastChannel unavailable', e && e.message);
      }
    }

    init();

    // Storage event fallback (other tabs)
    function onStorage(e) {
      if (e.key === STORAGE_KEY) {
        const s = readStore();
        setReviews(s[productId] || []);
      }
    }
    window.addEventListener('storage', onStorage);

    return () => {
      mounted = false;
  try { if (bc && typeof bc.close === 'function') bc.close(); } catch (e) { console.debug(e && e.message); }
  try { if (socket && typeof socket.disconnect === 'function') socket.disconnect(); } catch (e) { console.debug(e && e.message); }
  try { if (channelRef.current && typeof channelRef.current.close === 'function') channelRef.current.close(); } catch (e) { console.debug(e && e.message); }
      window.removeEventListener('storage', onStorage);
    };
  }, [productId]);

  function publishUpdate(newReviews) {
    const store = readStore();
    store[productId] = newReviews;
    writeStore(store);
    // Try posting to server (server will broadcast to other clients)
    try {
      fetch(`/api/reviews/${encodeURIComponent(productId)}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author: (newReviews[0] && newReviews[0].author) || 'Anonymous', rating: (newReviews[0] && newReviews[0].rating) || 5, text: (newReviews[0] && newReviews[0].text) || '' })
      }).catch(()=>{});
  } catch (e) { console.debug(e && e.message); }

    // local broadcast for tabs
    if (channelRef.current && typeof channelRef.current.postMessage === 'function') {
      channelRef.current.postMessage({ type: 'update', payload: { productId, reviews: newReviews } });
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim()) return;
    const newReview = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      author: author.trim() || 'Anonymous',
      rating: Number(rating) || 5,
      text: text.trim(),
      createdAt: new Date().toISOString(),
    };

    const updated = [newReview, ...reviews];
    setReviews(updated);
    publishUpdate(updated);
    // reset form
    setText('');
    setRating(5);
  }

  const avg = reviews.length ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length) : 0;
  const visibleReviews = filterVerified ? reviews.filter(r => !!r.verified) : reviews;

  return (
    <div className="dtb-reviews">

      {/* ── Summary bar ── */}
      <div className="dtb-reviews__summary">
        <div className="dtb-reviews__avg">
          <span className="dtb-reviews__avg-score">{avg ? avg.toFixed(1) : '—'}</span>
          <div className="dtb-reviews__avg-stars" aria-label={`${avg.toFixed(1)} out of 5 stars`}>
            {[1,2,3,4,5].map(n => (
              <svg key={n} className={`dtb-reviews__star${n <= Math.round(avg) ? ' is-filled' : ''}`} viewBox="0 0 20 20" aria-hidden="true">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <span className="dtb-reviews__count">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* ── Write a review form ── */}
      {allowSubmit && (
        <form onSubmit={handleSubmit} className="dtb-reviews__form">
          <p className="dtb-reviews__form-heading">Write a review</p>

          <div className="dtb-reviews__field">
            <label className="dtb-reviews__label">Rating</label>
            <div className="dtb-reviews__star-picker" role="group" aria-label="Select rating">
              {[1,2,3,4,5].map(n => (
                <button
                  type="button"
                  key={n}
                  onClick={() => setRating(n)}
                  className={`dtb-reviews__star-btn${n <= rating ? ' is-active' : ''}`}
                  aria-label={`${n} star${n !== 1 ? 's' : ''}`}
                  aria-pressed={n <= rating}
                >
                  <svg className="dtb-reviews__star" viewBox="0 0 20 20" aria-hidden="true">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </button>
              ))}
            </div>
          </div>

          <div className="dtb-reviews__field">
            <label className="dtb-reviews__label" htmlFor="dtb-review-author">Name <span className="dtb-reviews__label-opt">(optional)</span></label>
            <input
              id="dtb-review-author"
              className="dtb-reviews__input"
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Your name"
              autoComplete="name"
            />
          </div>

          <div className="dtb-reviews__field">
            <label className="dtb-reviews__label" htmlFor="dtb-review-text">Review</label>
            <textarea
              id="dtb-review-text"
              className="dtb-reviews__textarea"
              rows={4}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Share your experience with this product…"
            />
          </div>

          <button type="submit" className="dtb-reviews__submit">Submit review</button>
        </form>
      )}

      {/* ── Review list ── */}
      <div className="dtb-reviews__list">
        {visibleReviews.length === 0 ? (
          <p className="dtb-reviews__empty">No reviews yet — be the first to share your experience.</p>
        ) : visibleReviews.map(r => (
          <article key={r.id} className="dtb-reviews__item">
            <div className="dtb-reviews__item-header">
              <div className="dtb-reviews__item-meta">
                <span className="dtb-reviews__item-author">{r.author}</span>
                <div className="dtb-reviews__item-stars" aria-label={`${r.rating} out of 5 stars`}>
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className={`dtb-reviews__star dtb-reviews__star--sm${i < r.rating ? ' is-filled' : ''}`} viewBox="0 0 20 20" aria-hidden="true">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
              <time className="dtb-reviews__item-date" dateTime={r.createdAt}>
                {new Date(r.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
              </time>
            </div>
            <p className="dtb-reviews__item-text">{r.text}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
