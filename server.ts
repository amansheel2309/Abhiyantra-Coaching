import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

// Reconfigure JSON max limit to accept PDF/CSV base64 payloads
app.use(express.json({ limit: '60mb' }));
app.use(express.urlencoded({ limit: '60mb', extended: true }));

import { MongoClient } from 'mongodb';

const DB_FILE_PATH = path.join(process.cwd(), 'coaching_db.json');
const MONGODB_URI = process.env.MONGODB_URI || '';

// Memory cache of DB
let dbCache: any = {
  users: [],
  quizzes: [],
  timelines: [],
  attempts: [],
  notifications: [],
  leaderboard: [],
  lectures: []
};

// MongoDB Client Connection Setup
let mongoClient: MongoClient | null = null;
let isMongoConnected = false;

async function connectMongo() {
  if (MONGODB_URI) {
    try {
      mongoClient = new MongoClient(MONGODB_URI);
      await mongoClient.connect();
      isMongoConnected = true;
      console.log('Connected successfully to cloud MongoDB database');
    } catch (err) {
      console.error('MongoDB cloud connection failed, falling back to local file database:', err);
      isMongoConnected = false;
    }
  } else {
    console.log('No MONGODB_URI found in environment. Local file database persistence active.');
  }
}

async function loadDatabase() {
  if (isMongoConnected && mongoClient) {
    try {
      const db = mongoClient.db();
      const keys = Object.keys(dbCache);
      for (const key of keys) {
        const collection = db.collection(key);
        const docs = await collection.find({}).toArray();
        // Remove MongoDB internal _id field to match client schema formats
        dbCache[key] = docs.map(doc => {
          const { _id, ...rest } = doc;
          return rest;
        });
      }
    } catch (error) {
      console.error('Failed to load database from MongoDB collections:', error);
    }
  } else {
    try {
      if (fs.existsSync(DB_FILE_PATH)) {
        const content = fs.readFileSync(DB_FILE_PATH, 'utf-8');
        dbCache = JSON.parse(content);
      } else {
        fs.writeFileSync(DB_FILE_PATH, JSON.stringify(dbCache, null, 2), 'utf-8');
      }
    } catch (error) {
      console.error('Error reading/initializing local coaching database:', error);
    }
  }
}

async function saveDatabaseKey(key: string, data: any[]) {
  if (isMongoConnected && mongoClient) {
    try {
      const db = mongoClient.db();
      const collection = db.collection(key);
      
      // Clear existing records and bulk insert
      await collection.deleteMany({});
      if (data.length > 0) {
        // Strip any MongoDB _id field that might be present
        const cleanedData = data.map(item => {
          const { _id, ...rest } = item;
          return rest;
        });
        await collection.insertMany(cleanedData);
      }
      dbCache[key] = data;
    } catch (error) {
      console.error(`Failed to save key "${key}" to MongoDB:`, error);
    }
  } else {
    dbCache[key] = data;
    try {
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(dbCache, null, 2), 'utf-8');
    } catch (error) {
      console.error('Error writing coaching database to file:', error);
    }
  }
}

// Retrieve the Gemini API Key
const apiKey = process.env.GEMINI_API_KEY;

// Configure Google GenAI Client
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    apiConfigured: !!ai,
    environment: process.env.NODE_ENV || 'development',
  });
});

// Shared Database API Endpoints
app.get('/api/db', async (req, res) => {
  await loadDatabase();
  res.json(dbCache);
});

app.post('/api/db/save', async (req, res) => {
  const { key, data } = req.body;
  if (!key || !Array.isArray(data)) {
    return res.status(400).json({ error: 'Invalid payload key or array format' });
  }

  await saveDatabaseKey(key, data);
  res.json({ success: true });
});

app.post('/api/db/reset', async (req, res) => {
  if (isMongoConnected && mongoClient) {
    try {
      const db = mongoClient.db();
      for (const key of Object.keys(dbCache)) {
        await db.collection(key).deleteMany({});
      }
    } catch (e) {
      console.error('Failed to reset MongoDB database:', e);
    }
  }
  if (fs.existsSync(DB_FILE_PATH)) {
    try {
      fs.unlinkSync(DB_FILE_PATH);
    } catch (e) {}
  }
  dbCache = {
    users: [],
    quizzes: [],
    timelines: [],
    attempts: [],
    notifications: [],
    leaderboard: [],
    lectures: []
  };
  await loadDatabase();
  res.json({ success: true, message: 'Database reset successfully' });
});

