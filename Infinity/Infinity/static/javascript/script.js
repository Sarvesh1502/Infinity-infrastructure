
// Initialize Lucide icons when DOM is ready
document.addEventListener("DOMContentLoaded", function() {
    if (window.lucide) {
        lucide.createIcons();
    }

    const submitBtn = document.getElementById("submitbtn");
    if (submitBtn) {
        submitBtn.addEventListener("click", ValidateForm);
    }
});

function ValidateForm() {
    // Client-side validation
    const fullName = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const subject = document.getElementById("subject").value.trim();
    const message = document.getElementById("message").value.trim();

    let ok = true;
    document.getElementById("errorMessagefullName").textContent = '';
    document.getElementById("errorMessageEmail").textContent = '';
    document.getElementById("errMessageSubject").textContent = '';
    document.getElementById("errMessageMessage").textContent = '';
    document.getElementById("responseMessage").textContent = '';

    if (!fullName) {
        document.getElementById("errorMessagefullName").textContent = "Please enter your name.";
        ok = false;
    } else if (!/^[A-Za-z ]+$/.test(fullName)) {
        document.getElementById("errorMessagefullName").textContent = "Please enter a valid name (letters and spaces only).";
        ok = false;
    }

    if (!email) {
        document.getElementById("errorMessageEmail").textContent = "Please enter your email.";
        ok = false;
    } else if (!/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(email)) {
        document.getElementById("errorMessageEmail").textContent = "Please enter a valid email address.";
        ok = false;
    }

    if (!subject) {
        document.getElementById("errMessageSubject").textContent = "Please enter a subject.";
        ok = false;
    }

    if (!message) {
        document.getElementById("errMessageMessage").textContent = "Please enter your message.";
        ok = false;
    }

    if (!ok) return;

    // Submit form via Formspree
    sendContactViaBackend({
        name: fullName,
        email: email,
        subject: subject,
        message: message
    });
}

async function sendContactViaBackend(payload) {
    try {
        const apiBaseUrl = (window.API_BASE_URL || "http://127.0.0.1:5000").replace(/\/$/, "");
        const res = await fetch(`${apiBaseUrl}/api/contact`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (!res.ok) {
            document.getElementById("responseMessage").textContent = data.message;
            return;
        }

        showPopup();
    } catch (err) {
        document.getElementById("responseMessage").textContent =
            "Server error. Try again later.";
    }
}

function showPopup() {
    const popup = document.getElementById("popupBox");
    popup.style.display = "flex";

    setTimeout(() => {
        closePopup();
    }, 2000);
}

function closePopup() {
    const popup = document.getElementById("popupBox");
    popup.style.display = "none";
    document.getElementById("contactForm").reset();
}

// Video Modal Functions
function openVideo(videoSrc) {
    const modal = document.getElementById("videoModal");
    const videoFrame = document.getElementById("videoFrame");
    
    if (!modal || !videoFrame) {
        console.error("Video modal or frame element not found");
        return;
    }
    
    // Set the video source
    videoFrame.src = videoSrc;
    
    // Show the modal
    modal.style.display = "flex";
    
    // Prevent body scroll when modal is open
    document.body.style.overflow = "hidden";
}

function closeVideo() {
    const modal = document.getElementById("videoModal");
    const videoFrame = document.getElementById("videoFrame");
    
    if (!modal || !videoFrame) {
        console.error("Video modal or frame element not found");
        return;
    }
    
    // Clear the video source to stop playback
    videoFrame.src = "";
    
    // Hide the modal
    modal.style.display = "none";
    
    // Re-enable body scroll
    document.body.style.overflow = "";
}

// Close modal when clicking outside the content
document.addEventListener("DOMContentLoaded", function() {
    const modal = document.getElementById("videoModal");
    
    if (modal) {
        modal.addEventListener("click", function(event) {
            // Close only if clicking outside the modal-content
            if (event.target === modal) {
                closeVideo();
            }
        });
        
        // Also close on Escape key
        document.addEventListener("keydown", function(event) {
            if (event.key === "Escape" && modal.style.display === "flex") {
                closeVideo();
            }
        });
    }
});

// Navigation: smooth scroll and active link handling (scrollspy)
document.addEventListener("DOMContentLoaded", function () {
    const navLinks = Array.from(document.querySelectorAll('.main-nav .nav-link'));
    if (!navLinks.length) return;

    const sectionIds = ['#about-section', '#service-section', '#testimonals-section', '#team-section', '#contact-form'];
    const sections = sectionIds
        .map(id => document.querySelector(id))
        .filter(Boolean);

    const setActive = (href) => {
        navLinks.forEach(l => l.classList.remove('active'));
        const active = navLinks.find(l => l.getAttribute('href') === href);
        if (active) active.classList.add('active');
    };

    // Click behavior: smooth scroll and active toggle
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            // Home link typically points to index.html; handle as scroll to top
            if (href && (href === 'index.html' || href === './index.html' || href === '/index.html' || href === '#top')) {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
                setActive(href);
                return;
            }

            if (href && href.startsWith('#')) {
                const target = document.querySelector(href);
                if (target) {
                    e.preventDefault();
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    setActive(href);
                }
            }
        });
    });

    // Scrollspy: highlight link for the section in view
    let ticking = false;
    const onScroll = () => {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(() => {
            const scrollPos = window.scrollY || document.documentElement.scrollTop || 0;
            const offset = 110; // approximate header + spacing

            // If near top, mark Home active
            const firstSectionTop = sections.length ? sections[0].offsetTop : 0;
            if (scrollPos < Math.max(0, firstSectionTop - offset)) {
                // Try to match whichever home href exists
                const home = navLinks.find(l => ['index.html', './index.html', '/index.html', '#top'].includes(l.getAttribute('href')));
                navLinks.forEach(l => l.classList.remove('active'));
                if (home) home.classList.add('active');
                ticking = false;
                return;
            }

            // Find current section
            let currentHref = null;
            for (let i = sections.length - 1; i >= 0; i--) {
                const sec = sections[i];
                if (scrollPos + offset >= sec.offsetTop) {
                    currentHref = `#${sec.id}`;
                    break;
                }
            }

            if (currentHref) {
                setActive(currentHref);
            }

            ticking = false;
        });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    // Initialize state on load
    onScroll();
});

