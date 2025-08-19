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

    const prompt = `Create a comprehensive course about "${title}" with the following specifications:

- Category: ${category}
- Difficulty Level: ${difficulty}
- Duration: ${duration}
- Learning Objectives: ${learningObjectives}
- Target Audience: ${targetAudience}
${additionalRequirements ? `- Additional Requirements: ${additionalRequirements}` : ''}

Generate a detailed course with comprehensive modules and lessons. Each lesson should include rich, educational content in markdown format that provides real learning value. The content should be substantial (at least 200-500 words per lesson) and include practical examples, explanations, and actionable insights.

Return ONLY valid JSON in this exact format:
{
  "description": "string - comprehensive course description",
  "price": number,
  "tags": ["string", "string"],
  "outline": [
    {
      "moduleTitle": "string",
      "objectives": ["string", "string"],
      "estimatedTime": "string",
      "lessons": [
        {
          "title": "string",
          "description": "string - brief lesson overview",
          "duration": "string",
          "concepts": ["string", "string"],
          "content": "string - detailed lesson content in markdown format with headers, examples, and practical information"
        }
      ]
    }
  ]
}`;

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
                concepts: ["Overview", "Prerequisites"],
                content: "# Getting Started\n\nWelcome to this course! In this introduction, we'll cover the basics and set expectations for your learning journey.\n\n## What You'll Learn\n\n- Course overview and structure\n- Prerequisites and required knowledge\n- How to get the most out of this course\n\n## Course Structure\n\nThis course is designed to take you from beginner to proficient through hands-on examples and practical exercises."
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