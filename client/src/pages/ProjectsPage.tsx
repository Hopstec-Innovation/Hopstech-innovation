import { useState } from 'react';
import { Link } from 'wouter';
import { Plus, Search, Filter, FolderKanban, Calendar, TrendingUp, Code } from 'lucide-react';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Skeleton } from '../components/ui/skeleton';
import { trpc } from '../lib/trpc';
import { cn } from '../lib/utils';
import CreateProjectModal from '../components/dashboard/CreateProjectModal';
import { ProjectCardSkeleton } from '../components/ui/skeletons';

type ProjectStatus = 'planning' | 'in_progress' | 'on_hold' | 'completed' | 'archived';

const ProjectsPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const { data: projectsData, isLoading } = trpc.clientPortal.getProjects.useQuery({
    status: statusFilter === 'all' ? undefined : statusFilter,
    limit: 50,
    offset: 0,
  });

  const filteredProjects = projectsData?.projects.filter((project) =>
    project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const statusOptions: { value: ProjectStatus | 'all'; label: string; color: string }[] = [
    { value: 'all', label: 'All Projects', color: 'gray' },
    { value: 'planning', label: 'Planning', color: 'purple' },
    { value: 'in_progress', label: 'In Progress', color: 'blue' },
    { value: 'on_hold', label: 'On Hold', color: 'orange' },
    { value: 'completed', label: 'Completed', color: 'green' },
    { value: 'archived', label: 'Archived', color: 'gray' },
  ];

  const getStatusColor = (status: string) => {
    const colors = {
      planning: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      in_progress: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      on_hold: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      completed: 'bg-green-500/20 text-green-400 border-green-500/30',
      archived: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    };
    return colors[status as keyof typeof colors] || colors.planning;
  };

  return (
    <DashboardLayout>
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Projects</h1>
              <p className="text-gray-400">Manage and track all your projects</p>
            </div>
            <Button
              onClick={() => setCreateModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
                    Request quotation
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-900 border-slate-800 text-white"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {statusOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={statusFilter === option.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter(option.value)}
                  className={cn(
                    statusFilter === option.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-900 border-slate-800 text-gray-400 hover:bg-slate-800 hover:text-white'
                  )}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Projects Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <ProjectCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project) => (
                <Link key={project.id} href={`/client-portal/projects/${project.id}`}>
                  <a>
                    <Card className="bg-slate-900 border-slate-800 hover:border-blue-500/50 transition-all h-full">
                      <CardHeader>
                        <div className="flex items-start justify-between mb-2">
                          <CardTitle className="text-white text-lg line-clamp-1">
                            {project.title}
                          </CardTitle>
                          <Badge className={getStatusColor(project.status)}>
                            {project.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <CardDescription className="text-gray-400 line-clamp-2">
                          {project.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Progress */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-400">Progress</span>
                            <span className="text-sm font-medium text-white">{project.progress}%</span>
                          </div>
                          <Progress value={project.progress} className="h-2" />
                        </div>

                        {/* Dates */}
                        {project.startDate && (
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(project.startDate).toLocaleDateString()}</span>
                            {project.endDate && (
                              <>
                                <span>→</span>
                                <span>{new Date(project.endDate).toLocaleDateString()}</span>
                              </>
                            )}
                          </div>
                        )}

                        {/* Technologies */}
                        {project.technologies && project.technologies.length > 0 && (
                          <div className="flex items-center gap-2 flex-wrap">
                            <Code className="h-4 w-4 text-gray-400" />
                            {project.technologies.slice(0, 3).map((tech, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs border-slate-700 text-gray-400">
                                {tech}
                              </Badge>
                            ))}
                            {project.technologies.length > 3 && (
                              <span className="text-xs text-gray-500">+{project.technologies.length - 3}</span>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </a>
                </Link>
              ))}
            </div>
          ) : (
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <FolderKanban className="h-16 w-16 text-gray-600 mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No projects found</h3>
                <p className="text-gray-400 mb-6 text-center max-w-md">
                  {searchQuery || statusFilter !== 'all'
                    ? 'Try adjusting your filters or search query'
                    : 'Start by sending your first quotation request'}
                </p>
                {!searchQuery && statusFilter === 'all' && (
                  <Button onClick={() => setCreateModalOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Request Your First Quotation
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <CreateProjectModal open={createModalOpen} onOpenChange={setCreateModalOpen} />
    </DashboardLayout>
  );
};

export default ProjectsPage;
