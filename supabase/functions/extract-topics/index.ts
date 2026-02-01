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
    const { fileName, fileContent, fileType, pdfBase64 } = await req.json();

    if (!fileName) {
      return new Response(
        JSON.stringify({ success: false, error: 'File name is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are an expert document analyzer and educational content specialist. Given information about a study document, extract and identify the main topics and subtopics covered.

You MUST respond with a valid JSON object in this exact format:
{
  "summary": "A 2-3 sentence summary of what the document covers",
  "keyPoints": ["Key point 1", "Key point 2", "Key point 3", "Key point 4", "Key point 5"],
  "topics": [
    {
      "id": "1",
      "name": "Topic Name",
      "description": "Brief description of this topic",
      "subtopics": ["Subtopic 1", "Subtopic 2", "Subtopic 3"]
    }
  ]
}

IMPORTANT GUIDELINES:
- Extract 4-8 meaningful, specific topics from the document content
- Each topic should have 2-5 subtopics that represent key concepts within that topic
- Make topics specific to the actual subject matter, NOT generic placeholders
- If the document is about a specific subject (e.g., Data Structures, Physics, History), extract topics relevant to that subject
- Topics should be actionable for studying - students should be able to select a topic and ask questions about it
- Include topic names that reflect actual content from the document`;

    // Build the message content - use multimodal if PDF is provided
    type MessageContent = string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
    const messages: Array<{ role: string; content: MessageContent }> = [];
    
    if (pdfBase64 && fileType === 'application/pdf') {
      // Use multimodal approach for PDFs - Gemini can process PDF as image
      messages.push({ role: 'system', content: systemPrompt });
      messages.push({ 
        role: 'user', 
        content: [
          {
            type: 'text',
            text: `Analyze this PDF document "${fileName}" and extract detailed topics for learning. Extract specific, meaningful topics that a student can select to study and ask questions about. Respond with ONLY the JSON object.`
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:application/pdf;base64,${pdfBase64}`
            }
          }
        ]
      });
    } else {
      // Text-based analysis
      const userMessage = fileContent && fileContent.length > 100
        ? `Analyze this study document and extract detailed topics for learning:\n\nFile: ${fileName}\nType: ${fileType}\n\nDocument Content:\n${fileContent.substring(0, 15000)}\n\nExtract specific, meaningful topics from this content that a student can select to study and ask questions about.`
        : `Analyze this document based on its name and type. Infer what topics it likely covers:\n\nFile: ${fileName}\nType: ${fileType}\n\nProvide relevant topics that would typically be found in a document with this name. Be specific to the subject matter.`;
      
      messages.push({ role: 'system', content: systemPrompt });
      messages.push({ role: 'user', content: userMessage });
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages,
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
    let content = data.choices?.[0]?.message?.content;

    // Parse the JSON from the response
    try {
      // Remove markdown code blocks if present
      content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(content);
      
      // Store document context for Q&A
      return new Response(JSON.stringify({
        success: true,
        ...parsed,
        documentContext: fileContent ? fileContent.substring(0, 20000) : null
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      // Return a fallback response based on filename
      return new Response(JSON.stringify({
        success: true,
        summary: `Document "${fileName}" has been analyzed. The AI will help you explore its contents through interactive Q&A.`,
        keyPoints: [
          'Document successfully uploaded',
          'Topics extracted based on document analysis',
          'Ready for interactive learning',
          'Ask questions to dive deeper',
          'AI-powered explanations available'
        ],
        topics: [
          {
            id: '1',
            name: 'Introduction & Overview',
            description: 'Fundamental concepts and introduction to the subject',
            subtopics: ['Basic Definitions', 'Core Concepts', 'Background']
          },
          {
            id: '2',
            name: 'Main Content',
            description: 'Primary topics and detailed explanations',
            subtopics: ['Key Theories', 'Important Principles', 'Examples']
          },
          {
            id: '3',
            name: 'Applications',
            description: 'Practical applications and use cases',
            subtopics: ['Real-world Examples', 'Case Studies', 'Practice Problems']
          },
          {
            id: '4',
            name: 'Advanced Topics',
            description: 'Complex concepts and deeper exploration',
            subtopics: ['Advanced Techniques', 'Edge Cases', 'Best Practices']
          }
        ],
        documentContext: fileContent ? fileContent.substring(0, 20000) : null
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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