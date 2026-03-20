'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchDashboard, type DashboardData } from '@/lib/admin';
import styles from '@/components/admin/admin.module.css';

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
    <div className={styles.statCard}>
      <p className={styles.statLabel}>{label}</p>
      <p className={`${styles.statValue} ${colorClass || ''}`}>{value}</p>
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
      <div className={styles.adminPage}>
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>Admin Dashboard</h1>
            <p className={styles.pageSubtitle}>Overview of platform analytics</p>
          </div>
        </div>
        <div className={styles.statsGrid}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={styles.statCard}>
              <div className={styles.skeleton} style={{ width: '60%', height: '14px' }} />
              <div className={styles.skeleton} style={{ width: '40%', height: '28px', marginTop: '12px' }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.adminPage}>
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>Admin Dashboard</h1>
          </div>
        </div>
        <div className={styles.errorMessage}>{error}</div>
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
    BUYER: styles.roleBarFillGreen,
    SELLER: styles.roleBarFillBlue,
    SUPER_ADMIN: styles.roleBarFillPurple,
  };

  return (
    <div className={styles.adminPage}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Admin Dashboard</h1>
          <p className={styles.pageSubtitle}>Overview of platform analytics</p>
        </div>
        <Link href="/dashboard/admin/users" className={styles.goldLink}>
          Manage Users &rarr;
        </Link>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <StatCard
          label="Total Users"
          value={data.totalUsers.toLocaleString()}
        />
        <StatCard
          label="New This Week"
          value={data.newUsersThisWeek.toLocaleString()}
          colorClass={styles.statValueGold}
        />
        <StatCard
          label="Buyers"
          value={((data.roleDistribution as Record<string, number>)?.BUYER || 0).toLocaleString()}
          colorClass={styles.statValueGreen}
        />
        <StatCard
          label="Sellers"
          value={((data.roleDistribution as Record<string, number>)?.SELLER || 0).toLocaleString()}
          colorClass={styles.statValueGold}
        />
      </div>

      {/* Role Distribution */}
      <div className={styles.tableCard}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Role Distribution</h2>
        </div>
        <div className={styles.roleDistribution}>
          {roleDistArray.map((item) => (
            <div key={item.role} className={styles.roleBarRow}>
              <span className={styles.roleBarLabel}>{item.role}</span>
              <div className={styles.roleBarTrack}>
                <div
                  className={`${styles.roleBarFill} ${roleBarColors[item.role] || ''}`}
                  style={{ width: `${(item.count / maxRoleCount) * 100}%` }}
                />
              </div>
              <span className={styles.roleBarCount}>
                {item.count} ({item.percentage}%)
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className={styles.tableCard}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Recent Activity</h2>
        </div>
        {data.recentActivity.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>&#x2014;</div>
            <p className={styles.emptyTitle}>No recent activity</p>
            <p className={styles.emptySubtitle}>Activity will appear here as users interact with the platform</p>
          </div>
        ) : (
          <div className={styles.activityList}>
            {data.recentActivity.map((activity) => (
              <div key={activity.id} className={styles.activityItem}>
                <div className={styles.activityAvatar}>
                  {(activity.userName || 'U').charAt(0).toUpperCase()}
                </div>
                <div className={styles.activityContent}>
                  <div className={styles.activityName}>
                    {activity.userName}
                    {' '}
                    <span className={
                      activity.actionType === 'ROLE_CHANGE'
                        ? `${styles.activityBadge} ${styles.activityBadgeWarning}`
                        : activity.actionType === 'STATUS_CHANGE' || activity.actionType === 'SUSPEND'
                          ? `${styles.activityBadge} ${styles.activityBadgeDanger}`
                          : activity.actionType === 'CREATE' || activity.actionType === 'REGISTER'
                            ? `${styles.activityBadge} ${styles.activityBadgeSuccess}`
                            : styles.activityBadge
                    }>
                      {(activity.actionType || 'UNKNOWN').replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className={styles.activityDesc}>{activity.description}</p>
                </div>
                <span className={styles.activityTime}>
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
