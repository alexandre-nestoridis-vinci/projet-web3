/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {setGlobalOptions} from "firebase-functions";
import {onRequest} from "firebase-functions/https";
import * as logger from "firebase-functions/logger";
import {initializeApp} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";

// Initialize Firebase Admin
initializeApp();

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({maxInstances: 10});

// Test de connexion Firestore depuis le backend
export const testFirestore = onRequest(async (request, response) => {
  try {
    const db = getFirestore();

    // Test d'écriture en base
    const testDoc = {
      message: "Test depuis Cloud Functions",
      timestamp: new Date(),
      source: "backend",
    };

    const docRef = await db.collection("backend-tests").add(testDoc);

    logger.info("Document ajouté avec ID:", docRef.id);

    response.json({
      success: true,
      message: "Connexion Firestore réussie depuis le backend!",
      docId: docRef.id,
    });
  } catch (error) {
    logger.error("Erreur Firestore:", error);
    response.status(500).json({
      success: false,
      error: "Erreur de connexion Firestore",
    });
  }
});

// API pour récupérer les news
export const fetchNews = onRequest(async (request, response) => {
  response.json({
    message: "API News - À implémenter",
    status: "TODO",
  });
});

// API pour traitement IA
export const processWithAI = onRequest(async (request, response) => {
  response.json({
    message: "API IA - À implémenter",
    status: "TODO",
  });
});
