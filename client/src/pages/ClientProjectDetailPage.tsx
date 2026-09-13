import { useState } from 'react';
import { useRoute, Link } from 'wouter';
import { ArrowLeft, Calendar, DollarSign, Clock, CheckCircle2, Circle, FileText, Activity, List, BarChart3, Zap } from 'lucide-react';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Skeleton } from '../components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Input } from '../components/ui/input';
import { trpc } from '../lib/trpc';
import { cn } from '../lib/utils';
import ProjectTimeline from '../components/project/ProjectTimeline';
import ProjectInsights from '../components/project/ProjectInsights';
import { ProjectDetailSkeleton } from '../components/ui/skeletons';
import ProjectControlPanel from '../components/project/ProjectControlPanel';
import ChangeRequestForm from '../components/project/ChangeRequestForm';
import ProgressBreakdown from '../components/project/ProgressBreakdown';
import PaymentDashboard from '../components/project/PaymentDashboard';
import LiveTracker from '../components/project/LiveTracker';
import CommercialTimeline from '../components/project/CommercialTimeline';
import WipExportButton from '../components/project/WipExportButton';
import '@/components/dashboard/portal.css';

const ClientProjectDetailPage = () => {
  const [, params] = useRoute('/client-portal/projects/:id');
  const projectId = params?.id ? parseInt(params.id) : null;
  const [milestoneView, setMilestoneView] = useState<'list' | 'timeline'>('timeline');

  const { data: project, isLoading } = trpc.clientPortal.getProject.useQuery(
    { id: projectId! },
    { enabled: !!projectId }
  );

  const { data: commercial } = trpc.ops.getCommercialTimeline.useQuery(
    { projectId: projectId! },
    { enabled: !!projectId, refetchInterval: 10000 }
  );

  const { data: liveBundle } = trpc.liveRun.getActiveLiveRun.useQuery(
    { projectId: projectId! },
    {
      enabled: !!projectId,
      refetchInterval: (query) =>
        query.state.data?.run.status === "active" ||
        query.state.data?.run.status === "paused"
          ? 5000
          : false,
    }
  );

  const { data: kpis } = trpc.ops.getDeliveryKpis.useQuery(
    { projectId: projectId! },
    { enabled: !!projectId }
  );

  const { data: activities } = trpc.clientPortal.getActivityLog.useQuery(
    { limit: 20, offset: 0 },
    { enabled: !!projectId }
  );

  const utils = trpc.useUtils();
  const toggleMilestoneMutation = trpc.clientPortal.toggleMilestoneCompletion.useMutation({
    onSuccess: () => {
      utils.clientPortal.getProject.invalidate({ id: projectId! });
    },
  });

  const [clientDoc, setClientDoc] = useState({
    type: "sow" as "sow" | "rfq" | "po",
    fileName: "",
    fileUrl: "",
  });
  const addDoc = trpc.ops.addDocument.useMutation({
    onSuccess: () => {
      utils.ops.getCommercialTimeline.invalidate({ projectId: projectId! });
      setClientDoc({ type: "sow", fileName: "", fileUrl: "" });
    },
  });

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

  const handleMilestoneComplete = (milestoneId: string) => {
    if (!projectId) return;
    toggleMilestoneMutation.mutate({
      projectId,
      milestoneId,
    });
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <main className="flex-1 overflow-y-auto p-6">
          {/* Header Skeleton */}
          <div className="flex items-center gap-4 mb-6">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>
              <Skeleton className="h-4 w-96" />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content Skeleton */}
            <div className="lg:col-span-2 space-y-6">
              <ProjectDetailSkeleton />

              {/* Tabs Skeleton */}
              <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4].map((i) => (
                      <Skeleton key={i} className="h-10 w-32" />
                    ))}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-24 w-full" />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar Skeleton */}
            <div className="space-y-6">
              <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i}>
                      <Skeleton className="h-4 w-24 mb-2" />
                      <Skeleton className="h-6 w-32" />
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </DashboardLayout>
    );
  }

  if (!project) {
    return (
      <DashboardLayout>
        <main className="flex-1 overflow-y-auto p-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <FileText className="h-16 w-16 text-gray-600 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Project not found</h3>
              <p className="text-gray-400 mb-6">The project you're looking for doesn't exist</p>
              <Link href="/client-portal/projects">
                <a>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Projects
                  </Button>
                </a>
              </Link>
            </CardContent>
          </Card>
        </main>
      </DashboardLayout>
    );
  }

  const projectActivities = activities?.filter(
    (activity) => activity.metadata && 'projectId' in activity.metadata && activity.metadata.projectId === projectId
  ) || [];

  return (
    <DashboardLayout>
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Link href="/client-portal/projects">
              <a>
                <Button variant="outline" size="icon" className="border-slate-700 text-gray-400 hover:bg-slate-800">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </a>
            </Link>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-white">{project.title}</h1>
                <Badge className={getStatusColor(project.status)}>
                  {project.status.replace('_', ' ')}
                </Badge>
              </div>
              <p className="text-gray-400">{project.description}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {liveBundle ? (
                <LiveTracker
                  runTitle={liveBundle.run.title}
                  runStatus={liveBundle.run.status}
                  percentComplete={liveBundle.percentComplete}
                  currentStepLabel={liveBundle.currentStep?.label}
                  steps={liveBundle.steps}
                  lastUpdatedAt={liveBundle.lastUpdatedAt}
                />
              ) : null}

              {commercial ? (
                <CommercialTimeline
                  currentStage={String(
                    (commercial.project as { commercialStage?: string }).commercialStage ||
                      "intake"
                  )}
                  commitDate={
                    (commercial.project as { commitDate?: Date | null }).commitDate
                  }
                  docs={commercial.docs}
                  events={commercial.events}
                />
              ) : null}

              <Card className="portal-panel border-0 shadow-none">
                <CardHeader>
                  <CardTitle className="text-white">Upload SOW / RFQ / PO</CardTitle>
                  <CardDescription className="text-gray-400">
                    Share your cahier des charges, RFQ, or approved PO via a document link.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  <select
                    className="rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white"
                    value={clientDoc.type}
                    onChange={(e) =>
                      setClientDoc((d) => ({
                        ...d,
                        type: e.target.value as typeof clientDoc.type,
                      }))
                    }
                  >
                    <option value="sow">SOW</option>
                    <option value="rfq">RFQ</option>
                    <option value="po">Approved PO</option>
                  </select>
                  <Input
                    placeholder="File name"
                    value={clientDoc.fileName}
                    onChange={(e) =>
                      setClientDoc((d) => ({ ...d, fileName: e.target.value }))
                    }
                    className="max-w-[180px] border-white/10 bg-slate-950 text-white"
                  />
                  <Input
                    placeholder="https://… link"
                    value={clientDoc.fileUrl}
                    onChange={(e) =>
                      setClientDoc((d) => ({ ...d, fileUrl: e.target.value }))
                    }
                    className="min-w-[220px] flex-1 border-white/10 bg-slate-950 text-white"
                  />
                  <Button
                    disabled={
                      !clientDoc.fileName ||
                      !clientDoc.fileUrl ||
                      addDoc.isPending ||
                      !projectId
                    }
                    onClick={() =>
                      addDoc.mutate({
                        projectId: projectId!,
                        type: clientDoc.type,
                        fileName: clientDoc.fileName,
                        fileUrl: clientDoc.fileUrl,
                      })
                    }
                    className="bg-[var(--hopstec-teal)] text-slate-950 hover:bg-[var(--hopstec-teal)]/90"
                  >
                    Upload
                  </Button>
                  {projectId ? <WipExportButton projectId={projectId} /> : null}
                </CardContent>
              </Card>

              {kpis?.committed ? (
                <Card className="portal-panel border-0 shadow-none">
                  <CardContent className="flex flex-wrap gap-6 py-5 text-sm text-gray-300">
                    <div>
                      <p className="text-xs uppercase tracking-[0.14em] text-gray-500">
                        Days since commit
                      </p>
                      <p className="mt-1 text-2xl font-semibold text-white">
                        {kpis.daysSinceCommit}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.14em] text-gray-500">
                        Commit date
                      </p>
                      <p className="mt-1 text-white">
                        {kpis.commitDate
                          ? new Date(kpis.commitDate).toLocaleDateString()
                          : "—"}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : null}

              {/* Progress Card */}
              <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white">Project Progress</CardTitle>
                  <CardDescription className="text-gray-400">
                    Overall completion status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-white">{project.progress}%</span>
                      <span className="text-sm text-gray-400">
                        {project.actualHours || 0} / {project.estimatedHours || 0} hours
                      </span>
                    </div>
                    <Progress value={project.progress} className="h-3" />
                  </div>
                </CardContent>
              </Card>

              {/* Project Controls */}
              <ProjectControlPanel
                projectId={project.id}
                currentStatus={project.status}
                onStatusChangeRequested={() => utils.clientPortal.getProject.invalidate({ projectId: project.id })}
              />

              {/* Tabs */}
              <Tabs defaultValue="insights" className="w-full">
                <TabsList className="bg-slate-900 border border-slate-800 flex-wrap">
                  <TabsTrigger value="insights" className="data-[state=active]:bg-blue-600">
                    <Zap className="h-4 w-4 mr-2" />
                    AI Insights
                  </TabsTrigger>
                  <TabsTrigger value="progress" className="data-[state=active]:bg-blue-600">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Progress
                  </TabsTrigger>
                  <TabsTrigger value="milestones" className="data-[state=active]:bg-blue-600">
                    Milestones
                  </TabsTrigger>
                  <TabsTrigger value="deliverables" className="data-[state=active]:bg-blue-600">
                    Deliverables
                  </TabsTrigger>
                  <TabsTrigger value="payments" className="data-[state=active]:bg-blue-600">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Payments
                  </TabsTrigger>
                  <TabsTrigger value="changes" className="data-[state=active]:bg-blue-600">
                    <FileText className="h-4 w-4 mr-2" />
                    Changes
                  </TabsTrigger>
                  <TabsTrigger value="activity" className="data-[state=active]:bg-blue-600">
                    Activity
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="insights" className="mt-6">
                  <ProjectInsights project={project} />
                </TabsContent>

                <TabsContent value="progress" className="mt-6">
                  <ProgressBreakdown projectId={project.id} />
                </TabsContent>

                <TabsContent value="milestones" className="mt-6">
                  {/* View Toggle */}
                  <div className="flex items-center justify-end gap-2 mb-4">
                    <Button
                      variant={milestoneView === 'timeline' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setMilestoneView('timeline')}
                      className={cn(
                        milestoneView === 'timeline'
                          ? 'bg-blue-600 hover:bg-blue-700'
                          : 'border-slate-700 text-gray-400 hover:bg-slate-800'
                      )}
                    >
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Timeline View
                    </Button>
                    <Button
                      variant={milestoneView === 'list' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setMilestoneView('list')}
                      className={cn(
                        milestoneView === 'list'
                          ? 'bg-blue-600 hover:bg-blue-700'
                          : 'border-slate-700 text-gray-400 hover:bg-slate-800'
                      )}
                    >
                      <List className="h-4 w-4 mr-2" />
                      List View
                    </Button>
                  </div>

                  {/* Timeline View */}
                  {milestoneView === 'timeline' && (
                    <ProjectTimeline
                      milestones={project.milestones || []}
                      projectStartDate={project.startDate}
                      projectEndDate={project.endDate}
                      onMilestoneComplete={handleMilestoneComplete}
                    />
                  )}

                  {/* List View */}
                  {milestoneView === 'list' && (
                    <Card className="bg-slate-900 border-slate-800">
                      <CardHeader>
                        <CardTitle className="text-white">Milestones</CardTitle>
                        <CardDescription className="text-gray-400">
                          Track project milestones and deadlines
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                      {project.milestones && project.milestones.length > 0 ? (
                        <div className="space-y-4">
                          {project.milestones.map((milestone) => (
                            <div
                              key={milestone.id}
                              className="flex items-start gap-4 p-4 rounded-lg bg-slate-800/50"
                            >
                              <div className="mt-1">
                                {milestone.completed ? (
                                  <CheckCircle2 className="h-5 w-5 text-green-400" />
                                ) : (
                                  <Circle className="h-5 w-5 text-gray-500" />
                                )}
                              </div>
                              <div className="flex-1">
                                <h4 className={cn(
                                  "font-medium mb-1",
                                  milestone.completed ? "text-gray-400 line-through" : "text-white"
                                )}>
                                  {milestone.title}
                                </h4>
                                <p className="text-sm text-gray-500 mb-2">{milestone.description}</p>
                                <div className="flex items-center gap-4 text-xs text-gray-400">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    Due: {new Date(milestone.dueDate).toLocaleDateString()}
                                  </span>
                                  {milestone.completed && milestone.completedAt && (
                                    <span className="text-green-400">
                                      Completed: {new Date(milestone.completedAt).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-400">
                          <Circle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p>No milestones defined yet</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  )}
                </TabsContent>

                <TabsContent value="deliverables" className="mt-6">
                  <Card className="bg-slate-900 border-slate-800">
                    <CardHeader>
                      <CardTitle className="text-white">Deliverables</CardTitle>
                      <CardDescription className="text-gray-400">
                        Project outputs and deliverables
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {project.deliverables && project.deliverables.length > 0 ? (
                        <div className="space-y-3">
                          {project.deliverables.map((deliverable) => (
                            <div
                              key={deliverable.id}
                              className="flex items-start gap-4 p-4 rounded-lg bg-slate-800/50"
                            >
                              <div className="mt-1">
                                {deliverable.completed ? (
                                  <CheckCircle2 className="h-5 w-5 text-green-400" />
                                ) : (
                                  <FileText className="h-5 w-5 text-gray-500" />
                                )}
                              </div>
                              <div className="flex-1">
                                <h4 className={cn(
                                  "font-medium mb-1",
                                  deliverable.completed ? "text-gray-400 line-through" : "text-white"
                                )}>
                                  {deliverable.title}
                                </h4>
                                <p className="text-sm text-gray-500">{deliverable.description}</p>
                                {deliverable.url && (
                                  <a
                                    href={deliverable.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-400 hover:text-blue-300 mt-2 inline-block"
                                  >
                                    View Deliverable →
                                  </a>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-400">
                          <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p>No deliverables defined yet</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="activity" className="mt-6">
                  <Card className="bg-slate-900 border-slate-800">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Activity className="h-5 w-5 text-blue-400" />
                        Project Activity
                      </CardTitle>
                      <CardDescription className="text-gray-400">
                        Recent updates and changes
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {projectActivities.length > 0 ? (
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                          {projectActivities.map((activity) => (
                            <div key={activity.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-800/50">
                              <div className="w-2 h-2 bg-blue-400 rounded-full mt-2" />
                              <div className="flex-1">
                                <p className="text-sm text-white">{activity.description}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {new Date(activity.createdAt).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-400">
                          <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p>No activity recorded yet</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="payments" className="mt-6">
                  <PaymentDashboard projectId={project.id} />
                </TabsContent>

                <TabsContent value="changes" className="mt-6">
                  <ChangeRequestForm projectId={project.id} />
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Project Info */}
              <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white">Project Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {project.budget && (
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-500/20 rounded-lg">
                        <DollarSign className="h-4 w-4 text-green-400" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Budget</p>
                        <p className="text-white font-medium">
                          ${(project.budget / 100).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}

                  {project.startDate && (
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500/20 rounded-lg">
                        <Calendar className="h-4 w-4 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Start Date</p>
                        <p className="text-white font-medium">
                          {new Date(project.startDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )}

                  {project.endDate && (
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-500/20 rounded-lg">
                        <Calendar className="h-4 w-4 text-purple-400" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">End Date</p>
                        <p className="text-white font-medium">
                          {new Date(project.endDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )}

                  {project.estimatedHours && (
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-500/20 rounded-lg">
                        <Clock className="h-4 w-4 text-orange-400" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Estimated Hours</p>
                        <p className="text-white font-medium">{project.estimatedHours}h</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Technologies */}
              {project.technologies && project.technologies.length > 0 && (
                <Card className="bg-slate-900 border-slate-800">
                  <CardHeader>
                    <CardTitle className="text-white">Technologies</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {project.technologies.map((tech, idx) => (
                        <Badge
                          key={idx}
                          className="bg-blue-500/20 text-blue-400 border-blue-500/30"
                        >
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
    </DashboardLayout>
  );
};

export default ClientProjectDetailPage;

