import { BarChart3, TrendingUp, Clock, DollarSign, FolderKanban, Calendar } from 'lucide-react';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Skeleton } from '../components/ui/skeleton';
import { trpc } from '../lib/trpc';

const AnalyticsPage = () => {
  const { data: stats, isLoading: statsLoading } = trpc.clientPortal.getDashboardStats.useQuery();
  const { data: projectsData, isLoading: projectsLoading } = trpc.clientPortal.getProjects.useQuery({
    limit: 100,
    offset: 0,
  });

  const projects = projectsData?.projects || [];

  // Calculate analytics
  const totalProjects = projects.length;
  const completedProjects = projects.filter((p) => p.status === 'completed').length;
  const inProgressProjects = projects.filter((p) => p.status === 'in_progress').length;
  const completionRate = totalProjects > 0 ? (completedProjects / totalProjects) * 100 : 0;

  const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
  const totalHoursEstimated = projects.reduce((sum, p) => sum + (p.estimatedHours || 0), 0);
  const totalHoursActual = projects.reduce((sum, p) => sum + (p.actualHours || 0), 0);
  const avgProgress = totalProjects > 0 ? projects.reduce((sum, p) => sum + p.progress, 0) / totalProjects : 0;

  // Project status breakdown
  const statusBreakdown = {
    planning: projects.filter((p) => p.status === 'planning').length,
    in_progress: projects.filter((p) => p.status === 'in_progress').length,
    on_hold: projects.filter((p) => p.status === 'on_hold').length,
    completed: projects.filter((p) => p.status === 'completed').length,
    archived: projects.filter((p) => p.status === 'archived').length,
  };

  const isLoading = statsLoading || projectsLoading;

  if (isLoading) {
    return (
      <DashboardLayout>
        <main className="flex-1 overflow-y-auto p-6">
          <Skeleton className="h-12 w-64 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </main>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--hopstec-teal)]">
              Analytics
            </p>
            <h1 className="mt-2 text-3xl font-medium tracking-tight text-white">
              Portfolio rollup
            </h1>
            <p className="mt-2 text-gray-400">
              High-level metrics across your engagements. Live step progress lives on the dashboard.
            </p>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="portal-stat-card border-0 shadow-none">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="portal-icon-chip">
                    <FolderKanban className="h-5 w-5" />
                  </div>
                </div>
                <p className="text-sm text-gray-400 mb-1">Total Projects</p>
                <p className="text-3xl font-bold text-white">{totalProjects}</p>
                <p className="text-xs text-gray-500 mt-2">
                  {inProgressProjects} in progress
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-500/20 rounded-lg">
                    <BarChart3 className="h-6 w-6 text-green-400" />
                  </div>
                  <span className="text-sm text-green-400">{completionRate.toFixed(0)}%</span>
                </div>
                <p className="text-sm text-gray-400 mb-1">Completion Rate</p>
                <p className="text-3xl font-bold text-white">{completedProjects}</p>
                <p className="text-xs text-gray-500 mt-2">
                  of {totalProjects} completed
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-purple-500/20 rounded-lg">
                    <Clock className="h-6 w-6 text-purple-400" />
                  </div>
                  <span className="text-sm text-purple-400">
                    {totalHoursEstimated > 0
                      ? ((totalHoursActual / totalHoursEstimated) * 100).toFixed(0)
                      : 0}%
                  </span>
                </div>
                <p className="text-sm text-gray-400 mb-1">Hours Tracked</p>
                <p className="text-3xl font-bold text-white">{totalHoursActual}h</p>
                <p className="text-xs text-gray-500 mt-2">
                  of {totalHoursEstimated}h estimated
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-orange-500/20 rounded-lg">
                    <DollarSign className="h-6 w-6 text-orange-400" />
                  </div>
                </div>
                <p className="text-sm text-gray-400 mb-1">Total Budget</p>
                <p className="text-3xl font-bold text-white">
                  ${(totalBudget / 100).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Across all projects
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Project Status Breakdown */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Project Status Breakdown</CardTitle>
                <CardDescription className="text-gray-400">
                  Distribution of projects by status
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                        Planning
                      </Badge>
                      <span className="text-white font-medium">{statusBreakdown.planning}</span>
                    </div>
                    <span className="text-sm text-gray-400">
                      {totalProjects > 0 ? ((statusBreakdown.planning / totalProjects) * 100).toFixed(0) : 0}%
                    </span>
                  </div>
                  <Progress
                    value={totalProjects > 0 ? (statusBreakdown.planning / totalProjects) * 100 : 0}
                    className="h-2"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                        In Progress
                      </Badge>
                      <span className="text-white font-medium">{statusBreakdown.in_progress}</span>
                    </div>
                    <span className="text-sm text-gray-400">
                      {totalProjects > 0 ? ((statusBreakdown.in_progress / totalProjects) * 100).toFixed(0) : 0}%
                    </span>
                  </div>
                  <Progress
                    value={totalProjects > 0 ? (statusBreakdown.in_progress / totalProjects) * 100 : 0}
                    className="h-2"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                        On Hold
                      </Badge>
                      <span className="text-white font-medium">{statusBreakdown.on_hold}</span>
                    </div>
                    <span className="text-sm text-gray-400">
                      {totalProjects > 0 ? ((statusBreakdown.on_hold / totalProjects) * 100).toFixed(0) : 0}%
                    </span>
                  </div>
                  <Progress
                    value={totalProjects > 0 ? (statusBreakdown.on_hold / totalProjects) * 100 : 0}
                    className="h-2"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                        Completed
                      </Badge>
                      <span className="text-white font-medium">{statusBreakdown.completed}</span>
                    </div>
                    <span className="text-sm text-gray-400">
                      {totalProjects > 0 ? ((statusBreakdown.completed / totalProjects) * 100).toFixed(0) : 0}%
                    </span>
                  </div>
                  <Progress
                    value={totalProjects > 0 ? (statusBreakdown.completed / totalProjects) * 100 : 0}
                    className="h-2"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">
                        Archived
                      </Badge>
                      <span className="text-white font-medium">{statusBreakdown.archived}</span>
                    </div>
                    <span className="text-sm text-gray-400">
                      {totalProjects > 0 ? ((statusBreakdown.archived / totalProjects) * 100).toFixed(0) : 0}%
                    </span>
                  </div>
                  <Progress
                    value={totalProjects > 0 ? (statusBreakdown.archived / totalProjects) * 100 : 0}
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Average Progress */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Overall Progress</CardTitle>
                <CardDescription className="text-gray-400">
                  Average completion across all active projects
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center py-8">
                  <div className="relative w-48 h-48">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="96"
                        cy="96"
                        r="88"
                        stroke="currentColor"
                        strokeWidth="12"
                        fill="none"
                        className="text-slate-800"
                      />
                      <circle
                        cx="96"
                        cy="96"
                        r="88"
                        stroke="currentColor"
                        strokeWidth="12"
                        fill="none"
                        strokeDasharray={`${(avgProgress / 100) * 553} 553`}
                        className="text-blue-500"
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-5xl font-bold text-white">{avgProgress.toFixed(0)}%</p>
                        <p className="text-sm text-gray-400 mt-2">Average</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-800">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">{inProgressProjects}</p>
                    <p className="text-sm text-gray-400">Active</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-400">{completedProjects}</p>
                    <p className="text-sm text-gray-400">Completed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </DashboardLayout>
  );
};

export default AnalyticsPage;

