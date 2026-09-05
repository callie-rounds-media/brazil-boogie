/* Brazil Boogie , interactions modelled on the Habitas theme
   (GSAP reveals -> IntersectionObserver, Swiper -> vanilla drag slider,
    Barba page transitions -> fade overlay) */
(function () {
  'use strict';

  /* ---------- page transition in ---------- */
  var fade = document.querySelector('.page-fade');
  function clearFade() {
    if (!fade) return;
    fade.classList.remove('is-leaving');
    fade.classList.add('is-done');
  }
  window.addEventListener('load', function () {
    clearFade();
    var hero = document.querySelector('.hero');
    if (hero) hero.classList.add('is-ready');
  });
  /* Going back restores the page from the back/forward cache, which does not
     fire `load`. Without this the fade overlay stayed opaque and you landed on
     a blank screen. pageshow fires on both a fresh load and a cache restore. */
  window.addEventListener('pageshow', function (e) {
    clearFade();
    if (e.persisted) {
      var hero = document.querySelector('.hero');
      if (hero) hero.classList.add('is-ready');
      document.querySelectorAll('video[autoplay]').forEach(function (v) {
        v.play().catch(function () {});
      });
    }
  });
  // and if a navigation is cancelled, do not leave the overlay covering the page
  window.addEventListener('pagehide', function (e) { if (e.persisted) clearFade(); });
  // fade out before navigating to an internal page
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a || !fade) return;
    var href = a.getAttribute('href');
    if (!href || href.charAt(0) === '#' || a.target === '_blank' ||
        href.indexOf('mailto:') === 0 || href.indexOf('http') === 0) return;
    e.preventDefault();
    fade.classList.remove('is-done');
    fade.classList.add('is-leaving');
    setTimeout(function () { window.location.href = href; }, 550);
  });

  /* ---------- header gradient on scroll ---------- */
  var header = document.querySelector('.page-header');
  function onScroll() {
    if (header) header.classList.toggle('is-scrolling', window.scrollY > 40);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- slide-in nav ---------- */
  var nav = document.querySelector('.nav');
  var burger = document.querySelector('.hamburger');
  function setNav(open) {
    if (!nav || !burger) return;
    nav.classList.toggle('is-opened', open);
    burger.classList.toggle('is-opened', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    document.body.classList.toggle('nav-open', open);
  }
  if (burger) burger.addEventListener('click', function () {
    setNav(!nav.classList.contains('is-opened'));
  });
  var scrim = document.querySelector('.nav__scrim');
  if (scrim) scrim.addEventListener('click', function () { setNav(false); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { setNav(false); closeLightbox(); }
  });

  /* ---------- nav sub-menu (Rooms -> the three tiers) ---------- */
  var toggle = document.querySelector('.nav__toggle');
  if (toggle) {
    toggle.addEventListener('click', function (e) {
      e.preventDefault();
      var sub = document.querySelector('.sub-menu');
      var open = sub.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  // Pricing jumps to the rooms block; shut the panel on the way through
  document.querySelectorAll('.nav__menu a[href*="#rooms"]').forEach(function (a) {
    a.addEventListener('click', function () { setNav(false); });
  });

  /* ---------- scroll reveal ---------- */
  var reveals = document.querySelectorAll('.js-visibility');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('is-visible');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------- carousel ----------
     The viewport scrolls natively, so wheel, trackpad, touch and momentum
     all work without us intercepting anything. Arrows just scrollBy. */
  document.querySelectorAll('[data-slider]').forEach(function (root) {
    var vp = root.querySelector('.slider-viewport');
    var slide = root.querySelector('.slide');
    var prev = root.querySelector('[data-prev]');
    var next = root.querySelector('[data-next]');
    if (!vp || !slide) return;

    function step() {
      var track = root.querySelector('.slider-track');
      var gap = parseFloat(getComputedStyle(track).gap) || 24;
      return slide.getBoundingClientRect().width + gap;
    }
    function sync() {
      var max = vp.scrollWidth - vp.clientWidth - 1;
      if (prev) prev.disabled = vp.scrollLeft <= 0;
      if (next) next.disabled = vp.scrollLeft >= max;
    }
    if (prev) prev.addEventListener('click', function () {
      vp.scrollBy({ left: -step(), behavior: 'smooth' });
    });
    if (next) next.addEventListener('click', function () {
      vp.scrollBy({ left: step(), behavior: 'smooth' });
    });
    vp.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync);
    sync();

    /* A plain mouse wheel only emits deltaY, so translate a vertical wheel
       into horizontal movement while the track still has room to travel.
       Once it hits either end we let the event through and the page scrolls. */
    vp.addEventListener('wheel', function (e) {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;   // trackpad already horizontal
      var max = vp.scrollWidth - vp.clientWidth;
      var atStart = vp.scrollLeft <= 0 && e.deltaY < 0;
      var atEnd = vp.scrollLeft >= max - 1 && e.deltaY > 0;
      if (atStart || atEnd) return;
      e.preventDefault();
      vp.scrollLeft += e.deltaY;
    }, { passive: false });

    /* click and drag with a mouse */
    var down = false, startX = 0, startScroll = 0, moved = 0;
    vp.addEventListener('mousedown', function (e) {
      down = true; moved = 0;
      startX = e.clientX; startScroll = vp.scrollLeft;
      vp.classList.add('is-dragging');
    });
    window.addEventListener('mousemove', function (e) {
      if (!down) return;
      e.preventDefault();
      moved = Math.abs(e.clientX - startX);
      vp.scrollLeft = startScroll - (e.clientX - startX);
    });
    window.addEventListener('mouseup', function () {
      if (!down) return;
      down = false;
      vp.classList.remove('is-dragging');
    });
    // a drag should not follow the link underneath it
    vp.addEventListener('click', function (e) {
      if (moved > 6) { e.preventDefault(); e.stopPropagation(); }
    }, true);
  });

  /* ---------- lightbox for the labelled galleries ---------- */
  var lb = document.querySelector('.lightbox');
  var lbImg = lb && lb.querySelector('img');
  var lbCap = lb && lb.querySelector('.lightbox__cap');
  var items = Array.prototype.slice.call(document.querySelectorAll('.gallery-item'));
  var cur = 0;

  function openLightbox(i) {
    if (!lb || !items.length) return;
    cur = (i + items.length) % items.length;
    var it = items[cur];
    var img = it.querySelector('img');
    var lab = it.querySelector('.gallery-item__label');
    lbImg.src = img.getAttribute('data-full') || img.src;
    lbImg.alt = img.alt || '';
    lbCap.textContent = lab ? lab.textContent.trim() : '';
    lb.classList.add('is-open');
    document.body.classList.add('nav-open');
  }
  function closeLightbox() {
    if (!lb) return;
    lb.classList.remove('is-open');
    document.body.classList.remove('nav-open');
  }
  items.forEach(function (it, i) {
    it.addEventListener('click', function () { openLightbox(i); });
  });
  if (lb) {
    lb.querySelector('.lightbox__close').addEventListener('click', closeLightbox);
    lb.querySelector('.lightbox__nav--prev').addEventListener('click', function (e) {
      e.stopPropagation(); openLightbox(cur - 1);
    });
    lb.querySelector('.lightbox__nav--next').addEventListener('click', function (e) {
      e.stopPropagation(); openLightbox(cur + 1);
    });
    lb.addEventListener('click', function (e) { if (e.target === lb) closeLightbox(); });
    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('is-open')) return;
      if (e.key === 'ArrowLeft') openLightbox(cur - 1);
      if (e.key === 'ArrowRight') openLightbox(cur + 1);
    });
  }

  /* ---------- application form ----------
     Three places a submission can land, and it only counts as lost if all three fail:
       1. the endpoint (Google Sheet + email)
       2. a queue in this browser, retried on every later visit
       3. a pre-filled email as a last resort
     Nothing is cleared from the queue until the endpoint confirms it. */
  var form = document.querySelector('.form');
  if (form) {
    var note = document.getElementById('formNote');
    var QUEUE = 'bb_pending_applications';
    var FALLBACK_TO = 'brazilboogie.trip@gmail.com,callieroundsmedia@gmail.com,kylezellemn2@gmail.com';

    function readQueue() {
      try { return JSON.parse(localStorage.getItem(QUEUE) || '[]'); } catch (e) { return []; }
    }
    function writeQueue(q) {
      try { localStorage.setItem(QUEUE, JSON.stringify(q)); } catch (e) {}
    }
    function collect() {
      var d = {};
      new FormData(form).forEach(function (v, k) { d[k] = v; });
      d._submitted = new Date().toISOString();
      d._id = d._submitted + '|' + (d.email || '');
      return d;
    }
    function send(payload) {
      var url = form.getAttribute('action');
      if (!url) return Promise.reject(new Error('no endpoint'));

      // 1. email capture. Resolves only on a real success response.
      var body = {};
      Object.keys(payload).forEach(function (k) { if (k.charAt(0) !== '_') body[k] = payload[k]; });
      body._cc = form.getAttribute('data-cc') || '';
      body._subject = 'Brazil Boogie application: ' + (payload.name || '') +
                      ' (' + (payload.room || '') + ')';
      body._template = 'table';
      var email = fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(body)
      }).then(function (r) {
        if (!r.ok) throw new Error('capture failed ' + r.status);
        return r;
      });

      // 2. the Sheet, once it exists. Fire and forget, never blocks the applicant.
      var sheetUrl = form.getAttribute('data-sheet');
      if (sheetUrl) {
        fetch(sheetUrl, {
          method: 'POST', mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload)
        }).catch(function () {});
      }
      return email;
    }
    function mailtoFallback(d) {
      var lines = Object.keys(d).filter(function (k) { return k.charAt(0) !== '_'; })
        .map(function (k) { return k + ': ' + d[k]; }).join('\n');
      return 'mailto:' + FALLBACK_TO +
        '?subject=' + encodeURIComponent('Brazil Boogie application: ' + (d.name || '')) +
        '&body=' + encodeURIComponent(lines);
    }

    // anything stranded from a previous visit goes first
    (function flush() {
      var q = readQueue();
      if (!q.length || !form.getAttribute('action')) return;
      q.forEach(function (item) {
        send(item).then(function () {
          writeQueue(readQueue().filter(function (x) { return x._id !== item._id; }));
        }).catch(function () {});
      });
    
  /* ---------- video autoplay -----------
     Mobile browsers block autoplay in several situations even when the markup is
     correct: iOS Low Power Mode, Low Data Mode, Android data saver, and Chrome's
     first-visit policy on an unknown domain. The markup alone is not enough, so
     we ask to play, and if we are refused we start on the visitor's first touch. */
  (function video() {
    var vids = [].slice.call(document.querySelectorAll('video[autoplay]'));
    if (!vids.length) return;

    // a lighter file on small screens, 2.5MB instead of 8.4MB
    if (window.matchMedia('(max-width: 900px)').matches) {
      vids.forEach(function (v) {
        var src = v.querySelector('source');
        if (src && src.src.indexOf('hero.mp4') > -1) {
          src.src = src.src.replace('hero.mp4', 'hero-mobile.mp4');
          v.load();
        }
      });
    }

    var pending = [];
    function tryPlay(v) {
      var p = v.play();
      if (p && p.catch) p.catch(function () { if (pending.indexOf(v) < 0) pending.push(v); });
    }
    vids.forEach(function (v) {
      v.muted = true;                       // iOS needs this set in JS as well as markup
      v.setAttribute('muted', '');
      v.playsInline = true;
      tryPlay(v);
      v.addEventListener('canplay', function () { tryPlay(v); }, { once: true });
    });

    // if the browser refused, the first real interaction unlocks it
    function unlock() {
      pending.forEach(function (v) { v.play().catch(function () {}); });
      pending = [];
      ['touchstart', 'pointerdown', 'scroll', 'keydown'].forEach(function (e) {
        window.removeEventListener(e, unlock);
      });
    }
    ['touchstart', 'pointerdown', 'scroll', 'keydown'].forEach(function (e) {
      window.addEventListener(e, unlock, { passive: true });
    });

    // and pause offscreen video so it never eats a phone battery
    if ('IntersectionObserver' in window) {
      var vo = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.play().catch(function () {}); }
          else { en.target.pause(); }
        });
      }, { threshold: 0.15 });
      vids.forEach(function (v) { vo.observe(v); });
    }
  })();
})();

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }

      var data = collect();
      var q = readQueue(); q.push(data); writeQueue(q);      // save BEFORE sending
      note.textContent = 'Sending...';

      if (!form.getAttribute('action')) {
        note.innerHTML = 'The form is not connected yet, so your application is saved in this ' +
          'browser and will send automatically once it is. To be certain, ' +
          '<a href="' + mailtoFallback(data) + '">email it to us now</a>.';
        return;
      }

      send(data).then(function () {
        writeQueue(readQueue().filter(function (x) { return x._id !== data._id; }));
        form.reset();
        note.textContent = 'Got it. We will come back to you about a room.';
      }).catch(function () {
        note.innerHTML = 'That did not go through, but your application is saved and will ' +
          'retry. To be certain, <a href="' + mailtoFallback(data) + '">email it to us now</a>.';
      });
    });
  }

  /* ---------- video autoplay -----------
     Mobile browsers block autoplay in several situations even when the markup is
     correct: iOS Low Power Mode, Low Data Mode, Android data saver, and Chrome's
     first-visit policy on an unknown domain. The markup alone is not enough, so
     we ask to play, and if we are refused we start on the visitor's first touch. */
  (function video() {
    var vids = [].slice.call(document.querySelectorAll('video[autoplay]'));
    if (!vids.length) return;

    // a lighter file on small screens, 2.5MB instead of 8.4MB
    if (window.matchMedia('(max-width: 900px)').matches) {
      vids.forEach(function (v) {
        var src = v.querySelector('source');
        if (src && src.src.indexOf('hero.mp4') > -1) {
          src.src = src.src.replace('hero.mp4', 'hero-mobile.mp4');
          v.load();
        }
      });
    }

    var pending = [];
    function tryPlay(v) {
      var p = v.play();
      if (p && p.catch) p.catch(function () { if (pending.indexOf(v) < 0) pending.push(v); });
    }
    vids.forEach(function (v) {
      v.muted = true;                       // iOS needs this set in JS as well as markup
      v.setAttribute('muted', '');
      v.playsInline = true;
      tryPlay(v);
      v.addEventListener('canplay', function () { tryPlay(v); }, { once: true });
    });

    // if the browser refused, the first real interaction unlocks it
    function unlock() {
      pending.forEach(function (v) { v.play().catch(function () {}); });
      pending = [];
      ['touchstart', 'pointerdown', 'scroll', 'keydown'].forEach(function (e) {
        window.removeEventListener(e, unlock);
      });
    }
    ['touchstart', 'pointerdown', 'scroll', 'keydown'].forEach(function (e) {
      window.addEventListener(e, unlock, { passive: true });
    });

    // and pause offscreen video so it never eats a phone battery
    if ('IntersectionObserver' in window) {
      var vo = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.play().catch(function () {}); }
          else { en.target.pause(); }
        });
      }, { threshold: 0.15 });
      vids.forEach(function (v) { vo.observe(v); });
    }
  })();
})();
