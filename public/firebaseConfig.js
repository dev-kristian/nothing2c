// public/firebaseConfig.js
const firebaseConfig = {
  apiKey: "AIzaSyB0eS_-BHrntaXgg7ICiBf4tek5MYPW_Oo",
  authDomain: "nothing2c-tv.firebaseapp.com",
  projectId: "nothing2c-tv",
  storageBucket: "nothing2c-tv.firebasestorage.app",
  messagingSenderId: "451648445800",
  appId: "1:451648445800:web:9f4087caf98d5847440add",
};

// For the service worker
if (typeof self !== 'undefined') {
  self.firebaseConfig = firebaseConfig;
}

// For the main app
if (typeof module !== 'undefined') {
  module.exports = firebaseConfig;
}