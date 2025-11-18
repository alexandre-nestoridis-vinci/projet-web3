export const environment = {
  production: false,
  useEmulators: true, // 🔧 Mode développement local avec émulateurs
  firebase: {
    apiKey: "AIzaSyBL7Y_moxFVhQBmsyLQDwT1H0twCn72TsE",
    authDomain: "news-app-api-vinci.firebaseapp.com",
    projectId: "news-app-api-vinci",
    storageBucket: "news-app-api-vinci.firebasestorage.app",
    messagingSenderId: "118445075960",
    appId: "1:118445075960:web:484e66323f36962babba0d"
  },
  api: {
    // 🚀 URLs pour développement local (émulateurs)
    baseUrl: "http://127.0.0.1:5001/news-app-api-vinci/us-central1",
    endpoints: {
      testFirestore: "/testFirestore",
      fetchNews: "/api/api/fetch-ai-news", 
      processWithAI: "/processWithAI"
    }
  },
  newsApi: {
    key: "your-news-api-key",
    baseUrl: "https://newsapi.org/v2"
  },
  openai: {
    apiKey: "your-openai-api-key"
  }
};