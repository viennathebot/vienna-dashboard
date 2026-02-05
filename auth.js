// Vienna Dashboard Password Gate
// Immediately hide content and show password overlay
(function() {
  'use strict';

  // SHA-256 hash of the correct password
  var CORRECT_HASH = 'eb713e1bac76b5d89f28aa05e9e31ce5acacc7d1fe45b5b3085252d16cc874cd';
  var SESSION_KEY = 'vienna_auth';

  // Check if already authenticated this session
  if (sessionStorage.getItem(SESSION_KEY) === 'true') {
    return; // Already authenticated
  }

  // Hide all body content immediately
  document.body.style.display = 'none';

  // Wait for DOM then show overlay
  function init() {
    document.body.style.display = '';

    // Create overlay
    var overlay = document.createElement('div');
    overlay.id = 'vienna-auth-overlay';
    overlay.innerHTML = [
      '<style>',
      '#vienna-auth-overlay {',
      '  position: fixed; top: 0; left: 0; width: 100%; height: 100%;',
      '  background: #0f172a; z-index: 999999;',
      '  display: flex; align-items: center; justify-content: center;',
      '  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;',
      '}',
      '#vienna-auth-overlay * { box-sizing: border-box; }',
      '#vienna-auth-box {',
      '  background: #1e293b; border-radius: 16px; padding: 48px 40px;',
      '  text-align: center; max-width: 400px; width: 90%;',
      '  box-shadow: 0 25px 50px rgba(0,0,0,0.5);',
      '  border: 1px solid #334155;',
      '}',
      '#vienna-auth-logo {',
      '  font-size: 64px; margin-bottom: 8px;',
      '  filter: drop-shadow(0 0 20px rgba(225, 29, 72, 0.4));',
      '}',
      '#vienna-auth-title {',
      '  color: #f8fafc; font-size: 24px; font-weight: 700;',
      '  margin-bottom: 8px; letter-spacing: -0.5px;',
      '}',
      '#vienna-auth-subtitle {',
      '  color: #94a3b8; font-size: 14px; margin-bottom: 32px;',
      '}',
      '#vienna-auth-input {',
      '  width: 100%; padding: 14px 18px; font-size: 16px;',
      '  border: 2px solid #334155; border-radius: 10px;',
      '  background: #0f172a; color: #f8fafc;',
      '  outline: none; margin-bottom: 16px;',
      '  transition: border-color 0.2s;',
      '}',
      '#vienna-auth-input:focus { border-color: #e11d48; }',
      '#vienna-auth-input.shake {',
      '  animation: authShake 0.5s ease-in-out;',
      '  border-color: #ef4444;',
      '}',
      '@keyframes authShake {',
      '  0%, 100% { transform: translateX(0); }',
      '  20%, 60% { transform: translateX(-8px); }',
      '  40%, 80% { transform: translateX(8px); }',
      '}',
      '#vienna-auth-btn {',
      '  width: 100%; padding: 14px; font-size: 16px; font-weight: 600;',
      '  background: #e11d48; color: white; border: none;',
      '  border-radius: 10px; cursor: pointer;',
      '  transition: background 0.2s, transform 0.1s;',
      '}',
      '#vienna-auth-btn:hover { background: #be123c; }',
      '#vienna-auth-btn:active { transform: scale(0.98); }',
      '#vienna-auth-error {',
      '  color: #ef4444; font-size: 14px; margin-top: 12px;',
      '  min-height: 20px;',
      '}',
      '</style>',
      '<div id="vienna-auth-box">',
      '  <div id="vienna-auth-logo">🫀</div>',
      '  <div id="vienna-auth-title">Vienna Dashboard</div>',
      '  <div id="vienna-auth-subtitle">Enter password to continue</div>',
      '  <input type="password" id="vienna-auth-input" placeholder="Password" autocomplete="off" />',
      '  <button id="vienna-auth-btn">Unlock</button>',
      '  <div id="vienna-auth-error"></div>',
      '</div>'
    ].join('\n');

    // Hide real content behind overlay
    var realContent = document.body.children;
    for (var i = 0; i < realContent.length; i++) {
      if (realContent[i] !== overlay) {
        realContent[i].style.display = 'none';
      }
    }

    document.body.insertBefore(overlay, document.body.firstChild);

    // Store references to hidden elements
    var hiddenEls = [];
    for (var j = 0; j < document.body.children.length; j++) {
      var el = document.body.children[j];
      if (el !== overlay) {
        hiddenEls.push(el);
      }
    }

    var input = document.getElementById('vienna-auth-input');
    var btn = document.getElementById('vienna-auth-btn');
    var error = document.getElementById('vienna-auth-error');

    function unlock() {
      var password = input.value;
      sha256(password).then(function(hash) {
        if (hash === CORRECT_HASH) {
          sessionStorage.setItem(SESSION_KEY, 'true');
          overlay.style.opacity = '0';
          overlay.style.transition = 'opacity 0.3s ease';
          setTimeout(function() {
            overlay.remove();
            for (var k = 0; k < hiddenEls.length; k++) {
              hiddenEls[k].style.display = '';
            }
          }, 300);
        } else {
          input.classList.add('shake');
          error.textContent = 'Incorrect password';
          input.value = '';
          setTimeout(function() { input.classList.remove('shake'); }, 500);
        }
      });
    }

    btn.addEventListener('click', unlock);
    input.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') unlock();
      error.textContent = '';
    });

    input.focus();
  }

  // SHA-256 using Web Crypto API
  function sha256(message) {
    var encoder = new TextEncoder();
    var data = encoder.encode(message);
    return crypto.subtle.digest('SHA-256', data).then(function(buffer) {
      var array = Array.from(new Uint8Array(buffer));
      return array.map(function(b) { return b.toString(16).padStart(2, '0'); }).join('');
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
