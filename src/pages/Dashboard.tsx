import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Filter, MoreHorizontal, Edit, Copy, Download, Trash2, BookOpen, Users, DollarSign, TrendingUp } from 'lucide-react';
import { useCourses, Course } from '@/hooks/useCourses';
import { CourseForm } from '@/components/CourseForm';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { courses, userPlan, createCourse, updateCourse, deleteCourse, duplicateCourse, exportCourse, canCreateCourse } = useCourses();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  // Filter courses based on search and filters
  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || course.status === statusFilter;
    const matchesDifficulty = difficultyFilter === 'all' || course.difficulty === difficultyFilter;
    
    return matchesSearch && matchesStatus && matchesDifficulty;
  });

  // Calculate stats
  const stats = {
    total: courses.length,
    published: courses.filter(c => c.status === 'Published').length,
    revenue: courses.filter(c => c.status === 'Published').reduce((sum, c) => sum + c.price, 0),
    avgPrice: courses.length > 0 ? courses.reduce((sum, c) => sum + c.price, 0) / courses.length : 0
  };

  const handleCreateCourse = (courseData: Omit<Course, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      createCourse(courseData);
      setIsCreateDialogOpen(false);
      toast({
        title: "Course created successfully",
        description: "Your new course has been added to your library.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create course",
        variant: "destructive",
      });
    }
  };

  const handleUpdateCourse = (courseData: Omit<Course, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!editingCourse) return;
    
    updateCourse(editingCourse.id, courseData);
    setEditingCourse(null);
    toast({
      title: "Course updated",
      description: "Your course has been successfully updated.",
    });
  };

  const handleDuplicate = (course: Course) => {
    try {
      duplicateCourse(course.id);
      toast({
        title: "Course duplicated",
        description: `"${course.title}" has been duplicated successfully.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to duplicate course",
        variant: "destructive",
      });
    }
  };

  const handleDelete = (course: Course) => {
    deleteCourse(course.id);
    toast({
      title: "Course deleted",
      description: `"${course.title}" has been removed from your library.`,
    });
  };

  const getStatusBadge = (status: Course['status']) => {
    const variants = {
      Draft: 'secondary',
      Published: 'default',
      Archived: 'outline'
    } as const;
    
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const getDifficultyBadge = (difficulty: Course['difficulty']) => {
    const colors = {
      Beginner: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      Intermediate: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      Advanced: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    };
    
    return (
      <Badge variant="outline" className={colors[difficulty]}>
        {difficulty}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Course Dashboard</h1>
              <p className="text-muted-foreground">
                Manage your courses • {userPlan.name} Plan ({courses.length}/{userPlan.maxCourses} courses)
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/plan">
                <Button variant="outline" size="sm">
                  Upgrade Plan
                </Button>
              </Link>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button disabled={!canCreateCourse()}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Course
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create New Course</DialogTitle>
                    <DialogDescription>
                      Fill in the details below to create a new course.
                    </DialogDescription>
                  </DialogHeader>
                  <CourseForm
                    onSubmit={handleCreateCourse}
                    onCancel={() => setIsCreateDialogOpen(false)}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Published</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.published}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.revenue.toFixed(2)}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Price</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.avgPrice.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Published">Published</SelectItem>
                  <SelectItem value="Archived">Archived</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="Difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="Beginner">Beginner</SelectItem>
                  <SelectItem value="Intermediate">Intermediate</SelectItem>
                  <SelectItem value="Advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Courses Table */}
        <Card>
          <CardHeader>
            <CardTitle>Your Courses</CardTitle>
            <CardDescription>
              {filteredCourses.length} of {courses.length} courses
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredCourses.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No courses found</h3>
                <p className="text-muted-foreground mb-4">
                  {courses.length === 0 
                    ? "Get started by creating your first course!" 
                    : "Try adjusting your search or filters."}
                </p>
                {courses.length === 0 && canCreateCourse() && (
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Course
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Difficulty</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCourses.map((course) => (
                    <TableRow key={course.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{course.title}</div>
                          <div className="text-sm text-muted-foreground truncate max-w-xs">
                            {course.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{course.category}</TableCell>
                      <TableCell>{getDifficultyBadge(course.difficulty)}</TableCell>
                      <TableCell>{course.duration}</TableCell>
                      <TableCell>${course.price.toFixed(2)}</TableCell>
                      <TableCell>{getStatusBadge(course.status)}</TableCell>
                      <TableCell>
                        {new Date(course.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditingCourse(course)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicate(course)}>
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => exportCourse(course.id, 'json')}>
                              <Download className="h-4 w-4 mr-2" />
                              Export JSON
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => exportCourse(course.id, 'csv')}>
                              <Download className="h-4 w-4 mr-2" />
                              Export CSV
                            </DropdownMenuItem>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Course</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{course.title}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(course)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Edit Course Dialog */}
        <Dialog open={!!editingCourse} onOpenChange={() => setEditingCourse(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Course</DialogTitle>
              <DialogDescription>
                Update the course details below.
              </DialogDescription>
            </DialogHeader>
            {editingCourse && (
              <CourseForm
                course={editingCourse}
                onSubmit={handleUpdateCourse}
                onCancel={() => setEditingCourse(null)}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Dashboard;