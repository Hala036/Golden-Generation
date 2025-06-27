import express from 'express';
import cors from 'cors';
import admin from 'firebase-admin';
import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import pkg from 'agora-access-token';
import iconv from 'iconv-lite';
import Papa from 'papaparse';
import fs from 'fs';
const { RtcTokenBuilder, RtcRole } = pkg;

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Get the directory of the current module file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin (only once)
(async () => {
  try {
    const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
    const serviceAccount = JSON.parse(await readFile(serviceAccountPath, 'utf-8'));

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: 'https://golden-generation-de85d.firebaseio.com',
    });
    console.log('Firebase Admin initialized successfully.');

    // Middleware (moved here to be applied before any routes)
    app.use(cors());
    app.use(express.json());

    // Settlements Route (corrected, removed duplicate)
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

    // Settlements CSV Route (serves settlements from CSV with Hebrew support)
    app.get('/api/settlements-csv', async (req, res) => {
      try {
        const csvPath = path.join(__dirname, 'public', 'data', 'settlemnts_list_CSV.csv');
        const buffer = fs.readFileSync(csvPath);
        // Try decoding as windows-1255 (common for Hebrew CSVs)
        const csvText = iconv.decode(buffer, 'windows-1255');
        const results = Papa.parse(csvText, { header: true, skipEmptyLines: true });
        res.json(results.data);
      } catch (err) {
        console.error('Error reading settlements CSV:', err.message);
        res.status(500).json({ error: 'Failed to read settlements CSV', message: err.message });
      }
    });

    // Languages Route
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

    // Health Check Route
    app.get('/api/health', (_req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // Agora Token Generation Route
    app.post('/api/agora/token', (req, res) => {
      const { channelName, uid } = req.body;
      console.log('Backend: Token request received:', { channelName, uid });

      if (!channelName || typeof uid === 'undefined') {
        console.error('Backend: Missing channelName or uid');
        return res.status(400).json({ error: 'channelName and uid are required' });
      }

      if (!AGORA_APP_ID || !AGORA_APP_CERTIFICATE) {
        console.error('Backend: AGORA_APP_ID or AGORA_APP_CERTIFICATE not configured');
        return res.status(500).json({ error: 'Agora credentials are not configured on the server' });
      }

      const role = RtcRole.PUBLISHER;
      const expireTimeSeconds = 3600; // 1 hour
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const privilegeExpireTs = currentTimestamp + expireTimeSeconds;

      // Ensure UID is a number as required by buildTokenWithUid
      const numericUid = Number(uid);
      if (isNaN(numericUid)) {
        console.error('Backend: UID is not a number:', uid);
        return res.status(400).json({ error: 'UID must be a valid number' });
      }

      try {
        const token = RtcTokenBuilder.buildTokenWithUid(
          AGORA_APP_ID,
          AGORA_APP_CERTIFICATE,
          channelName,
          numericUid,
          role,
          privilegeExpireTs
        );
        res.json({ token, appId: AGORA_APP_ID });
        console.log('Backend: Token generated successfully.');
      } catch (error) {
        console.error('Backend: Error generating Agora token:', error);
        res.status(500).json({ error: 'Failed to generate Agora token', details: error.message });
      }
    });

    // Start the server (moved outside the async IIFE)
    app.listen(PORT, '127.0.0.1', () => {
      console.log(`✅ Server is running on http://127.0.0.1:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
})();

const AGORA_APP_ID = process.env.AGORA_APP_ID;
const AGORA_APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE;
