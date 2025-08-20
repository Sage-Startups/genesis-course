import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface GenerateCourseRequest {
  title: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  learningObjectives: string;
  targetAudience: string;
  additionalRequirements?: string;
  mode?: 'course' | 'lesson' | 'module';
  context?: any;
}

const createFallbackCourse = (title: string, category: string, difficulty: string, targetAudience: string, learningObjectives: string) => ({
  description: `A comprehensive ${title} course designed for ${targetAudience}. ${learningObjectives}`,
  price: 99,
  tags: [category.toLowerCase(), difficulty.toLowerCase()],
  outline: [
    {
      moduleTitle: "Introduction",
      objectives: ["Course overview", "Setting expectations", "Understanding the fundamentals"],
      estimatedTime: "2 hours",
      lessons: [
        {
          title: "Getting Started",
          description: "Introduction to the course material and setup",
          duration: "30 minutes",
          concepts: ["Overview", "Prerequisites", "Course structure"],
          content: `# Getting Started with ${title}

Welcome to this comprehensive ${title} course! In this introductory lesson, we'll cover the basics and set expectations for your learning journey.

## What You'll Learn

This course is designed specifically for ${targetAudience} and will help you achieve the following learning objectives:

${learningObjectives.split('.').map(obj => obj.trim()).filter(Boolean).map(obj => `- ${obj}`).join('\n')}

## Course Structure

This course is structured to take you from ${difficulty === 'Beginner' ? 'zero knowledge' : 'your current level'} to proficiency through:

- **Hands-on examples** that reinforce key concepts
- **Practical exercises** to build real-world skills
- **Progressive difficulty** that builds upon previous lessons
- **Real-world applications** of what you learn

## Prerequisites

${difficulty === 'Beginner' ? 
  'No prior experience is required! This course starts from the basics and builds up gradually.' : 
  difficulty === 'Intermediate' ? 
    'Some basic familiarity with the topic is helpful but not required. We\'ll review fundamentals as needed.' :
    'This is an advanced course that assumes you have working knowledge of the fundamentals.'
}

## How to Get the Most Out of This Course

1. **Follow along actively** - Don't just watch, practice!
2. **Take notes** on key concepts and insights
3. **Complete all exercises** to reinforce your learning
4. **Ask questions** if anything is unclear
5. **Apply what you learn** to your own projects

Let's begin your learning journey!`
        },
        {
          title: "Core Concepts",
          description: "Understanding the fundamental principles",
          duration: "45 minutes", 
          concepts: ["Key principles", "Foundation knowledge", "Best practices"],
          content: `# Core Concepts and Principles

In this lesson, we'll explore the fundamental concepts that form the foundation of ${title}.

## Key Principles

Understanding these core principles is essential for mastering ${title}:

### Principle 1: Foundation Knowledge
Every expert started as a beginner. The key is building a solid foundation of understanding that you can build upon.

### Principle 2: Progressive Learning
Learning is most effective when you progress step by step, mastering each concept before moving to the next.

### Principle 3: Practical Application
Theory without practice is incomplete. You'll learn best by applying concepts to real scenarios.

## Essential Terminology

Let's establish a common vocabulary that we'll use throughout this course:

- **Core Concept**: The fundamental ideas that everything else builds upon
- **Best Practice**: Proven approaches that lead to success
- **Real-world Application**: How these concepts apply in actual scenarios

## Why These Concepts Matter

Understanding these fundamentals will help you:
- Make better decisions as you progress
- Avoid common pitfalls and mistakes
- Build more effective solutions
- Communicate clearly with others in the field

## Moving Forward

With these core concepts in mind, you're ready to dive deeper into the specific skills and techniques that make up ${title}.

In the next lesson, we'll start applying these concepts in practical ways.`
        }
      ]
    }
  ]
});

