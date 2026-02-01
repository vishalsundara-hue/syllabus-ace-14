-- Create shared_mindmaps table
CREATE TABLE public.shared_mindmaps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  topic TEXT NOT NULL,
  description TEXT,
  mindmap_data JSONB NOT NULL,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create shared_roadmaps table
CREATE TABLE public.shared_roadmaps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  topic TEXT NOT NULL,
  description TEXT,
  roadmap_data JSONB NOT NULL,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shared_mindmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_roadmaps ENABLE ROW LEVEL SECURITY;

-- Policies for shared_mindmaps
CREATE POLICY "Anyone can view shared mindmaps" ON public.shared_mindmaps FOR SELECT USING (true);
CREATE POLICY "Users can create their own mindmaps" ON public.shared_mindmaps FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own mindmaps" ON public.shared_mindmaps FOR DELETE USING (auth.uid() = user_id);

-- Policies for shared_roadmaps
CREATE POLICY "Anyone can view shared roadmaps" ON public.shared_roadmaps FOR SELECT USING (true);
CREATE POLICY "Users can create their own roadmaps" ON public.shared_roadmaps FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own roadmaps" ON public.shared_roadmaps FOR DELETE USING (auth.uid() = user_id);