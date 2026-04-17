// ❀ © 2026 Capski. All Rights Reserved. ❀
// 3D Scanner Website - Enhanced Animations & Image Magnification

document.addEventListener('DOMContentLoaded', () => {
  // ========== SMOOTH SCROLLING ==========
  const tocLinks = document.querySelectorAll('.toc-link');
  tocLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const targetId = this.getAttribute('href').substring(1);
      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });

  // ========== IMAGE MAGNIFICATION (LIGHTBOX) ==========
  // Select all images that should be clickable
  const clickableImages = document.querySelectorAll('.responsive-img, .gallery-img, .wiring-img');
  
  // Create lightbox overlay
  const lightbox = document.createElement('div');
  lightbox.id = 'lightbox';
  lightbox.innerHTML = `
    <div class="lightbox-overlay">
      <div class="lightbox-container">
        <button class="lightbox-close">&times;</button>
        <button class="lightbox-prev">‹</button>
        <button class="lightbox-next">›</button>
        <img class="lightbox-image" src="" alt="Magnified view">
        <div class="lightbox-caption"></div>
      </div>
    </div>
  `;
  document.body.appendChild(lightbox);
  
  const lightboxOverlay = document.querySelector('.lightbox-overlay');
  const lightboxImg = document.querySelector('.lightbox-image');
  const lightboxCaption = document.querySelector('.lightbox-caption');
  const closeBtn = document.querySelector('.lightbox-close');
  const prevBtn = document.querySelector('.lightbox-prev');
  const nextBtn = document.querySelector('.lightbox-next');
  
  let currentImageIndex = 0;
  let allImages = [];
  
  // Collect all clickable images
  function updateImageList() {
    allImages = Array.from(document.querySelectorAll('.responsive-img, .gallery-img'));
  }
  
  // Open lightbox
  function openLightbox(index) {
    updateImageList();
    if (allImages.length === 0) return;
    
    currentImageIndex = index;
    const img = allImages[currentImageIndex];
    lightboxImg.src = img.src;
    
    // Get caption from parent or alt text
    let caption = img.alt || '';
    const parentItem = img.closest('.gallery-item');
    if (parentItem) {
      const captionText = parentItem.querySelector('p');
      if (captionText) caption = captionText.innerText;
    } else {
      const figCaption = img.closest('.image-placeholder')?.querySelector('.caption');
      if (figCaption) caption = figCaption.innerText;
    }
    
    lightboxCaption.textContent = caption;
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Add keyboard listeners
    document.addEventListener('keydown', handleKeydown);
  }
  
  // Close lightbox
  function closeLightbox() {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
    document.removeEventListener('keydown', handleKeydown);
  }
  
  // Navigate images
  function prevImage() {
    currentImageIndex = (currentImageIndex - 1 + allImages.length) % allImages.length;
    const img = allImages[currentImageIndex];
    lightboxImg.src = img.src;
    
    let caption = img.alt || '';
    const parentItem = img.closest('.gallery-item');
    if (parentItem) {
      const captionText = parentItem.querySelector('p');
      if (captionText) caption = captionText.innerText;
    }
    lightboxCaption.textContent = caption;
  }
  
  function nextImage() {
    currentImageIndex = (currentImageIndex + 1) % allImages.length;
    const img = allImages[currentImageIndex];
    lightboxImg.src = img.src;
    
    let caption = img.alt || '';
    const parentItem = img.closest('.gallery-item');
    if (parentItem) {
      const captionText = parentItem.querySelector('p');
      if (captionText) caption = captionText.innerText;
    }
    lightboxCaption.textContent = caption;
  }
  
  function handleKeydown(e) {
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') prevImage();
    if (e.key === 'ArrowRight') nextImage();
  }
  
  // Add click listeners to images
  function addImageClickListeners() {
    const images = document.querySelectorAll('.responsive-img, .gallery-img');
    images.forEach((img, index) => {
      img.style.cursor = 'pointer';
      img.setAttribute('data-index', index);
      img.addEventListener('click', (e) => {
        e.stopPropagation();
        openLightbox(parseInt(img.getAttribute('data-index')));
      });
    });
  }
  
  // Listen for dynamic image additions (for future updates)
  const observer = new MutationObserver(() => {
    addImageClickListeners();
  });
  observer.observe(document.body, { childList: true, subtree: true });
  
  // Initial setup
  addImageClickListeners();
  
  // Lightbox button events
  closeBtn.addEventListener('click', closeLightbox);
  prevBtn.addEventListener('click', prevImage);
  nextBtn.addEventListener('click', nextImage);
  lightboxOverlay.addEventListener('click', (e) => {
    if (e.target === lightboxOverlay) closeLightbox();
  });
  
  // ========== SCROLL REVEAL ANIMATIONS (Intersection Observer) ==========
  const animatedElements = document.querySelectorAll('.card, .gallery-item, .part-card, .attach-item');
  
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -20px 0px' });
  
  animatedElements.forEach(el => {
    el.classList.add('animate-on-scroll');
    revealObserver.observe(el);
  });
  
  // ========== HOVER EFFECTS FOR BUTTONS ==========
  const buttons = document.querySelectorAll('.btn-placeholder, .toc-link');
  buttons.forEach(btn => {
    btn.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-2px)';
    });
    btn.addEventListener('mouseleave', function() {
      this.style.transform = 'translateY(0)';
    });
  });
  
  // ========== HOVER ZOOM EFFECT FOR GALLERY IMAGES ==========
  const galleryImages = document.querySelectorAll('.gallery-img');
  galleryImages.forEach(img => {
    img.addEventListener('mouseenter', function() {
      this.style.transform = 'scale(1.05)';
    });
    img.addEventListener('mouseleave', function() {
      this.style.transform = 'scale(1)';
    });
  });
  
  // ========== TYPEWRITER EFFECT FOR HERO SUBTITLE (Optional) ==========
  const subtitle = document.querySelector('.subtitle');
  if (subtitle && !subtitle.hasAttribute('data-typed')) {
    const originalText = subtitle.innerText;
    subtitle.innerText = '';
    subtitle.setAttribute('data-typed', 'true');
    
    let i = 0;
    function typeWriter() {
      if (i < originalText.length) {
        subtitle.innerText += originalText.charAt(i);
        i++;
        setTimeout(typeWriter, 50);
      }
    }
    typeWriter();
  }
  
  // ========== NAVBAR SCROLL EFFECT ==========
  let lastScroll = 0;
  window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    const tocCard = document.querySelector('.toc-card');
    if (tocCard) {
      if (currentScroll > 100) {
        tocCard.style.boxShadow = '0 4px 20px rgba(0,0,0,0.4)';
      } else {
        tocCard.style.boxShadow = '';
      }
    }
  });
  
  // ========== TOOLTIP FOR ATTACHMENT ITEMS ==========
  const attachItems = document.querySelectorAll('.attach-item');
  attachItems.forEach(item => {
    item.addEventListener('mouseenter', () => {
      item.style.transition = 'all 0.2s';
      item.style.transform = 'translateX(4px)';
    });
    item.addEventListener('mouseleave', () => {
      item.style.transform = 'translateX(0)';
    });
  });
  
  // ========== UPDATE FOOTER DATE ==========
  const footer = document.querySelector('.footer p');
  if (footer) {
    const date = new Date();
    const formattedDate = `${date.toLocaleDateString('en-PH')}`;
    if (!footer.innerHTML.includes('updated')) {
      footer.innerHTML += ` <span style="opacity:0.6;">| updated ${formattedDate}</span>`;
    }
  }
  
  console.log('✨ Website enhanced with lightbox and animations!');
});

