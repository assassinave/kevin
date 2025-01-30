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
        #state = {
            pageStart: null,
            pageData: null,
            isTracking: false,
            currentRequest: null
        };

        constructor() {
            this.#visitorId = this.#initializeVisitorId();
            this.#initializeScreenObserver();
            this.#bindEventHandlers();
        }

        // ... [rest of the modernized code from previous artifact, 
        //     but with module imports/exports removed]
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