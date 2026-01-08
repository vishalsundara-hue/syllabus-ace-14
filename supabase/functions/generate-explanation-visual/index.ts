import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topic, question, level, explanation } = await req.json();

    console.log('Generating visual explanation for:', { topic, question, level });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Generate a Manim-style educational diagram using AI image generation
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

    const imageResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        messages: [
          { role: 'user', content: imagePrompt }
        ],
        modalities: ['image', 'text']
      }),
    });

    if (!imageResponse.ok) {
      const errorText = await imageResponse.text();
      console.error('Image generation failed:', errorText);
      throw new Error(`Image generation failed: ${imageResponse.status}`);
    }

    const imageData = await imageResponse.json();
    console.log('Image generation response:', JSON.stringify(imageData).substring(0, 500));

    // Extract the generated image
    const generatedImage = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    // Generate Manim Python code for the animation (for reference/download)
    const codeResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
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
