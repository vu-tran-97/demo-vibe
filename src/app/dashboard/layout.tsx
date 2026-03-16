import Link from 'next/link';
import styles from './dashboard.module.css';

const NAV_ITEMS = [
  { label: 'Overview', href: '/dashboard', icon: '◎' },
  { label: 'Board', href: '/dashboard/board', icon: '☰' },
  { label: 'Chat', href: '/dashboard/chat', icon: '◉' },
  { label: 'Products', href: '/dashboard/products', icon: '◇' },
  { label: 'Orders', href: '/dashboard/orders', icon: '□' },
];

const NAV_BOTTOM = [
  { label: 'Settings', href: '/dashboard/settings', icon: '⚙' },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={styles.layout}>
      {/* ── Sidebar ── */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarTop}>
          <Link href="/" className={styles.logo}>
            Vibe
          </Link>
        </div>

        <nav className={styles.nav}>
          <ul className={styles.navList}>
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={styles.navItem}>
                  <span className={styles.navIcon}>{item.icon}</span>
                  <span className={styles.navLabel}>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className={styles.sidebarBottom}>
          {NAV_BOTTOM.map((item) => (
            <Link key={item.href} href={item.href} className={styles.navItem}>
              <span className={styles.navIcon}>{item.icon}</span>
              <span className={styles.navLabel}>{item.label}</span>
            </Link>
          ))}

          <div className={styles.userCard}>
            <div className={styles.userAvatar}>V</div>
            <div className={styles.userInfo}>
              <p className={styles.userName}>Vu Tran</p>
              <p className={styles.userRole}>Admin</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className={styles.main}>
        {/* Top Bar */}
        <header className={styles.topBar}>
          <div className={styles.topBarLeft}>
            <h1 className={styles.pageTitle}>Overview</h1>
          </div>
          <div className={styles.topBarRight}>
            <div className={styles.searchBox}>
              <span className={styles.searchIcon}>⌕</span>
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Search anything..."
              />
              <kbd className={styles.searchKbd}>⌘K</kbd>
            </div>
            <button type="button" className={styles.notifBtn}>
              <span className={styles.notifDot} />
              ◎
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className={styles.content}>{children}</div>
      </main>
    </div>
  );
}
