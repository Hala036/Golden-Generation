import express from 'express';
import cors from 'cors';
import admin from 'firebase-admin';
import { readFile } from 'fs/promises';

const app = express();

(async () => {
  try {
    // Load service account
    const serviceAccount = JSON.parse(
      await readFile(new URL('./serviceAccountKey.json', import.meta.url))
    );
    
    // Initialize Firebase
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: 'https://golden-generation-de85d.firebaseio.com'
    });

    // Middleware
    app.use(cors());
    app.use(express.json());

    // Routes
    app.get('/api/settlements', async (req, res) => {
      try {
        // Try a simpler query first if the index isn't ready
        let snapshot;
        try {
          snapshot = await admin.firestore()
            .collection('availableSettlements')
            .where('available', '==', true)
            .orderBy('name', 'asc')
            .get();
        } catch (indexError) {
          console.warn('Index not ready, using fallback query:', indexError.message);
          // Fallback without ordering if index isn't ready
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

    app.get('/api/languages', (req, res) => {
      try {
        // Provide a more comprehensive list of common languages
        const languages = [
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
        ];
        res.json(languages);
      } catch (error) {
        console.error("Error in /api/languages:", error);
        res.status(500).json({ error: 'Failed to fetch languages', message: error.message });
      }
    });

    // Health check endpoint
    app.get('/api/health', (_req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, '127.0.0.1', () => console.log(`Server running on port ${PORT}`));
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();