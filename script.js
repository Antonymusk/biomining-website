document.addEventListener('DOMContentLoaded', () => {
  // 1. Mouse Follow Glow
  const glow = document.getElementById('cursor-glow');
  
  document.addEventListener('mousemove', (e) => {
      // Small delay for smooth follow effect
      requestAnimationFrame(() => {
          glow.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`;
      });
  });

  // Highlight glow when hovering over interactive elements
  const interactives = document.querySelectorAll('a, button, .interactive-card');
  interactives.forEach(el => {
      el.addEventListener('mouseenter', () => {
          glow.style.background = 'radial-gradient(circle, rgba(173, 198, 255, 0.15) 0%, rgba(12, 19, 33, 0) 50%)';
          glow.style.width = '800px';
          glow.style.height = '800px';
      });
      el.addEventListener('mouseleave', () => {
          glow.style.background = 'radial-gradient(circle, rgba(173, 198, 255, 0.08) 0%, rgba(12, 19, 33, 0) 60%)';
          glow.style.width = '600px';
          glow.style.height = '600px';
      });
  });

  // 2. Intersection Observer for Scroll Reveals
  const revealElements = document.querySelectorAll('.scroll-reveal');
  const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.15
  };

  const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
          if (entry.isIntersecting) {
              entry.target.classList.add('is-visible');
              
              // Trigger counters if they exist in this section
              const counters = entry.target.querySelectorAll('.counter');
              counters.forEach(counter => startCounter(counter));
              
              observer.unobserve(entry.target);
          }
      });
  }, observerOptions);

  revealElements.forEach(el => revealObserver.observe(el));

  // 3. Animated Counters
  function startCounter(counter) {
      const target = parseFloat(counter.getAttribute('data-target'));
      const duration = 2000; // 2 seconds
      const stepTime = 20;
      const steps = duration / stepTime;
      const increment = target / steps;
      let current = 0;

      const timer = setInterval(() => {
          current += increment;
          if (current >= target) {
              clearInterval(timer);
              current = target;
          }
          
          // Format based on whether it has decimals
          if (target % 1 !== 0) {
              counter.innerText = current.toFixed(1);
          } else {
              counter.innerText = Math.floor(current);
          }
      }, stepTime);
  }

  // 4. Parallax Scroll Effect
  const parallaxElements = document.querySelectorAll('.parallax');
  
  window.addEventListener('scroll', () => {
      const scrollY = window.scrollY;
      
      parallaxElements.forEach(el => {
          const speed = el.getAttribute('data-speed') || 0.1;
          const yPos = -(scrollY * speed);
          el.style.transform = `translateY(${yPos}px)`;
      });

      // Navbar glassmorphism adjust on scroll
      const nav = document.querySelector('.navbar');
      if (scrollY > 50) {
          nav.style.background = 'rgba(12, 19, 33, 0.8)';
          nav.style.boxShadow = '0 4px 30px rgba(0, 0, 0, 0.5)';
      } else {
          nav.style.background = 'rgba(12, 19, 33, 0.6)';
          nav.style.boxShadow = 'none';
      }
  });

  // 5. 3D Tilt Effect on Hero Mockup
  const tiltWrapper = document.querySelector('.hero-mockup-wrapper');
  const tiltElement = document.getElementById('hero-tilt');
  
  if (tiltWrapper && tiltElement) {
      tiltWrapper.addEventListener('mousemove', (e) => {
          const rect = tiltWrapper.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          
          // Calculate rotation between -5 and 5 degrees
          const xRotation = -((y - rect.height / 2) / rect.height) * 10;
          const yRotation = ((x - rect.width / 2) / rect.width) * 10;
          
          tiltElement.style.transform = `perspective(1000px) rotateX(${xRotation}deg) rotateY(${yRotation}deg) scale3d(1.02, 1.02, 1.02)`;
          
          // Adjust reflection
          const reflection = document.querySelector('.mockup-reflection');
          if (reflection) {
              reflection.style.background = `linear-gradient(${135 + xRotation * 2}deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 50%)`;
          }
      });
      
      tiltWrapper.addEventListener('mouseleave', () => {
          tiltElement.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
          const reflection = document.querySelector('.mockup-reflection');
          if (reflection) {
              reflection.style.background = `linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 50%)`;
          }
      });
  }

  // 6. Particle Canvas Background
  const canvas = document.getElementById('particle-canvas');
  if (canvas) {
      const ctx = canvas.getContext('2d');
      let width, height;
      let particles = [];

      function initCanvas() {
          width = canvas.width = window.innerWidth;
          height = canvas.height = window.innerHeight;
      }

      class Particle {
          constructor() {
              this.x = Math.random() * width;
              this.y = Math.random() * height;
              this.size = Math.random() * 2;
              this.speedX = Math.random() * 0.5 - 0.25;
              this.speedY = Math.random() * 0.5 - 0.25;
              // Primary, Secondary, or Tertiary color
              const colors = ['#adc6ff', '#ddb7ff', '#4cd7f6'];
              this.color = colors[Math.floor(Math.random() * colors.length)];
              this.opacity = Math.random() * 0.5 + 0.1;
          }

          update() {
              this.x += this.speedX;
              this.y += this.speedY;

              if (this.x < 0) this.x = width;
              if (this.x > width) this.x = 0;
              if (this.y < 0) this.y = height;
              if (this.y > height) this.y = 0;
          }

          draw() {
              ctx.beginPath();
              ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
              ctx.fillStyle = this.color;
              ctx.globalAlpha = this.opacity;
              ctx.fill();
          }
      }

      function createParticles() {
          particles = [];
          const particleCount = Math.floor(width / 15); // Responsive count
          for (let i = 0; i < particleCount; i++) {
              particles.push(new Particle());
          }
      }

      function animateParticles() {
          ctx.clearRect(0, 0, width, height);
          particles.forEach(p => {
              p.update();
              p.draw();
          });
          requestAnimationFrame(animateParticles);
      }

      window.addEventListener('resize', () => {
          initCanvas();
          createParticles();
      });

      initCanvas();
      createParticles();
      animateParticles();
  }
});
