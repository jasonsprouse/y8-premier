import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import multer from "multer";
import { GoogleGenAI, GenerateVideosOperation } from "@google/genai";
import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode, LinkTokenCreateRequest } from "plaid";
import session from "express-session";
import { generateNonce, SiweMessage } from "siwe";
import dotenv from "dotenv";

dotenv.config({ override: true });

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

app.use(express.json());

app.use(session({
  name: 'siwe-session',
  secret: process.env.SESSION_SECRET || 'siwe-y8-premier-secret',
  resave: true,
  saveUninitialized: true,
  cookie: { secure: false, sameSite: true }
}));

// --- SIWE Auth Setup ---
app.get('/api/auth/nonce', function (req, res) {
  (req.session as any).nonce = generateNonce();
  res.setHeader('Content-Type', 'text/plain');
  res.status(200).send((req.session as any).nonce);
});

app.post('/api/auth/verify', async function (req, res) {
  try {
    if (!req.body.message) {
      res.status(422).json({ message: 'Expected prepareMessage object as body.' });
      return;
    }

    const message = new SiweMessage(req.body.message);
    const fields = await message.verify({ 
      signature: req.body.signature, 
      nonce: (req.session as any).nonce 
    });

    (req.session as any).siwe = fields;
    if (fields.data.expirationTime) {
      req.session.cookie.expires = new Date(fields.data.expirationTime);
    }
    
    req.session.save(() => {
      res.status(200).json({ success: true, address: fields.data.address });
    });
  } catch (e: any) {
    (req.session as any).siwe = null;
    (req.session as any).nonce = null;
    console.error('SIWE Verification error:', e);
    res.status(400).json({ error: e.message || e.toString() });
  }
});

const upload = multer({ storage: multer.memoryStorage() });

// --- Plaid Setup ---
const getPlaidClient = () => {
  if (!process.env.PLAID_CLIENT_ID || !process.env.PLAID_SECRET) {
    throw new Error('Missing PLAID_CLIENT_ID or PLAID_SECRET environment variables. Please add them in the Settings menu.');
  }
  const envStr = (process.env.PLAID_ENV || 'sandbox').trim().toLowerCase();
  const basePath = envStr === 'production' 
    ? PlaidEnvironments.production 
    : envStr === 'development' 
      ? PlaidEnvironments.development 
      : PlaidEnvironments.sandbox;

  const plaidConfig = new Configuration({
    basePath,
    baseOptions: {
      headers: {
        'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID.trim(),
        'PLAID-SECRET': process.env.PLAID_SECRET.trim(),
        'Plaid-Version': '2020-09-14',
      },
    },
  });
  return new PlaidApi(plaidConfig);
};

let accessToken: string | null = null;

// --- Gemini Setup ---
const getAi = () => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not set');
  }
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
};

// --- Financial Routes ---
app.post("/api/plaid/create_link_token", async (req, res) => {
  try {
    if (!process.env.PLAID_CLIENT_ID || !process.env.PLAID_SECRET) {
      return res.status(400).json({ error: "Missing PLAID_CLIENT_ID or PLAID_SECRET environment variables. Please add them in the Settings menu." });
    }
    const { primaryAddress } = req.body;
    const plaidClient = getPlaidClient();
    const request: LinkTokenCreateRequest = {
      user: {
        client_user_id: primaryAddress || 'user-id',
      },
      client_name: 'Y8 Premier',
      products: [Products.Auth, Products.Identity, Products.Transfer],
      language: 'en',
      country_codes: [CountryCode.Us],
    };
    const response = await plaidClient.linkTokenCreate(request);
    res.json(response.data);
  } catch (error: any) {
    console.error("Plaid error", error.response?.data || error.message);
    const statusCode = error.response?.status || 400;
    res.status(statusCode).json({ error: error.response?.data?.error_message || error.message || "Plaid error" });
  }
});

app.post("/api/plaid/set_access_token", async (req, res) => {
  try {
    if (!process.env.PLAID_CLIENT_ID || !process.env.PLAID_SECRET) {
      return res.status(400).json({ error: "Missing PLAID environment variables." });
    }
    const { public_token } = req.body;
    const plaidClient = getPlaidClient();
    const response = await plaidClient.itemPublicTokenExchange({ public_token });
    accessToken = response.data.access_token;
    res.json({ success: true });
  } catch (error: any) {
    console.error("Plaid token exchange error", error.response?.data || error.message);
    const statusCode = error.response?.status || 400;
    res.status(statusCode).json({ error: error.response?.data?.error_message || error.message || "Plaid error" });
  }
});

