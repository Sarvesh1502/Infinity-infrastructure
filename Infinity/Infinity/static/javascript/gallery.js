// Gallery Modal Functions
function openGalleryModal(src, caption) {
    const modal = document.getElementById("galleryModal");
    const img = document.getElementById("galleryImage");
    const captionText = document.getElementById("galleryCaption");
    
    img.src = src;
    captionText.textContent = caption;
    modal.style.display = "flex";
    document.body.style.overflow = "hidden";
}

function closeGalleryModal() {
    const modal = document.getElementById("galleryModal");
    modal.style.display = "none";
    document.body.style.overflow = "";
}

function playVideo(src, caption) {
    const modal = document.getElementById("videoPlayerModal");
    const video = document.getElementById("galleryVideo");
    const captionText = document.getElementById("videoCaption");
    
    video.src = src;
    video.load();
    captionText.textContent = caption;
    modal.style.display = "flex";
    document.body.style.overflow = "hidden";

    const playPromise = video.play();
    if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => {
            // Autoplay may be blocked; user can press play.
        });
    }
}

function closeVideoPlayer() {
    const modal = document.getElementById("videoPlayerModal");
    const video = document.getElementById("galleryVideo");
    modal.style.display = "none";
    video.pause();
    video.currentTime = 0;
    document.body.style.overflow = "";
}

// Close modals on outside click
document.addEventListener("DOMContentLoaded", function() {
    const galleryModal = document.getElementById("galleryModal");
    const videoModal = document.getElementById("videoPlayerModal");
    
    if (galleryModal) {
        galleryModal.addEventListener("click", function(event) {
            if (event.target === galleryModal) {
                closeGalleryModal();
            }
        });
    }

    if (videoModal) {
        videoModal.addEventListener("click", function(event) {
            if (event.target === videoModal) {
                closeVideoPlayer();
            }
        });
    }

    // Close on Escape key
    document.addEventListener("keydown", function(event) {
        if (event.key === "Escape") {
            if (galleryModal && galleryModal.style.display === "flex") {
                closeGalleryModal();
            }
            if (videoModal && videoModal.style.display === "flex") {
                closeVideoPlayer();
            }
        }
    });
});
