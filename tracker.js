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
      endTime: start.toISOString(),
      timeOnPage: '0 seconds'
    };
  
    // Helper function to send data using sendBeacon
    const sendData = (data) => {
      const blob = new Blob(
        [new URLSearchParams(data).toString()],
        {type: 'application/x-www-form-urlencoded'}
      );
      navigator.sendBeacon(URL, blob);
    };
  
    // Send initial visit data
    try {
      sendData(data);
    } catch (e) {
      console.error('Error sending initial tracking data:', e);
    }
  
    // Function to send final data
    const sendFinalData = () => {
      const end = new Date();
      const finalData = {
        ...data,
        endTime: end.toISOString(),
        timeOnPage: `${Math.round((end - start) / 1000)} seconds`
      };
      sendData(finalData);
    };
  
    // Listen for page visibility changes
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        sendFinalData();
      }
    });
  
    // Listen for page hide with capture
    window.addEventListener('pagehide', sendFinalData, {capture: true});
  
    // Handle internal navigation
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a');
      if (link && link.href && link.href.includes(window.location.hostname)) {
        setTimeout(sendFinalData, 0);
      }
    });
  };
  
  // Initialize tracking when page is ready
  if (document.readyState === 'complete') {
    trackPageVisit();
  } else {
    window.addEventListener('load', trackPageVisit);
  }