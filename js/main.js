/* ===================================================================
   M&E ASOCIADOS / AL GRANO — Main JavaScript
   Sticky header, hamburger menu, FAQ accordion, testimonials slider,
   blog feed, scroll reveal, WhatsApp tracking
   =================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initStickyHeader();
  initHamburgerMenu();
  initFaqAccordion();
  initTestimonialsSlider();
  initScrollReveal();
  initBlogFeed();
});

/* ── Sticky Header ─────────────────────────────────────────────────── */
function initStickyHeader() {
  const header = document.querySelector('.site-header');
  if (!header) return;

  let lastScroll = 0;
  window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    if (currentScroll > 60) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
    lastScroll = currentScroll;
  }, { passive: true });
}

/* ── Hamburger / Mobile Menu ───────────────────────────────────────── */
function initHamburgerMenu() {
  const hamburger = document.querySelector('.hamburger');
  const overlay = document.querySelector('.mobile-overlay');
  if (!hamburger || !overlay) return;

  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    overlay.classList.toggle('active');
    document.body.style.overflow = overlay.classList.contains('active') ? 'hidden' : '';
  });

  // Close when clicking a link
  overlay.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('active');
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    });
  });
}

/* ── FAQ Accordion ─────────────────────────────────────────────────── */
function initFaqAccordion() {
  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.parentElement;
      const isActive = item.classList.contains('active');

      // Close all siblings
      item.closest('.faq-list')?.querySelectorAll('.faq-item').forEach(el => {
        el.classList.remove('active');
      });

      // Toggle current
      if (!isActive) {
        item.classList.add('active');
      }
    });
  });
}

/* ── Testimonials Slider ───────────────────────────────────────────── */
function initTestimonialsSlider() {
  const track = document.querySelector('.testimonials-track');
  if (!track) return;

  const cards = track.querySelectorAll('.testimonial-card');
  const dotsContainer = document.querySelector('.testimonials-dots');
  const prevBtn = document.querySelector('.testimonial-prev');
  const nextBtn = document.querySelector('.testimonial-next');
  let current = 0;
  const total = cards.length;

  function goTo(index) {
    if (index < 0) index = total - 1;
    if (index >= total) index = 0;
    current = index;
    track.style.transform = `translateX(-${current * 100}%)`;

    // Update dots
    dotsContainer?.querySelectorAll('.dot').forEach((dot, i) => {
      dot.classList.toggle('active', i === current);
    });
  }

  prevBtn?.addEventListener('click', () => goTo(current - 1));
  nextBtn?.addEventListener('click', () => goTo(current + 1));

  dotsContainer?.querySelectorAll('.dot').forEach((dot, i) => {
    dot.addEventListener('click', () => goTo(i));
  });

  // Auto-play
  let autoPlay = setInterval(() => goTo(current + 1), 5000);

  // Pause on hover
  track.closest('.testimonials-slider')?.addEventListener('mouseenter', () => {
    clearInterval(autoPlay);
  });
  track.closest('.testimonials-slider')?.addEventListener('mouseleave', () => {
    autoPlay = setInterval(() => goTo(current + 1), 5000);
  });

  // Touch support
  let touchStartX = 0;
  let touchEndX = 0;
  track.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });
  track.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    if (touchStartX - touchEndX > 50) goTo(current + 1);
    if (touchEndX - touchStartX > 50) goTo(current - 1);
  }, { passive: true });
}

