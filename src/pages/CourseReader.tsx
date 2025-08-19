import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { ChevronLeft, ChevronRight, Download, Menu, X, Home, Clock, Tag, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { useCourses } from '@/hooks/useCourses';
import { Course, CourseModule, CourseLesson } from '@/hooks/useCourses';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useToast } from '@/hooks/use-toast';

interface FlatLesson extends CourseLesson {
  moduleTitle: string;
  moduleIndex: number;
  lessonIndex: number;
}

export default function CourseReader() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { courses } = useCourses();
  const { toast } = useToast();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [flatLessons, setFlatLessons] = useState<FlatLesson[]>([]);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  useEffect(() => {
    const foundCourse = courses.find(c => c.id === id);
    if (foundCourse) {
      setCourse(foundCourse);
      
      // Flatten lessons for easy navigation
      const lessons: FlatLesson[] = [];
      foundCourse.outline?.forEach((module, moduleIndex) => {
        module.lessons.forEach((lesson, lessonIndex) => {
          lessons.push({
            ...lesson,
            moduleTitle: module.moduleTitle,
            moduleIndex,
            lessonIndex,
          });
        });
      });
      setFlatLessons(lessons);
    }
  }, [id, courses]);

  const currentLesson = flatLessons[currentLessonIndex];
  const currentModule = course?.outline?.[currentLesson?.moduleIndex];

  const navigateToLesson = (index: number) => {
    setCurrentLessonIndex(index);
    setSidebarOpen(false);
  };

  const nextLesson = () => {
    if (currentLessonIndex < flatLessons.length - 1) {
      setCurrentLessonIndex(currentLessonIndex + 1);
    }
  };

  const prevLesson = () => {
    if (currentLessonIndex > 0) {
      setCurrentLessonIndex(currentLessonIndex - 1);
    }
  };

  const generatePDF = async () => {
    if (!course) return;
    
    setIsGeneratingPDF(true);
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      
      // Title page
      pdf.setFontSize(24);
      pdf.text(course.title, margin, 40);
      pdf.setFontSize(14);
      pdf.text(course.description || '', margin, 60, { maxWidth: pageWidth - 2 * margin });
      
      if (course.category) pdf.text(`Category: ${course.category}`, margin, 80);
      if (course.difficulty) pdf.text(`Difficulty: ${course.difficulty}`, margin, 90);
      if (course.duration) pdf.text(`Duration: ${course.duration}`, margin, 100);
      
      // Table of contents
      pdf.addPage();
      pdf.setFontSize(18);
      pdf.text('Table of Contents', margin, 30);
      
      let yPos = 50;
      course.outline?.forEach((module, moduleIndex) => {
        pdf.setFontSize(14);
        pdf.text(`${moduleIndex + 1}. ${module.moduleTitle}`, margin, yPos);
        yPos += 10;
        
        module.lessons.forEach((lesson, lessonIndex) => {
          pdf.setFontSize(12);
          pdf.text(`   ${moduleIndex + 1}.${lessonIndex + 1} ${lesson.title}`, margin + 5, yPos);
          yPos += 8;
          
          if (yPos > pageHeight - 30) {
            pdf.addPage();
            yPos = 30;
          }
        });
        yPos += 5;
      });
      
      // Course content
      for (const lesson of flatLessons) {
        pdf.addPage();
        
        // Lesson header
        pdf.setFontSize(18);
        pdf.text(`${lesson.moduleTitle}`, margin, 30);
        pdf.setFontSize(16);
        pdf.text(lesson.title, margin, 45);
        
        // Lesson content
        pdf.setFontSize(12);
        const content = lesson.content || lesson.description || 'No content available';
        const lines = pdf.splitTextToSize(content, pageWidth - 2 * margin);
        
        let currentY = 60;
        for (const line of lines) {
          if (currentY > pageHeight - 30) {
            pdf.addPage();
            currentY = 30;
          }
          pdf.text(line, margin, currentY);
          currentY += 6;
        }
      }
      
      pdf.save(`${course.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`);
      
      toast({
        title: "PDF Generated",
        description: "Your course has been exported as a PDF successfully.",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Export Failed",
        description: "There was an error generating the PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Course Not Found</h1>
          <Button onClick={() => navigate('/dashboard')}>
            <Home className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const SidebarContent = () => (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h2 className="font-semibold text-lg">{course.title}</h2>
        <div className="flex flex-wrap gap-2 mt-2">
          {course.difficulty && <Badge variant="secondary">{course.difficulty}</Badge>}
          {course.duration && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {course.duration}
            </Badge>
          )}
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-4">
          {course.outline?.map((module, moduleIndex) => (
            <div key={moduleIndex} className="mb-6">
              <h3 className="font-medium text-sm text-muted-foreground mb-2">
                Module {moduleIndex + 1}
              </h3>
              <h4 className="font-semibold mb-3">{module.moduleTitle}</h4>
              
              <div className="space-y-1">
                {module.lessons.map((lesson, lessonIndex) => {
                  const globalIndex = flatLessons.findIndex(
                    fl => fl.moduleIndex === moduleIndex && fl.lessonIndex === lessonIndex
                  );
                  const isActive = globalIndex === currentLessonIndex;
                  
                  return (
                    <button
                      key={lessonIndex}
                      onClick={() => navigateToLesson(globalIndex)}
                      className={`w-full text-left p-2 rounded-md text-sm transition-colors ${
                        isActive 
                          ? 'bg-primary text-primary-foreground' 
                          : 'hover:bg-muted'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-3 w-3 shrink-0" />
                        <span className="truncate">{lesson.title}</span>
                      </div>
                      {lesson.duration && (
                        <div className="text-xs opacity-70 mt-1 ml-5">
                          {lesson.duration}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-4">
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="lg:hidden">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 p-0">
                <SidebarContent />
              </SheetContent>
            </Sheet>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={generatePDF}
              disabled={isGeneratingPDF}
            >
              <Download className="mr-2 h-4 w-4" />
              {isGeneratingPDF ? 'Generating...' : 'Export PDF'}
            </Button>
          </div>
        </div>
      </header>

      <div className="container flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-80 border-r min-h-[calc(100vh-3.5rem)]">
          <SidebarContent />
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-h-[calc(100vh-3.5rem)]">
          {currentLesson ? (
            <div className="max-w-4xl mx-auto p-6">
              {/* Lesson Header */}
              <div className="mb-8">
                <div className="text-sm text-muted-foreground mb-2">
                  Module {currentLesson.moduleIndex + 1}: {currentLesson.moduleTitle}
                </div>
                <h1 className="text-3xl font-bold mb-4">{currentLesson.title}</h1>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {currentLesson.duration && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {currentLesson.duration}
                    </Badge>
                  )}
                  {currentLesson.concepts?.map((concept, index) => (
                    <Badge key={index} variant="secondary">
                      <Tag className="h-3 w-3 mr-1" />
                      {concept}
                    </Badge>
                  ))}
                </div>
                
                {currentLesson.description && (
                  <p className="text-muted-foreground text-lg">
                    {currentLesson.description}
                  </p>
                )}
              </div>

              {/* Lesson Content */}
              <Card>
                <CardContent className="p-8">
                  <div className="prose prose-neutral dark:prose-invert max-w-none">
                    <ReactMarkdown>
                      {currentLesson.content || currentLesson.description || 'No content available for this lesson.'}
                    </ReactMarkdown>
                  </div>
                </CardContent>
              </Card>

              {/* Navigation */}
              <div className="flex justify-between items-center mt-8">
                <Button
                  variant="outline"
                  onClick={prevLesson}
                  disabled={currentLessonIndex === 0}
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Previous Lesson
                </Button>
                
                <div className="text-sm text-muted-foreground">
                  {currentLessonIndex + 1} of {flatLessons.length}
                </div>
                
                <Button
                  onClick={nextLesson}
                  disabled={currentLessonIndex === flatLessons.length - 1}
                >
                  Next Lesson
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[calc(100vh-3.5rem)]">
              <div className="text-center">
                <h2 className="text-xl font-semibold mb-2">No lessons available</h2>
                <p className="text-muted-foreground">This course doesn't have any lessons yet.</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}