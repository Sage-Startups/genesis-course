import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateCourseRequest {
  title: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  learningObjectives: string;
  targetAudience: string;
  additionalRequirements?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      title,
      category,
      difficulty,
      duration,
      learningObjectives,
      targetAudience,
      additionalRequirements
    }: GenerateCourseRequest = await req.json();

    console.log('Generating course with AI:', { title, category, difficulty });

    const prompt = `Create a comprehensive course outline for: "${title}"

Course Details:
- Category: ${category}
- Difficulty Level: ${difficulty}
- Duration: ${duration}
- Target Audience: ${targetAudience}
- Learning Objectives: ${learningObjectives}
${additionalRequirements ? `- Additional Requirements: ${additionalRequirements}` : ''}

Please create a detailed course structure with:
1. A compelling course description (2-3 paragraphs)
2. A comprehensive outline with 6-10 modules
3. For each module, include:
   - Module title
   - Learning objectives
   - 3-5 lessons with detailed descriptions
   - Estimated time for completion
   - Key concepts covered
4. Suggested price range based on content depth and market standards
5. Relevant tags (5-7 keywords)

Format the response as a JSON object with the following structure:
{
  "description": "detailed course description",
  "price": suggested_price_number,
  "tags": ["tag1", "tag2", "tag3"],
  "outline": [
    {
      "moduleTitle": "Module 1 Title",
      "objectives": ["objective1", "objective2"],
      "estimatedTime": "2 hours",
      "lessons": [
        {
          "title": "Lesson Title",
          "description": "Detailed lesson description",
          "duration": "30 minutes",
          "concepts": ["concept1", "concept2"]
        }
      ]
    }
  ]
}

Make this course comprehensive, engaging, and valuable for the target audience.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-2025-08-07',
        messages: [
          { role: 'system', content: 'You are an expert course creator and instructional designer. Create detailed, structured course content that provides real educational value. You must respond with valid JSON only.' },
          { role: 'user', content: prompt }
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const generatedContent = data.choices[0].message.content;

    console.log('AI generated content:', generatedContent);

    // Parse the JSON response from GPT
    let courseData;
    try {
      courseData = JSON.parse(generatedContent);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      console.error('Raw AI response:', generatedContent);
      // Fallback: create a default course structure if parsing fails
      courseData = {
        description: `A comprehensive ${title} course for ${targetAudience}. ${learningObjectives}`,
        price: 99,
        tags: [category.toLowerCase(), difficulty.toLowerCase()],
        outline: [
          {
            moduleTitle: "Introduction",
            objectives: ["Course overview", "Setting expectations"],
            estimatedTime: "1 hour",
            lessons: [
              {
                title: "Getting Started",
                description: "Introduction to the course material",
                duration: "30 minutes",
                concepts: ["Overview", "Prerequisites"]
              }
            ]
          }
        ]
      };
    }

    return new Response(JSON.stringify(courseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-course function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'An error occurred while generating the course'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});