const tryGenerateWithModel = async (model: string, prompt: string): Promise<any> => {
  const isNewerModel = ['gpt-4.1-2025-04-14'].includes(model);
  
  const requestBody: any = {
    model,
    messages: [
      { role: 'system', content: 'You are an expert course creator and instructional designer. Create detailed, structured course content that provides real educational value. You must respond with valid JSON only.' },
      { role: 'user', content: prompt }
    ],
    response_format: { type: "json_object" }
  };

  if (isNewerModel) {
    requestBody.max_completion_tokens = 4000;
  } else {
    requestBody.max_tokens = 4000;
    requestBody.temperature = 0.7;
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error(`${model} API error:`, errorData);
    throw new Error(`${model} API error: ${errorData.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  const generatedContent = data.choices[0]?.message?.content;
  
  if (!generatedContent) {
    throw new Error(`${model} returned empty content`);
  }

  return JSON.parse(generatedContent);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData: GenerateCourseRequest = await req.json();
    const {
      title,
      category,
      difficulty,
      duration,
      learningObjectives,
      targetAudience,
      additionalRequirements,
      mode = 'course',
      context
    } = requestData;

    console.log('Generating course with AI:', { title, category, difficulty, mode });

    let prompt: string;
    let responseStructure: string;

    if (mode === 'lesson') {
      // Scoped regeneration for a single lesson
      prompt = `Regenerate the content for a lesson titled "${context.lessonTitle}" in the module "${context.moduleTitle}" of the course "${context.courseTitle}".

The course difficulty is ${context.difficulty}.

Generate ONLY the lesson content in detailed markdown format (at least 300-500 words) that provides real educational value with examples and practical information.

Return ONLY valid JSON in this format:
{
  "content": "detailed markdown content for the lesson"
}`;

      responseStructure = '{"content": "string - detailed lesson content in markdown"}';
    } else {
      // Full course generation
      prompt = `Create a comprehensive course about "${title}" with the following specifications:

- Category: ${category}
- Difficulty Level: ${difficulty}
- Duration: ${duration}
- Learning Objectives: ${learningObjectives}
- Target Audience: ${targetAudience}
${additionalRequirements ? `- Additional Requirements: ${additionalRequirements}` : ''}

Generate a detailed course with comprehensive modules and lessons. Each lesson should include rich, educational content in markdown format that provides real learning value. The content should be substantial (at least 300-500 words per lesson) and include practical examples, explanations, and actionable insights.

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

      responseStructure = 'full course structure with outline array';
    }

    // Try with reliable models first
    let courseData;
    try {
      courseData = await tryGenerateWithModel('gpt-4o', prompt);
    } catch (error) {
      console.log('Primary model failed, trying fallback model:', error.message);
      
      try {
        courseData = await tryGenerateWithModel('gpt-4o-mini', prompt);
      } catch (fallbackError) {
        console.log('Fallback model failed, trying final fallback:', fallbackError.message);
        
        try {
          courseData = await tryGenerateWithModel('gpt-4.1-2025-04-14', prompt);
        } catch (finalError) {
          console.error('All models failed, using fallback structure:', finalError.message);
          
          if (mode === 'lesson') {
            courseData = {
              content: `# ${context.lessonTitle}

This lesson covers the essential concepts of ${context.lessonTitle} as part of the ${context.moduleTitle} module.

## Learning Objectives

By the end of this lesson, you will understand:
- The key concepts and principles
- How to apply these concepts practically
- Best practices and common pitfalls to avoid

## Core Content

### Introduction

Welcome to this lesson on ${context.lessonTitle}. This is an important topic that builds upon what we've learned so far in the ${context.courseTitle} course.

### Key Concepts

Let's explore the fundamental concepts that make up this topic:

1. **Foundation Knowledge**: Understanding the basics is crucial for success
2. **Practical Application**: How these concepts apply in real-world scenarios  
3. **Best Practices**: Proven approaches that lead to better outcomes

### Examples and Practice

Here are some practical examples to help illustrate these concepts:

- Example 1: A basic application of the principles
- Example 2: A more advanced use case
- Example 3: Common challenges and how to overcome them

### Summary

In this lesson, we covered the essential aspects of ${context.lessonTitle}. The key takeaways are:

- Understanding the fundamental principles
- Knowing how to apply them practically
- Being aware of best practices and common mistakes

## Next Steps

In the next lesson, we'll build upon these concepts and explore more advanced topics related to ${context.moduleTitle}.`
            };
          } else {
            courseData = createFallbackCourse(title, category, difficulty, targetAudience, learningObjectives);
          }
        }
      }
    }

    // Validate the response structure
    if (mode === 'course') {
      if (!courseData.outline || !Array.isArray(courseData.outline) || courseData.outline.length === 0) {
        console.log('Invalid course structure, using fallback');
        courseData = createFallbackCourse(title, category, difficulty, targetAudience, learningObjectives);
      }
    } else if (mode === 'lesson') {
      if (!courseData.content || typeof courseData.content !== 'string' || courseData.content.length < 50) {
        courseData = {
          content: `# ${context.lessonTitle}

This lesson provides comprehensive coverage of ${context.lessonTitle} within the context of ${context.courseTitle}.

## Overview

In this lesson, we'll explore the key concepts and practical applications that are essential for understanding ${context.lessonTitle}.

## Key Learning Points

- Fundamental concepts and principles
- Real-world applications and examples  
- Best practices and common approaches
- Practical exercises and implementations

## Content

[Detailed lesson content would be generated here based on the specific topic and learning objectives]

This lesson builds upon previous concepts while preparing you for more advanced topics in subsequent lessons.`
        };
      }
    }

    console.log('Successfully generated course data:', mode, courseData ? 'with content' : 'empty');

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