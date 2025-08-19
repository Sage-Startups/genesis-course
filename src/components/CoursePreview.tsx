import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Clock, Users, Target, BookOpen } from 'lucide-react';
import { Course } from '@/hooks/useCourses';

interface CoursePreviewProps {
  course: Course | null;
  isOpen: boolean;
  onClose: () => void;
}

export const CoursePreview: React.FC<CoursePreviewProps> = ({ course, isOpen, onClose }) => {
  if (!course) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {course.isAIGenerated && (
              <Badge variant="outline" className="text-xs">
                AI Generated
              </Badge>
            )}
            {course.title}
          </DialogTitle>
          <DialogDescription className="text-left">
            Complete course preview with detailed outline
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Course Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Course Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {course.description}
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{course.difficulty}</Badge>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4" />
                  {course.duration}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4" />
                  {course.category}
                </div>
                <div className="text-sm font-semibold">
                  ${course.price}
                </div>
              </div>

              {course.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {course.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Course Outline */}
          {course.outline && course.outline.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Course Outline
                </CardTitle>
                <CardDescription>
                  {course.outline.length} modules • Detailed curriculum structure
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {course.outline.map((module, moduleIndex) => (
                    <div key={moduleIndex} className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-lg">
                            Module {moduleIndex + 1}: {module.moduleTitle}
                          </h3>
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {module.estimatedTime}
                            </span>
                            <span className="flex items-center gap-1">
                              <BookOpen className="h-4 w-4" />
                              {module.lessons.length} lessons
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Learning Objectives */}
                      {module.objectives.length > 0 && (
                        <div className="bg-muted/50 rounded-lg p-4">
                          <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                            <Target className="h-4 w-4" />
                            Learning Objectives
                          </h4>
                          <ul className="space-y-1">
                            {module.objectives.map((objective, index) => (
                              <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                                <span className="text-primary mt-1">•</span>
                                {objective}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Lessons */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-sm">Lessons</h4>
                        <div className="grid gap-3">
                          {module.lessons.map((lesson, lessonIndex) => (
                            <Card key={lessonIndex} className="border-l-4 border-l-primary/20">
                              <CardContent className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                  <h5 className="font-medium text-sm">
                                    {lessonIndex + 1}. {lesson.title}
                                  </h5>
                                  <Badge variant="outline" className="text-xs">
                                    {lesson.duration}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                                  {lesson.description}
                                </p>
                                {lesson.concepts.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {lesson.concepts.map((concept, conceptIndex) => (
                                      <Badge key={conceptIndex} variant="secondary" className="text-xs">
                                        {concept}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>

                      {moduleIndex < course.outline!.length - 1 && (
                        <Separator className="my-6" />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};