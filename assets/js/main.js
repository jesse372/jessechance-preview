/* Jesse Chance — site behaviour */
(function () {
  'use strict';

  /* ---------- Year ---------- */
  var yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();

  /* ---------- Sticky header ---------- */
  var header = document.getElementById('header');
  if (header && !header.classList.contains('solid')) {
    var onScroll = function () {
      header.classList.toggle('scrolled', window.scrollY > 60);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- Mobile menu ---------- */
  var burger = document.getElementById('burger');
  var menu = document.getElementById('mobileMenu');
  if (burger && menu) {
    burger.addEventListener('click', function () {
      var open = menu.classList.toggle('open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.style.overflow = open ? 'hidden' : '';
    });
    menu.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        menu.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    });
  }

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Hero film ----------
     Autoplay is refused in some contexts (low power mode, data saver, older
     iOS). If it doesn't actually start, drop the video so the poster shows
     rather than leaving a frozen first frame. */
  var heroVideo = document.querySelector('.hero-video');
  if (heroVideo) {
    if (reduceMotion) {
      heroVideo.classList.add('failed');
      heroVideo.removeAttribute('autoplay');
      try { heroVideo.pause(); } catch (e) {}
    } else {
      heroVideo.addEventListener('error', function () { heroVideo.classList.add('failed'); });
      var playAttempt = heroVideo.play();
      if (playAttempt && typeof playAttempt.catch === 'function') {
        playAttempt.catch(function () { heroVideo.classList.add('failed'); });
      }
      // If it still hasn't advanced after 3s, assume it isn't going to.
      setTimeout(function () {
        if (heroVideo.readyState < 2 || heroVideo.paused || heroVideo.currentTime === 0) {
          heroVideo.classList.add('failed');
        }
      }, 3000);
      // Don't burn battery/data off-screen
      document.addEventListener('visibilitychange', function () {
        if (document.hidden) { try { heroVideo.pause(); } catch (e) {} }
        else if (!heroVideo.classList.contains('failed')) { heroVideo.play().catch(function(){}); }
      });
    }
  }

  /* ---------- Hero slideshow ---------- */
  var heroMedia = document.querySelector('.hero-media');
  if (heroMedia) {
    var slides = Array.prototype.slice.call(heroMedia.querySelectorAll('img'));
    if (slides.length) {
      var current = 0;
      var dotsWrap = document.querySelector('.hero-dots');
      var dots = [];

      var paint = function (i) {
        slides.forEach(function (s, n) { s.classList.toggle('on', n === i); });
        dots.forEach(function (d, n) {
          d.setAttribute('aria-current', n === i ? 'true' : 'false');
        });
        current = i;
      };

      if (dotsWrap && slides.length > 1) {
        slides.forEach(function (s, n) {
          var b = document.createElement('button');
          b.type = 'button';
          b.setAttribute('aria-label', 'Show image ' + (n + 1));
          b.addEventListener('click', function () { paint(n); restart(); });
          dotsWrap.appendChild(b);
          dots.push(b);
        });
      }

      paint(0);

      var timer = null;
      var restart = function () {
        if (timer) clearInterval(timer);
        if (slides.length < 2 || reduceMotion) return;
        timer = setInterval(function () {
          paint((current + 1) % slides.length);
        }, 6500);
      };

      // Only start once the 2nd image has loaded, so the first swap isn't blank
      var second = slides[1];
      if (second) {
        if (second.complete) restart();
        else second.addEventListener('load', restart, { once: true });
      }

      // Pause when the tab is hidden
      document.addEventListener('visibilitychange', function () {
        if (document.hidden) { if (timer) clearInterval(timer); }
        else restart();
      });
    }
  }

  /* ---------- Sticky booking bar (mobile) ---------- */
  var bookBar = document.querySelector('.book-bar');
  if (bookBar) {
    var trigger = document.querySelector('.hero, .venue-hero, .page-head');
    var showBar = function () {
      var past = trigger
        ? trigger.getBoundingClientRect().bottom < 0
        : window.scrollY > 600;
      bookBar.classList.toggle('up', past);
    };
    showBar();
    window.addEventListener('scroll', showBar, { passive: true });
    // Never cover the menu
    if (menu) {
      var mo = new MutationObserver(function () {
        if (menu.classList.contains('open')) bookBar.classList.remove('up');
        else showBar();
      });
      mo.observe(menu, { attributes: true, attributeFilter: ['class'] });
    }
  }

  /* ---------- Fade images in as they decode ---------- */
  // Hero slides are excluded — the slideshow owns their opacity.
  var lazyImgs = Array.prototype.filter.call(
    document.querySelectorAll('img[loading="lazy"]'),
    function (img) { return !img.closest('.hero-media'); }
  );
  Array.prototype.forEach.call(lazyImgs, function (img) {
    if (img.complete && img.naturalWidth > 0) img.classList.add('loaded');
    else img.addEventListener('load', function () { img.classList.add('loaded'); }, { once: true });
    // Never leave an image invisible if it errors
    img.addEventListener('error', function () { img.classList.add('loaded'); }, { once: true });
  });
  // Safety net: reveal any stragglers
  setTimeout(function () {
    Array.prototype.forEach.call(lazyImgs, function (img) { img.classList.add('loaded'); });
  }, 4000);

  /* ---------- Parallax on full-bleed bands ---------- */
  var bands = document.querySelectorAll('.band');
  if (bands.length && !reduceMotion) {
    var ticking = false;
    var moveBands = function () {
      Array.prototype.forEach.call(bands, function (band) {
        var img = band.querySelector('img');
        if (!img) return;
        var r = band.getBoundingClientRect();
        if (r.bottom < 0 || r.top > window.innerHeight) return;
        var progress = (r.top + r.height) / (window.innerHeight + r.height);
        img.style.transform = 'translateY(' + ((progress - 0.5) * -12) + '%)';
      });
      ticking = false;
    };
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(moveBands); }
    }, { passive: true });
    moveBands();
  }

  /* ---------- Reveal on scroll ---------- */
  var revealEls = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  if (revealEls.length) {
    var showAll = function () {
      revealEls.forEach(function (el) { el.classList.add('in'); });
    };

    if (!('IntersectionObserver' in window) ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      showAll();
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          // Reveal anything intersecting, and anything already scrolled past.
          if (entry.isIntersecting || entry.boundingClientRect.top < 0) {
            entry.target.classList.add('in');
            io.unobserve(entry.target);
          }
        });
      }, { rootMargin: '120px 0px -8% 0px', threshold: 0 });

      revealEls.forEach(function (el) { io.observe(el); });

      // Safety nets — content must never stay invisible.
      // 1) Anything above the fold on load reveals immediately.
      requestAnimationFrame(function () {
        revealEls.forEach(function (el) {
          if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add('in');
        });
      });
      // 2) Hard fallback: if anything is still hidden after 3s, show it.
      setTimeout(showAll, 3000);
      // 3) Reaching the bottom of the page reveals everything.
      window.addEventListener('scroll', function () {
        if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 200) showAll();
      }, { passive: true });
    }
  }

  /* ---------- Package tabs (packages page) ---------- */
  var tablist = document.querySelector('[role="tablist"]');
  if (tablist) {
    var tabs = Array.prototype.slice.call(tablist.querySelectorAll('[role="tab"]'));
    var select = function (tab) {
      tabs.forEach(function (t) {
        var selected = t === tab;
        t.setAttribute('aria-selected', selected ? 'true' : 'false');
        t.setAttribute('tabindex', selected ? '0' : '-1');
        var panel = document.getElementById(t.getAttribute('aria-controls'));
        if (panel) panel.hidden = !selected;
      });
    };
    // Panels start visible in the HTML so the page still works without JS.
    // Now that JS is running, collapse to the selected tab.
    var initial = tabs.filter(function (t) { return t.getAttribute('aria-selected') === 'true'; })[0] || tabs[0];
    select(initial);

    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { select(tab); });
      tab.addEventListener('keydown', function (e) {
        var dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (!dir) return;
        e.preventDefault();
        var next = tabs[(i + dir + tabs.length) % tabs.length];
        next.focus();
        select(next);
      });
    });
  }

  /* ---------- Lightbox (work page) ---------- */
  var BLANK = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
  var figures = Array.prototype.slice.call(document.querySelectorAll('[data-lightbox]'));
  if (figures.length) {
    var lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.setAttribute('aria-label', 'Photo viewer');
    lb.innerHTML =
      '<button class="lb-close" aria-label="Close">&#10005;</button>' +
      '<button class="lb-prev" aria-label="Previous">&#8249;</button>' +
      '<img alt="" src=' + JSON.stringify(BLANK) + '>' +
      '<button class="lb-next" aria-label="Next">&#8250;</button>' +
      '<span class="lb-count"></span>';
    document.body.appendChild(lb);

    var lbImg = lb.querySelector('img');
    var lbCount = lb.querySelector('.lb-count');
    var idx = 0;
    var lastFocus = null;

    var show = function (i) {
      idx = (i + figures.length) % figures.length;
      var src = figures[idx].getAttribute('data-lightbox');
      var img = figures[idx].querySelector('img');
      lbImg.src = src;
      lbImg.alt = img ? img.alt : '';
      lbCount.textContent = (idx + 1) + ' / ' + figures.length;
    };
    var open = function (i) {
      lastFocus = document.activeElement;
      show(i);
      lb.classList.add('open');
      document.body.style.overflow = 'hidden';
      lb.querySelector('.lb-close').focus();
    };
    var close = function () {
      lb.classList.remove('open');
      document.body.style.overflow = '';
      lbImg.src = BLANK;
      if (lastFocus) lastFocus.focus();
    };

    figures.forEach(function (fig, i) {
      fig.setAttribute('tabindex', '0');
      fig.setAttribute('role', 'button');
      fig.addEventListener('click', function () { open(i); });
      fig.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(i); }
      });
    });

    lb.querySelector('.lb-close').addEventListener('click', close);
    lb.querySelector('.lb-prev').addEventListener('click', function () { show(idx - 1); });
    lb.querySelector('.lb-next').addEventListener('click', function () { show(idx + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') show(idx - 1);
      if (e.key === 'ArrowRight') show(idx + 1);
    });
  }

  /* ---------- Package context from ?package= ----------
     Two jobs:
     1. Pre-select it in the interim form (same-origin, so this works).
     2. Show it on the page as text. Once the Studio Ninja iframe is in place
        we can't reach inside it (cross-origin), so this banner is the only way
        the couple's chosen package survives the click. */
  var PACKAGES = {
    'bronze':         ['Photography · Bronze', '$799 · up to 1.5 hours'],
    'silver':         ['Photography · Silver', '$1,499 · up to 3 hours'],
    'gold':           ['Photography · Gold', '$2,499 · up to 5 hours'],
    'diamond':        ['Photography · Diamond', '$3,499 · up to 9 hours'],
    'video-gold':     ['Wedding Film · Gold', '$2,499 · up to 5 hours'],
    'video-diamond':  ['Wedding Film · Diamond', '$3,499 · up to 9 hours'],
    'booth-bronze':   ['Photo Booth · Bronze', '$799 · 3 hours'],
    'booth-silver':   ['Photo Booth · Silver', '$899 · 4 hours'],
    'booth-gold':     ['Photo Booth · Gold', '$1,099 · 6 hours'],
    'photo-video':    ['Photo + Film', 'combined quote'],
    'everything':     ['Photo + Film + Booth', 'combined quote']
  };

  var params = new URLSearchParams(window.location.search);
  var pkg = params.get('package');
  if (pkg) {
    var key = pkg.toLowerCase();

    // 1. Interim form
    var sel = document.getElementById('package');
    if (sel) {
      Array.prototype.slice.call(sel.options).forEach(function (o) {
        if (o.value.toLowerCase() === key) sel.value = o.value;
      });
    }

    // 2. Visible context banner
    var ctx = document.getElementById('pkgContext');
    var known = PACKAGES[key];
    if (ctx && known) {
      var nameEl = document.getElementById('pkgName');
      var priceEl = document.getElementById('pkgPrice');
      if (nameEl) nameEl.textContent = known[0];
      if (priceEl) priceEl.textContent = ' — ' + known[1];
      ctx.hidden = false;
    }
  }

  /* ---------- Mark empty embed / video slots ----------
     CSS :empty can't be used: each slot holds an HTML comment on its own line,
     so whitespace text nodes stop :empty from matching. Flag them here instead. */
  Array.prototype.forEach.call(
    document.querySelectorAll('.video-slot, .embed-slot'),
    function (el) {
      el.classList.toggle('is-empty', el.children.length === 0);
    }
  );

  /* ---------- Studio Ninja embed takes over from the fallback form ----------
     If an embed has been pasted into .embed-slot, hide the interim form so the
     page never shows two enquiry forms (in case the fallback wasn't deleted). */
  var slot = document.querySelector('.embed-slot');
  var fallbackForm = document.querySelector('form.enquiry');
  if (slot && fallbackForm && slot.children.length > 0) {
    fallbackForm.hidden = true;
  }

  /* ---------- Enquiry form (front-end validation + mailto fallback) ---------- */
  var form = document.querySelector('form.enquiry');
  if (form) {
    form.addEventListener('submit', function (e) {
      // If no backend action is configured, fall back to a prefilled email.
      if (!form.getAttribute('action')) {
        e.preventDefault();
        var get = function (n) {
          var el = form.elements[n];
          return el ? String(el.value || '').trim() : '';
        };
        var body = [
          'Name: ' + get('name'),
          'Email: ' + get('email'),
          'Phone: ' + get('phone'),
          'Wedding date: ' + get('date'),
          'Venue / location: ' + get('venue'),
          'Interested in: ' + get('package'),
          '',
          get('message')
        ].join('\n');
        window.location.href = 'mailto:jesse@jessechance.com' +
          '?subject=' + encodeURIComponent('Wedding enquiry — ' + (get('name') || 'New enquiry')) +
          '&body=' + encodeURIComponent(body);
      }
    });
  }
})();
