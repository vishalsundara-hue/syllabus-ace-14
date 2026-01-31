-- Create update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create user_skills table
CREATE TABLE public.user_skills (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  skill_name TEXT NOT NULL,
  confidence INTEGER NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, skill_name)
);

-- Create job_roles table
CREATE TABLE public.job_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role_name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create job_role_skills table (mapping skills to roles with weights)
CREATE TABLE public.job_role_skills (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role_id UUID NOT NULL REFERENCES public.job_roles(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  weight DECIMAL(3,2) NOT NULL CHECK (weight >= 0 AND weight <= 1),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(role_id, skill_name)
);

-- Create role_projects table
CREATE TABLE public.role_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role_id UUID NOT NULL REFERENCES public.job_roles(id) ON DELETE CASCADE,
  project_name TEXT NOT NULL,
  project_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_role_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_projects ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_skills (user can only manage their own skills)
CREATE POLICY "Users can view own skills" ON public.user_skills FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own skills" ON public.user_skills FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own skills" ON public.user_skills FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own skills" ON public.user_skills FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for job_roles (public read)
CREATE POLICY "Anyone can view job roles" ON public.job_roles FOR SELECT USING (true);

-- RLS policies for job_role_skills (public read)
CREATE POLICY "Anyone can view job role skills" ON public.job_role_skills FOR SELECT USING (true);

-- RLS policies for role_projects (public read)
CREATE POLICY "Anyone can view role projects" ON public.role_projects FOR SELECT USING (true);

-- Create trigger for updated_at on user_skills
CREATE TRIGGER update_user_skills_updated_at
BEFORE UPDATE ON public.user_skills
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample job roles
INSERT INTO public.job_roles (id, role_name, description) VALUES
  ('a1b2c3d4-1111-1111-1111-111111111111', 'Backend Developer', 'Build server-side applications and APIs'),
  ('a1b2c3d4-2222-2222-2222-222222222222', 'Data Analyst', 'Analyze data and create insights'),
  ('a1b2c3d4-3333-3333-3333-333333333333', 'Frontend Developer', 'Build user interfaces and web applications'),
  ('a1b2c3d4-4444-4444-4444-444444444444', 'Full Stack Developer', 'Build complete web applications end-to-end'),
  ('a1b2c3d4-5555-5555-5555-555555555555', 'Machine Learning Engineer', 'Build and deploy ML models'),
  ('a1b2c3d4-6666-6666-6666-666666666666', 'DevOps Engineer', 'Manage infrastructure and CI/CD pipelines');

-- Insert skill requirements for Backend Developer
INSERT INTO public.job_role_skills (role_id, skill_name, weight) VALUES
  ('a1b2c3d4-1111-1111-1111-111111111111', 'Python', 0.30),
  ('a1b2c3d4-1111-1111-1111-111111111111', 'SQL', 0.20),
  ('a1b2c3d4-1111-1111-1111-111111111111', 'DSA', 0.20),
  ('a1b2c3d4-1111-1111-1111-111111111111', 'Django', 0.30);

-- Insert skill requirements for Data Analyst
INSERT INTO public.job_role_skills (role_id, skill_name, weight) VALUES
  ('a1b2c3d4-2222-2222-2222-222222222222', 'Python', 0.25),
  ('a1b2c3d4-2222-2222-2222-222222222222', 'SQL', 0.30),
  ('a1b2c3d4-2222-2222-2222-222222222222', 'Excel', 0.20),
  ('a1b2c3d4-2222-2222-2222-222222222222', 'Data Visualization', 0.25);

-- Insert skill requirements for Frontend Developer
INSERT INTO public.job_role_skills (role_id, skill_name, weight) VALUES
  ('a1b2c3d4-3333-3333-3333-333333333333', 'JavaScript', 0.30),
  ('a1b2c3d4-3333-3333-3333-333333333333', 'React', 0.30),
  ('a1b2c3d4-3333-3333-3333-333333333333', 'CSS', 0.20),
  ('a1b2c3d4-3333-3333-3333-333333333333', 'TypeScript', 0.20);

-- Insert skill requirements for Full Stack Developer
INSERT INTO public.job_role_skills (role_id, skill_name, weight) VALUES
  ('a1b2c3d4-4444-4444-4444-444444444444', 'JavaScript', 0.20),
  ('a1b2c3d4-4444-4444-4444-444444444444', 'React', 0.20),
  ('a1b2c3d4-4444-4444-4444-444444444444', 'Node.js', 0.20),
  ('a1b2c3d4-4444-4444-4444-444444444444', 'SQL', 0.20),
  ('a1b2c3d4-4444-4444-4444-444444444444', 'TypeScript', 0.20);

-- Insert skill requirements for ML Engineer
INSERT INTO public.job_role_skills (role_id, skill_name, weight) VALUES
  ('a1b2c3d4-5555-5555-5555-555555555555', 'Python', 0.30),
  ('a1b2c3d4-5555-5555-5555-555555555555', 'Machine Learning', 0.30),
  ('a1b2c3d4-5555-5555-5555-555555555555', 'TensorFlow', 0.20),
  ('a1b2c3d4-5555-5555-5555-555555555555', 'Statistics', 0.20);

-- Insert skill requirements for DevOps Engineer
INSERT INTO public.job_role_skills (role_id, skill_name, weight) VALUES
  ('a1b2c3d4-6666-6666-6666-666666666666', 'Linux', 0.25),
  ('a1b2c3d4-6666-6666-6666-666666666666', 'Docker', 0.25),
  ('a1b2c3d4-6666-6666-6666-666666666666', 'Kubernetes', 0.25),
  ('a1b2c3d4-6666-6666-6666-666666666666', 'CI/CD', 0.25);

-- Insert sample projects
INSERT INTO public.role_projects (role_id, project_name, project_description) VALUES
  ('a1b2c3d4-1111-1111-1111-111111111111', 'REST API with JWT Authentication', 'Build a secure REST API with user authentication'),
  ('a1b2c3d4-1111-1111-1111-111111111111', 'E-commerce Backend', 'Create a complete e-commerce API with payment integration'),
  ('a1b2c3d4-2222-2222-2222-222222222222', 'Sales Dashboard', 'Analyze sales data and create visualizations'),
  ('a1b2c3d4-2222-2222-2222-222222222222', 'Data Analysis with Pandas & SQL', 'Process and analyze large datasets'),
  ('a1b2c3d4-3333-3333-3333-333333333333', 'Portfolio Website', 'Build a responsive portfolio website'),
  ('a1b2c3d4-3333-3333-3333-333333333333', 'React Dashboard', 'Create an interactive admin dashboard'),
  ('a1b2c3d4-4444-4444-4444-444444444444', 'Full Stack Blog Platform', 'Build a complete blogging platform'),
  ('a1b2c3d4-4444-4444-4444-444444444444', 'Task Management App', 'Create a full-stack project management tool'),
  ('a1b2c3d4-5555-5555-5555-555555555555', 'Image Classification Model', 'Train a CNN for image classification'),
  ('a1b2c3d4-5555-5555-5555-555555555555', 'Sentiment Analysis API', 'Build an NLP model for sentiment analysis'),
  ('a1b2c3d4-6666-6666-6666-666666666666', 'CI/CD Pipeline', 'Set up automated deployment pipeline'),
  ('a1b2c3d4-6666-6666-6666-666666666666', 'Kubernetes Cluster', 'Deploy a microservices architecture');