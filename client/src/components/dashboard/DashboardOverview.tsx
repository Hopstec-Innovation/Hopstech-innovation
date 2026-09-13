import {
  FolderKanban,
  MessageSquare,
  FileText,
  CheckCircle2,
  Clock,
  TrendingUp,
  AlertCircle,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { trpc } from '../../lib/trpc';
import { Link } from 'wouter';
import { Skeleton } from '../ui/skeleton';
import NotificationPermissionPrompt from './NotificationPermissionPrompt';
import { StatsCardSkeleton, ProjectCardSkeleton } from '../ui/skeletons';
import './portal.css';

const DashboardOverview = () => {
  const { data: stats, isLoading: statsLoading } = trpc.clientPortal.getDashboardStats.useQuery();
  const { data: projectsData, isLoading: projectsLoading } = trpc.clientPortal.getProjects.useQuery({ 
    limit: 5, 
    offset: 0 
  });
  const { data: notifications, isLoading: notificationsLoading } = trpc.clientPortal.getNotifications.useQuery({ 
    limit: 5, 
    offset: 0,
    unreadOnly: true 
  });
  const { data: activities, isLoading: activitiesLoading } = trpc.clientPortal.getActivityLog.useQuery({ 
    limit: 10, 
    offset: 0 
  });

  const statCards = [
    {
      title: 'Active Projects',
      value: stats?.projects.active || 0,
      total: stats?.projects.total || 0,
      icon: FolderKanban,
      description: `${stats?.projects.completed || 0} completed`,
      href: '/client-portal/projects',
    },
    {
      title: 'Unread Messages',
      value: stats?.messages.unread || 0,
      icon: MessageSquare,
      description: 'New messages',
      href: '/client-portal/messages',
    },
    {
      title: 'Pending Invoices',
      value: stats?.invoices.pending || 0,
      icon: FileText,
      description: `${stats?.invoices.overdue || 0} overdue`,
      href: '/client-portal/invoices',
    },
    {
      title: 'Open Tickets',
      value: stats?.tickets.open || 0,
      icon: AlertCircle,
      description: 'Support tickets',
      href: '/client-portal/support',
    },
  ];

  const statusClass = (status: string) => {
    if (status === 'completed') return 'border-[var(--hopstec-teal)]/30 bg-[var(--hopstec-teal)]/10 text-[var(--hopstec-teal)]';
    if (status === 'in_progress') return 'border-sky-500/30 bg-sky-500/10 text-sky-300';
    if (status === 'on_hold') return 'border-amber-500/30 bg-amber-500/10 text-amber-300';
    return 'border-white/15 bg-white/5 text-gray-300';
  };

  if (statsLoading) {
    return (
      <div className="p-6 space-y-6">
        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <StatsCardSkeleton key={i} />
          ))}
        </div>

        {/* Recent Projects Skeleton */}
        <Card className="bg-slate-900/60 border-white/10">
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3].map((i) => (
              <ProjectCardSkeleton key={i} />
            ))}
          </CardContent>
        </Card>

        {/* Activity Feed Skeleton */}
        <Card className="bg-slate-900/60 border-white/10">
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Notification Permission Prompt */}
      <NotificationPermissionPrompt />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.title} href={stat.href}>
              <a>
                <Card className="portal-stat-card cursor-pointer border-0 shadow-none">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-gray-400">
                      {stat.title}
                    </CardTitle>
                    <div className="portal-icon-chip">
                      <Icon className="h-4 w-4" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-1 text-3xl font-semibold tracking-tight text-white">
                      {stat.value}
                      {stat.total !== undefined && (
                        <span className="ml-2 text-lg text-gray-500">/ {stat.total}</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{stat.description}</p>
                  </CardContent>
                </Card>
              </a>
            </Link>
          );
        })}
      </div>

      {/* Recent Projects & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Projects */}
        <Card className="portal-panel border-0 shadow-none">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">Recent Projects</CardTitle>
              <Link href="/client-portal/projects">
                <a>
                  <Button variant="ghost" size="sm" className="text-[var(--hopstec-teal)] hover:text-[var(--hopstec-teal)]/80">
                    View All
                  </Button>
                </a>
              </Link>
            </div>
            <CardDescription className="text-gray-400">
              Your active and recent projects
            </CardDescription>
          </CardHeader>
          <CardContent>
            {projectsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            ) : projectsData?.projects && projectsData.projects.length > 0 ? (
              <div className="space-y-3">
                {projectsData.projects.slice(0, 5).map((project) => (
                  <Link key={project.id} href={`/client-portal/projects/${project.id}`}>
                    <a className="block rounded-xl border border-white/5 bg-white/[0.03] p-3 transition-colors hover:border-[var(--hopstec-teal)]/25 hover:bg-white/[0.05]">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <h4 className="font-medium text-white">{project.title}</h4>
                        <Badge className={statusClass(project.status)}>
                          {project.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          {project.progress}%
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'Not started'}
                        </span>
                      </div>
                    </a>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-gray-400">
                <FolderKanban className="mx-auto mb-3 h-12 w-12 opacity-50" />
                <p>No projects yet</p>
                <Link href="/client-portal/projects">
                  <a>
                    <Button variant="link" className="mt-2 text-[var(--hopstec-teal)]">
                      Create your first project
                    </Button>
                  </a>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="portal-panel border-0 shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Activity className="h-5 w-5 text-[var(--hopstec-teal)]" />
              Recent Activity
            </CardTitle>
            <CardDescription className="text-gray-400">
              Your latest actions and updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            {activitiesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-12" />
                ))}
              </div>
            ) : activities && activities.length > 0 ? (
              <div className="max-h-96 space-y-3 overflow-y-auto">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 rounded-lg p-2 hover:bg-white/[0.03]">
                    <div className="mt-2 h-2 w-2 rounded-full bg-[var(--hopstec-teal)]" />
                    <div className="flex-1">
                      <p className="text-sm text-white">{activity.description}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        {new Date(activity.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-gray-400">
                <Activity className="mx-auto mb-3 h-12 w-12 opacity-50" />
                <p>No recent activity</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardOverview;

