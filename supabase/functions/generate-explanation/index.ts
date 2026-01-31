import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Input validation constants
const MAX_TOPIC_LENGTH = 100;
const MAX_QUESTION_LENGTH = 500;
const VALID_LEVELS = ['Beginner', 'Intermediate', 'Master'] as const;

interface RequestBody {
  topic: string;
  question: string;
  level: string;
  keywords: string[];
}

function validateInput(body: unknown): { valid: true; data: RequestBody } | { valid: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Invalid request body' };
  }

  const { topic, question, level, keywords } = body as Record<string, unknown>;

  if (typeof topic !== 'string' || topic.trim().length === 0) {
    return { valid: false, error: 'Topic is required' };
  }
  if (topic.length > MAX_TOPIC_LENGTH) {
    return { valid: false, error: `Topic must be less than ${MAX_TOPIC_LENGTH} characters` };
  }

  if (typeof question !== 'string' || question.trim().length === 0) {
    return { valid: false, error: 'Question is required' };
  }
  if (question.length > MAX_QUESTION_LENGTH) {
    return { valid: false, error: `Question must be less than ${MAX_QUESTION_LENGTH} characters` };
  }

  if (typeof level !== 'string' || !VALID_LEVELS.includes(level as typeof VALID_LEVELS[number])) {
    return { valid: false, error: `Level must be one of: ${VALID_LEVELS.join(', ')}` };
  }

  const sanitize = (str: string) => str.replace(/[\x00-\x1F\x7F]/g, '').trim();

  return {
    valid: true,
    data: {
      topic: sanitize(topic),
      question: sanitize(question),
      level: level as string,
      keywords: Array.isArray(keywords) ? keywords.slice(0, 10).map(k => String(k)) : [],
    }
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let requestBody: unknown;
    try {
      requestBody = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid JSON' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const validation = validateInput(requestBody);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ success: false, error: validation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { topic, question, level, keywords } = validation.data;

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are StudyBuddy, an expert educational AI tutor. You explain concepts clearly using simple English, step-by-step instructions, and a friendly teacher-like tone.

Your explanations MUST include:
1. An Accuracy Score (0-100%) indicating how confident you are in the explanation
2. A clear, structured explanation appropriate for the student's level
3. Real examples and analogies
4. Key takeaways

Level guidelines:
- Beginner: Use simple definitions, everyday analogies, avoid jargon
- Intermediate: Include implementation details, code examples, processes
- Master: Cover internal mechanics, optimization, edge cases, best practices

Format your response as JSON with this structure:
{
  "explanation": "The main explanation text with markdown formatting",
  "accuracyScore": 85,
  "keyTakeaways": ["takeaway 1", "takeaway 2", "takeaway 3"],
  "relatedTopics": ["topic 1", "topic 2"]
}`;

    const userPrompt = `Topic: ${topic}
Question: ${question}
Level: ${level}
Keywords detected: ${keywords.join(', ')}

Please provide a comprehensive, accurate explanation for this ${level}-level question about ${topic}.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', errorText);
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a moment.');
      }
      if (response.status === 402) {
        throw new Error('AI usage limit reached. Please add credits to your workspace.');
      }
      throw new Error(`AI API failed: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = {
        explanation: content,
        accuracyScore: 75,
        keyTakeaways: [],
        relatedTopics: []
      };
    }

    return new Response(JSON.stringify({
      success: true,
      explanation: parsed.explanation,
      accuracyScore: parsed.accuracyScore || 75,
      keyTakeaways: parsed.keyTakeaways || [],
      relatedTopics: parsed.relatedTopics || []
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
