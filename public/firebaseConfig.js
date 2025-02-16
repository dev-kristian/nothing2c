// public/firebaseConfig.js
const firebaseConfig = {
  apiKey: "AIzaSyD-MwfoLKLZZ3Zy096ZEtP_syBH6xBhBWY",
  authDomain: "afk-cinema.firebaseapp.com",
  projectId: "afk-cinema",
  storageBucket: "afk-cinema.firebasestorage.app",
  messagingSenderId: "117851804753",
  appId: "1:117851804753:web:4367690cba9f853ba79470",
};

// For the service worker
if (typeof self !== 'undefined') {
  self.firebaseConfig = firebaseConfig;
}

// For the main app
if (typeof module !== 'undefined') {
  module.exports = firebaseConfig;
}