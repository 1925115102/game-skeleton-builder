import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';

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

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());


// ==========================================
// Proxy
// ==========================================

const proxyAgent = new ProxyAgent(
  'http://127.0.0.1:7897'
);


// ==========================================
// OpenAI Client
// ==========================================

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,

  fetch: undiciFetch,

  fetchOptions: {
    dispatcher: proxyAgent,
  },
});


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
    console.error('Guided Design failed:', error);

    return res.status(500).json({
      error: 'Guided Design request failed.',
      message: error?.message ?? 'Unknown error',
    });
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
});
