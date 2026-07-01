document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu toggle
    var mobileToggle = document.querySelector('.mobile-menu-toggle');
    var navMenu = document.querySelector('nav ul');

    if (mobileToggle && navMenu) {
        mobileToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            this.classList.toggle('active');
            var isExpanded = navMenu.classList.contains('active');
            this.setAttribute('aria-expanded', isExpanded);
        });

        navMenu.querySelectorAll('a').forEach(function(link) {
            link.addEventListener('click', function() {
                navMenu.classList.remove('active');
                mobileToggle.classList.remove('active');
                mobileToggle.setAttribute('aria-expanded', 'false');
            });
        });

        document.addEventListener('click', function(e) {
            if (!mobileToggle.contains(e.target) && !navMenu.contains(e.target)) {
                navMenu.classList.remove('active');
                mobileToggle.classList.remove('active');
                mobileToggle.setAttribute('aria-expanded', 'false');
            }
        });
    }

    // Nav scroll effect
    var nav = document.querySelector('nav');
    var lastScrollTop = 0;

    window.addEventListener('scroll', function() {
        var scrollTop = window.pageYOffset || document.documentElement.scrollTop;

        if (scrollTop > 50) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }

        if (window.innerWidth > 768) {
            if (scrollTop > lastScrollTop && scrollTop > 300) {
                nav.style.transform = 'translateY(-100%)';
            } else {
                nav.style.transform = 'translateY(0)';
            }
        }

        lastScrollTop = scrollTop;
    });

    // Smooth scroll to anchors
    document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
        anchor.addEventListener('click', function(e) {
            var href = this.getAttribute('href');
            if (href === '#' || href === '#home') {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return;
            }
            var target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                var offsetTop = target.offsetTop - 80;
                window.scrollTo({ top: offsetTop, behavior: 'smooth' });
            }
        });
    });

    // Nav highlight on scroll
    function highlightNav() {
        var sections = document.querySelectorAll('section[id]');
        var scrollPos = window.scrollY + 120;

        if (window.scrollY < 100) {
            document.querySelectorAll('nav a').forEach(function(l) { l.classList.remove('nav-active'); });
            var homeLink = document.querySelector('nav a[href="#home"]');
            if (homeLink) homeLink.classList.add('nav-active');
            return;
        }

        sections.forEach(function(section) {
            var top = section.offsetTop;
            var height = section.offsetHeight;
            if (scrollPos >= top && scrollPos < top + height) {
                document.querySelectorAll('nav a').forEach(function(l) { l.classList.remove('nav-active'); });
                var active = document.querySelector('nav a[href="#' + section.id + '"]');
                if (active) active.classList.add('nav-active');
            }
        });
    }
    window.addEventListener('scroll', highlightNav);

    // Scroll reveal animations
    var revealElements = document.querySelectorAll('[data-reveal]');
    var revealObserver = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    revealElements.forEach(function(el) {
        revealObserver.observe(el);
    });

    // Counter animation for stats
    var counters = document.querySelectorAll('[data-count]');
    var countersAnimated = false;

    function animateCounters() {
        if (countersAnimated) return;
        countersAnimated = true;

        counters.forEach(function(counter) {
            var target = parseInt(counter.getAttribute('data-count'), 10);
            var duration = 1500;
            var startTime = null;

            function step(timestamp) {
                if (!startTime) startTime = timestamp;
                var progress = Math.min((timestamp - startTime) / duration, 1);
                var eased = 1 - Math.pow(1 - progress, 3);
                var current = Math.floor(eased * target);
                counter.textContent = current;
                if (progress < 1) {
                    requestAnimationFrame(step);
                } else {
                    counter.textContent = target;
                }
            }

            requestAnimationFrame(step);
        });
    }

    var statsSection = document.querySelector('.stats-section');
    if (statsSection) {
        var statsObserver = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    animateCounters();
                    statsObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.3 });
        statsObserver.observe(statsSection);
    }


    // Screenshot horizontal scroll with mouse wheel
    var track = document.getElementById('screenshotTrack');
    if (track) {
        // Mouse wheel -> horizontal scroll
        track.addEventListener('wheel', function(e) {
            if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
                e.preventDefault();
                track.scrollLeft += e.deltaY * 2.5;
            }
        }, { passive: false });
    }
});