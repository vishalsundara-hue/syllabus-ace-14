import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { 
  Briefcase, 
  TrendingUp, 
  AlertTriangle, 
  BookOpen, 
  Lightbulb,
  Plus,
  X,
  Save,
  RefreshCw,
  Target,
  Rocket,
  ChevronRight,
  GraduationCap
} from 'lucide-react';

interface UserSkill {
  id?: string;
  skill_name: string;
  confidence: number;
}

interface JobRole {
  id: string;
  role_name: string;
  description: string;
  skills: { skill_name: string; weight: number }[];
  projects: { project_name: string; project_description: string }[];
}

interface JobFitResult {
  role: JobRole;
  fitScore: number;
  missingSkills: { skill_name: string; weight: number; impact: number }[];
  matchedSkills: { skill_name: string; confidence: number; weight: number }[];
}

interface LearningRecommendation {
  skillName: string;
  currentScore: number;
  newScore: number;
  improvement: number;
  roleName: string;
}

const CareerIntelligencePanel: React.FC = () => {
  const { user } = useAuth();
  const [skills, setSkills] = useState<UserSkill[]>([]);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillConfidence, setNewSkillConfidence] = useState(50);
  const [jobRoles, setJobRoles] = useState<JobRole[]>([]);
  const [jobFitResults, setJobFitResults] = useState<JobFitResult[]>([]);
  const [learningRecommendations, setLearningRecommendations] = useState<LearningRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('skills');

  // Fetch user skills and job roles on mount
  useEffect(() => {
    fetchJobRoles();
    if (user) {
      fetchUserSkills();
    }
  }, [user]);

  // Recalculate fit scores when skills change
  useEffect(() => {
    if (jobRoles.length > 0 && skills.length > 0) {
      calculateJobFitScores();
    }
  }, [skills, jobRoles]);

  const fetchUserSkills = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_skills')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      setSkills(data || []);
    } catch (error) {
      console.error('Error fetching skills:', error);
      toast.error('Failed to load your skills');
    }
  };

  const fetchJobRoles = async () => {
    setIsLoading(true);
    try {
      // Fetch job roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('job_roles')
        .select('*');

      if (rolesError) throw rolesError;

      // Fetch skills for each role
      const { data: skillsData, error: skillsError } = await supabase
        .from('job_role_skills')
        .select('*');

      if (skillsError) throw skillsError;

      // Fetch projects for each role
      const { data: projectsData, error: projectsError } = await supabase
        .from('role_projects')
        .select('*');

      if (projectsError) throw projectsError;

      // Combine data
      const combinedRoles = rolesData?.map(role => ({
        ...role,
        skills: skillsData?.filter(s => s.role_id === role.id) || [],
        projects: projectsData?.filter(p => p.role_id === role.id) || []
      })) || [];

      setJobRoles(combinedRoles);
    } catch (error) {
      console.error('Error fetching job roles:', error);
      toast.error('Failed to load job roles');
    } finally {
      setIsLoading(false);
    }
  };

  const addSkill = () => {
    if (!newSkillName.trim()) {
      toast.error('Please enter a skill name');
      return;
    }

    const existingSkill = skills.find(
      s => s.skill_name.toLowerCase() === newSkillName.toLowerCase()
    );

    if (existingSkill) {
      toast.error('This skill already exists');
      return;
    }

    setSkills([...skills, { skill_name: newSkillName.trim(), confidence: newSkillConfidence }]);
    setNewSkillName('');
    setNewSkillConfidence(50);
  };

  const updateSkillConfidence = (index: number, confidence: number) => {
    const updatedSkills = [...skills];
    updatedSkills[index].confidence = confidence;
    setSkills(updatedSkills);
  };

  const removeSkill = (index: number) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  const saveSkills = async () => {
    if (!user) {
      toast.error('Please sign in to save your skills');
      return;
    }

    setIsSaving(true);
    try {
      // Delete existing skills
      await supabase
        .from('user_skills')
        .delete()
        .eq('user_id', user.id);

      // Insert new skills
      if (skills.length > 0) {
        const { error } = await supabase
          .from('user_skills')
          .insert(skills.map(s => ({
            user_id: user.id,
            skill_name: s.skill_name,
            confidence: s.confidence
          })));

        if (error) throw error;
      }

      toast.success('Skills saved successfully!');
      fetchUserSkills();
    } catch (error) {
      console.error('Error saving skills:', error);
      toast.error('Failed to save skills');
    } finally {
      setIsSaving(false);
    }
  };

  const calculateJobFitScores = () => {
    const results: JobFitResult[] = jobRoles.map(role => {
      let fitScore = 0;
      const missingSkills: JobFitResult['missingSkills'] = [];
      const matchedSkills: JobFitResult['matchedSkills'] = [];

      role.skills.forEach(roleSkill => {
        const userSkill = skills.find(
          s => s.skill_name.toLowerCase() === roleSkill.skill_name.toLowerCase()
        );

        if (userSkill) {
          const contribution = (userSkill.confidence / 100) * Number(roleSkill.weight);
          fitScore += contribution;
          matchedSkills.push({
            skill_name: roleSkill.skill_name,
            confidence: userSkill.confidence,
            weight: Number(roleSkill.weight)
          });
        } else {
          // Calculate potential impact of learning this skill
          const impact = Number(roleSkill.weight) * 100;
          missingSkills.push({
            skill_name: roleSkill.skill_name,
            weight: Number(roleSkill.weight),
            impact
          });
        }
      });

      // Normalize to percentage
      fitScore = Math.round(fitScore * 100);

      return {
        role,
        fitScore,
        missingSkills: missingSkills.sort((a, b) => b.impact - a.impact),
        matchedSkills
      };
    });

    // Sort by fit score
    results.sort((a, b) => b.fitScore - a.fitScore);
    setJobFitResults(results);

    // Generate learning recommendations
    generateLearningRecommendations(results);
  };

  const generateLearningRecommendations = (results: JobFitResult[]) => {
    const recommendations: LearningRecommendation[] = [];

    results.slice(0, 3).forEach(result => {
      result.missingSkills.slice(0, 2).forEach(missingSkill => {
        const newScore = result.fitScore + Math.round(missingSkill.weight * 80);
        
        recommendations.push({
          skillName: missingSkill.skill_name,
          currentScore: result.fitScore,
          newScore: Math.min(newScore, 100),
          improvement: newScore - result.fitScore,
          roleName: result.role.role_name
        });
      });
    });

    // Remove duplicates and sort by improvement
    const uniqueRecommendations = recommendations.reduce((acc, curr) => {
      const existing = acc.find(r => r.skillName === curr.skillName);
      if (!existing || existing.improvement < curr.improvement) {
        return [...acc.filter(r => r.skillName !== curr.skillName), curr];
      }
      return acc;
    }, [] as LearningRecommendation[]);

    setLearningRecommendations(uniqueRecommendations.sort((a, b) => b.improvement - a.improvement).slice(0, 5));
  };

  const getFitScoreColor = (score: number) => {
    if (score >= 70) return 'text-success';
    if (score >= 40) return 'text-warning';
    return 'text-destructive';
  };

  const getFitScoreBackground = (score: number) => {
    if (score >= 70) return 'bg-success/10 border-success/30';
    if (score >= 40) return 'bg-warning/10 border-warning/30';
    return 'bg-destructive/10 border-destructive/30';
  };

  // Get all missing skills across top 3 roles
  const getAllMissingSkills = () => {
    const allMissing = jobFitResults
      .slice(0, 3)
      .flatMap(r => r.missingSkills.map(s => s.skill_name));
    return [...new Set(allMissing)];
  };

  // Get project recommendations based on top fitting roles
  const getProjectRecommendations = () => {
    return jobFitResults
      .slice(0, 3)
      .flatMap(r => r.role.projects.map(p => ({
        ...p,
        roleName: r.role.role_name,
        fitScore: r.fitScore
      })));
  };

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-accent/80 p-8 md:p-12">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-success/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <Briefcase className="w-5 h-5 text-accent" />
            <span className="text-sm font-medium text-primary-foreground/80">Career Intelligence</span>
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Discover Your Career Path
          </h1>
          <p className="text-primary-foreground/80 max-w-xl">
            Enter your skills, see which job roles match your profile, and get personalized recommendations 
            to improve your career readiness.
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="skills" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Skills
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <Briefcase className="w-4 h-4" />
            Job Fit
          </TabsTrigger>
          <TabsTrigger value="learning" className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            Learning Path
          </TabsTrigger>
          <TabsTrigger value="projects" className="flex items-center gap-2">
            <Rocket className="w-4 h-4" />
            Projects
          </TabsTrigger>
        </TabsList>

        {/* Skills Input Tab */}
        <TabsContent value="skills" className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-primary" />
                Your Skills
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Add new skill */}
              <div className="flex flex-col md:flex-row gap-4 p-4 bg-muted/30 rounded-xl">
                <div className="flex-1">
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">Skill Name</label>
                  <Input
                    placeholder="e.g., Python, React, SQL"
                    value={newSkillName}
                    onChange={(e) => setNewSkillName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                  />
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Confidence Level: {newSkillConfidence}%
                  </label>
                  <Slider
                    value={[newSkillConfidence]}
                    onValueChange={(v) => setNewSkillConfidence(v[0])}
                    min={0}
                    max={100}
                    step={5}
                    className="py-4"
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={addSkill} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Skill
                  </Button>
                </div>
              </div>

              {/* Skills list */}
              <div className="space-y-3">
                {skills.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No skills added yet. Start by adding your skills above!</p>
                  </div>
                ) : (
                  skills.map((skill, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-4 p-4 bg-muted/20 rounded-xl hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{skill.skill_name}</span>
                          <span className="text-sm text-muted-foreground">{skill.confidence}%</span>
                        </div>
                        <Slider
                          value={[skill.confidence]}
                          onValueChange={(v) => updateSkillConfidence(index, v[0])}
                          min={0}
                          max={100}
                          step={5}
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeSkill(index)}
                        className="text-destructive hover:bg-destructive/10"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>

              {/* Save button */}
              {skills.length > 0 && (
                <div className="flex justify-end gap-4">
                  <Button
                    variant="outline"
                    onClick={() => calculateJobFitScores()}
                    className="gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Calculate Fit
                  </Button>
                  {user && (
                    <Button onClick={saveSkills} disabled={isSaving} className="gap-2">
                      <Save className="w-4 h-4" />
                      {isSaving ? 'Saving...' : 'Save Skills'}
                    </Button>
                  )}
                </div>
              )}

              {!user && skills.length > 0 && (
                <p className="text-sm text-muted-foreground text-center">
                  Sign in to save your skills and track progress over time.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Job Roles Tab */}
        <TabsContent value="roles" className="space-y-6">
          {skills.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="py-12 text-center">
                <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-warning" />
                <h3 className="text-lg font-semibold mb-2">No Skills Added</h3>
                <p className="text-muted-foreground mb-4">
                  Add your skills first to see job role recommendations.
                </p>
                <Button onClick={() => setActiveTab('skills')}>Add Skills</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {jobFitResults.map((result, index) => (
                <Card
                  key={result.role.id}
                  className={`glass-card border-2 ${getFitScoreBackground(result.fitScore)} transition-all hover:shadow-lg`}
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge variant="outline" className="text-xs">
                            #{index + 1}
                          </Badge>
                          <h3 className="text-xl font-bold">{result.role.role_name}</h3>
                        </div>
                        <p className="text-muted-foreground text-sm mb-4">
                          {result.role.description}
                        </p>
                        
                        {/* Matched skills */}
                        {result.matchedSkills.length > 0 && (
                          <div className="mb-3">
                            <span className="text-xs text-muted-foreground">Matched Skills:</span>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {result.matchedSkills.map((skill, i) => (
                                <Badge key={i} variant="secondary" className="bg-success/20 text-success">
                                  {skill.skill_name} ({skill.confidence}%)
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Missing skills */}
                        {result.missingSkills.length > 0 && (
                          <div>
                            <span className="text-xs text-muted-foreground">Missing Skills:</span>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {result.missingSkills.slice(0, 4).map((skill, i) => (
                                <Badge key={i} variant="outline" className="text-warning border-warning/50">
                                  {skill.skill_name}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Score circle */}
                      <div className="flex flex-col items-center">
                        <div className={`relative w-24 h-24 rounded-full border-4 ${
                          result.fitScore >= 70 ? 'border-success' :
                          result.fitScore >= 40 ? 'border-warning' : 'border-destructive'
                        } flex items-center justify-center`}>
                          <span className={`text-2xl font-bold ${getFitScoreColor(result.fitScore)}`}>
                            {result.fitScore}%
                          </span>
                        </div>
                        <span className="text-sm text-muted-foreground mt-2">Fit Score</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Learning Path Tab */}
        <TabsContent value="learning" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Missing Skills */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-warning" />
                  Missing / Weak Skills
                </CardTitle>
              </CardHeader>
              <CardContent>
                {getAllMissingSkills().length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    Add skills and calculate fit to see missing skills.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {getAllMissingSkills().map((skill, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 bg-warning/10 rounded-lg border border-warning/30"
                      >
                        <AlertTriangle className="w-4 h-4 text-warning" />
                        <span className="font-medium">{skill}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Optimized Learning Path */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-success" />
                  Optimized Learning Path
                </CardTitle>
              </CardHeader>
              <CardContent>
                {learningRecommendations.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    Add skills to get personalized learning recommendations.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {learningRecommendations.map((rec, index) => (
                      <div
                        key={index}
                        className="p-4 bg-success/10 rounded-xl border border-success/30"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <BookOpen className="w-4 h-4 text-primary" />
                          <span className="font-semibold">{rec.skillName}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          Learning this skill increases <strong>{rec.roleName}</strong> fit:
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{rec.currentScore}%</span>
                          <ChevronRight className="w-4 h-4 text-success" />
                          <span className="text-sm font-bold text-success">{rec.newScore}%</span>
                          <Badge variant="secondary" className="bg-success/20 text-success ml-2">
                            +{rec.improvement}%
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Projects Tab */}
        <TabsContent value="projects" className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Rocket className="w-5 h-5 text-accent" />
                Recommended Projects
              </CardTitle>
            </CardHeader>
            <CardContent>
              {getProjectRecommendations().length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Add skills and calculate fit to see project recommendations.
                </p>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {getProjectRecommendations().map((project, index) => (
                    <div
                      key={index}
                      className="p-4 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
                          <Rocket className="w-5 h-5 text-accent" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold mb-1">{project.project_name}</h4>
                          <p className="text-sm text-muted-foreground mb-2">
                            {project.project_description}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {project.roleName}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CareerIntelligencePanel;
