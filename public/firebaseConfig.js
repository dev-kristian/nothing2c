// public/firebaseConfig.js
const firebaseConfig = {

  apiKey: "AIzaSyA5gG1JdCZ3F_pIGRf-buTBDOpU35k9oEA",

  authDomain: "nothing-2c.firebaseapp.com",

  projectId: "nothing-2c",

  storageBucket: "nothing-2c.firebasestorage.app",

  messagingSenderId: "288575155282",

  appId: "1:288575155282:web:1cf74c79fa51d87b19438b",

  measurementId: "G-6PZVM9J5QY"

};

// For the service worker
if (typeof self !== 'undefined') {
  self.firebaseConfig = firebaseConfig;
}

// For the main app
if (typeof module !== 'undefined') {
  module.exports = firebaseConfig;
}