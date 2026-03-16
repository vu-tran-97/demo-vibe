import styles from './dashboard.module.css';

const STATS = [
  {
    label: 'Total Revenue',
    value: '$24,580',
    change: '+12.5%',
    positive: true,
  },
  {
    label: 'Active Users',
    value: '1,248',
    change: '+8.2%',
    positive: true,
  },
  {
    label: 'New Orders',
    value: '356',
    change: '+23.1%',
    positive: true,
  },
  {
    label: 'Conversations',
    value: '89',
    change: '-3.4%',
    positive: false,
  },
];

const RECENT_ORDERS = [
  {
    id: '#DV-1024',
    customer: 'Minji K.',
    product: 'Handcrafted Ceramic Vase',
    amount: '$128.00',
    status: 'Completed',
  },
  {
    id: '#DV-1023',
    customer: 'Seonwoo P.',
    product: 'Linen Table Runner',
    amount: '$64.00',
    status: 'Shipped',
  },
  {
    id: '#DV-1022',
    customer: 'Yuna L.',
    product: 'Artisan Coffee Set',
    amount: '$96.00',
    status: 'Processing',
  },
  {
    id: '#DV-1021',
    customer: 'Jihoon C.',
    product: 'Botanical Print',
    amount: '$42.00',
    status: 'Completed',
  },
  {
    id: '#DV-1020',
    customer: 'Hana S.',
    product: 'Silk Scarf',
    amount: '$78.00',
    status: 'Shipped',
  },
];

const RECENT_CHATS = [
  {
    name: 'Minji K.',
    message: 'Thank you! The vase is beautiful.',
    time: '2m ago',
    unread: true,
  },
  {
    name: 'Seonwoo P.',
    message: 'When will my order ship?',
    time: '15m ago',
    unread: true,
  },
  {
    name: 'Yuna L.',
    message: 'Do you have this in a larger size?',
    time: '1h ago',
    unread: false,
  },
  {
    name: 'Jihoon C.',
    message: 'Great quality, will order again!',
    time: '3h ago',
    unread: false,
  },
];

const TOP_PRODUCTS = [
  { name: 'Ceramic Vase', sold: 142, revenue: '$18,176' },
  { name: 'Linen Runner', sold: 98, revenue: '$6,272' },
  { name: 'Coffee Set', sold: 87, revenue: '$8,352' },
  { name: 'Botanical Print', sold: 76, revenue: '$3,192' },
];

function getStatusClass(status: string) {
  switch (status) {
    case 'Completed':
      return styles.statusCompleted;
    case 'Shipped':
      return styles.statusShipped;
    case 'Processing':
      return styles.statusProcessing;
    default:
      return '';
  }
}

export default function DashboardPage() {
  return (
    <div className={styles.dashboard}>
      {/* ── Stats ── */}
      <div className={styles.statsGrid}>
        {STATS.map((stat, i) => (
          <div
            key={stat.label}
            className={`${styles.statCard} animate-fade-up delay-${i + 1}`}
          >
            <p className={styles.statLabel}>{stat.label}</p>
            <p className={styles.statValue}>{stat.value}</p>
            <span
              className={`${styles.statChange} ${stat.positive ? styles.positive : styles.negative}`}
            >
              {stat.change}
            </span>
          </div>
        ))}
      </div>

      {/* ── Main Grid ── */}
      <div className={styles.mainGrid}>
        {/* Recent Orders */}
        <div className={`${styles.card} animate-fade-up delay-5`}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Recent Orders</h2>
            <button type="button" className={styles.cardAction}>
              View All
            </button>
          </div>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Product</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {RECENT_ORDERS.map((order) => (
                  <tr key={order.id}>
                    <td className={styles.orderId}>{order.id}</td>
                    <td>{order.customer}</td>
                    <td className={styles.productName}>{order.product}</td>
                    <td className={styles.amount}>{order.amount}</td>
                    <td>
                      <span
                        className={`${styles.statusBadge} ${getStatusClass(order.status)}`}
                      >
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column */}
        <div className={styles.rightCol}>
          {/* Recent Chats */}
          <div className={`${styles.card} animate-fade-up delay-6`}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Recent Chats</h2>
              <button type="button" className={styles.cardAction}>
                Open
              </button>
            </div>
            <div className={styles.chatList}>
              {RECENT_CHATS.map((chat) => (
                <div key={chat.name} className={styles.chatItem}>
                  <div className={styles.chatAvatarSmall}>
                    {chat.name.charAt(0)}
                  </div>
                  <div className={styles.chatContent}>
                    <div className={styles.chatTop}>
                      <span className={styles.chatSender}>{chat.name}</span>
                      <span className={styles.chatTime}>{chat.time}</span>
                    </div>
                    <p
                      className={`${styles.chatPreview} ${chat.unread ? styles.chatUnread : ''}`}
                    >
                      {chat.message}
                    </p>
                  </div>
                  {chat.unread && <span className={styles.unreadDot} />}
                </div>
              ))}
            </div>
          </div>

          {/* Top Products */}
          <div className={`${styles.card} animate-fade-up delay-7`}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Top Products</h2>
            </div>
            <div className={styles.productList}>
              {TOP_PRODUCTS.map((product, i) => (
                <div key={product.name} className={styles.productItem}>
                  <span className={styles.productRank}>{i + 1}</span>
                  <div className={styles.productInfo}>
                    <span className={styles.productName}>{product.name}</span>
                    <span className={styles.productSold}>
                      {product.sold} sold
                    </span>
                  </div>
                  <span className={styles.productRevenue}>
                    {product.revenue}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
