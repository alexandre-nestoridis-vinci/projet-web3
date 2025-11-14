export const environment = {
  production: true,
  useEmulators: false, // 🚀 Mode production avec Firebase hébergé
  firebase: {
    apiKey: "AIzaSyBL7Y_moxFVhQBmsyLQDwT1H0twCn72TsE",
    authDomain: "news-app-api-vinci.firebaseapp.com",
    projectId: "news-app-api-vinci",
    storageBucket: "news-app-api-vinci.firebasestorage.app",
    messagingSenderId: "118445075960",
    appId: "1:118445075960:web:484e66323f36962babba0d"
  },
  api: {
    // 🔥 URLs pour production (Firebase Functions déployées)
    baseUrl: "https://us-central1-news-app-api-vinci.cloudfunctions.net",
    endpoints: {
      testFirestore: "/testFirestore",
      fetchNews: "/fetchNews",
      processWithAI: "/processWithAI"
    }
  },
  newsApi: {
    key: "your-production-news-api-key",
    baseUrl: "https://newsapi.org/v2"
  },
  openai: {
    apiKey: "your-production-openai-api-key"
  }
};