// ========== SCROLL REVEAL - REVEAL CONTENT AS YOU SCROLL ==========
// Select all elements to reveal
const revealElements = document.querySelectorAll('.card, .gallery-item, .part-card, .attach-item, .toc-card');

// Add reveal class to each element
revealElements.forEach(el => {
  el.classList.add('reveal-on-scroll');
});

// Create intersection observer for scroll reveal
const scrollRevealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('revealed');
      // Optional: keep observing for repeated animations
      // scrollRevealObserver.unobserve(entry.target);
    }
  });
}, { 
  threshold: 0.15,  // Trigger when 15% of element is visible
  rootMargin: '0px 0px -50px 0px'  // Slight offset for better timing
});

// Observe all reveal elements
revealElements.forEach(el => {
  scrollRevealObserver.observe(el);
});

// ========== SCROLL INDICATOR CLICK BEHAVIOR ==========
const scrollIndicator = document.querySelector('.scroll-indicator');
if (scrollIndicator) {
  scrollIndicator.addEventListener('click', () => {
    const firstCard = document.querySelector('.card');
    if (firstCard) {
      firstCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
}

// ========== HIDE SCROLL INDICATOR AFTER FIRST SCROLL ==========
let hasScrolled = false;
window.addEventListener('scroll', () => {
  if (!hasScrolled && window.scrollY > 100) {
    hasScrolled = true;
    const indicator = document.querySelector('.scroll-indicator');
    if (indicator) {
      indicator.style.opacity = '0';
      indicator.style.pointerEvents = 'none';
      setTimeout(() => {
        if (indicator) indicator.style.display = 'none';
      }, 500);
    }
  }
});

// ========== PARALLAX EFFECT ON HERO (Optional) ==========
window.addEventListener('scroll', () => {
  const hero = document.querySelector('.fullscreen-hero');
  if (hero) {
    const scrolled = window.pageYOffset;
    hero.style.transform = `translateY(${scrolled * 0.3}px)`;
    hero.style.opacity = 1 - (scrolled / 800);
  }
});

console.log('✨ Scroll reveal animations active!');

// ========== STICKY CENTERED TITLE ON SCROLL ==========
// Create sticky title element
const stickyTitle = document.createElement('div');
stickyTitle.className = 'sticky-title';
stickyTitle.innerHTML = `
  <h1>3D Optical Scanner</h1>
  <p>TEM Analogy · Real‑time 3D Reconstruction · DIY Instrumentation</p>
`;
document.body.insertBefore(stickyTitle, document.body.firstChild);

// Show/hide sticky title based on scroll position
const heroSection = document.querySelector('.fullscreen-hero');
if (heroSection) {
  window.addEventListener('scroll', () => {
    const heroBottom = heroSection.offsetTop + heroSection.offsetHeight;
    const scrollPosition = window.scrollY + 100;
    
    if (scrollPosition > heroBottom) {
      stickyTitle.classList.add('visible');
    } else {
      stickyTitle.classList.remove('visible');
    }
  });
}
