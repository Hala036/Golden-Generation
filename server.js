import express from 'express';
import cors from 'cors';
import admin from 'firebase-admin';
import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Get the directory of the current module file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Firebase setup
(async () => {
  try {
    const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
    const serviceAccount = JSON.parse(await readFile(serviceAccountPath, 'utf-8'));

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: 'https://golden-generation-de85d.firebaseio.com',
    });

    // Middleware
    app.use(cors());
    app.use(express.json());

    // Routes
    app.get('/api/settlements', async (req, res) => {
      try {
        let snapshot;
        try {
          snapshot = await admin.firestore()
            .collection('availableSettlements')
            .where('available', '==', true)
            .orderBy('name', 'asc')
            .get();
        } catch (indexError) {
          console.warn('Firestore index error, fallback:', indexError.message);
          snapshot = await admin.firestore()
            .collection('availableSettlements')
            .where('available', '==', true)
            .get();
        }
        const settlements = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        res.json(settlements || []);
      } catch (err) {
        console.error('Error fetching settlements:', err.message);
        res.status(500).json({ error: 'Failed to fetch settlements', message: err.message });
      }
    });

    app.get('/api/languages', (_req, res) => {
      res.json([
        { value: 'english', label: 'English' },
        { value: 'arabic', label: 'Arabic' },
        { value: 'hebrew', label: 'Hebrew' },
        { value: 'french', label: 'French' },
        { value: 'spanish', label: 'Spanish' },
        { value: 'german', label: 'German' },
        { value: 'russian', label: 'Russian' },
        { value: 'portuguese', label: 'Portuguese' },
        { value: 'chinese', label: 'Chinese (Mandarin)' },
        { value: 'hindi', label: 'Hindi' },
        { value: 'japanese', label: 'Japanese' },
        { value: 'korean', label: 'Korean' },
        { value: 'italian', label: 'Italian' },
        { value: 'dutch', label: 'Dutch' },
        { value: 'polish', label: 'Polish' },
        { value: 'turkish', label: 'Turkish' },
        { value: 'swedish', label: 'Swedish' },
        { value: 'ukrainian', label: 'Ukrainian' },
        { value: 'greek', label: 'Greek' },
        { value: 'romanian', label: 'Romanian' }
      ]);
    });

    app.get('/api/health', (_req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

  app.get('/api/settlements', async (req, res) => {
  try {
    let snapshot;
    try {
      snapshot = await admin.firestore()
        .collection('availableSettlements')
        .where('available', '==', true)
        .orderBy('name', 'asc')
        .get();
    } catch (indexError) {
      console.warn('Firestore index error, fallback:', indexError.message);
      snapshot = await admin.firestore()
        .collection('availableSettlements')
        .where('available', '==', true)
        .get();
    }

    const settlements = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json(settlements || []);
  } catch (err) {
    console.error('Error fetching settlements:', err); // Make sure this logs the full error
    res.status(500).json({ error: 'Failed to fetch settlements', message: err.message });
  }
});

    app.listen(PORT, '127.0.0.1', () => {
      console.log(`✅ Server is running on http://127.0.0.1:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
})();
