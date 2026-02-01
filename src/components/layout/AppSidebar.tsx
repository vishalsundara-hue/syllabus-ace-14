import React from 'react';
import { BookOpen, Moon, Sun, History, Upload, Map, Calendar, Users, Compass, TrendingUp, Briefcase } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface AppSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const tabs = [
  { id: 'learn', label: 'Learn', icon: BookOpen },
  { id: 'upload', label: 'Upload', icon: Upload },
  { id: 'history', label: 'History', icon: History },
  { id: 'mindmap', label: 'Mind Map', icon: Map },
  { id: 'community', label: 'Community', icon: Users },
  { id: 'planner', label: 'Study Plan', icon: Calendar },
  { id: 'roadmap', label: 'Roadmap', icon: Compass },
  { id: 'progress', label: 'Progress', icon: TrendingUp },
  { id: 'career', label: 'Career', icon: Briefcase },
];

const AppSidebar: React.FC<AppSidebarProps> = ({ activeTab, setActiveTab }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <aside className="fixed left-0 top-0 z-50 h-screen w-16 flex flex-col items-center py-4 bg-background/80 backdrop-blur-xl border-r border-border/40">
      {/* Logo */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative mb-6 cursor-pointer" onClick={() => setActiveTab('learn')}>
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center glow-effect">
              <BookOpen className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full animate-pulse" />
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" className="font-semibold">
          <p>StudyBuddy</p>
        </TooltipContent>
      </Tooltip>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col items-center gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <Tooltip key={tab.id}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 group ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-lg'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-[2px] w-1 h-6 bg-primary rounded-r-full" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                <p>{tab.label}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </nav>

      {/* Theme Toggle */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={toggleTheme}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200"
          >
            {theme === 'light' ? (
              <Moon className="w-5 h-5" />
            ) : (
              <Sun className="w-5 h-5 text-warning" />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>
          <p>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</p>
        </TooltipContent>
      </Tooltip>
    </aside>
  );
};

export default AppSidebar;
