import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Wand2, Loader2 } from 'lucide-react';
import { Course } from '@/hooks/useCourses';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CourseFormProps {
  course?: Course;
  onSubmit: (data: Omit<Course, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

export const CourseForm: React.FC<CourseFormProps> = ({ course, onSubmit, onCancel }) => {
  const { toast } = useToast();
  const [title, setTitle] = useState(course?.title || '');
  const [description, setDescription] = useState(course?.description || '');
  const [category, setCategory] = useState(course?.category || '');
  const [difficulty, setDifficulty] = useState<'Beginner' | 'Intermediate' | 'Advanced'>(course?.difficulty || 'Beginner');
  const [duration, setDuration] = useState(course?.duration || '');
  const [price, setPrice] = useState(course?.price?.toString() || '');
  const [status, setStatus] = useState<'Draft' | 'Published' | 'Archived'>(course?.status || 'Draft');
  const [tags, setTags] = useState<string[]>(course?.tags || []);
  const [newTag, setNewTag] = useState('');
  const [thumbnail, setThumbnail] = useState(course?.thumbnail || '');
  const [outline, setOutline] = useState(course?.outline || []);
  const [isAiGenerated, setIsAiGenerated] = useState(course?.isAiGenerated || false);
  
  // AI Generation fields
  const [learningObjectives, setLearningObjectives] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [additionalRequirements, setAdditionalRequirements] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    onSubmit({
      title,
      description,
      category,
      difficulty,
      duration,
      price: parseFloat(price) || 0,
      status,
      tags,
      thumbnail: thumbnail || undefined,
      outline,
      isAiGenerated,
    });
  };

  const generateCourseWithAI = async () => {
    if (!title || !category || !learningObjectives || !targetAudience) {
      toast({
        title: "Missing Information",
        description: "Please fill in title, category, learning objectives, and target audience to generate with AI.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-course', {
        body: {
          title,
          category,
          difficulty,
          duration: duration || '4-6 weeks',
          learningObjectives,
          targetAudience,
          additionalRequirements,
        },
      });

      if (error) throw error;

      // Update form with AI-generated content
      setDescription(data.description);
      setPrice(data.price.toString());
      setTags(data.tags);
      setOutline(data.outline);
      setIsAiGenerated(true);

      toast({
        title: "Course Generated!",
        description: "AI has successfully created your course content. Review and modify as needed.",
      });
    } catch (error) {
      console.error('Error generating course:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate course with AI. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle>{course ? 'Edit Course' : 'Create New Course'}</CardTitle>
        <CardDescription>
          {course ? 'Update your course details' : 'Fill in the details to create a new course'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Basic Info */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter course title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter course description"
                rows={4}
                  readOnly={isAiGenerated}
                  className={isAiGenerated ? "bg-muted" : ""}
                />
                {isAiGenerated && (
                  <p className="text-sm text-muted-foreground">
                    Generated by AI - Edit manually if needed
                  </p>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g., Programming, Design"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="difficulty">Difficulty</Label>
                <Select value={difficulty} onValueChange={(value: 'Beginner' | 'Intermediate' | 'Advanced') => setDifficulty(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select difficulty" />
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
                <Label htmlFor="duration">Duration</Label>
                <Input
                  id="duration"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="e.g., 4 weeks, 20 hours"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Price ($)</Label>
                <Input
                  id="price"
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0"
                  min="0"
                  step="0.01"
                  readOnly={isAiGenerated}
                  className={isAiGenerated ? "bg-muted" : ""}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={(value: 'Draft' | 'Published' | 'Archived') => setStatus(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Draft">Draft</SelectItem>
                    <SelectItem value="Published">Published</SelectItem>
                    <SelectItem value="Archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="thumbnail">Thumbnail URL</Label>
                <Input
                  id="thumbnail"
                  value={thumbnail}
                  onChange={(e) => setThumbnail(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => removeTag(index)}
                    />
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  id="tags"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add a tag"
                  onKeyPress={handleKeyPress}
                />
                <Button type="button" onClick={addTag} variant="outline">
                  Add
                </Button>
              </div>
            </div>
          </div>

          {/* Right Column - AI Generation */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wand2 className="h-5 w-5" />
                  Generate with AI
                </CardTitle>
                <CardDescription>
                  Let GPT-5 create comprehensive course content for you
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="learningObjectives">Learning Objectives</Label>
                  <Textarea
                    id="learningObjectives"
                    value={learningObjectives}
                    onChange={(e) => setLearningObjectives(e.target.value)}
                    placeholder="What should students learn from this course?"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="targetAudience">Target Audience</Label>
                  <Textarea
                    id="targetAudience"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    placeholder="Who is this course designed for?"
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="additionalRequirements">Additional Requirements (Optional)</Label>
                  <Textarea
                    id="additionalRequirements"
                    value={additionalRequirements}
                    onChange={(e) => setAdditionalRequirements(e.target.value)}
                    placeholder="Any specific requirements or topics to include?"
                    rows={2}
                  />
                </div>

                <Button 
                  type="button" 
                  onClick={generateCourseWithAI}
                  disabled={isGenerating || !title || !category || !learningObjectives || !targetAudience}
                  className="w-full"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="mr-2 h-4 w-4" />
                      Generate Course with AI
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {outline.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Course Outline Preview</CardTitle>
                  <CardDescription>
                    AI-generated course structure ({outline.length} modules)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {outline.map((module, index) => (
                      <div key={index} className="border rounded-lg p-3">
                        <h4 className="font-semibold text-sm">{module.moduleTitle}</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {module.estimatedTime} • {module.lessons.length} lessons
                        </p>
                        <div className="mt-2 space-y-1">
                          {module.lessons.slice(0, 2).map((lesson, lessonIndex) => (
                            <div key={lessonIndex} className="text-xs text-muted-foreground">
                              • {lesson.title}
                            </div>
                          ))}
                          {module.lessons.length > 2 && (
                            <div className="text-xs text-muted-foreground">
                              • +{module.lessons.length - 2} more lessons
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-6">
          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1">
              {course ? 'Update Course' : 'Create Course'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};