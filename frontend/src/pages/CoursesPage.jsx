import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API, useUser } from "@/App";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { ArrowLeft, Plus, MapPin, Trash2, Edit, Flag, Save } from "lucide-react";

// Default stroke indices (common UK/US pattern)
const DEFAULT_STROKE_INDICES = [
  { hole: 1, si: 7 }, { hole: 2, si: 15 }, { hole: 3, si: 3 }, { hole: 4, si: 11 },
  { hole: 5, si: 1 }, { hole: 6, si: 13 }, { hole: 7, si: 5 }, { hole: 8, si: 17 },
  { hole: 9, si: 9 }, { hole: 10, si: 8 }, { hole: 11, si: 16 }, { hole: 12, si: 4 },
  { hole: 13, si: 12 }, { hole: 14, si: 2 }, { hole: 15, si: 14 }, { hole: 16, si: 6 },
  { hole: 17, si: 18 }, { hole: 18, si: 10 }
];

// Default pars
const DEFAULT_PARS = [4, 4, 4, 3, 5, 4, 4, 3, 4, 4, 4, 4, 3, 5, 4, 4, 3, 5];

export default function CoursesPage() {
  const navigate = useNavigate();
  const { user } = useUser();
  const isAdmin = user?.is_admin === true;
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  
  const [newCourse, setNewCourse] = useState({
    name: "",
    tee: "White",
    slope_rating: 113,
    course_rating: 72.0,
    total_par: 72,
    holes: DEFAULT_STROKE_INDICES.map((item, idx) => ({
      hole_number: item.hole,
      par: DEFAULT_PARS[idx],
      stroke_index: item.si,
      yards: null
    }))
  });

  useEffect(() => {
    fetchCourses();
  }, [user]);

  const fetchCourses = async () => {
    try {
      const societyId = user?.society_id;
      const url = societyId 
        ? `${API}/courses?society_id=${societyId}`
        : `${API}/courses`;
      const response = await axios.get(url);
      setCourses(response.data);
    } catch (error) {
      toast.error("Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = async () => {
    if (!newCourse.name.trim()) {
      toast.error("Course name is required");
      return;
    }

    // Validate stroke indices are unique 1-18
    const siValues = newCourse.holes.map(h => h.stroke_index);
    const uniqueSI = new Set(siValues);
    if (uniqueSI.size !== 18 || !siValues.every(si => si >= 1 && si <= 18)) {
      toast.error("Stroke indices must be unique values 1-18");
      return;
    }

    try {
      const payload = {
        ...newCourse,
        society_id: user?.society_id || null,
      };
      await axios.post(`${API}/courses?user_id=${user?.id}`, payload);
      toast.success("Course created!");
      setShowAddDialog(false);
      setNewCourse({
        name: "",
        tee: "White",
        slope_rating: 113,
        course_rating: 72.0,
        total_par: 72,
        holes: DEFAULT_STROKE_INDICES.map((item, idx) => ({
          hole_number: item.hole,
          par: DEFAULT_PARS[idx],
          stroke_index: item.si,
          yards: null
        }))
      });
      fetchCourses();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to create course");
    }
  };

  const handleUpdateCourse = async () => {
    if (!editingCourse) return;

    try {
      await axios.put(`${API}/courses/${editingCourse.id}?user_id=${user?.id}`, editingCourse);
      toast.success("Course updated!");
      setShowEditDialog(false);
      setEditingCourse(null);
      fetchCourses();
    } catch (error) {
      if (error.response?.status === 403) {
        toast.error("Admin access required");
      } else {
        toast.error("Failed to update course");
      }
    }
  };

  const handleDeleteCourse = async (courseId) => {
    try {
      await axios.delete(`${API}/courses/${courseId}?user_id=${user?.id}`);
      toast.success("Course deleted");
      fetchCourses();
    } catch (error) {
      if (error.response?.status === 403) {
        toast.error("Admin access required");
      } else {
        toast.error("Failed to delete course");
      }
    }
  };

  const updateHoleData = (holeNumber, field, value, isEditing = false) => {
    const target = isEditing ? editingCourse : newCourse;
    const setTarget = isEditing ? setEditingCourse : setNewCourse;
    
    const updatedHoles = target.holes.map(h => 
      h.hole_number === holeNumber 
        ? { ...h, [field]: field === 'par' || field === 'stroke_index' || field === 'yards' ? parseInt(value) || 0 : value }
        : h
    );
    setTarget({ ...target, holes: updatedHoles });
  };

  const calculateTotalPar = (holes) => {
    return holes.reduce((sum, h) => sum + (h.par || 0), 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="golf-header text-white py-6 px-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Button
              data-testid="back-btn"
              variant="ghost"
              onClick={() => navigate("/dashboard")}
              className="text-white hover:bg-white/10 p-2 flex-shrink-0"
            >
              <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </Button>
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <MapPin className="w-6 h-6 sm:w-8 sm:h-8 text-[#C0C0C0] flex-shrink-0" />
              <div className="min-w-0">
                <h1 className="text-lg sm:text-2xl font-bold uppercase tracking-tight truncate">Courses</h1>
                <p className="text-white/70 text-xs sm:text-sm hidden sm:block">Manage courses with stroke indices</p>
              </div>
            </div>
          </div>
          {isAdmin ? (
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button
                  data-testid="add-course-btn"
                  className="bg-[#C0C0C0] text-black hover:bg-[#9E9E9E] rounded-none uppercase font-bold tracking-widest text-xs sm:text-sm px-2 sm:px-4 flex-shrink-0"
                >
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5 sm:mr-2" />
                  <span className="hidden sm:inline">Add Course</span>
                </Button>
              </DialogTrigger>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold uppercase tracking-tight flex items-center gap-2">
                  <MapPin className="w-6 h-6 text-primary" />
                  Add New Course
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-6 py-4">
                {/* Course Basic Info */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="col-span-2 space-y-2">
                    <Label>Course Name *</Label>
                    <Input
                      data-testid="course-name-input"
                      value={newCourse.name}
                      onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
                      placeholder="e.g., Royal Portrush"
                      className="rounded-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tee</Label>
                    <Select
                      value={newCourse.tee}
                      onValueChange={(val) => setNewCourse({ ...newCourse, tee: val })}
                    >
                      <SelectTrigger className="rounded-none">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Black">Black</SelectItem>
                        <SelectItem value="Blue">Blue</SelectItem>
                        <SelectItem value="White">White</SelectItem>
                        <SelectItem value="Yellow">Yellow</SelectItem>
                        <SelectItem value="Red">Red</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Slope Rating</Label>
                    <Input
                      data-testid="slope-input"
                      type="number"
                      min="55"
                      max="155"
                      value={newCourse.slope_rating}
                      onChange={(e) => setNewCourse({ ...newCourse, slope_rating: parseInt(e.target.value) || 113 })}
                      className="rounded-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Course Rating</Label>
                    <Input
                      data-testid="rating-input"
                      type="number"
                      step="0.1"
                      min="60"
                      max="80"
                      value={newCourse.course_rating}
                      onChange={(e) => setNewCourse({ ...newCourse, course_rating: parseFloat(e.target.value) || 72.0 })}
                      className="rounded-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Total Par</Label>
                    <div className="h-10 flex items-center px-3 border rounded-none bg-muted font-mono font-bold">
                      {calculateTotalPar(newCourse.holes)}
                    </div>
                  </div>
                </div>

                {/* Hole-by-hole stroke indices */}
                <div className="space-y-3">
                  <Label className="text-lg font-bold uppercase">Hole Details & Stroke Index</Label>
                  <p className="text-sm text-muted-foreground">
                    Stroke Index (SI) determines which holes receive handicap strokes. 1 = hardest, 18 = easiest.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {/* Front 9 */}
                    <Card>
                      <CardHeader className="py-2 bg-primary/10">
                        <CardTitle className="text-sm uppercase">Front 9</CardTitle>
                      </CardHeader>
                      <CardContent className="p-2">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-12 text-center text-xs">Hole</TableHead>
                              <TableHead className="w-16 text-center text-xs">Par</TableHead>
                              <TableHead className="w-16 text-center text-xs">SI</TableHead>
                              <TableHead className="text-center text-xs">Yards</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {newCourse.holes.slice(0, 9).map((hole) => (
                              <TableRow key={hole.hole_number}>
                                <TableCell className="text-center font-bold">{hole.hole_number}</TableCell>
                                <TableCell>
                                  <Select
                                    value={hole.par.toString()}
                                    onValueChange={(val) => updateHoleData(hole.hole_number, 'par', val)}
                                  >
                                    <SelectTrigger className="h-8 rounded-none text-center">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="3">3</SelectItem>
                                      <SelectItem value="4">4</SelectItem>
                                      <SelectItem value="5">5</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                                <TableCell>
                                  <Select
                                    value={hole.stroke_index.toString()}
                                    onValueChange={(val) => updateHoleData(hole.hole_number, 'stroke_index', val)}
                                  >
                                    <SelectTrigger className="h-8 rounded-none text-center">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {Array.from({ length: 18 }, (_, i) => i + 1).map(si => (
                                        <SelectItem key={si} value={si.toString()}>{si}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    className="h-8 rounded-none text-center"
                                    placeholder="-"
                                    value={hole.yards || ""}
                                    onChange={(e) => updateHoleData(hole.hole_number, 'yards', e.target.value)}
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>

                    {/* Back 9 */}
                    <Card>
                      <CardHeader className="py-2 bg-primary/10">
                        <CardTitle className="text-sm uppercase">Back 9</CardTitle>
                      </CardHeader>
                      <CardContent className="p-2">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-12 text-center text-xs">Hole</TableHead>
                              <TableHead className="w-16 text-center text-xs">Par</TableHead>
                              <TableHead className="w-16 text-center text-xs">SI</TableHead>
                              <TableHead className="text-center text-xs">Yards</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {newCourse.holes.slice(9, 18).map((hole) => (
                              <TableRow key={hole.hole_number}>
                                <TableCell className="text-center font-bold">{hole.hole_number}</TableCell>
                                <TableCell>
                                  <Select
                                    value={hole.par.toString()}
                                    onValueChange={(val) => updateHoleData(hole.hole_number, 'par', val)}
                                  >
                                    <SelectTrigger className="h-8 rounded-none text-center">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="3">3</SelectItem>
                                      <SelectItem value="4">4</SelectItem>
                                      <SelectItem value="5">5</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                                <TableCell>
                                  <Select
                                    value={hole.stroke_index.toString()}
                                    onValueChange={(val) => updateHoleData(hole.hole_number, 'stroke_index', val)}
                                  >
                                    <SelectTrigger className="h-8 rounded-none text-center">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {Array.from({ length: 18 }, (_, i) => i + 1).map(si => (
                                        <SelectItem key={si} value={si.toString()}>{si}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    className="h-8 rounded-none text-center"
                                    placeholder="-"
                                    value={hole.yards || ""}
                                    onChange={(e) => updateHoleData(hole.hole_number, 'yards', e.target.value)}
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  data-testid="save-course-btn"
                  onClick={handleCreateCourse}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-none uppercase font-bold tracking-widest"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Course
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          ) : (
            <span className="text-white/70 text-sm">(Admin only)</span>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-6">
        {/* Courses List */}
        {courses.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <MapPin className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground mb-4">
                {isAdmin ? "No courses yet. Add your first course with stroke indices!" : "No courses available."}
              </p>
              {isAdmin && (
                <Button
                  onClick={() => setShowAddDialog(true)}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-none uppercase"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Course
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {courses.map((course) => (
              <Card key={course.id} className="overflow-hidden" data-testid={`course-card-${course.id}`}>
                <div className="bg-[#1a1a1a] text-white px-4 py-3 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-[#C0C0C0]" />
                    <div>
                      <h3 className="font-bold uppercase tracking-wide">{course.name}</h3>
                      <p className="text-sm text-gray-400">
                        {course.tee} Tees • Par {course.total_par} • Slope {course.slope_rating} • Rating {course.course_rating}
                      </p>
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingCourse(course);
                          setShowEditDialog(true);
                        }}
                        className="text-white hover:bg-white/10"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteCourse(course.id)}
                        className="text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  {/* Stroke Index Display */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="px-2 py-1 text-left text-xs text-muted-foreground">HOLE</th>
                          {Array.from({ length: 18 }, (_, i) => (
                            <th key={i} className="px-2 py-1 text-center text-xs font-bold">{i + 1}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="px-2 py-1 text-xs text-muted-foreground">PAR</td>
                          {course.holes?.map((hole, idx) => (
                            <td key={idx} className="px-2 py-1 text-center font-mono">{hole.par}</td>
                          )) || Array.from({ length: 18 }, (_, i) => (
                            <td key={i} className="px-2 py-1 text-center font-mono">4</td>
                          ))}
                        </tr>
                        <tr className="bg-[#C0C0C0]/10">
                          <td className="px-2 py-1 text-xs font-semibold text-[#C0C0C0]">S.I.</td>
                          {course.holes?.map((hole, idx) => (
                            <td key={idx} className="px-2 py-1 text-center font-mono font-bold text-[#C0C0C0]">{hole.stroke_index}</td>
                          )) || Array.from({ length: 18 }, (_, i) => (
                            <td key={i} className="px-2 py-1 text-center font-mono">-</td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Info Card */}
        <Card className="mt-6 bg-secondary/30">
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground">
              <strong>Stroke Index (S.I.):</strong> Determines which holes a player receives handicap strokes on. 
              A player with handicap 10 gets an extra stroke on holes with S.I. 1-10. 
              A player with handicap 20 gets two strokes on S.I. 1-2, and one stroke on S.I. 3-18.
            </p>
          </CardContent>
        </Card>
      </main>

      {/* Edit Course Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold uppercase tracking-tight flex items-center gap-2">
              <Edit className="w-6 h-6 text-primary" />
              Edit Course
            </DialogTitle>
          </DialogHeader>
          {editingCourse && (
            <div className="space-y-6 py-4">
              {/* Course Basic Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label>Course Name *</Label>
                  <Input
                    value={editingCourse.name}
                    onChange={(e) => setEditingCourse({ ...editingCourse, name: e.target.value })}
                    className="rounded-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tee</Label>
                  <Select
                    value={editingCourse.tee}
                    onValueChange={(val) => setEditingCourse({ ...editingCourse, tee: val })}
                  >
                    <SelectTrigger className="rounded-none">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Black">Black</SelectItem>
                      <SelectItem value="Blue">Blue</SelectItem>
                      <SelectItem value="White">White</SelectItem>
                      <SelectItem value="Yellow">Yellow</SelectItem>
                      <SelectItem value="Red">Red</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Slope Rating</Label>
                  <Input
                    type="number"
                    min="55"
                    max="155"
                    value={editingCourse.slope_rating}
                    onChange={(e) => setEditingCourse({ ...editingCourse, slope_rating: parseInt(e.target.value) || 113 })}
                    className="rounded-none"
                  />
                </div>
              </div>

              {/* Hole-by-hole stroke indices */}
              <div className="space-y-3">
                <Label className="text-lg font-bold uppercase">Hole Details & Stroke Index</Label>
                <div className="grid grid-cols-2 gap-4">
                  {/* Front 9 */}
                  <Card>
                    <CardHeader className="py-2 bg-primary/10">
                      <CardTitle className="text-sm uppercase">Front 9</CardTitle>
                    </CardHeader>
                    <CardContent className="p-2">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12 text-center text-xs">Hole</TableHead>
                            <TableHead className="w-16 text-center text-xs">Par</TableHead>
                            <TableHead className="w-16 text-center text-xs">SI</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {editingCourse.holes?.slice(0, 9).map((hole) => (
                            <TableRow key={hole.hole_number}>
                              <TableCell className="text-center font-bold">{hole.hole_number}</TableCell>
                              <TableCell>
                                <Select
                                  value={hole.par.toString()}
                                  onValueChange={(val) => updateHoleData(hole.hole_number, 'par', val, true)}
                                >
                                  <SelectTrigger className="h-8 rounded-none text-center">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="3">3</SelectItem>
                                    <SelectItem value="4">4</SelectItem>
                                    <SelectItem value="5">5</SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                <Select
                                  value={hole.stroke_index.toString()}
                                  onValueChange={(val) => updateHoleData(hole.hole_number, 'stroke_index', val, true)}
                                >
                                  <SelectTrigger className="h-8 rounded-none text-center">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Array.from({ length: 18 }, (_, i) => i + 1).map(si => (
                                      <SelectItem key={si} value={si.toString()}>{si}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>

                  {/* Back 9 */}
                  <Card>
                    <CardHeader className="py-2 bg-primary/10">
                      <CardTitle className="text-sm uppercase">Back 9</CardTitle>
                    </CardHeader>
                    <CardContent className="p-2">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12 text-center text-xs">Hole</TableHead>
                            <TableHead className="w-16 text-center text-xs">Par</TableHead>
                            <TableHead className="w-16 text-center text-xs">SI</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {editingCourse.holes?.slice(9, 18).map((hole) => (
                            <TableRow key={hole.hole_number}>
                              <TableCell className="text-center font-bold">{hole.hole_number}</TableCell>
                              <TableCell>
                                <Select
                                  value={hole.par.toString()}
                                  onValueChange={(val) => updateHoleData(hole.hole_number, 'par', val, true)}
                                >
                                  <SelectTrigger className="h-8 rounded-none text-center">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="3">3</SelectItem>
                                    <SelectItem value="4">4</SelectItem>
                                    <SelectItem value="5">5</SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                <Select
                                  value={hole.stroke_index.toString()}
                                  onValueChange={(val) => updateHoleData(hole.hole_number, 'stroke_index', val, true)}
                                >
                                  <SelectTrigger className="h-8 rounded-none text-center">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Array.from({ length: 18 }, (_, i) => i + 1).map(si => (
                                      <SelectItem key={si} value={si.toString()}>{si}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              onClick={handleUpdateCourse}
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-none uppercase font-bold tracking-widest"
            >
              <Save className="w-4 h-4 mr-2" />
              Update Course
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
