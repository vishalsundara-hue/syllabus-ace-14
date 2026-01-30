import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useStudy } from '@/contexts/StudyContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Heart, Share2, Calendar, Clock, Search, 
  Plus, Loader2, User, ChevronDown, ChevronUp, Trash2 
} from 'lucide-react';
import { Json } from '@/integrations/supabase/types';

interface SharedPlan {
  id: string;
  user_id: string;
  title: string;
  topic: string;
  description: string | null;
  days: Json;
  likes_count: number | null;
  created_at: string;
  profile_display_name?: string | null;
}

const CommunityPanel: React.FC = () => {
  const { user } = useAuth();
  const { studyPlans } = useStudy();
  const { toast } = useToast();
  const [sharedPlans, setSharedPlans] = useState<SharedPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [showShareForm, setShowShareForm] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [shareTitle, setShareTitle] = useState('');
  const [shareDescription, setShareDescription] = useState('');
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchSharedPlans();
    if (user) {
      fetchUserLikes();
    }
  }, [user]);

  const fetchSharedPlans = async () => {
    setIsLoading(true);
    try {
      // Fetch plans
      const { data: plans, error: plansError } = await supabase
        .from('shared_study_plans')
        .select('*')
        .order('created_at', { ascending: false });

      if (plansError) throw plansError;

      // Fetch public profiles (without email) for all user_ids using RPC or direct query
      const userIds = [...new Set(plans?.map(p => p.user_id) || [])];
      
      // Query profiles but only select non-sensitive fields
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', userIds);

      // Merge profiles with plans
      const plansWithProfiles: SharedPlan[] = (plans || []).map(plan => {
        const profile = profiles?.find(p => p.id === plan.user_id);
        return {
          ...plan,
          profile_display_name: profile?.display_name,
        };
      });

      setSharedPlans(plansWithProfiles);
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserLikes = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('plan_likes')
        .select('plan_id')
        .eq('user_id', user.id);

      if (error) throw error;
      setUserLikes(new Set(data?.map(l => l.plan_id) || []));
    } catch (error) {
      console.error('Error fetching likes:', error);
    }
  };

  const handleSharePlan = async () => {
    if (!user || !selectedPlanId) {
      toast({ title: 'Error', description: 'Please select a plan to share', variant: 'destructive' });
      return;
    }

    const plan = studyPlans.find(p => p.id === selectedPlanId);
    if (!plan) return;

    setIsSharing(true);
    try {
      const { error } = await supabase.from('shared_study_plans').insert([{
        user_id: user.id,
        title: shareTitle || `Study Plan: ${plan.topic}`,
        topic: plan.topic,
        description: shareDescription || null,
        days: plan.days as unknown as Json,
      }]);

      if (error) throw error;

      toast({ title: 'Shared!', description: 'Your study plan is now visible to the community.' });
      setShowShareForm(false);
      setShareTitle('');
      setShareDescription('');
      setSelectedPlanId('');
      fetchSharedPlans();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsSharing(false);
    }
  };

  const handleLike = async (planId: string) => {
    if (!user) {
      toast({ title: 'Sign in required', description: 'Please sign in to like plans', variant: 'destructive' });
      return;
    }

    const isLiked = userLikes.has(planId);

    try {
      if (isLiked) {
        await supabase.from('plan_likes').delete().eq('user_id', user.id).eq('plan_id', planId);
        setUserLikes(prev => {
          const newSet = new Set(prev);
          newSet.delete(planId);
          return newSet;
        });
      } else {
        await supabase.from('plan_likes').insert({ user_id: user.id, plan_id: planId });
        setUserLikes(prev => new Set(prev).add(planId));
      }
      fetchSharedPlans();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleDelete = async (planId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase.from('shared_study_plans').delete().eq('id', planId);
      if (error) throw error;
      toast({ title: 'Deleted', description: 'Your shared plan has been removed.' });
      fetchSharedPlans();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const filteredPlans = sharedPlans.filter(plan =>
    plan.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    plan.topic.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card p-6 animate-slide-up">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-display font-semibold text-lg text-foreground">Community Study Plans</h2>
              <p className="text-sm text-muted-foreground">Share and discover study plans from other students</p>
            </div>
          </div>
          {user && studyPlans.length > 0 && (
            <Button onClick={() => setShowShareForm(!showShareForm)} className="gap-2">
              <Plus className="w-4 h-4" />
              Share Plan
            </Button>
          )}
        </div>

        {/* Share Form */}
        <AnimatePresence>
          {showShareForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 p-4 bg-muted/30 rounded-xl border border-border"
            >
              <h3 className="font-medium text-foreground mb-4">Share Your Study Plan</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">Select Plan</label>
                  <select
                    value={selectedPlanId}
                    onChange={(e) => setSelectedPlanId(e.target.value)}
                    className="w-full p-2 rounded-lg border border-border bg-background text-foreground"
                  >
                    <option value="">Choose a plan...</option>
                    {studyPlans.map(plan => (
                      <option key={plan.id} value={plan.id}>{plan.topic}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">Title</label>
                  <Input
                    placeholder="Give your plan a title..."
                    value={shareTitle}
                    onChange={(e) => setShareTitle(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">Description (optional)</label>
                  <Textarea
                    placeholder="Add a description..."
                    value={shareDescription}
                    onChange={(e) => setShareDescription(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSharePlan} disabled={isSharing || !selectedPlanId}>
                    {isSharing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4 mr-2" />}
                    Share
                  </Button>
                  <Button variant="outline" onClick={() => setShowShareForm(false)}>Cancel</Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search plans..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Plans List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : filteredPlans.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">No shared plans yet</p>
          {user && studyPlans.length > 0 && (
            <p className="text-sm text-muted-foreground mt-2">Be the first to share your study plan!</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPlans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="glass-card p-5"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {plan.profile_display_name || 'Anonymous'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(plan.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <h3 className="font-display font-semibold text-lg text-foreground">{plan.title}</h3>
                  <p className="text-sm text-primary mt-1">{plan.topic}</p>
                  {plan.description && (
                    <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleLike(plan.id)}
                    className={userLikes.has(plan.id) ? 'text-red-500' : 'text-muted-foreground'}
                  >
                    <Heart className={`w-4 h-4 mr-1 ${userLikes.has(plan.id) ? 'fill-current' : ''}`} />
                    {plan.likes_count || 0}
                  </Button>
                  {user?.id === plan.user_id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(plan.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Expandable Schedule */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpandedPlan(expandedPlan === plan.id ? null : plan.id)}
                className="mt-3 w-full justify-center"
              >
                {expandedPlan === plan.id ? (
                  <>Hide Schedule <ChevronUp className="w-4 h-4 ml-1" /></>
                ) : (
                  <>View Schedule <ChevronDown className="w-4 h-4 ml-1" /></>
                )}
              </Button>

              <AnimatePresence>
                {expandedPlan === plan.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 pt-4 border-t border-border"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {Array.isArray(plan.days) && plan.days.map((day: any, idx: number) => (
                        <div key={idx} className="p-3 bg-muted/30 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Calendar className="w-4 h-4 text-primary" />
                            <span className="text-sm font-medium">Day {day.day}</span>
                          </div>
                          <div className="space-y-1">
                            {day.timeSlots?.map((slot: any, slotIdx: number) => (
                              <div key={slotIdx} className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                <span>{slot.startTime} - {slot.endTime}</span>
                                <span className="text-foreground">{slot.activity}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}

      {!user && (
        <div className="glass-card p-6 text-center">
          <p className="text-muted-foreground mb-4">Sign in to share your study plans and like others' plans</p>
          <Button onClick={() => window.location.href = '/auth'}>
            Sign In
          </Button>
        </div>
      )}
    </div>
  );
};

export default CommunityPanel;
