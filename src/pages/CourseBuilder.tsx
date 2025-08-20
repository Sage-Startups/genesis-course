import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MarkdownEditor } from '@/components/MarkdownEditor';
import { useCourses, Course, CourseModule, CourseLesson } from '@/hooks/useCourses';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  ArrowLeft, 
  Wand2, 
  Plus, 
  Trash2, 
  RotateCcw,
  Save,
  Eye,
  Loader2
} from 'lucide-react';

type BuilderStep = 'input' | 'editor';

interface GenerateRequest {
  title: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  learningObjectives: string;
  targetAudience: string;
  additionalRequirements?: string;
}

const CourseBuilder: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { courses, createCourse, updateCourse } = useCourses();
  
  const [step, setStep] = useState<BuilderStep>('input');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Input form state
  const [formData, setFormData] = useState<GenerateRequest>({
    title: '',
    category: '',
    difficulty: 'Beginner',
    duration: '',
    learningObjectives: '',
    targetAudience: '',
    additionalRequirements: ''
  });
  
  // Generated course state
  const [courseData, setCourseData] = useState<Partial<Course>>({
    title: '',
    description: '',
    category: '',
    difficulty: 'Beginner',
    duration: '',
    price: 0,
    tags: [],
    outline: [],
    status: 'Draft'
  });

  // Load existing course for editing
  useEffect(() => {
    if (id && courses.length > 0) {
      const existingCourse = courses.find(c => c.id === id);
      if (existingCourse) {
        setCourseData(existingCourse);
        setStep('editor');
      }
    }
  }, [id, courses]);

  const handleInputChange = (field: keyof GenerateRequest, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const generateCourse = async () => {
    if (!formData.title || !formData.category || !formData.learningObjectives || !formData.targetAudience) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-course', {
        body: formData
      });

      if (error) throw error;

      setCourseData({
        title: formData.title,
        category: formData.category,
        difficulty: formData.difficulty,
        duration: formData.duration,
        description: data.description || '',
        price: data.price || 0,
        tags: data.tags || [],
        outline: data.outline || [],
        status: 'Draft'
      });

      setStep('editor');
      toast({
        title: "Course Generated!",
        description: "Your course has been generated successfully."
      });
    } catch (error) {
      console.error('Generation error:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate course. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const regenerateLesson = async (moduleIndex: number, lessonIndex: number) => {
    if (!courseData.outline) return;
    
    const lesson = courseData.outline[moduleIndex]?.lessons[lessonIndex];
    if (!lesson) return;

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-course', {
        body: {
          mode: 'lesson',
          context: {
            courseTitle: courseData.title,
            moduleTitle: courseData.outline[moduleIndex].moduleTitle,
            lessonTitle: lesson.title,
            difficulty: courseData.difficulty
          }
        }
      });

      if (error) throw error;

      const newOutline = [...courseData.outline];
      newOutline[moduleIndex].lessons[lessonIndex] = {
        ...lesson,
        content: data.content || lesson.content
      };

      setCourseData(prev => ({ ...prev, outline: newOutline }));
      
      toast({
        title: "Lesson Regenerated",
        description: "The lesson content has been updated."
      });
    } catch (error) {
      console.error('Regeneration error:', error);
      toast({
        title: "Regeneration Failed",
        description: "Failed to regenerate lesson content.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const addModule = () => {
    const newModule: CourseModule = {
      moduleTitle: 'New Module',
      objectives: ['Learning objective 1'],
      estimatedTime: '1 hour',
      lessons: []
    };

    setCourseData(prev => ({
      ...prev,
      outline: [...(prev.outline || []), newModule]
    }));
  };

  const removeModule = (index: number) => {
    setCourseData(prev => ({
      ...prev,
      outline: prev.outline?.filter((_, i) => i !== index) || []
    }));
  };

  const addLesson = (moduleIndex: number) => {
    if (!courseData.outline) return;

    const newLesson: CourseLesson = {
      title: 'New Lesson',
      description: 'Lesson description',
      duration: '30 minutes',
      concepts: ['Concept 1'],
      content: '# New Lesson\n\nLesson content goes here...'
    };

    const newOutline = [...courseData.outline];
    newOutline[moduleIndex].lessons.push(newLesson);
    setCourseData(prev => ({ ...prev, outline: newOutline }));
  };

  const removeLesson = (moduleIndex: number, lessonIndex: number) => {
    if (!courseData.outline) return;

    const newOutline = [...courseData.outline];
    newOutline[moduleIndex].lessons = newOutline[moduleIndex].lessons.filter((_, i) => i !== lessonIndex);
    setCourseData(prev => ({ ...prev, outline: newOutline }));
  };

  const updateCourseField = (field: keyof Course, value: any) => {
    setCourseData(prev => ({ ...prev, [field]: value }));
  };

  const updateModuleField = (moduleIndex: number, field: keyof CourseModule, value: any) => {
    if (!courseData.outline) return;

    const newOutline = [...courseData.outline];
    newOutline[moduleIndex] = { ...newOutline[moduleIndex], [field]: value };
    setCourseData(prev => ({ ...prev, outline: newOutline }));
  };

  const updateLessonField = (moduleIndex: number, lessonIndex: number, field: keyof CourseLesson, value: any) => {
    if (!courseData.outline) return;

    const newOutline = [...courseData.outline];
    newOutline[moduleIndex].lessons[lessonIndex] = {
      ...newOutline[moduleIndex].lessons[lessonIndex],
      [field]: value
    };
    setCourseData(prev => ({ ...prev, outline: newOutline }));
  };

  const saveCourse = async (status: 'Draft' | 'Published' = 'Draft') => {
    if (!courseData.title) {
      toast({
        title: "Missing Title",
        description: "Please provide a course title.",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      const courseToSave: Omit<Course, 'id' | 'created_at' | 'updated_at'> = {
        title: courseData.title,
        description: courseData.description || '',
        category: courseData.category || '',
        difficulty: courseData.difficulty || 'Beginner',
        duration: courseData.duration || '',
        price: courseData.price || 0,
        tags: courseData.tags || [],
        outline: courseData.outline || [],
        status,
        thumbnail: null,
        isAiGenerated: true
      };

      if (id) {
        await updateCourse(id, courseToSave);
        toast({
          title: "Course Updated",
          description: `Course has been ${status === 'Published' ? 'published' : 'saved as draft'}.`
        });
      } else {
        await createCourse(courseToSave);
        toast({
          title: "Course Saved",
          description: `Course has been ${status === 'Published' ? 'published' : 'saved as draft'}.`
        });
        // Navigate back to dashboard since we don't have the new course ID
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save course. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (step === 'input') {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wand2 className="h-5 w-5" />
                  Tell the AI what course you want
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Course Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="e.g., Complete Python Programming Bootcamp"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Input
                      id="category"
                      value={formData.category}
                      onChange={(e) => handleInputChange('category', e.target.value)}
                      placeholder="e.g., Programming"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="difficulty">Difficulty *</Label>
                    <Select
                      value={formData.difficulty}
                      onValueChange={(value) => handleInputChange('difficulty', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Beginner">Beginner</SelectItem>
                        <SelectItem value="Intermediate">Intermediate</SelectItem>
                        <SelectItem value="Advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Duration</Label>
                  <Input
                    id="duration"
                    value={formData.duration}
                    onChange={(e) => handleInputChange('duration', e.target.value)}
                    placeholder="e.g., 8 weeks, 40 hours"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="target-audience">Target Audience *</Label>
                  <Textarea
                    id="target-audience"
                    value={formData.targetAudience}
                    onChange={(e) => handleInputChange('targetAudience', e.target.value)}
                    placeholder="Who is this course for? e.g., Complete beginners with no programming experience"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="learning-objectives">Learning Objectives *</Label>
                  <Textarea
                    id="learning-objectives"
                    value={formData.learningObjectives}
                    onChange={(e) => handleInputChange('learningObjectives', e.target.value)}
                    placeholder="What will students learn? e.g., Build web applications, understand OOP concepts, work with databases"
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="additional-requirements">Additional Requirements</Label>
                  <Textarea
                    id="additional-requirements"
                    value={formData.additionalRequirements}
                    onChange={(e) => handleInputChange('additionalRequirements', e.target.value)}
                    placeholder="Any specific tools, frameworks, or topics to include/exclude?"
                    rows={3}
                  />
                </div>

                <Button
                  onClick={generateCourse}
                  disabled={isGenerating}
                  className="w-full"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating Course...
                    </>
                  ) : (
                    <>
                      <Wand2 className="mr-2 h-4 w-4" />
                      Generate Course
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
            <h1 className="text-2xl font-bold">Course Builder</h1>
          </div>
          
          <div className="flex items-center gap-2">
            {id && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/courses/${id}`)}
                className="flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                Preview
              </Button>
            )}
            <Button
              onClick={() => saveCourse('Draft')}
              disabled={isSaving}
              variant="outline"
            >
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Draft
            </Button>
            <Button
              onClick={() => saveCourse('Published')}
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Publish
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Course Meta */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Course Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="course-title">Title</Label>
                  <Input
                    id="course-title"
                    value={courseData.title || ''}
                    onChange={(e) => updateCourseField('title', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="course-description">Description</Label>
                  <Textarea
                    id="course-description"
                    value={courseData.description || ''}
                    onChange={(e) => updateCourseField('description', e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="course-category">Category</Label>
                    <Input
                      id="course-category"
                      value={courseData.category || ''}
                      onChange={(e) => updateCourseField('category', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="course-difficulty">Difficulty</Label>
                    <Select
                      value={courseData.difficulty || 'Beginner'}
                      onValueChange={(value) => updateCourseField('difficulty', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Beginner">Beginner</SelectItem>
                        <SelectItem value="Intermediate">Intermediate</SelectItem>
                        <SelectItem value="Advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="course-duration">Duration</Label>
                    <Input
                      id="course-duration"
                      value={courseData.duration || ''}
                      onChange={(e) => updateCourseField('duration', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="course-price">Price ($)</Label>
                    <Input
                      id="course-price"
                      type="number"
                      value={courseData.price || 0}
                      onChange={(e) => updateCourseField('price', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="course-tags">Tags (comma-separated)</Label>
                  <Input
                    id="course-tags"
                    value={(courseData.tags || []).join(', ')}
                    onChange={(e) => updateCourseField('tags', e.target.value.split(',').map(tag => tag.trim()).filter(Boolean))}
                    placeholder="python, web-development, beginner"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Course Outline */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Course Outline</h2>
              <Button onClick={addModule} size="sm" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Module
              </Button>
            </div>

            {courseData.outline && courseData.outline.length > 0 ? (
              <Accordion type="single" collapsible className="space-y-4">
                {courseData.outline.map((module, moduleIndex) => (
                  <AccordionItem key={moduleIndex} value={`module-${moduleIndex}`}>
                    <Card>
                      <AccordionTrigger className="px-6 py-4 hover:no-underline">
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">Module {moduleIndex + 1}</Badge>
                            <span className="font-medium">{module.moduleTitle}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeModule(moduleIndex);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="px-6 pb-6 space-y-6">
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label>Module Title</Label>
                              <Input
                                value={module.moduleTitle}
                                onChange={(e) => updateModuleField(moduleIndex, 'moduleTitle', e.target.value)}
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label>Estimated Time</Label>
                              <Input
                                value={module.estimatedTime}
                                onChange={(e) => updateModuleField(moduleIndex, 'estimatedTime', e.target.value)}
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label>Learning Objectives (one per line)</Label>
                              <Textarea
                                value={module.objectives.join('\n')}
                                onChange={(e) => updateModuleField(moduleIndex, 'objectives', e.target.value.split('\n').filter(Boolean))}
                                rows={3}
                              />
                            </div>
                          </div>

                          <Separator />

                          <div>
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="font-medium">Lessons</h4>
                              <Button
                                onClick={() => addLesson(moduleIndex)}
                                size="sm"
                                variant="outline"
                                className="flex items-center gap-2"
                              >
                                <Plus className="h-4 w-4" />
                                Add Lesson
                              </Button>
                            </div>

                            <div className="space-y-4">
                              {module.lessons.map((lesson, lessonIndex) => (
                                <Card key={lessonIndex} className="p-4">
                                  <div className="flex items-center justify-between mb-4">
                                    <Badge variant="outline">Lesson {lessonIndex + 1}</Badge>
                                    <div className="flex items-center gap-2">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => regenerateLesson(moduleIndex, lessonIndex)}
                                        disabled={isGenerating}
                                        className="flex items-center gap-2"
                                      >
                                        <RotateCcw className="h-3 w-3" />
                                        Regenerate
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeLesson(moduleIndex, lessonIndex)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>

                                  <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <Label>Title</Label>
                                        <Input
                                          value={lesson.title}
                                          onChange={(e) => updateLessonField(moduleIndex, lessonIndex, 'title', e.target.value)}
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label>Duration</Label>
                                        <Input
                                          value={lesson.duration}
                                          onChange={(e) => updateLessonField(moduleIndex, lessonIndex, 'duration', e.target.value)}
                                        />
                                      </div>
                                    </div>

                                    <div className="space-y-2">
                                      <Label>Description</Label>
                                      <Input
                                        value={lesson.description}
                                        onChange={(e) => updateLessonField(moduleIndex, lessonIndex, 'description', e.target.value)}
                                      />
                                    </div>

                                    <div className="space-y-2">
                                      <Label>Key Concepts (comma-separated)</Label>
                                      <Input
                                        value={lesson.concepts.join(', ')}
                                        onChange={(e) => updateLessonField(moduleIndex, lessonIndex, 'concepts', e.target.value.split(',').map(c => c.trim()).filter(Boolean))}
                                      />
                                    </div>

                                    <div className="space-y-2">
                                      <Label>Lesson Content</Label>
                                      <MarkdownEditor
                                        value={lesson.content}
                                        onChange={(value) => updateLessonField(moduleIndex, lessonIndex, 'content', value)}
                                        placeholder="Write your lesson content in markdown..."
                                      />
                                    </div>
                                  </div>
                                </Card>
                              ))}
                            </div>
                          </div>
                        </div>
                      </AccordionContent>
                    </Card>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground mb-4">No modules yet. Click "Add Module" to get started.</p>
                <Button onClick={addModule} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Your First Module
                </Button>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseBuilder;