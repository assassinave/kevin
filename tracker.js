// tracker.js
(function() {
    'use strict';
    
    // Configuration
    const CONFIG = Object.freeze({
        API_ENDPOINT: 'https://script.google.com/macros/s/AKfycbxtpR6C4zEjlZ5tRlYUbHPH1yBaXdk3YPX5hJZlV_av2oSm34C3obBqFy0chnjF1S_a/exec',
        ID_RANGE: { min: 1000, max: 2000 },
        SUPPORTED_PLATFORMS: ['Windows', 'Mac', 'Linux', 'Android', 'iOS'],
        SUPPORTED_BROWSERS: ['Chrome', 'Firefox', 'Safari', 'Edge'],
        STORAGE_KEYS: {
            VISITOR_ID: 'visitorId',
            IS_OWNER: 'isOwner'
        }
    });

    // Error handling
    class TrackingError extends Error {
        constructor(message, data) {
            super(message);
            this.name = 'TrackingError';
            this.data = data;
            this.timestamp = new Date().toISOString();
        }
    }

    class VisitorTracker {
        // Declare all private fields at the top of the class
        #state;
        #visitorId;
        #screenObserver;
        #performanceMarks;

        constructor() {
            // Initialize fields in constructor
            this.#state = {
                pageStart: null,
                pageData: null,
                isTracking: false,
                currentRequest: null
            };
            this.#performanceMarks = new Map();
            this.#visitorId = this.#initializeVisitorId();
            this.#initializeScreenObserver();
            this.#bindEventHandlers();
        }

        #initializeVisitorId() {
            const stored = localStorage.getItem(CONFIG.STORAGE_KEYS.VISITOR_ID);
            if (stored) return Number(stored);

            const id = Math.floor(Math.random() * 
                (CONFIG.ID_RANGE.max - CONFIG.ID_RANGE.min + 1)) + 
                CONFIG.ID_RANGE.min;
            localStorage.setItem(CONFIG.STORAGE_KEYS.VISITOR_ID, String(id));
            return id;
        }

        #initializeScreenObserver() {
            this.#screenObserver = new ResizeObserver(() => {
                if (this.#state.pageData) {
                    this.#state.pageData['Screen Size'] = 
                        `${window.innerWidth}x${window.innerHeight}`;
                }
            });
            this.#screenObserver.observe(document.documentElement);
        }

        #detectPlatform() {
            if (navigator.userAgentData?.platform) {
                return navigator.userAgentData.platform;
            }
            return CONFIG.SUPPORTED_PLATFORMS.find(os => 
                navigator.userAgent.includes(os)) || 'Unknown OS';
        }

        #detectBrowser() {
            if (navigator.userAgentData?.brands) {
                const brand = navigator.userAgentData.brands.find(b => 
                    CONFIG.SUPPORTED_BROWSERS.includes(b.brand));
                if (brand) return brand.brand;
            }
            return CONFIG.SUPPORTED_BROWSERS.find(browser => 
                navigator.userAgent.includes(browser)) || 'Unknown Browser';
        }

        #getBasicData() {
            const urlParams = new URLSearchParams(window.location.search);
            const utmSource = urlParams.get('utm_source');
            const referrerSource = document.referrer 
                ? new URL(document.referrer).hostname
                : (utmSource || 'direct');

            const isOwner = localStorage.getItem(CONFIG.STORAGE_KEYS.IS_OWNER) === 'true';
            const visitorType = isOwner ? 'Owner' : 'Visitor';

            return Object.freeze({
                'Timestamp': new Date().toISOString(),
                'URL': location.href,
                'Referrer': referrerSource,
                'User Agent': `${this.#detectPlatform()}, ${this.#detectBrowser()}`,
                'Screen Size': `${window.innerWidth}x${window.innerHeight}`,
                'Visitor': `${visitorType} (ID: ${this.#visitorId})`,
                'Time on Page': '0 seconds'
            });
        }

        async #sendData(data) {
            this.#state.currentRequest?.abort();
            this.#state.currentRequest = new AbortController();

            const params = new URLSearchParams(data);
            try {
                const response = await fetch(`${CONFIG.API_ENDPOINT}?${params}`, {
                    signal: this.#state.currentRequest.signal
                });
                
                if (!response.ok) {
                    throw new TrackingError('API request failed', {
                        status: response.status,
                        statusText: response.statusText
                    });
                }
            } catch (error) {
                if (error.name === 'AbortError') return;
                console.error('Tracking error:', error);
                
                if (navigator.sendBeacon) {
                    navigator.sendBeacon(CONFIG.API_ENDPOINT, params);
                }
            }
        }

        #bindEventHandlers() {
            window.addEventListener('popstate', this.#handleNavigation.bind(this));
            window.addEventListener('beforeunload', this.#handleUnload.bind(this));
            
            const originalPushState = history.pushState;
            const originalReplaceState = history.replaceState;
            
            history.pushState = (...args) => {
                originalPushState.apply(history, args);
                this.#handleNavigation();
            };
            
            history.replaceState = (...args) => {
                originalReplaceState.apply(history, args);
                this.#handleNavigation();
            };
        }

        async #handleNavigation() {
            const performanceMark = `navigation-${Date.now()}`;
            performance.mark(performanceMark);
            this.#performanceMarks.set('lastNavigation', performanceMark);

            if (this.#state.isTracking && 
                this.#state.pageData?.URL === location.href) {
                return;
            }

            if (this.#state.isTracking) {
                await this.#sendFinalPageData();
            }

            this.#state.pageStart = new Date();
            this.#state.pageData = this.#getBasicData();
            this.#state.isTracking = true;

            await this.#sendData(this.#state.pageData);
        }

        async #handleUnload() {
            if (this.#state.isTracking) {
                await this.#sendFinalPageData();
            }
            this.#screenObserver.disconnect();
        }

        async #sendFinalPageData() {
            if (!this.#state.isTracking || !this.#state.pageData || !this.#state.pageStart) {
                return;
            }

            const navigationMark = this.#performanceMarks.get('lastNavigation');
            const timeOnPage = navigationMark 
                ? performance.measure('time-on-page', navigationMark).duration
                : new Date().getTime() - this.#state.pageStart.getTime();

            const finalData = Object.freeze({
                ...this.#state.pageData,
                'Timestamp': new Date().toISOString(),
                'Time on Page': `${Math.round(timeOnPage / 1000)} seconds`
            });

            await this.#sendData(finalData);
            this.#state.isTracking = false;
        }

        startTracking() {
            this.#handleNavigation();
        }

        destroy() {
            this.#handleUnload();
            this.#performanceMarks.clear();
        }
    }

    // Create and initialize tracker
    const tracker = new VisitorTracker();
    tracker.startTracking();

    // Expose for debugging in development
    if (window.location.hostname === 'webflow.io' || 
        window.location.hostname.includes('localhost')) {
        window.tracker = tracker;
    }
})();