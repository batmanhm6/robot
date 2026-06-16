document.addEventListener('DOMContentLoaded', () => {

    // --- 1. App Loader (Wembi Style) ---
    const loader = document.getElementById('app-loader');
    const loaderProgress = document.querySelector('.loader-progress-bar');
    const loaderNumber = document.querySelector('.loader-number');
    
    // Activate loader word transitions
    setTimeout(() => {
        loader.classList.add('active');
    }, 100);

    let progress = 0;
    const loadDuration = 2000; // 2 seconds
    const intervalTime = 20; // ms
    const increment = 100 / (loadDuration / intervalTime);

    // Run progress bar scaleX transform
    setTimeout(() => {
        loaderProgress.style.transform = 'scaleX(1)';
    }, 100);

    // Number count animation
    const progressInterval = setInterval(() => {
        progress += increment;
        if (progress >= 100) {
            progress = 100;
            clearInterval(progressInterval);
            
            // Loaded, transition out
            setTimeout(() => {
                loader.classList.add('loaded');
            }, 300);
        }
        
        // Format to 3 digits (e.g. 008, 045, 100)
        const formattedNum = String(Math.floor(progress)).padStart(3, '0');
        loaderNumber.textContent = formattedNum;
    }, intervalTime);


    // --- 3. Smart Floating Navigation (Hide on Scroll Down, Show on Scroll Up, Hidden on Hero) ---
    const siteNav = document.querySelector('.site-nav');
    const heroSection = document.getElementById('hero');
    let lastScrollY = window.scrollY;

    const handleNavVisibility = () => {
        const currentScrollY = window.scrollY;
        const heroHeight = heroSection ? heroSection.offsetHeight : window.innerHeight;
        
        if (currentScrollY < heroHeight - 100) {
            siteNav.classList.add('hidden');
        } else {
            if (currentScrollY > lastScrollY) {
                siteNav.classList.add('hidden');
            } else {
                siteNav.classList.remove('hidden');
            }
        }
        lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleNavVisibility);
    handleNavVisibility();


    // --- 4. Intersection Observer for Text Reveal & Clip-path ---
    const revealOptions = {
        threshold: 0.12,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                entry.target.classList.add('is-inview'); // support both classes
                observer.unobserve(entry.target); // Trigger only once
            }
        });
    }, revealOptions);

    // Observe standard reveal components
    const elementsToReveal = document.querySelectorAll('.reveal-on-scroll');
    elementsToReveal.forEach(el => observer.observe(el));

    // Text Split Logic for Serve Robotics word-by-word reveal
    const textRevealElements = document.querySelectorAll('.js-text');
    textRevealElements.forEach(el => {
        // Only split text nodes to avoid destroying child HTML like <br> or <span>
        const childNodes = Array.from(el.childNodes);
        el.innerHTML = '';
        
        let wordCount = 0;
        childNodes.forEach(node => {
            if (node.nodeType === Node.TEXT_NODE) {
                const words = node.textContent.split(/\s+/).filter(w => w.trim() !== '');
                words.forEach((word) => {
                    const span = document.createElement('span');
                    span.className = 'word-span';
                    span.textContent = word;
                    span.style.transitionDelay = `${wordCount * 0.04}s`;
                    
                    // Add mint green highlight to specific words if needed
                    if(word.includes('AI') || word.includes('물리') || word.includes('Physical') || word.includes('Serve')) {
                        span.classList.add('highlight-ready');
                    }
                    
                    el.appendChild(span);
                    wordCount++;
                });
            } else {
                // If it's a span or br, append it directly but apply animation if it's text
                if(node.tagName && node.tagName.toLowerCase() === 'span' && node.classList.contains('highlight-text')) {
                    const subWords = node.textContent.split(/\s+/).filter(w => w.trim() !== '');
                    subWords.forEach((word) => {
                        const span = document.createElement('span');
                        span.className = 'word-span highlight-ready';
                        span.textContent = word;
                        span.style.transitionDelay = `${wordCount * 0.04}s`;
                        el.appendChild(span);
                        wordCount++;
                    });
                } else {
                    el.appendChild(node.cloneNode(true));
                }
            }
        });
        
        observer.observe(el);
    });


    // --- 5. Anatomy Pins & Cards Mapping ---
    const pins = document.querySelectorAll('.anatomy-pin');
    const techCards = document.querySelectorAll('.tech-card');

    pins.forEach(pin => {
        const activatePin = () => {
            // Remove active classes
            pins.forEach(p => p.classList.remove('active'));
            techCards.forEach(c => c.classList.remove('active'));

            // Add active class to clicked pin
            pin.classList.add('active');

            // Find target card
            const targetId = pin.getAttribute('data-target');
            const targetCard = document.getElementById(targetId);
            if (targetCard) {
                targetCard.classList.add('active');
                
                // On small screens, scroll the active card into view
                if (window.innerWidth <= 1024) {
                    targetCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            }
        };

        pin.addEventListener('click', activatePin);
        pin.addEventListener('mouseenter', activatePin);
    });

    // Also support clicking cards to highlight pins
    techCards.forEach(card => {
        card.addEventListener('click', () => {
            techCards.forEach(c => c.classList.remove('active'));
            pins.forEach(p => p.classList.remove('active'));

            card.classList.add('active');
            const targetPin = document.querySelector(`.anatomy-pin[data-target="${card.id}"]`);
            if (targetPin) {
                targetPin.classList.add('active');
            }
        });
    });


    // --- 6. Active Nav Link on Scroll ---
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-link');

    window.addEventListener('scroll', () => {
        let currentSectionId = '';
        const scrollPosition = window.scrollY + 300; // offset

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                currentSectionId = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            const parentLi = link.parentElement;
            parentLi.classList.remove('active');
            if (link.getAttribute('href') === `#${currentSectionId}`) {
                parentLi.classList.add('active');
            }
        });
    });

});
