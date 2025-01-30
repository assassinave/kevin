const getBrowserInfo = ua => {
    const os = ['Windows', 'Mac', 'Linux', 'Android', 'iOS'].find(os => ua.includes(os)) || 'Unknown OS';
    const browser = ['Chrome', 'Firefox', 'Safari', 'Edge'].find(browser => ua.includes(browser)) || 'Unknown Browser';
    return `${os}, ${browser}`;
  };
  
  const trackPageVisit = async () => {
    const start = new Date();
    const URL = 'https://script.google.com/macros/s/AKfycbxtpR6C4zEjlZ5tRlYUbHPH1yBaXdk3YPX5hJZlV_av2oSm34C3obBqFy0chnjF1S_a/exec';
    
    // Get URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const utmSource = urlParams.get('utm_source');
    
    // Check for referrer or UTM parameters
    let referrerSource = 'direct';
    if (document.referrer) {
      // Extract hostname from referrer URL without using URL constructor
      const hostnameMatch = document.referrer.match(/^https?:\/\/([^/?#]+)(?:[/?#]|$)/i);
      referrerSource = hostnameMatch ? hostnameMatch[1] : utmSource || 'direct';
    } else if (utmSource) {
      referrerSource = utmSource;
    }
    
    const data = {
      url: window.location.href,
      referrer: referrerSource,
      userAgent: getBrowserInfo(navigator.userAgent),
      screenSize: `${screen.width}x${screen.height}`,
      visitor: localStorage.getItem('isOwner') === 'true' ? 'Owner' : 'Visitor',
      startTime: start.toISOString(),
      endTime: start.toISOString(), // Initially same as start time
      timeOnPage: '0 seconds'
    };
  
    // Send initial page visit
    try {
      const params = new URLSearchParams(data);
      await fetch(`${URL}?${params.toString()}`);
    } catch (e) {
      console.error('Error sending tracking data:', e);
    }
  
    const sendFinalData = () => {
      const end = new Date();
      const finalData = {
        ...data,
        endTime: end.toISOString(),
        timeOnPage: `${Math.round((end - start) / 1000)} seconds`
      };
      navigator.sendBeacon(URL, new URLSearchParams(finalData));
    };
  
    // Handle page exit and navigation
    window.addEventListener('beforeunload', sendFinalData);
    
    // Track internal navigation
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a');
      if (link && link.href && link.href.includes(window.location.hostname)) {
        sendFinalData();
      }
    });
  };
  
  // Start tracking
  trackPageVisit();