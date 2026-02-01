import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topic } = await req.json();

    if (!topic) {
      return new Response(
        JSON.stringify({ error: 'Topic is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const response = await fetch('https://api.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a mind map generator. Create a hierarchical mind map for any given topic. 
            Return ONLY valid JSON with no markdown or extra text.
            
            The structure should be:
            {
              "id": "unique-id",
              "label": "Main Topic",
              "children": [
                {
                  "id": "unique-id-1",
                  "label": "Subtopic 1",
                  "children": [
                    { "id": "unique-id-1-1", "label": "Detail 1" },
                    { "id": "unique-id-1-2", "label": "Detail 2" }
                  ]
                },
                {
                  "id": "unique-id-2",
                  "label": "Subtopic 2",
                  "children": [...]
                }
              ]
            }
            
            Guidelines:
            - Create 4-6 main branches from the central topic
            - Each branch should have 2-4 sub-items
            - Keep labels concise (2-4 words max)
            - Use unique IDs for each node
            - Make it educational and comprehensive`
          },
          {
            role: 'user',
            content: `Create a detailed mind map for: "${topic}"`
          }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API error:', errorText);
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No content in response');
    }

    // Parse the JSON from the response
    let mindMap;
    try {
      // Remove markdown code blocks if present
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
      mindMap = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Parse error:', parseError, 'Content:', content);
      throw new Error('Failed to parse mind map response');
    }

    return new Response(
      JSON.stringify({ mindMap }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-mindmap:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
