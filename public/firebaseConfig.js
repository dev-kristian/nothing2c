// public/firebaseConfig.js
const firebaseConfig = {
  apiKey: "AIzaSyBMl2-dsWYFs_vVG_oKjBg6WCjl79QBR_Y",
  authDomain: "kino-n-chill.firebaseapp.com",
  projectId: "kino-n-chill",
  storageBucket: "kino-n-chill.appspot.com",
  messagingSenderId: "904976281790",
  appId: "1:904976281790:web:eb2fbdd47862df668a6eef"
};

// For the service worker
if (typeof self !== 'undefined') {
  self.firebaseConfig = firebaseConfig;
}

// For the main app
if (typeof module !== 'undefined') {
  module.exports = firebaseConfig;
}