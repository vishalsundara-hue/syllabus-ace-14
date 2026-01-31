import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topic, weeks = 4 } = await req.json();

    if (!topic || typeof topic !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: 'Topic is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are an expert educational planner. Create a comprehensive weekly study plan.

Return JSON with this exact structure:
{
  "weeks": [
    {
      "weekNumber": 1,
      "theme": "Week theme/focus",
      "topics": [
        {
          "name": "Topic name",
          "priority": "high" | "medium" | "low",
          "hoursRecommended": 3,
          "examFrequency": "often" | "sometimes" | "rarely",
          "description": "Brief description"
        }
      ],
      "resources": [
        {
          "type": "video" | "article" | "book" | "practice",
          "title": "Resource title",
          "url": "https://...",
          "description": "Why this resource"
        }
      ],
      "books": [
        {
          "title": "Book title",
          "author": "Author name",
          "chapters": "Relevant chapters"
        }
      ],
      "dailyChecklist": [
        { "day": "Monday", "tasks": ["Task 1", "Task 2"] },
        { "day": "Tuesday", "tasks": ["Task 1", "Task 2"] },
        { "day": "Wednesday", "tasks": ["Task 1", "Task 2"] },
        { "day": "Thursday", "tasks": ["Task 1", "Task 2"] },
        { "day": "Friday", "tasks": ["Task 1", "Task 2"] },
        { "day": "Saturday", "tasks": ["Revision", "Practice"] },
        { "day": "Sunday", "tasks": ["Quick revision"] }
      ],
      "weeklyTest": {
        "questions": [
          {
            "question": "Question text",
            "options": ["A", "B", "C", "D"],
            "correctAnswer": 0,
            "explanation": "Why this is correct"
          }
        ]
      },
      "revisionPlan": {
        "topics": ["Topic 1 to revise", "Topic 2 to revise"],
        "keyPoints": ["Key point 1", "Key point 2"],
        "quickTips": ["Tip 1", "Tip 2"]
      }
    }
  ],
  "totalHours": 40,
  "youtubeSearchQuery": "best youtube tutorials for <topic>"
}

Prioritize topics by:
1. Exam frequency (how often they appear in exams)
2. Foundation importance (needed for other topics)
3. Complexity (harder topics need more time)

Include 10 MCQ questions per week for the test.
Make the revision plan a one-day summary of the week.`;

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
          { role: 'user', content: `Create a ${weeks}-week study plan for: ${topic}` }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI error:', errorText);
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
      // Extract JSON from potential markdown code blocks
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      parsed = JSON.parse(jsonStr);
    } catch {
      console.error('Failed to parse AI response:', content);
      throw new Error('Failed to generate study plan. Please try again.');
    }

    return new Response(JSON.stringify({
      success: true,
      plan: parsed
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
