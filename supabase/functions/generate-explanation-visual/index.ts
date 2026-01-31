import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Input validation constants
const MAX_TOPIC_LENGTH = 100;
const MAX_QUESTION_LENGTH = 500;
const MAX_EXPLANATION_LENGTH = 2000;
const VALID_LEVELS = ['Beginner', 'Intermediate', 'Advanced'] as const;

interface RequestBody {
  topic: string;
  question: string;
  level: string;
  explanation: string;
}

function validateInput(body: unknown): { valid: true; data: RequestBody } | { valid: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Invalid request body' };
  }

  const { topic, question, level, explanation } = body as Record<string, unknown>;

  // Validate topic
  if (typeof topic !== 'string' || topic.trim().length === 0) {
    return { valid: false, error: 'Topic is required and must be a non-empty string' };
  }
  if (topic.length > MAX_TOPIC_LENGTH) {
    return { valid: false, error: `Topic must be less than ${MAX_TOPIC_LENGTH} characters` };
  }

  // Validate question
  if (typeof question !== 'string' || question.trim().length === 0) {
    return { valid: false, error: 'Question is required and must be a non-empty string' };
  }
  if (question.length > MAX_QUESTION_LENGTH) {
    return { valid: false, error: `Question must be less than ${MAX_QUESTION_LENGTH} characters` };
  }

  // Validate level
  if (typeof level !== 'string' || !VALID_LEVELS.includes(level as typeof VALID_LEVELS[number])) {
    return { valid: false, error: `Level must be one of: ${VALID_LEVELS.join(', ')}` };
  }

  // Validate explanation
  if (typeof explanation !== 'string' || explanation.trim().length === 0) {
    return { valid: false, error: 'Explanation is required and must be a non-empty string' };
  }
  if (explanation.length > MAX_EXPLANATION_LENGTH) {
    return { valid: false, error: `Explanation must be less than ${MAX_EXPLANATION_LENGTH} characters` };
  }

  // Sanitize inputs - remove control characters
  const sanitize = (str: string) => str.replace(/[\x00-\x1F\x7F]/g, '').trim();

  return {
    valid: true,
    data: {
      topic: sanitize(topic),
      question: sanitize(question),
      level: level as string,
      explanation: sanitize(explanation),
    }
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized - Missing or invalid authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify the user's JWT token
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);

    if (claimsError || !claimsData?.claims) {
      console.error('Auth error:', claimsError);
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized - Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub;
    console.log('Authenticated user:', userId);

    // Parse and validate input
    let requestBody: unknown;
    try {
      requestBody = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid JSON in request body' }),
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

    const { topic, question, level, explanation } = validation.data;

    console.log('Generating visual explanation for:', { topic, question, level, userId });

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    // Generate a Manim-style educational diagram using DALL-E
    const imagePrompt = `Create an educational diagram in the style of 3Blue1Brown Manim animations. 
Topic: ${topic}
Question: ${question}
Level: ${level}

The diagram should:
- Use a dark navy blue or black background (like Manim)
- Feature clean geometric shapes and mathematical notation
- Include arrows, labels, and step-by-step visual flow
- Be colorful with blues, yellows, greens, and pinks on dark background
- Look like a frame from an animated math/science video
- Be clear, educational, and visually engaging
- Include the key concept: ${explanation.substring(0, 200)}

Style: Mathematical animation frame, vector graphics style, educational infographic`;

    const imageResponse = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: imagePrompt,
        n: 1,
        size: '1024x1024',
        response_format: 'url'
      }),
    });

    if (!imageResponse.ok) {
      const errorText = await imageResponse.text();
      console.error('Image generation failed:', errorText);
      throw new Error(`Image generation failed: ${imageResponse.status}`);
    }

    const imageData = await imageResponse.json();
    console.log('Image generation response received for user:', userId);

    // Extract the generated image
    const generatedImage = imageData.data?.[0]?.url;

    // Generate Manim Python code for the animation using GPT-4
    const codeResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a Manim Community Edition expert. Generate clean, working Manim Python code that creates educational animations. Only output the Python code, no explanations.`
          },
          {
            role: 'user',
            content: `Create a Manim animation script for this educational topic:

Topic: ${topic}
Question: ${question}
Level: ${level}
Key concepts: ${explanation.substring(0, 500)}

Generate a complete Manim scene class that:
1. Uses ManimCE (Community Edition) syntax
2. Creates smooth animations explaining the concept
3. Includes text labels, shapes, arrows as needed
4. Lasts about 30-60 seconds when rendered
5. Uses appropriate colors (BLUE, YELLOW, GREEN, etc.)

Output only the Python code starting with 'from manim import *'`
          }
        ],
      }),
    });

    if (!codeResponse.ok) {
      console.error('Code generation failed:', await codeResponse.text());
    }

    const codeData = await codeResponse.json();
    const manimCode = codeData.choices?.[0]?.message?.content || '';

    return new Response(JSON.stringify({
      success: true,
      image: generatedImage,
      manimCode: manimCode,
      message: 'Visual explanation generated successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error in generate-explanation-visual:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
