// =============================================
//  SCCS â€” Interactive JavaScript
// =============================================

// ---- Navbar Scroll Effect ----
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  if (window.scrollY > 30) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
});

// ---- Hamburger Menu ----
const hamburger = document.getElementById('hamburger');
const navLinks  = document.getElementById('nav-links');

hamburger.addEventListener('click', () => {
  navLinks.classList.toggle('open');
  // Animate bars
  const bars = hamburger.querySelectorAll('span');
  if (navLinks.classList.contains('open')) {
    bars[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
    bars[1].style.opacity   = '0';
    bars[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
  } else {
    bars[0].style.transform = '';
    bars[1].style.opacity   = '1';
    bars[2].style.transform = '';
  }
});

// Close nav when nav link is clicked
document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    hamburger.querySelectorAll('span').forEach(b => {
      b.style.transform = '';
      b.style.opacity   = '1';
    });
  });
});

// ---- Intersection Observer for Scroll Animations ----
const animatables = [
  '.feature-card',
  '.timeline-step',
  '.impact-card',
  '.roadmap-item',
  '.portal-card',
  '.impact-testimonial',
  '.hero-stats',
  '.section-header',
];

function setupScrollAnimations() {
  const elements = document.querySelectorAll(animatables.join(','));
  elements.forEach(el => el.classList.add('animate-on-scroll'));

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          // stagger siblings
          const siblings = [...entry.target.parentElement.children].filter(c =>
            c.classList.contains('animate-on-scroll') && !c.classList.contains('in-view')
          );
          const idx = siblings.indexOf(entry.target);
          setTimeout(() => {
            entry.target.classList.add('in-view');
          }, idx * 80);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  elements.forEach(el => observer.observe(el));
}

setupScrollAnimations();

// ---- Smooth Active Nav Highlighting ----
const sections = document.querySelectorAll('section[id]');
const navLinkEls = document.querySelectorAll('.nav-link');

function highlightNavOnScroll() {
  const scrollY = window.scrollY + 120;
  sections.forEach(section => {
    if (
      scrollY >= section.offsetTop &&
      scrollY < section.offsetTop + section.offsetHeight
    ) {
      navLinkEls.forEach(link => {
        link.style.color = '';
        link.style.background = '';
      });
      const active = document.querySelector(`.nav-link[href="#${section.id}"]`);
      if (active) {
        active.style.color = '#a78bfa';
        active.style.background = 'rgba(124,58,237,0.1)';
      }
    }
  });
}

window.addEventListener('scroll', highlightNavOnScroll);

// ---- Send Button Animation ----
const sendBtn = document.getElementById('send-btn');
if (sendBtn) {
  sendBtn.addEventListener('click', () => {
    sendBtn.style.transform = 'scale(0.85) rotate(-15deg)';
    setTimeout(() => {
      sendBtn.style.transform = '';
    }, 250);
  });
}

// ---- Portal Button Ripple Effect ----
function addRipple(btn, colorRgba) {
  btn.addEventListener('click', function (e) {
    const ripple = document.createElement('span');
    const size = Math.max(btn.offsetWidth, btn.offsetHeight);
    const x = e.clientX - btn.getBoundingClientRect().left - size / 2;
    const y = e.clientY - btn.getBoundingClientRect().top  - size / 2;

    ripple.style.cssText = `
      position: absolute;
      width: ${size}px; height: ${size}px;
      top: ${y}px; left: ${x}px;
      background: ${colorRgba};
      border-radius: 50%;
      transform: scale(0);
      animation: rippleAnim 0.55s ease-out;
      pointer-events: none;
    `;
    btn.style.position = 'relative';
    btn.style.overflow = 'hidden';
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  });
}

// Inject keyframe
const style = document.createElement('style');
style.textContent = `
  @keyframes rippleAnim {
    to { transform: scale(2.5); opacity: 0; }
  }
`;
document.head.appendChild(style);

const studentBtn = document.getElementById('student-login-btn');
const teacherBtn = document.getElementById('teacher-login-btn');
if (studentBtn) addRipple(studentBtn, 'rgba(6,182,212,0.3)');
if (teacherBtn) addRipple(teacherBtn, 'rgba(124,58,237,0.3)');

// ---- Mockup Live Update Simulation ----
const questionData = [
  { icon: 'ðŸ¤”', text: 'Can you re-explain <strong>recursion</strong> with a real-world example?', votes: 7 },
  { icon: 'ðŸ’¬', text: 'What is the time complexity of <strong>merge sort</strong>?', votes: 14 },
  { icon: 'ðŸ§ ', text: 'How does <strong>dynamic programming</strong> differ from greedy algorithms?', votes: 5 },
  { icon: 'â“', text: 'What is the purpose of <strong>virtual memory</strong> in an OS?', votes: 9 },
  { icon: 'ðŸ”', text: 'Can you explain <strong>Big-O notation</strong> again with examples?', votes: 11 },
];

let qIndex = questionData.length; // start cycling after existing cards

function cycleQuestion() {
  const body = document.querySelector('.mockup-body');
  if (!body) return;

  const cards = body.querySelectorAll('.question-card');
  if (cards.length === 0) return;

  // fade out oldest
  const oldest = cards[0];
  oldest.style.transition = 'opacity 0.4s, transform 0.4s';
  oldest.style.opacity = '0';
  oldest.style.transform = 'translateX(-20px)';

  setTimeout(() => {
    oldest.remove();

    const data = questionData[qIndex % questionData.length];
    qIndex++;

    const newCard = document.createElement('div');
    newCard.className = 'question-card';
    newCard.style.opacity = '0';
    newCard.style.transform = 'translateY(12px)';
    newCard.innerHTML = `
      <div class="q-icon">${data.icon}</div>
      <div class="q-content">
        <p>${data.text}</p>
        <span class="q-meta">Anonymous Â· just now</span>
      </div>
      <div class="q-votes">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4l8 8H4z"/></svg>
        <span>${data.votes}</span>
      </div>
    `;
    body.appendChild(newCard);

    requestAnimationFrame(() => {
      newCard.style.transition = 'opacity 0.4s, transform 0.4s';
      newCard.style.opacity = '1';
      newCard.style.transform = 'translateY(0)';
    });
  }, 450);
}

// cycle every 3.5 seconds
setInterval(cycleQuestion, 3500);

// ---- Number Counter Animation ----
function animateCounters() {
  document.querySelectorAll('.stat-num').forEach(el => {
    const text = el.textContent.trim();
    // only animate if it's purely numeric (like a percent)
    if (/^\d+%$/.test(text)) {
      const target = parseInt(text);
      let current = 0;
      const step = Math.ceil(target / 40);
      const timer = setInterval(() => {
        current = Math.min(current + step, target);
        el.textContent = current + '%';
        if (current >= target) clearInterval(timer);
      }, 30);
    }
  });
}

// Trigger once hero is visible
const heroObserver = new IntersectionObserver(entries => {
  if (entries[0].isIntersecting) {
    setTimeout(animateCounters, 600);
    heroObserver.disconnect();
  }
}, { threshold: 0.3 });

const heroEl = document.getElementById('hero');
if (heroEl) heroObserver.observe(heroEl);

// ---- Tooltip on send button ----
if (sendBtn) {
  sendBtn.title = 'Submit anonymously';
}

console.log('%cðŸŽ“ SCCS | Silent Classroom Communication System', 'font-size:16px;font-weight:bold;color:#7c3aed;');
console.log('%cBuilt by SD Team', 'font-size:12px;color:#06b6d4;');

