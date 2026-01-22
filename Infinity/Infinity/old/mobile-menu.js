/**
 * Mobile Menu and Smooth Scrolling
 * Handles the mobile menu toggle, overlay, and smooth scrolling
 */
// const FORMSPREE_ENDPOINT = 'https://formspree.io/f/xyzabc123';

document.addEventListener('DOMContentLoaded', function() {
    // Cache DOM elements
    const menuToggle = document.querySelector('.menu-toggle');
    const mainNav = document.querySelector('.main-nav');
    const menuOverlay = document.querySelector('.menu-overlay');
    const navLinks = document.querySelectorAll('.nav-link');
    const html = document.documentElement;
    const body = document.body;
    
    // Check if menu is open
    const isMenuOpen = () => mainNav.classList.contains('active');
    
    // Toggle mobile menu
    function toggleMenu() {
        if (isMenuOpen()) {
            closeMenu();
        } else {
            openMenu();
        }
    }
    
    // Open menu
    function openMenu() {
        // Disable body scroll when menu is open
        body.style.overflow = 'hidden';
        html.style.overflow = 'hidden';
        
        // Add active classes
        menuToggle.classList.add('active');
        mainNav.classList.add('active');
        menuOverlay.classList.add('active');
        
        // Add ARIA attributes
        menuToggle.setAttribute('aria-expanded', 'true');
        mainNav.setAttribute('aria-hidden', 'false');
    }
    
    // Close menu
    function closeMenu() {
        // Re-enable body scroll
        body.style.overflow = '';
        html.style.overflow = '';
        
        // Remove active classes
        menuToggle.classList.remove('active');
        mainNav.classList.remove('active');
        menuOverlay.classList.remove('active');
        
        // Update ARIA attributes
        menuToggle.setAttribute('aria-expanded', 'false');
        mainNav.setAttribute('aria-hidden', 'true');
    }
    
    // Initialize menu state
    function initMenu() {
        // Set initial ARIA attributes
        menuToggle.setAttribute('aria-expanded', 'false');
        menuToggle.setAttribute('aria-controls', 'main-nav');
        menuToggle.setAttribute('aria-label', 'Toggle navigation');
        mainNav.setAttribute('id', 'main-nav');
        mainNav.setAttribute('aria-hidden', 'true');
        
        // Close menu by default on mobile
        if (window.innerWidth <= 991) {
            closeMenu();
        } else {
            // Ensure menu is visible on desktop
            mainNav.style.display = '';
            mainNav.removeAttribute('style');
        }
    }
    
    // Event Listeners
    menuToggle.addEventListener('click', function (e) {
        // Prevent any default button or parent link behavior
        e.preventDefault();
        e.stopPropagation();
        toggleMenu();
    });
    menuOverlay.addEventListener('click', closeMenu);
    
    // Close menu when clicking on a nav link (on mobile) and update active state
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            // Update active class immediately on click
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            // Only prevent default for anchor links
            if (link.getAttribute('href').startsWith('#')) {
                e.preventDefault();
                const targetId = link.getAttribute('href');
                const targetElement = document.querySelector(targetId);
                
                if (targetElement) {
                    closeMenu();
                    
                    // Smooth scroll to target
                    const headerOffset = document.querySelector('.site-header').offsetHeight;
                    const elementPosition = targetElement.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                    
                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                }
            }
            
            // Close menu on mobile after clicking a link
            if (window.innerWidth <= 991) {
                closeMenu();
            }
        });
    });
    
    // Close menu when pressing Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isMenuOpen()) {
            closeMenu();
        }
    });
    
    // Handle window resize
    function handleResize() {
        if (window.innerWidth > 991) {
            // Reset menu for desktop
            closeMenu();
            mainNav.style.display = '';
            mainNav.removeAttribute('style');
        } else {
            // Ensure proper mobile menu state
            if (isMenuOpen()) {
                body.style.overflow = 'hidden';
                html.style.overflow = 'hidden';
            }
        }
    }
    
    // Debounce resize events
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(handleResize, 100);
    });
    
    // Initialize the menu
    initMenu();
    
    // Handle page load with hash in URL
    if (window.location.hash) {
        const targetElement = document.querySelector(window.location.hash);
        if (targetElement) {
            setTimeout(() => {
                const headerOffset = document.querySelector('.site-header').offsetHeight;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset - 20;
                
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }, 100);
        }
    }
});