app.post("/api/financial/rafiki/transfer", async (req, res) => {
  const { recipient, amount } = req.body;
  // Mock Interledger Rafiki Payment
  setTimeout(() => {
    res.json({ success: true, transactionId: `ILP-${Date.now()}` });
  }, 1000);
});

app.get("/api/financial/ledger", async (req, res) => {
  // Mock TigerBeetle Ledger
  res.json([
    { id: 1, date: '10 Oct 14:22', description: 'Global Payment (Rafiki)', amount: -1240.00 },
    { id: 2, date: '10 Oct 09:15', description: 'Dividend Yield', amount: 45.20 },
    { id: 3, date: '09 Oct 18:44', description: 'Merchant Settlement', amount: -210.15 }
  ]);
});

// --- AI Routes ---
app.post("/api/ai/visual-qa", upload.single('image'), async (req, res) => {
  try {
    const ai = getAi();
    const { question } = req.body;
    const imagePart = req.file ? {
      inlineData: {
        mimeType: req.file.mimetype,
        data: req.file.buffer.toString('base64')
      }
    } : null;

    const parts: any[] = [{ text: question }];
    if (imagePart) parts.unshift(imagePart);

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: { parts }
    });
    res.json({ answer: response.text });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/ai/document-qa", upload.single('document'), async (req, res) => {
  try {
    const ai = getAi();
    const { question } = req.body;
    const docPart = req.file ? {
      inlineData: {
        mimeType: req.file.mimetype,
        data: req.file.buffer.toString('base64')
      }
    } : null;

    const parts: any[] = [{ text: question }];
    if (docPart) parts.unshift(docPart);

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: { parts }
    });
    res.json({ answer: response.text });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/ai/object-detection", upload.single('image'), async (req, res) => {
  try {
    const ai = getAi();
    if (!req.file) return res.status(400).json({ error: 'No image' });
    
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: {
        parts: [
          { inlineData: { mimeType: req.file.mimetype, data: req.file.buffer.toString('base64') } },
          { text: "Return a JSON array of objects detected in this image. Each object should have a 'label' string, 'confidence' string (e.g. '98%'), and a 'box' object with 'top', 'left', 'width', 'height' as percentages (e.g. '20%')." }
        ]
      },
      config: { responseMimeType: "application/json" }
    });
    res.json({ objects: JSON.parse(response.text || '[]') });
  } catch (e: any) {
    // Mock response if JSON parsing fails or something goes wrong
    res.json({ objects: [{ label: 'Object', confidence: '90%', box: { top: '20%', left: '30%', width: '40%', height: '30%' } }] });
  }
});

app.post("/api/ai/image-caption", upload.single('image'), async (req, res) => {
  try {
    const ai = getAi();
    if (!req.file) return res.status(400).json({ error: 'No image' });
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: {
        parts: [
          { inlineData: { mimeType: req.file.mimetype, data: req.file.buffer.toString('base64') } },
          { text: "Provide a detailed, professional caption for this image." }
        ]
      }
    });
    res.json({ caption: response.text });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/ai/text-to-image", async (req, res) => {
  try {
    const ai = getAi();
    const { prompt } = req.body;
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-image",
      contents: { parts: [{ text: prompt }] },
      config: {
        imageConfig: { aspectRatio: "1:1", imageSize: "1K" }
      }
    });
    
    let base64Image = null;
    if (response.candidates && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          base64Image = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
          break;
        }
      }
    }
    
    res.json({ result: base64Image });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/ai/text-to-video", async (req, res) => {
  try {
    const ai = getAi();
    const { prompt } = req.body;
    const operation = await ai.models.generateVideos({
      model: 'veo-3.1-lite-generate-preview',
      prompt: prompt,
      config: { numberOfVideos: 1, resolution: '720p', aspectRatio: '16:9' }
    });
    res.json({ operationName: operation.name });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/ai/video-status", async (req, res) => {
  try {
    const ai = getAi();
    const { operationName } = req.body;
    const op = new GenerateVideosOperation();
    op.name = operationName;
    const updated = await ai.operations.getVideosOperation({ operation: op });
    
    if (updated.done) {
      const uri = updated.response?.generatedVideos?.[0]?.video?.uri;
      res.json({ done: true, uri });
    } else {
      res.json({ done: false });
    }
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/ai/text-to-3d", async (req, res) => {
  // Mock 3D generation since there is no standard SDK endpoint for it yet
  setTimeout(() => {
    res.json({ success: true, modelUrl: 'mock' });
  }, 3000);
});


// --- Vite Integration & Server Startup ---
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