/* ── Scroll Reveal ─────────────────────────────────────────────────── */
function initScrollReveal() {
  const reveals = document.querySelectorAll('.reveal');
  if (!reveals.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  reveals.forEach(el => observer.observe(el));
}

/* ── Blog Feed (WP REST API with fallback) ─────────────────────────── */
function initBlogFeed() {
  const blogContainer = document.querySelector('#blog-feed');
  if (!blogContainer) return;

  const API_URL = 'https://www.myeasociados.com/wp-json/wp/v2/posts?per_page=3&_fields=id,title,excerpt,date,link,featured_media,_links&_embed';
  const CACHE_KEY = 'algrano_blog_cache';
  const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

  // Check cache first
  const cached = localStorage.getItem(CACHE_KEY);
  if (cached) {
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < CACHE_DURATION) {
      renderBlogPosts(data, blogContainer);
      return;
    }
  }

  // Show loading skeleton
  blogContainer.innerHTML = `
    <div class="blog-grid">
      ${[1,2,3].map(() => `
        <div class="blog-card">
          <div class="blog-card-img" style="background:#1a1a1a;"></div>
          <div class="blog-card-body">
            <div style="height:12px;background:#1a1a1a;width:60%;margin-bottom:12px;border-radius:4px;"></div>
            <div style="height:18px;background:#1a1a1a;width:90%;margin-bottom:8px;border-radius:4px;"></div>
            <div style="height:14px;background:#1a1a1a;width:70%;border-radius:4px;"></div>
          </div>
        </div>
      `).join('')}
    </div>
  `;

  fetch(API_URL)
    .then(res => {
      if (!res.ok) throw new Error('API error');
      return res.json();
    })
    .then(posts => {
      const data = posts.map(post => ({
        title: post.title.rendered,
        excerpt: post.excerpt.rendered.replace(/<[^>]+>/g, '').substring(0, 120) + '…',
        date: new Date(post.date).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }),
        link: post.link,
        image: post._embedded?.['wp:featuredmedia']?.[0]?.source_url || ''
      }));

      localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
      renderBlogPosts(data, blogContainer);
    })
    .catch(() => {
      renderBlogFallback(blogContainer);
    });
}

function renderBlogPosts(posts, container) {
  container.innerHTML = `
    <div class="blog-grid">
      ${posts.map(post => `
        <a href="${post.link}" target="_blank" rel="noopener" class="blog-card">
          <div class="blog-card-img">
            ${post.image ? `<img src="${post.image}" alt="${post.title}" loading="lazy">` : '<span style="color:#333;font-size:40px;">📰</span>'}
          </div>
          <div class="blog-card-body">
            <span class="blog-card-category">Blog</span>
            <h4>${post.title}</h4>
            <p>${post.excerpt}</p>
            <span class="blog-card-date">${post.date}</span>
          </div>
        </a>
      `).join('')}
    </div>
  `;
}

function renderBlogFallback(container) {
  const fallbackPosts = [
    {
      title: '¿Cómo obtener el registro sanitario INVIMA para su producto alimenticio?',
      excerpt: 'Conozca los pasos, requisitos y tiempos del trámite de registro sanitario INVIMA para alimentos en Colombia…',
      date: '2025',
      link: 'https://www.myeasociados.com/blog-empresarios-de-alimentos/'
    },
    {
      title: 'Resolución 810 de 2021: Lo que todo empresario de alimentos debe saber',
      excerpt: 'La nueva tabla nutricional en Colombia ya es obligatoria. Entérese de los cambios y cómo cumplir…',
      date: '2025',
      link: 'https://www.myeasociados.com/blog-empresarios-de-alimentos/'
    },
    {
      title: '¿Cada cuánto se renueva el curso de manipulación de alimentos?',
      excerpt: 'Descubra quiénes están obligados a tener el certificado y con qué frecuencia debe renovarlo…',
      date: '2025',
      link: 'https://www.myeasociados.com/blog-empresarios-de-alimentos/'
    }
  ];

  container.innerHTML = `
    <div class="blog-grid">
      ${fallbackPosts.map(post => `
        <a href="${post.link}" target="_blank" rel="noopener" class="blog-card">
          <div class="blog-card-img"><span style="color:#333;font-size:40px;">📰</span></div>
          <div class="blog-card-body">
            <span class="blog-card-category">Blog</span>
            <h4>${post.title}</h4>
            <p>${post.excerpt}</p>
            <span class="blog-card-date">${post.date}</span>
          </div>
        </a>
      `).join('')}
    </div>
  `;
}

/* ── WhatsApp Click Tracking ───────────────────────────────────────── */
document.querySelectorAll('a[href*="wa.me"]').forEach(link => {
  link.addEventListener('click', () => {
    if (typeof gtag === 'function') {
      gtag('event', 'whatsapp_click', {
        event_category: 'contact',
        event_label: link.closest('section')?.id || 'general'
      });
    }
  });
});
