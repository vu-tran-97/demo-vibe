'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchDashboard, type DashboardData } from '@/lib/admin';

function formatTimestamp(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function StatCard({
  label,
  value,
  colorClass,
}: {
  label: string;
  value: string;
  colorClass?: string;
}) {
  return (
    <div className="bg-white border border-border-light rounded-[12px] p-[2rem] transition-all duration-[400ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:border-border">
      <p className="text-[0.8125rem] text-muted mb-[0.5rem] tracking-[0.02em]">{label}</p>
      <p className={`font-[family-name:var(--font-display)] text-[2rem] font-normal text-charcoal tracking-[-0.02em] ${colorClass || ''}`}>{value}</p>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const result = await fetchDashboard();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col gap-[2rem]">
        <div className="flex items-start justify-between gap-[1.5rem]">
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-[1.5rem] font-normal text-charcoal tracking-[-0.02em]">Admin Dashboard</h1>
            <p className="text-[0.8125rem] text-muted mt-[0.25rem] tracking-[0.02em]">Overview of platform analytics</p>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-[1.5rem] max-lg:grid-cols-2 max-sm:grid-cols-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white border border-border-light rounded-[12px] p-[2rem] transition-all duration-[400ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:border-border">
              <div className="h-[14px] bg-ivory-warm rounded-[4px] animate-pulse" style={{ width: '60%' }} />
              <div className="h-[28px] bg-ivory-warm rounded-[4px] animate-pulse" style={{ width: '40%', marginTop: '12px' }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-[2rem]">
        <div className="flex items-start justify-between gap-[1.5rem]">
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-[1.5rem] font-normal text-charcoal tracking-[-0.02em]">Admin Dashboard</h1>
          </div>
        </div>
        <div className="py-[1rem] px-[1.5rem] mx-[2rem] bg-[rgba(196,91,91,0.06)] border border-[rgba(196,91,91,0.2)] rounded-[8px] text-error text-[0.8125rem] leading-[1.6]">{error}</div>
      </div>
    );
  }

  if (!data) return null;

  const roleEntries = Object.entries(data.roleDistribution);
  const totalRoleCount = roleEntries.reduce((sum, [, count]) => sum + count, 0);
  const roleDistArray = roleEntries.map(([role, count]) => ({
    role,
    count,
    percentage: totalRoleCount > 0 ? Math.round((count / totalRoleCount) * 100) : 0,
  }));
  const maxRoleCount = Math.max(...roleDistArray.map((r) => r.count), 1);

  const roleBarColors: Record<string, string> = {
    BUYER: 'bg-success',
    SELLER: 'bg-gold',
    SUPER_ADMIN: 'bg-charcoal',
  };

  return (
    <div className="flex flex-col gap-[2rem]">
      <div className="flex items-start justify-between gap-[1.5rem] max-sm:flex-col max-sm:gap-[1rem]">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-[1.5rem] font-normal text-charcoal tracking-[-0.02em]">Admin Dashboard</h1>
          <p className="text-[0.8125rem] text-muted mt-[0.25rem] tracking-[0.02em]">Overview of platform analytics</p>
        </div>
        <Link href="/dashboard/admin/users" className="font-[family-name:var(--font-body)] text-[0.8125rem] font-medium text-gold-dark no-underline transition-colors duration-[200ms] hover:text-gold">
          Manage Users &rarr;
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-[1.5rem] max-lg:grid-cols-2 max-sm:grid-cols-1">
        <StatCard
          label="Total Users"
          value={data.totalUsers.toLocaleString()}
        />
        <StatCard
          label="New This Week"
          value={data.newUsersThisWeek.toLocaleString()}
          colorClass="!text-gold-dark"
        />
        <StatCard
          label="Buyers"
          value={((data.roleDistribution as Record<string, number>)?.BUYER || 0).toLocaleString()}
          colorClass="!text-success"
        />
        <StatCard
          label="Sellers"
          value={((data.roleDistribution as Record<string, number>)?.SELLER || 0).toLocaleString()}
          colorClass="!text-gold-dark"
        />
      </div>

      {/* Role Distribution */}
      <div className="bg-white border border-border-light rounded-[12px] overflow-hidden">
        <div className="py-[1.5rem] px-[2rem] border-b border-border-light">
          <h2 className="font-[family-name:var(--font-display)] text-[1.125rem] font-medium text-charcoal">Role Distribution</h2>
        </div>
        <div className="py-[1.5rem] px-[2rem] flex flex-col gap-[1rem]">
          {roleDistArray.map((item) => (
            <div key={item.role} className="flex items-center gap-[1rem]">
              <span className="w-[100px] text-[0.8125rem] font-medium text-charcoal shrink-0 max-sm:w-[70px] max-sm:text-[0.75rem]">{item.role}</span>
              <div className="flex-1 h-[8px] bg-ivory-warm rounded-[4px] overflow-hidden">
                <div
                  className={`h-full bg-charcoal rounded-[4px] transition-[width] duration-500 ease-[var(--ease-out)] min-w-[4px] ${roleBarColors[item.role] || ''}`}
                  style={{ width: `${(item.count / maxRoleCount) * 100}%` }}
                />
              </div>
              <span className="w-[80px] text-[0.75rem] text-muted text-right shrink-0 max-sm:w-[60px]">
                {item.count} ({item.percentage}%)
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white border border-border-light rounded-[12px] overflow-hidden">
        <div className="py-[1.5rem] px-[2rem] border-b border-border-light">
          <h2 className="font-[family-name:var(--font-display)] text-[1.125rem] font-medium text-charcoal">Recent Activity</h2>
        </div>
        {data.recentActivity.length === 0 ? (
          <div className="flex flex-col items-center gap-[0.5rem] py-[3rem] px-[1.5rem]">
            <div className="text-[2.5rem] text-muted opacity-40">&#x2014;</div>
            <p className="font-[family-name:var(--font-display)] text-[1.125rem] font-normal text-slate">No recent activity</p>
            <p className="text-[0.8125rem] text-muted">Activity will appear here as users interact with the platform</p>
          </div>
        ) : (
          <div className="py-[0.5rem]">
            {data.recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center gap-[1rem] py-[1rem] px-[2rem] transition-colors duration-[200ms] hover:bg-ivory max-sm:flex-wrap max-sm:gap-[0.5rem]">
                <div className="w-[36px] h-[36px] rounded-full bg-ivory-warm flex items-center justify-center font-[family-name:var(--font-display)] text-[0.875rem] font-medium text-gold shrink-0">
                  {(activity.userName || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[0.8125rem] font-medium text-charcoal">
                    {activity.userName}
                    {' '}
                    <span className={
                      activity.actionType === 'ROLE_CHANGE'
                        ? 'inline-block py-[2px] px-[8px] text-[0.75rem] font-medium rounded-[4px] whitespace-nowrap bg-[rgba(200,169,110,0.12)] text-gold-dark'
                        : activity.actionType === 'STATUS_CHANGE' || activity.actionType === 'SUSPEND'
                          ? 'inline-block py-[2px] px-[8px] text-[0.75rem] font-medium rounded-[4px] whitespace-nowrap bg-[rgba(196,91,91,0.08)] text-error'
                          : activity.actionType === 'CREATE' || activity.actionType === 'REGISTER'
                            ? 'inline-block py-[2px] px-[8px] text-[0.75rem] font-medium rounded-[4px] whitespace-nowrap bg-[rgba(90,138,106,0.08)] text-success'
                            : 'inline-block py-[2px] px-[8px] text-[0.75rem] font-medium rounded-[4px] whitespace-nowrap bg-ivory-warm text-slate'
                    }>
                      {(activity.actionType || 'UNKNOWN').replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-[0.8125rem] text-muted whitespace-nowrap overflow-hidden text-ellipsis">{activity.description}</p>
                </div>
                <span className="text-[0.6875rem] text-muted whitespace-nowrap shrink-0">
                  {formatTimestamp(activity.createdAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
