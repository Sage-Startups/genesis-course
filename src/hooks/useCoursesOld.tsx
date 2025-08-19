import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CourseLesson {
  title: string;
  description: string;
  duration: string;
  concepts: string[];
  content?: string; // Rich lesson content in markdown
}

export interface CourseModule {
  moduleTitle: string;
  objectives: string[];
  estimatedTime: string;
  lessons: CourseLesson[];
}

export interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  price: number;
  status: 'Draft' | 'Published' | 'Archived';
  createdAt: string;
  updatedAt: string;
  tags: string[];
  thumbnail?: string;
  outline?: CourseModule[];
  isAIGenerated?: boolean;
}

export interface UserPlan {
  name: string;
  maxCourses: number;
}

const PLAN_LIMITS: Record<string, number> = {
  'Free': 3,
  'Basic': 10,
  'Premium': 50,
  'Lifetime': 999
};

export const useCourses = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [userPlan, setUserPlan] = useState<UserPlan>({ name: 'Free', maxCourses: 3 });

  useEffect(() => {
    // Load courses from localStorage
    const savedCourses = localStorage.getItem('courses');
    if (savedCourses) {
      setCourses(JSON.parse(savedCourses));
    }

    // Load user plan from localStorage
    const savedPlan = localStorage.getItem('userPlan');
    if (savedPlan) {
      const plan = JSON.parse(savedPlan);
      setUserPlan({
        name: plan.name,
        maxCourses: PLAN_LIMITS[plan.name] || 3
      });
    }
  }, []);

  const saveCourses = (newCourses: Course[]) => {
    setCourses(newCourses);
    localStorage.setItem('courses', JSON.stringify(newCourses));
  };

  const createCourse = (courseData: Omit<Course, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (courses.length >= userPlan.maxCourses) {
      throw new Error(`Course limit reached. Upgrade your plan to create more than ${userPlan.maxCourses} courses.`);
    }

    const newCourse: Course = {
      ...courseData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedCourses = [...courses, newCourse];
    saveCourses(updatedCourses);
    return newCourse;
  };

  const updateCourse = (id: string, updates: Partial<Course>) => {
    const updatedCourses = courses.map(course =>
      course.id === id
        ? { ...course, ...updates, updatedAt: new Date().toISOString() }
        : course
    );
    saveCourses(updatedCourses);
  };

  const deleteCourse = (id: string) => {
    const updatedCourses = courses.filter(course => course.id !== id);
    saveCourses(updatedCourses);
  };

  const duplicateCourse = (id: string) => {
    const courseToDuplicate = courses.find(course => course.id === id);
    if (!courseToDuplicate) return;

    if (courses.length >= userPlan.maxCourses) {
      throw new Error(`Course limit reached. Upgrade your plan to create more than ${userPlan.maxCourses} courses.`);
    }

    const duplicatedCourse: Course = {
      ...courseToDuplicate,
      id: crypto.randomUUID(),
      title: `${courseToDuplicate.title} (Copy)`,
      status: 'Draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedCourses = [...courses, duplicatedCourse];
    saveCourses(updatedCourses);
    return duplicatedCourse;
  };

  const exportCourse = (id: string, format: 'json' | 'csv') => {
    const course = courses.find(c => c.id === id);
    if (!course) return;

    if (format === 'json') {
      const dataStr = JSON.stringify(course, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      const exportFileDefaultName = `${course.title.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    } else if (format === 'csv') {
      const csvData = [
        ['Field', 'Value'],
        ['Title', course.title],
        ['Description', course.description],
        ['Category', course.category],
        ['Difficulty', course.difficulty],
        ['Duration', course.duration],
        ['Price', course.price.toString()],
        ['Status', course.status],
        ['Tags', course.tags.join('; ')],
        ['Created At', course.createdAt],
        ['Updated At', course.updatedAt]
      ];

      const csvContent = csvData.map(row => 
        row.map(field => `"${field.replace(/"/g, '""')}"`).join(',')
      ).join('\n');

      const dataUri = 'data:text/csv;charset=utf-8,'+ encodeURIComponent(csvContent);
      const exportFileDefaultName = `${course.title.replace(/[^a-zA-Z0-9]/g, '_')}.csv`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    }
  };

  const canCreateCourse = () => courses.length < userPlan.maxCourses;

  return {
    courses,
    userPlan,
    createCourse,
    updateCourse,
    deleteCourse,
    duplicateCourse,
    exportCourse,
    canCreateCourse,
  };
};