// Automated Quiz Generation using Gemini 3.5 Flash
app.post('/api/quiz/generate', async (req, res) => {
  try {
    if (!ai) {
      return res.status(400).json({
        error: 'Gemini API is not configured on the server. Please add your GEMINI_API_KEY in Settings > Secrets.',
      });
    }

    const {
      subject,
      classLevel,
      numQuestions = 5,
      textBody,
      fileBase64,
      fileMimeType,
    } = req.body;

    const actualNumQ = Math.min(Math.max(Number(numQuestions) || 5, 2), 15);

    let systemPrompt = `You are a Senior Academic Subject Expert and Exam Setter for "Abhiyantra Coaching", specializing in premium, advanced-level competitive exam questions (JEE Advanced/NEET standard) for Class 11 and Class 12.
Your goal is to parse the input provided and generate exactly ${actualNumQ} high-quality, concept-heavy Multiple Choice Questions (MCQs) for a Class ${classLevel} ${subject} student.`;

    let userInstruction = `Generate exactly ${actualNumQ} MCQs conforming to the strict JSON schema provided.
Each question must test conceptual mastery, logical reasoning, or multi-step calculations relevant to Class ${classLevel} ${subject}.
Ensure the questions are challenging (JEE/NEET caliber) yet solvable, and provide deep, step-by-step mathematical or chemical/physical proofs in the 'explanation' field.
For each question, specify a specific subtopic name in the 'topic' field for performance analysis.
If the input resource contains existing questions, convert them into high-fidelity multiple-choice format with detailed explanations. If the input is general material, construct brand new conceptual application-based questions from that material.`;

    const contentsArray: any[] = [];

    // Check if base64 file is uploaded (PDF or CSV or general)
    if (fileBase64 && fileMimeType) {
      contentsArray.push({
        inlineData: {
          data: fileBase64.split(',')[1] || fileBase64,
          mimeType: fileMimeType,
        },
      });
      userInstruction += `\nAnalyze the attached document (MIME: ${fileMimeType}) carefully to extract or generate the quiz questions.`;
    }

    if (textBody) {
      contentsArray.push({
        text: `Source Text:\n${textBody}\n\nUser Notes:\nCreate questions based on this topic context.`,
      });
    } else if (!fileBase64) {
      contentsArray.push({
        text: `Create a general mock test series on the state of the art syllabus for Class ${classLevel} in ${subject}.`,
      });
    }

    contentsArray.push({ text: userInstruction });

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: contentsArray,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          description: 'A list of generated coaching test questions.',
          items: {
            type: Type.OBJECT,
            properties: {
              text: {
                type: Type.STRING,
                description: 'The conceptual, high-caliber question text. Use standard formatting.',
              },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Exactly 4 multiple-choice options.',
              },
              correctAnswerIndex: {
                type: Type.INTEGER,
                description: 'The 0-based index of the correct option (0, 1, 2, or 3).',
              },
              explanation: {
                type: Type.STRING,
                description: 'A beautifully written, progressive, step-by-step breakdown of the formula, solution, and reasoning behind the correct answer.',
              },
              topic: {
                type: Type.STRING,
                description: 'The specific chapter subtopic name (e.g. Rotation Dynamics, Chemical Thermodynamics, Vector Calculus, Genetics). Keep it consistent.',
              },
              difficulty: {
                type: Type.STRING,
                enum: ['Easy', 'Medium', 'Hard'],
                description: 'The challenge rating.',
              },
            },
            required: ['text', 'options', 'correctAnswerIndex', 'explanation', 'topic', 'difficulty'],
          },
        },
      },
    });

    const outputText = response.text || '[]';
    // Return parsed results safely
    return res.json(JSON.parse(outputText.trim()));
  } catch (error: any) {
    console.error('Gemini generate error:', error);
    return res.status(500).json({
      error: 'Failed to generate quiz. Check your file format or try a smaller size.',
      details: error.message,
    });
  }
});

// Configure Vite middleware or static serving
async function setupApp() {
  // Connect to cloud database if available, and load initial cache
  await connectMongo();
  await loadDatabase();

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Bind to dynamic process.env.PORT to satisfy Render/Railway requirement
  const port = process.env.PORT || PORT;
  app.listen(Number(port), '0.0.0.0', () => {
    console.log(`Abhiyantra Platform running on http://localhost:${port}`);
  });
}

setupApp();
