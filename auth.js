// Vienna Dashboard Authentication
// Password: Vienna2026! (SHA-256 hashed, never stored in plain text)
(function() {
  const HASH = 'eb713e1bac76b5d89f28aa05e9e31ce5acacc7d1fe45b5b3085252d16cc874cd';
  const KEY = 'vienna_auth';
  
  async function sha256(str) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }
  
  async function checkAuth() {
    // Check if already authenticated
    if (localStorage.getItem(KEY) === HASH) {
      document.body.style.visibility = 'visible';
      return;
    }
    
    // Prompt for password
    const pwd = prompt('🔐 Vienna Dashboard\n\nEnter password:');
    if (!pwd) {
      document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:system-ui;color:#666;background:#0f172a;"><p>Access denied. Refresh to try again.</p></div>';
      document.body.style.visibility = 'visible';
      return;
    }
    
    const hash = await sha256(pwd);
    if (hash === HASH) {
      localStorage.setItem(KEY, HASH);
      document.body.style.visibility = 'visible';
    } else {
      document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:system-ui;color:#666;background:#0f172a;"><p>❌ Incorrect password. Refresh to try again.</p></div>';
      document.body.style.visibility = 'visible';
    }
  }
  
  // Hide body until authenticated
  document.body.style.visibility = 'hidden';
  checkAuth();
})();
