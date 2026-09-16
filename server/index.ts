import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';

import {
  dirname,
  resolve,
} from 'node:path';

import {
  fileURLToPath,
} from 'node:url';

import {
  fetch as undiciFetch,
  ProxyAgent,
} from 'undici';

import {
  zodTextFormat,
} from 'openai/helpers/zod';

import {
  AIReviewSchema,
} from './aiReviewSchema';

import {
  GuidedDesignProposalSchema,
  GuidedDesignRequestSchema,
} from './guidedDesignSchema';

import {
  buildGuidedDesignPrompt,
} from './guidedDesignPrompt';

import {
  DesignAnalysisRequestSchema,
  DesignAnalysisSchema,
  DesignChangeRequestSchema,
  DesignChangeSetSchema,
} from './designAssistantSchema';

import {
  analysisPrompt,
  changePrompt,
} from './designAssistantPrompt';
import { validateExistingEdgeReferences } from './designAssistantValidation';

const serverDirectory = dirname(
  fileURLToPath(import.meta.url)
);

const rootEnvPath = resolve(
  serverDirectory,
  '..',
  '.env'
);

const dotenvResult = dotenv.config({
  path: rootEnvPath,
});

const app = express();

app.use(cors());
app.use(express.json());


// ==========================================
// OpenAI Client
// ==========================================

const proxyUrl =
  process.env.OPENAI_PROXY_URL?.trim();

const client = proxyUrl
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      fetch: undiciFetch as unknown as typeof globalThis.fetch,
      fetchOptions: {
        dispatcher: new ProxyAgent(proxyUrl),
      } as never,
    })
  : new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });


function logServerError(
  context: string,
  error: unknown
) {
  if (error instanceof Error) {
    console.error(`${context}:`, {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
    return;
  }

  console.error(`${context}:`, error);
}


// ==========================================
// Health Check
// ==========================================

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
  });
});


// ==========================================
// AI Skeleton Review
// ==========================================

app.post('/api/review', async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({
        error: 'Prompt is required.',
      });
    }
    console.log(
      'Received AI Review request.'
    );

    const response =
    await client.responses.parse({

        model: 'gpt-5.6-luna',

        input: prompt,

        text: {
        format: zodTextFormat(
            AIReviewSchema,
            'game_skeleton_review'
        ),
        },

    });

    const review =
    response.output_parsed;

    if (!review) {
    throw new Error(
        'AI returned no parsed review.'
    );
    }

    console.log(
    'AI Structured Review completed.'
    );

    return res.json({
    result: review,
    });

  } catch (error: any) {

    console.error(
      'AI Review failed:',
      error
    );

    return res.status(500).json({
      error:
        'AI review request failed.',

      message:
        error?.message ??
        'Unknown error',

      status:
        error?.status ??
        null,

      code:
        error?.code ??
        null,

      type:
        error?.type ??
        null,
    });
  }
});


// ==========================================
// Guided Design Proposal
// ==========================================

app.post('/api/guided-design', async (req, res) => {
  const parsedRequest =
    GuidedDesignRequestSchema.safeParse(req.body);

  if (!parsedRequest.success) {
    return res.status(400).json({
      error: 'Invalid guided design request.',
      details: parsedRequest.error.issues,
    });
  }

  try {
    const response =
      await client.responses.parse({
        model: 'gpt-5.6-luna',
        input: buildGuidedDesignPrompt(parsedRequest.data),
        text: {
          format: zodTextFormat(
            GuidedDesignProposalSchema,
            'guided_design_proposal'
          ),
        },
      });

    const proposal = response.output_parsed;

    if (!proposal) {
      throw new Error(
        'AI returned no parsed guided design proposal.'
      );
    }

    return res.json({ result: proposal });
  } catch (error: any) {
    logServerError(
      'Guided Design OpenAI request failed',
      error
    );

    return res.status(500).json({
      error: 'Guided Design request failed.',
    });
  }
});


app.post('/api/design-assistant/analyze', async (req, res) => {
  const parsed = DesignAnalysisRequestSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid design analysis request.' });

  try {
    const response = await client.responses.parse({
      model: 'gpt-5.6-luna',
      input: analysisPrompt(parsed.data),
      text: { format: zodTextFormat(DesignAnalysisSchema, 'design_analysis') },
    });
    if (!response.output_parsed) throw new Error('AI returned no parsed design analysis.');
    return res.json({ result: response.output_parsed });
  } catch (error) {
    logServerError('Design Assistant analysis failed', error);
    return res.status(500).json({ error: 'Design analysis request failed.' });
  }
});

app.post('/api/design-assistant/change-set', async (req, res) => {
  const parsed = DesignChangeRequestSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid design change request.' });

  try {
    const response = await client.responses.parse({
      model: 'gpt-5.6-luna',
      input: changePrompt(parsed.data),
      text: { format: zodTextFormat(DesignChangeSetSchema, 'design_change_set') },
    });
    if (!response.output_parsed) throw new Error('AI returned no parsed design change set.');
    const referenceError = validateExistingEdgeReferences(parsed.data, response.output_parsed);
    if (referenceError) throw new Error(referenceError);
    return res.json({ result: response.output_parsed });
  } catch (error) {
    logServerError('Design Assistant change set failed', error);
    return res.status(500).json({ error: 'Design change request failed.' });
  }
});


// ==========================================
// Start Server
// ==========================================

const PORT = 3001;

app.listen(PORT, () => {
  console.log(
    `Game Skeleton AI server running on http://localhost:${PORT}`
  );
  console.log(
    `Root .env: ${dotenvResult.error ? 'not found' : 'loaded'}`
  );
  console.log(
    `API key configured: ${process.env.OPENAI_API_KEY?.trim() ? 'yes' : 'no'}`
  );
  console.log(
    `OpenAI proxy: ${proxyUrl ? 'configured' : 'direct'}`
  );
});
