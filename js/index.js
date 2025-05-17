/**
 * index.js - JavaScript for the Habitus Zone landing page
 */

// Initialize landing page components when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize carousel
    initCarousel();
    
    // Setup smooth scrolling
    setupSmoothScrolling();
});

/**
 * Initialize the carousel functionality
 */
function initCarousel() {
    const carousel = document.querySelector('.carousel');
    const slides = document.querySelectorAll('.carousel-slide');
    const prevButton = document.querySelector('.carousel-prev');
    const nextButton = document.querySelector('.carousel-next');
    const indicators = document.querySelectorAll('.carousel-indicator');
    
    // Only initialize if carousel exists on page
    if (!carousel) return;
    
    let currentSlide = 0;
    const slideCount = slides.length;
    
    // Set up initial position
    updateCarousel();
    
    // Set up event listeners
    prevButton.addEventListener('click', function() {
        currentSlide = (currentSlide - 1 + slideCount) % slideCount;
        updateCarousel();
    });
    
    nextButton.addEventListener('click', function() {
        currentSlide = (currentSlide + 1) % slideCount;
        updateCarousel();
    });
    
    // Set up indicator buttons
    indicators.forEach((indicator, index) => {
        indicator.addEventListener('click', function() {
            currentSlide = index;
            updateCarousel();
        });
    });
    
    // Auto-advance carousel every 5 seconds
    let carouselInterval = setInterval(function() {
        currentSlide = (currentSlide + 1) % slideCount;
        updateCarousel();
    }, 5000);
    
    // Pause auto-advance when user interacts with carousel
    carousel.addEventListener('mouseenter', function() {
        clearInterval(carouselInterval);
    });
    
    carousel.addEventListener('mouseleave', function() {
        carouselInterval = setInterval(function() {
            currentSlide = (currentSlide + 1) % slideCount;
            updateCarousel();
        }, 5000);
    });
    
    // Function to update carousel position and indicators
    function updateCarousel() {
        // Update carousel position
        carousel.style.transform = `translateX(-${currentSlide * 100}%)`;
        
        // Update indicators
        indicators.forEach((indicator, index) => {
            if (index === currentSlide) {
                indicator.classList.add('active');
            } else {
                indicator.classList.remove('active');
            }
        });
    }
}

/**
 * Setup smooth scrolling for anchor links
 */
function setupSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80, // Offset for fixed header if needed
                    behavior: 'smooth'
                });
            }
        });
    });
}