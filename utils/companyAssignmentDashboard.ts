import type { CompanyAssignmentListItem } from '@/lib/api/models/company';
import type {
  CompanyDashboardOverview,
  CompanyRecentActivityItem,
  CompanyTaskStatusItem,
  CompanyTeamPerformanceItem,
  CompanyUpcomingDeadlineItem,
} from '@/lib/api/services/fetchCompanyDashboard';

const ACTIVE_STATUSES = new Set(['Assigned', 'InProgress']);

function hoursUntil(iso: string): number {
  const due = new Date(iso);
  if (Number.isNaN(due.getTime())) return 0;
  return (due.getTime() - Date.now()) / (60 * 60 * 1000);
}

/** Aggregate assignmentStatus → task-status donut slices. */
export function assignmentsToTaskStatusItems(
  items: CompanyAssignmentListItem[]
): CompanyTaskStatusItem[] {
  const counts = new Map<string, number>();
  for (const row of items) {
    const key = row.assignmentStatus || 'Unknown';
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const total = items.length;
  return [...counts.entries()]
    .map(([status, count]) => ({
      status,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count);
}

/** Map SLA deadlines from assignment rows — active tasks first, soonest due first. */
export function assignmentsToUpcomingDeadlines(
  items: CompanyAssignmentListItem[]
): CompanyUpcomingDeadlineItem[] {
  return items
    .filter(row => ACTIVE_STATUSES.has(row.assignmentStatus) && row.report.slaResolveDueAt?.trim())
    .map(row => ({
      taskId: row.assignmentId,
      reportId: row.report.reportId,
      reportCode: row.report.code,
      location: row.report.address,
      deadline: row.report.slaResolveDueAt,
      remainingHours: hoursUntil(row.report.slaResolveDueAt),
      priority: row.report.severity,
      status: row.assignmentStatus,
    }))
    .sort((a, b) => {
      const ah = a.remainingHours ?? 0;
      const bh = b.remainingHours ?? 0;
      return ah - bh;
    });
}

/** Per-team rollup from assignment list. */
export function assignmentsToTeamPerformance(
  items: CompanyAssignmentListItem[]
): CompanyTeamPerformanceItem[] {
  const byTeam = new Map<
    string,
    {
      teamId: string;
      teamName: string;
      assignedTasks: number;
      completedTasks: number;
      onTimeCount: number;
      completedWithHours: number;
      totalHours: number;
    }
  >();

  for (const row of items) {
    const existing = byTeam.get(row.team.teamId) ?? {
      teamId: row.team.teamId,
      teamName: row.team.teamName,
      assignedTasks: 0,
      completedTasks: 0,
      onTimeCount: 0,
      completedWithHours: 0,
      totalHours: 0,
    };
    existing.assignedTasks += 1;
    if (row.assignmentStatus === 'Completed') {
      existing.completedTasks += 1;
      const due = row.report.slaResolveDueAt;
      const completedAt = row.completedAt ?? row.progressUpdatedAt;
      if (due && completedAt) {
        const onTime = new Date(completedAt).getTime() <= new Date(due).getTime();
        if (onTime) existing.onTimeCount += 1;
        const assigned = new Date(row.assignedAt).getTime();
        const done = new Date(completedAt).getTime();
        if (Number.isFinite(assigned) && Number.isFinite(done) && done >= assigned) {
          existing.totalHours += (done - assigned) / (60 * 60 * 1000);
          existing.completedWithHours += 1;
        }
      }
    }
    byTeam.set(row.team.teamId, existing);
  }

  return [...byTeam.values()].map(team => ({
    teamId: team.teamId,
    teamName: team.teamName,
    assignedTasks: team.assignedTasks,
    completedTasks: team.completedTasks,
    onTimeRate: team.completedTasks > 0 ? (team.onTimeCount / team.completedTasks) * 100 : 0,
    averageHours: team.completedWithHours > 0 ? team.totalHours / team.completedWithHours : 0,
  }));
}

/** Recent assignment events for activity feed fallback. */
export function assignmentsToRecentActivities(
  items: CompanyAssignmentListItem[]
): CompanyRecentActivityItem[] {
  const events: CompanyRecentActivityItem[] = [];

  for (const row of items) {
    events.push({
      time: row.assignedAt,
      type: 'assignment',
      description: `${row.team.teamName} được phân công báo cáo ${row.report.code} bởi ${row.assignedByName}`,
    });
    if (row.startedAt) {
      events.push({
        time: row.startedAt,
        type: 'progress',
        description: `${row.team.teamName} bắt đầu xử lý ${row.report.code}`,
      });
    }
    if (row.progressUpdatedAt && row.progressPercent > 0) {
      events.push({
        time: row.progressUpdatedAt,
        type: 'progress',
        description: `${row.team.teamName} cập nhật tiến độ ${row.report.code}: ${row.progressPercent}%`,
      });
    }
    if (row.completedAt) {
      events.push({
        time: row.completedAt,
        type: 'completed',
        description: `${row.team.teamName} hoàn thành ${row.report.code}`,
      });
    }
    if (row.assignmentStatus === 'Declined') {
      events.push({
        time: row.progressUpdatedAt ?? row.assignedAt,
        type: 'declined',
        description: `${row.team.teamName} từ chối ${row.report.code}`,
      });
    }
  }

  return events.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 8);
}

/** Fill overview KPI strip when dashboard overview returns zeros but assignments exist. */
export function supplementOverviewFromAssignments(
  overview: CompanyDashboardOverview,
  items: CompanyAssignmentListItem[],
  totalItems: number
): CompanyDashboardOverview {
  const hasAssignmentData = totalItems > 0 || items.length > 0;
  if (!hasAssignmentData) return overview;

  const assigned = items.filter(i => i.assignmentStatus !== 'Declined').length;
  const completed = items.filter(i => i.assignmentStatus === 'Completed').length;
  const pending = items.filter(i => i.assignmentStatus === 'Assigned').length;
  const total = totalItems > 0 ? totalItems : items.length;

  const overviewEmpty =
    overview.assignedTasks === 0 && overview.completedTasks === 0 && overview.pendingTasks === 0;

  if (!overviewEmpty) return overview;

  return {
    ...overview,
    assignedTasks: total,
    completedTasks: completed,
    pendingTasks: pending > 0 ? pending : Math.max(0, assigned - completed),
  };
}
