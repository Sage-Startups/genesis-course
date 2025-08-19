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
  tags: string[];
  thumbnail?: string;
  outline?: CourseModule[];
  isAiGenerated?: boolean;
  created_at?: string;
  updated_at?: string;
}

export type UserPlan = 'free' | 'basic' | 'premium' | 'lifetime';

export const PLAN_LIMITS: Record<UserPlan, number> = {
  'free': 3,
  'basic': 10,
  'premium': 50,
  'lifetime': 999
};

export const useCourses = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [userPlan, setUserPlan] = useState<UserPlan>('free');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
      setIsLoading(false);
    };
    
    checkAuth();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
    });
    
    return () => subscription.unsubscribe();
  }, []);

  // Load courses on mount
  useEffect(() => {
    if (!isLoading) {
      loadCourses();
    }
  }, [isAuthenticated, isLoading]);

  // Save user plan to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('userPlan', userPlan);
  }, [userPlan]);

  const loadCourses = async () => {
    if (isAuthenticated) {
      // Load from Supabase
      try {
        const { data, error } = await supabase
          .from('courses')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        const formattedCourses = data?.map(course => ({
          id: course.id,
          title: course.title || '',
          description: course.description || '',
          category: course.category || '',
          difficulty: (course.difficulty as 'Beginner' | 'Intermediate' | 'Advanced') || 'Beginner',
          duration: course.duration || '',
          price: course.price || 0,
          status: (course.status as 'Draft' | 'Published' | 'Archived') || 'Draft',
          tags: course.tags || [],
          thumbnail: course.thumbnail,
          outline: course.outline as unknown as CourseModule[],
          isAiGenerated: course.is_ai_generated || false,
          created_at: course.created_at,
          updated_at: course.updated_at,
        })) || [];
        
        setCourses(formattedCourses);
      } catch (error) {
        console.error('Error loading courses from Supabase:', error);
        // Fallback to localStorage
        loadLocalCourses();
      }
    } else {
      // Load from localStorage
      loadLocalCourses();
    }
  };

  const loadLocalCourses = () => {
    const savedCourses = localStorage.getItem('courses');
    const savedUserPlan = localStorage.getItem('userPlan') as UserPlan;
    
    if (savedCourses) {
      setCourses(JSON.parse(savedCourses));
    }
    if (savedUserPlan) {
      setUserPlan(savedUserPlan);
    }
  };

  const saveToLocalStorage = (updatedCourses: Course[]) => {
    localStorage.setItem('courses', JSON.stringify(updatedCourses));
  };

  const createCourse = async (courseData: Omit<Course, 'id'>) => {
    const newCourse: Course = {
      ...courseData,
      id: Date.now().toString(),
    };

    if (isAuthenticated) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No authenticated user');

        const { data, error } = await supabase
          .from('courses')
          .insert({
            user_id: user.id,
            title: newCourse.title,
            description: newCourse.description,
            category: newCourse.category,
            difficulty: newCourse.difficulty,
            duration: newCourse.duration,
            price: newCourse.price,
            status: newCourse.status,
            tags: newCourse.tags,
            thumbnail: newCourse.thumbnail,
            is_ai_generated: newCourse.isAiGenerated || false,
            outline: newCourse.outline as any,
          })
          .select()
          .single();

        if (error) throw error;

        const formattedCourse: Course = {
          id: data.id,
          title: data.title || '',
          description: data.description || '',
          category: data.category || '',
          difficulty: (data.difficulty as any) || 'Beginner',
          duration: data.duration || '',
          price: data.price || 0,
          status: (data.status as any) || 'Draft',
          tags: data.tags || [],
          thumbnail: data.thumbnail,
          outline: data.outline as unknown as CourseModule[],
          isAiGenerated: data.is_ai_generated || false,
        };

        setCourses(prev => [formattedCourse, ...prev]);
      } catch (error) {
        console.error('Error creating course in Supabase:', error);
        // Fallback to local storage
        setCourses(prev => [...prev, newCourse]);
        saveToLocalStorage([...courses, newCourse]);
      }
    } else {
      setCourses(prev => [...prev, newCourse]);
      saveToLocalStorage([...courses, newCourse]);
    }
  };

  const updateCourse = async (id: string, updates: Partial<Course>) => {
    if (isAuthenticated) {
      try {
        const { error } = await supabase
          .from('courses')
          .update({
            title: updates.title,
            description: updates.description,
            category: updates.category,
            difficulty: updates.difficulty,
            duration: updates.duration,
            price: updates.price,
            status: updates.status,
            tags: updates.tags,
            thumbnail: updates.thumbnail,
            is_ai_generated: updates.isAiGenerated,
            outline: updates.outline as any,
          })
          .eq('id', id);

        if (error) throw error;

        setCourses(prev => prev.map(course => 
          course.id === id ? { ...course, ...updates } : course
        ));
      } catch (error) {
        console.error('Error updating course in Supabase:', error);
        // Fallback to local update
        const updatedCourses = courses.map(course => 
          course.id === id ? { ...course, ...updates } : course
        );
        setCourses(updatedCourses);
        saveToLocalStorage(updatedCourses);
      }
    } else {
      const updatedCourses = courses.map(course => 
        course.id === id ? { ...course, ...updates } : course
      );
      setCourses(updatedCourses);
      saveToLocalStorage(updatedCourses);
    }
  };

  const deleteCourse = async (id: string) => {
    if (isAuthenticated) {
      try {
        const { error } = await supabase
          .from('courses')
          .delete()
          .eq('id', id);

        if (error) throw error;

        setCourses(prev => prev.filter(course => course.id !== id));
      } catch (error) {
        console.error('Error deleting course from Supabase:', error);
        // Fallback to local deletion
        const updatedCourses = courses.filter(course => course.id !== id);
        setCourses(updatedCourses);
        saveToLocalStorage(updatedCourses);
      }
    } else {
      const updatedCourses = courses.filter(course => course.id !== id);
      setCourses(updatedCourses);
      saveToLocalStorage(updatedCourses);
    }
  };

  const duplicateCourse = async (id: string) => {
    const course = courses.find(c => c.id === id);
    if (course) {
      await createCourse({
        ...course,
        title: `${course.title} (Copy)`,
        status: 'Draft',
      });
    }
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

  const canCreateCourse = () => courses.length < PLAN_LIMITS[userPlan];

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