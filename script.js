// ===== Loading Screen =====
document.addEventListener('DOMContentLoaded', () => {
    const loader = document.getElementById('loader');
    const loaderBarFill = document.getElementById('loader-bar-fill');
    let loadProgress = 0;

    function updateLoader() {
        loadProgress += Math.random() * 8 + 3;
        if (loadProgress > 100) loadProgress = 100;
        loaderBarFill.style.width = loadProgress + '%';

        if (loadProgress < 100) {
            setTimeout(updateLoader, 80 + Math.random() * 120);
        } else {
            setTimeout(() => {
                loader.classList.add('hidden');
                document.body.style.overflow = '';
                setTimeout(() => {
                    initAllAnimations();
                    initCounters();
                }, 300);
            }, 500);
        }
    }

    document.body.style.overflow = 'hidden';
    updateLoader();

    // ===== Throttle Utility =====
    function throttle(fn, delay) {
        let last = 0;
        let rafId = null;
        return function (...args) {
            const now = Date.now();
            if (now - last >= delay) {
                last = now;
                fn.apply(this, args);
            } else if (!rafId) {
                rafId = requestAnimationFrame(() => {
                    last = Date.now();
                    rafId = null;
                    fn.apply(this, args);
                });
            }
        };
    }

    // ===== Custom Cursor =====
    const cursorDot = document.getElementById('cursor-dot');
    const cursorRing = document.getElementById('cursor-ring');
    const cursorGlow = document.getElementById('cursor-glow');
    const heroVisual = document.querySelector('.hero-visual');
    const isTouch = window.matchMedia('(hover: none)').matches;
    let cursorX = 0, cursorY = 0;
    let ringX = 0, ringY = 0;
    let cursorRafRunning = true;
    let particlesRafRunning = true;

    function animateCursorRing() {
        if (!cursorRafRunning) return;
        ringX += (cursorX - ringX) * 0.15;
        ringY += (cursorY - ringY) * 0.15;
        cursorRing.style.transform = `translate(calc(-50% + ${ringX}px), calc(-50% + ${ringY}px))`;
        requestAnimationFrame(animateCursorRing);
    }
    if (!isTouch) animateCursorRing();

    // Consolidated throttled mousemove
    if (!isTouch) {
        document.addEventListener('mousemove', throttle((e) => {
            cursorX = e.clientX;
            cursorY = e.clientY;
            cursorDot.style.transform = `translate(calc(-50% + ${cursorX}px), calc(-50% + ${cursorY}px))`;
            cursorGlow.style.transform = `translate(calc(-50% + ${e.clientX}px), calc(-50% + ${e.clientY}px))`;

            // Hero parallax
            if (heroVisual) {
                const x = (e.clientX / window.innerWidth - 0.5) * 20;
                const y = (e.clientY / window.innerHeight - 0.5) * 20;
                heroVisual.style.transform = `translate(${x}px, ${y}px)`;
            }

            // Particle mouse tracking
            mouse.x = e.clientX;
            mouse.y = e.clientY;
        }, 16));
    }

    // Cursor hover effects
    const hoverElements = document.querySelectorAll('a, button, .project-card, .skill-card, .social-icon, .contact-link, [data-tilt]');
    hoverElements.forEach(el => {
        el.addEventListener('mouseenter', () => {
            cursorDot.classList.add('hover');
            cursorRing.classList.add('hover');
        });
        el.addEventListener('mouseleave', () => {
            cursorDot.classList.remove('hover');
            cursorRing.classList.remove('hover');
        });
    });

    // Hide default cursor on desktop
    if (window.matchMedia('(hover: hover)').matches) {
        document.body.style.cursor = 'none';
        document.querySelectorAll('a, button').forEach(el => {
            el.style.cursor = 'none';
        });
    }

    // ===== Particles Background =====
    const canvas = document.getElementById('particles');
    const ctx = canvas.getContext('2d');
    let particles = [];
    let mouse = { x: null, y: null };
    const isMobileDevice = window.innerWidth <= 768 || isTouch;

    if (!isMobileDevice) {
        function resizeCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        resizeCanvas();

        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                resizeCanvas();
                initParticles();
            }, 250);
        });

        class Particle {
            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.size = Math.random() * 2 + 0.5;
                this.baseSize = this.size;
                this.speedX = (Math.random() - 0.5) * 0.5;
                this.speedY = (Math.random() - 0.5) * 0.5;
                this.opacity = Math.random() * 0.5 + 0.1;
                this.baseOpacity = this.opacity;
                this.twinkleSpeed = Math.random() * 0.02 + 0.005;
                this.twinkleDir = Math.random() > 0.5 ? 1 : -1;
            }

            update() {
                this.x += this.speedX;
                this.y += this.speedY;

                this.opacity += this.twinkleSpeed * this.twinkleDir;
                if (this.opacity >= this.baseOpacity + 0.2 || this.opacity <= this.baseOpacity - 0.2) {
                    this.twinkleDir *= -1;
                }

                if (mouse.x !== null && mouse.y !== null) {
                    const dx = mouse.x - this.x;
                    const dy = mouse.y - this.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < 120) {
                        const force = (120 - dist) / 120;
                        this.x -= dx * force * 0.02;
                        this.y -= dy * force * 0.02;
                        this.size = this.baseSize + force * 2;
                        this.opacity = Math.min(1, this.baseOpacity + force * 0.5);
                    } else {
                        this.size += (this.baseSize - this.size) * 0.1;
                        this.opacity += (this.baseOpacity - this.opacity) * 0.1;
                    }
                }

                if (this.x > canvas.width) this.x = 0;
                if (this.x < 0) this.x = canvas.width;
                if (this.y > canvas.height) this.y = 0;
                if (this.y < 0) this.y = canvas.height;
            }

            draw() {
                ctx.fillStyle = `rgba(99, 102, 241, ${this.opacity})`;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        function initParticles() {
            const count = Math.min(80, Math.floor(window.innerWidth / 15));
            particles = [];
            for (let i = 0; i < count; i++) {
                particles.push(new Particle());
            }
        }
        initParticles();

        function connectParticles() {
            const maxDist = 150;
            const maxDistSq = maxDist * maxDist;
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const distSq = dx * dx + dy * dy;

                    if (distSq < maxDistSq) {
                        const dist = Math.sqrt(distSq);
                        const opacity = (1 - dist / maxDist) * 0.15;
                        ctx.strokeStyle = `rgba(99, 102, 241, ${opacity})`;
                        ctx.lineWidth = 0.5;
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.stroke();
                    }
                }
            }
        }

        function animateParticles() {
            if (!particlesRafRunning) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => {
                p.update();
                p.draw();
            });
            connectParticles();
            requestAnimationFrame(animateParticles);
        }
        animateParticles();
    }

    // Page Visibility API - pause RAF loops when tab hidden
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            cursorRafRunning = false;
            particlesRafRunning = false;
        } else {
            cursorRafRunning = true;
            particlesRafRunning = true;
            if (!isTouch) animateCursorRing();
            if (!isMobileDevice) {
                animateParticles();
            }
        }
    });

    // ===== Navbar =====
    const navbar = document.getElementById('navbar');

    window.addEventListener('scroll', throttle(() => {
        navbar.classList.toggle('scrolled', window.scrollY > 50);
    }, 16));

    // Mobile nav toggle
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    const navScrim = document.getElementById('nav-scrim');

    function closeMenu() {
        navMenu.classList.remove('active');
        navToggle.classList.remove('active');
        navScrim.classList.remove('active');
        navToggle.setAttribute('aria-expanded', 'false');
    }

    function openMenu() {
        navMenu.classList.add('active');
        navToggle.classList.add('active');
        navScrim.classList.add('active');
        navToggle.setAttribute('aria-expanded', 'true');
    }

    navToggle.addEventListener('click', () => {
        if (navMenu.classList.contains('active')) {
            closeMenu();
        } else {
            openMenu();
        }
    });

    navScrim.addEventListener('click', closeMenu);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navMenu.classList.contains('active')) {
            closeMenu();
        }
    });

    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', closeMenu);
    });

    // Smooth scroll
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const offset = 80;
                const pos = target.getBoundingClientRect().top + window.pageYOffset - offset;
                window.scrollTo({ top: pos, behavior: 'smooth' });
            }
        });
    });

    // Active nav link
    function highlightNav() {
        const scrollY = window.pageYOffset;
        document.querySelectorAll('.section, .hero').forEach(section => {
            const top = section.offsetTop - 100;
            const height = section.offsetHeight;
            const id = section.getAttribute('id');

            if (scrollY >= top && scrollY < top + height) {
                document.querySelectorAll('.nav-link').forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${id}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }
    window.addEventListener('scroll', throttle(highlightNav, 16));

    // ===== Typing Effect =====
    const typedEl = document.getElementById('typed-text');
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const words = ['Web Developer', 'Open Source Contributor', 'Tech Enthusiast', 'Problem Solver', 'Freelancer'];
    let wordIndex = 0;
    let charIndex = 0;
    let isDeleting = false;

    function typeEffect() {
        if (prefersReducedMotion) return;
        const currentWord = words[wordIndex];

        if (isDeleting) {
            typedEl.textContent = currentWord.substring(0, charIndex - 1);
            charIndex--;
        } else {
            typedEl.textContent = currentWord.substring(0, charIndex + 1);
            charIndex++;
        }

        let speed = isDeleting ? 50 : 100;

        if (!isDeleting && charIndex === currentWord.length) {
            speed = 2000;
            isDeleting = true;
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            wordIndex = (wordIndex + 1) % words.length;
            speed = 500;
        }

        setTimeout(typeEffect, speed);
    }
    typeEffect();

    // ===== Scroll Indicator Fade =====
    const scrollIndicator = document.querySelector('.scroll-indicator');
    if (scrollIndicator) {
        setTimeout(() => scrollIndicator.classList.add('visible'), 1000);
        window.addEventListener('scroll', throttle(() => {
            if (window.scrollY > 100) {
                scrollIndicator.classList.remove('visible');
            } else {
                scrollIndicator.classList.add('visible');
            }
        }, 16));
    }

    // ===== Back to Top =====
    const backToTop = document.getElementById('back-to-top');
    if (backToTop) {
        window.addEventListener('scroll', throttle(() => {
            if (window.scrollY > 500) {
                backToTop.classList.add('visible');
            } else {
                backToTop.classList.remove('visible');
            }
        }, 16));

        backToTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // ===== Scroll Animations =====
    function initAllAnimations() {
        const isMobile = window.innerWidth <= 768;
        const observerOptions = {
            threshold: isMobile ? 0.05 : 0.15,
            rootMargin: isMobile ? '0px 0px -20px 0px' : '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        document.querySelectorAll('.project-card, .experience-item, .stat-card, .skill-card, .process-card, .contact-wrapper, .about-code').forEach(el => {
            el.classList.add('fade-in-up');
            observer.observe(el);
        });

        // Staggered animations for cards
        document.querySelectorAll('.projects-grid, .experience-timeline, .skills-grid, .process-grid').forEach(container => {
            const children = container.children;
            const staggerDelay = isMobile ? 0.06 : 0.15;
            Array.from(children).forEach((child, i) => {
                child.style.transitionDelay = `${i * staggerDelay}s`;
            });
        });

        // Section Transitions
        const sectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    sectionObserver.unobserve(entry.target);
                }
            });
        }, { threshold: isMobile ? 0.02 : 0.1 });

        document.querySelectorAll('.section').forEach(section => {
            sectionObserver.observe(section);
        });

        // Text Reveal Animation
        function splitTextIntoChars(element) {
            const text = element.textContent;
            element.innerHTML = '';
            element.classList.add('reveal-text');
            text.split('').forEach(char => {
                const span = document.createElement('span');
                span.classList.add('char');
                span.textContent = char === ' ' ? '\u00A0' : char;
                element.appendChild(span);
            });
        }

        document.querySelectorAll('.section-title, .hero-name .name-line').forEach(el => {
            splitTextIntoChars(el);
        });

        const textObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const chars = entry.target.querySelectorAll('.char');
                    chars.forEach((char, i) => {
                        char.style.transitionDelay = `${i * 0.03}s`;
                    });
                    entry.target.classList.add('revealed');
                    textObserver.unobserve(entry.target);
                }
            });
        }, { threshold: isMobile ? 0.2 : 0.5 });

        document.querySelectorAll('.reveal-text').forEach(el => {
            textObserver.observe(el);
        });

        // Magnetic Effect (no CSS transition — JS controls transform directly)
        document.querySelectorAll('.btn, .social-icon, .project-link').forEach(el => {
            el.classList.add('magnetic');
            el.addEventListener('mousemove', (e) => {
                const rect = el.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                el.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
            });
            el.addEventListener('mouseleave', () => {
                el.style.transform = 'translate(0, 0)';
            });
        });

        // Ripple Effect on Buttons
        document.querySelectorAll('.btn').forEach(btn => {
            btn.style.position = 'relative';
            btn.style.overflow = 'hidden';
            btn.addEventListener('click', function(e) {
                const ripple = document.createElement('span');
                ripple.classList.add('ripple');
                const rect = this.getBoundingClientRect();
                const size = Math.max(rect.width, rect.height);
                ripple.style.width = ripple.style.height = size + 'px';
                ripple.style.left = e.clientX - rect.left - size / 2 + 'px';
                ripple.style.top = e.clientY - rect.top - size / 2 + 'px';
                this.appendChild(ripple);
                setTimeout(() => ripple.remove(), 600);
            });
        });
    }

    // ===== Counter Animation =====
    function animateCounter(el) {
        const target = parseInt(el.getAttribute('data-target'));
        const duration = 2000;
        const start = performance.now();

        function update(currentTime) {
            const elapsed = currentTime - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = Math.floor(target * eased);

            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                el.textContent = target + '+';
            }
        }
        requestAnimationFrame(update);
    }

    function initCounters() {
        const isMobile = window.innerWidth <= 768;
        const counterObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const counters = entry.target.querySelectorAll('.stat-number');
                    counters.forEach(counter => animateCounter(counter));
                    counterObserver.unobserve(entry.target);
                }
            });
        }, { threshold: isMobile ? 0.1 : 0.5 });

        const statsSection = document.querySelector('.about-stats');
        if (statsSection) counterObserver.observe(statsSection);

        // Skill Bars Animation
        const skillObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const card = entry.target;
                    const cardIndex = Array.from(card.parentNode.children).indexOf(card);
                    const delay = isMobile ? cardIndex * 0.04 : cardIndex * 0.06;
                    card.style.transitionDelay = `${delay}s`;
                    setTimeout(() => {
                        card.classList.add('animated');
                        setTimeout(() => {
                            card.style.transitionDelay = '0s';
                        }, 600);
                    }, 50);
                    skillObserver.unobserve(card);
                }
            });
        }, { threshold: isMobile ? 0.05 : 0.2 });

        document.querySelectorAll('.skill-card').forEach(card => {
            skillObserver.observe(card);
        });
    }

    // ===== 3D Tilt Effect =====
    document.querySelectorAll('[data-tilt]').forEach(card => {
        // Remove CSS transition so JS controls transform directly (no conflict)
        card.style.transition = 'border-color 0.4s ease, box-shadow 0.4s ease, color 0.4s ease';

        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = (y - centerY) / 20;
            const rotateY = (centerX - x) / 20;

            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateY(0)';
        });
    });

    // ===== Contact Form =====
    const contactForm = document.getElementById('contact-form');
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const messageInput = document.getElementById('message');
    const charCount = document.getElementById('char-count');

    // Character counter
    if (messageInput && charCount) {
        messageInput.addEventListener('input', () => {
            const len = messageInput.value.length;
            charCount.textContent = len;
            const countEl = charCount.parentElement;
            countEl.classList.remove('warn', 'limit');
            if (len > 500) countEl.classList.add('limit');
            else if (len > 400) countEl.classList.add('warn');
        });
    }

    // Validation helpers
    function showError(input, message) {
        const group = input.closest('.form-group');
        group.classList.remove('success');
        group.classList.add('error');
        const hint = group.querySelector('.form-hint');
        if (hint) hint.textContent = message;
    }

    function showSuccess(input) {
        const group = input.closest('.form-group');
        group.classList.remove('error');
        group.classList.add('success');
        const hint = group.querySelector('.form-hint');
        if (hint) hint.textContent = '';
    }

    function clearState(input) {
        const group = input.closest('.form-group');
        group.classList.remove('error', 'success');
        const hint = group.querySelector('.form-hint');
        if (hint) hint.textContent = '';
    }

    // Live validation on blur
    nameInput.addEventListener('blur', () => {
        if (!nameInput.value.trim()) showError(nameInput, 'Name is required');
        else if (nameInput.value.trim().length < 2) showError(nameInput, 'Name must be at least 2 characters');
        else showSuccess(nameInput);
    });

    emailInput.addEventListener('blur', () => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailInput.value.trim()) showError(emailInput, 'Email is required');
        else if (!emailRegex.test(emailInput.value)) showError(emailInput, 'Please enter a valid email');
        else showSuccess(emailInput);
    });

    messageInput.addEventListener('blur', () => {
        if (!messageInput.value.trim()) showError(messageInput, 'Message is required');
        else if (messageInput.value.trim().length < 10) showError(messageInput, 'Message must be at least 10 characters');
        else showSuccess(messageInput);
    });

    // Clear error on input
    [nameInput, emailInput, messageInput].forEach(input => {
        input.addEventListener('input', () => {
            if (input.closest('.form-group').classList.contains('error')) {
                clearState(input);
            }
        });
    });

    contactForm.addEventListener('submit', function (e) {
        e.preventDefault();

        let isValid = true;
        let firstError = null;

        // Validate name
        if (!nameInput.value.trim()) {
            showError(nameInput, 'Name is required');
            isValid = false;
            if (!firstError) firstError = nameInput;
        } else if (nameInput.value.trim().length < 2) {
            showError(nameInput, 'Name must be at least 2 characters');
            isValid = false;
            if (!firstError) firstError = nameInput;
        } else {
            showSuccess(nameInput);
        }

        // Validate email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailInput.value.trim()) {
            showError(emailInput, 'Email is required');
            isValid = false;
            if (!firstError) firstError = emailInput;
        } else if (!emailRegex.test(emailInput.value)) {
            showError(emailInput, 'Please enter a valid email');
            isValid = false;
            if (!firstError) firstError = emailInput;
        } else {
            showSuccess(emailInput);
        }

        // Validate message
        if (!messageInput.value.trim()) {
            showError(messageInput, 'Message is required');
            isValid = false;
            if (!firstError) firstError = messageInput;
        } else if (messageInput.value.trim().length < 10) {
            showError(messageInput, 'Message must be at least 10 characters');
            isValid = false;
            if (!firstError) firstError = messageInput;
        } else {
            showSuccess(messageInput);
        }

        if (!isValid) {
            if (firstError) {
                firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                firstError.focus();
            }
            return;
        }

        const name = nameInput.value.trim();
        const email = emailInput.value.trim();
        const message = messageInput.value.trim();

        const subject = encodeURIComponent(`Portfolio Contact from ${name}`);
        const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`);
        window.location.href = `mailto:tusharsahu969@gmail.com?subject=${subject}&body=${body}`;

        // Reset form and show success
        contactForm.reset();
        charCount.textContent = '0';
        charCount.parentElement.classList.remove('warn', 'limit');
        [nameInput, emailInput, messageInput].forEach(clearState);

        const btn = contactForm.querySelector('button');
        const originalHTML = btn.innerHTML;
        btn.innerHTML = '<span>Message Ready!</span>';
        btn.style.background = 'linear-gradient(135deg, #10b981, #06b6d4)';
        btn.disabled = true;

        setTimeout(() => {
            btn.innerHTML = originalHTML;
            btn.style.background = '';
            btn.disabled = false;
        }, 3000);
    });
});
