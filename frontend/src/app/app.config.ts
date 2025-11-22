import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getFirestore, provideFirestore, connectFirestoreEmulator } from '@angular/fire/firestore';
import { getAuth, provideAuth, connectAuthEmulator } from '@angular/fire/auth';
import { getFunctions, provideFunctions, connectFunctionsEmulator } from '@angular/fire/functions';
import { provideHttpClient } from '@angular/common/http';

import { routes } from './app.routes';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes), 
    provideHttpClient(),
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAuth(() => {
      const auth = getAuth();
      if (environment.useEmulators) {
        connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
      }
      return auth;
    }),
    provideFirestore(() => {
      const firestore = getFirestore();
      if (environment.useEmulators) {
        connectFirestoreEmulator(firestore, '127.0.0.1', 9099); 
      }
      return firestore;
    }),
    
    provideFunctions(() => {
      const functions = getFunctions();
      if (environment.useEmulators) {
        // PORT CORRECT : Fonctions est sur 5001 (confirmé par vos logs)
        connectFunctionsEmulator(functions, '127.0.0.1', 5001);
      }
      return functions;
    })
  ]
};