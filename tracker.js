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
    
    // Get referrer information
    let referrerSource = 'direct';
    if (document.referrer) {
      // Don't try to parse the URL, just extract the hostname part
      referrerSource = document.referrer.split('/')[2] || utmSource || 'direct';
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
  
    // Send initial page visit data
    try {
      const params = new URLSearchParams(data);
      const response = await fetch(`${URL}?${params.toString()}`);
      if (!response.ok) {
        console.error('Failed to send initial tracking data:', response.status);
      }
    } catch (e) {
      console.error('Error sending initial tracking data:', e);
    }
  
    // Handle page navigation and closing
    const sendFinalData = () => {
      const end = new Date();
      const finalData = {
        ...data,
        endTime: end.toISOString(),
        timeOnPage: `${Math.round((end - start) / 1000)} seconds`
      };
  
      // Use sendBeacon for more reliable data sending during page unload
      try {
        const successful = navigator.sendBeacon(URL, new URLSearchParams(finalData));
        if (!successful) {
          // Fallback to fetch if sendBeacon fails
          fetch(URL, {
            method: 'POST',
            body: new URLSearchParams(finalData),
            keepalive: true
          }).catch(e => console.error('Error in fetch fallback:', e));
        }
      } catch (e) {
        console.error('Error in sendBeacon:', e);
      }
    };
  
    // Listen for both page hide and beforeunload events
    window.addEventListener('pagehide', sendFinalData);
    window.addEventListener('beforeunload', sendFinalData);
  
    // Handle navigation within the site
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a');
      if (link && link.href && link.href.includes(window.location.hostname)) {
        sendFinalData();
      }
    });
  };
  
  // Initialize tracking
  trackPageVisit();