import Link from 'next/link';
import styles from './page.module.css';

const FEATURES = [
  {
    number: '01',
    title: 'Curated Marketplace',
    description:
      'Discover handpicked products from independent creators and artisans, each vetted for quality and originality.',
  },
  {
    number: '02',
    title: 'Live Conversations',
    description:
      'Connect directly with sellers through real-time chat. Ask questions, negotiate, and build relationships.',
  },
  {
    number: '03',
    title: 'Community Reviews',
    description:
      'Honest reviews from real buyers. Share experiences, post photos, and help others make informed decisions.',
  },
];

const TESTIMONIALS = [
  {
    quote:
      'The direct connection with sellers changed how I shop online. It feels personal again.',
    author: 'Minji K.',
    role: 'Early Adopter',
  },
  {
    quote:
      'Finally, a platform that treats commerce as a conversation, not just a transaction.',
    author: 'Seonwoo P.',
    role: 'Seller Partner',
  },
  {
    quote:
      'Clean, intuitive, and genuinely delightful to use. This is what online shopping should feel like.',
    author: 'Yuna L.',
    role: 'Community Member',
  },
];

export default function LandingPage() {
  return (
    <div className={styles.page}>
      {/* ── Navigation ── */}
      <nav className={styles.nav}>
        <div className={styles.navInner}>
          <Link href="/" className={styles.logo}>
            Vibe
          </Link>
          <div className={styles.navLinks}>
            <a href="#features" className={styles.navLink}>
              Features
            </a>
            <a href="#testimonials" className={styles.navLink}>
              Stories
            </a>
            <Link href="/auth/login" className={styles.navLink}>
              Sign In
            </Link>
            <Link href="/auth/signup" className={styles.navCta}>
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <p className={`${styles.heroLabel} animate-fade-up`}>
            A new way to shop
          </p>
          <h1 className={`${styles.heroTitle} animate-fade-up delay-1`}>
            Where Commerce
            <br />
            Meets <em>Conversation</em>
          </h1>
          <p className={`${styles.heroSubtitle} animate-fade-up delay-2`}>
            An intimate marketplace where every purchase begins with a genuine
            connection. Discover, converse, and shop — all in one beautifully
            crafted space.
          </p>
          <div className={`${styles.heroCtas} animate-fade-up delay-3`}>
            <Link href="/auth/signup" className={styles.btnPrimary}>
              Start Exploring
            </Link>
            <a href="#features" className={styles.btnSecondary}>
              Learn More
            </a>
          </div>
        </div>

        <div className={`${styles.heroVisual} animate-fade-up delay-4`}>
          <div className={styles.heroCard}>
            <div className={styles.heroCardImage} />
            <div className={styles.heroCardContent}>
              <span className={styles.heroCardTag}>Featured</span>
              <h3 className={styles.heroCardTitle}>Handcrafted Ceramics</h3>
              <p className={styles.heroCardPrice}>from $48</p>
            </div>
          </div>
          <div className={styles.heroChatBubble}>
            <div className={styles.chatAvatar} />
            <div>
              <p className={styles.chatName}>Seller</p>
              <p className={styles.chatMsg}>
                Happy to customize the glaze color for you!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Divider ── */}
      <div className={styles.divider}>
        <div className={styles.dividerLine} />
        <span className={styles.dividerText}>Thoughtfully designed</span>
        <div className={styles.dividerLine} />
      </div>

      {/* ── Features ── */}
      <section id="features" className={styles.features}>
        <div className={styles.sectionHeader}>
          <p className={`${styles.sectionLabel} animate-fade-up`}>Features</p>
          <h2 className={`${styles.sectionTitle} animate-fade-up delay-1`}>
            Everything you need,
            <br />
            nothing you don&apos;t
          </h2>
        </div>

        <div className={styles.featureGrid}>
          {FEATURES.map((feature, i) => (
            <div
              key={feature.number}
              className={`${styles.featureCard} animate-fade-up delay-${i + 2}`}
            >
              <span className={styles.featureNumber}>{feature.number}</span>
              <h3 className={styles.featureTitle}>{feature.title}</h3>
              <p className={styles.featureDesc}>{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Stats ── */}
      <section className={styles.stats}>
        <div className={styles.statsGrid}>
          {[
            { value: '12K+', label: 'Active Users' },
            { value: '3.2K', label: 'Products Listed' },
            { value: '98%', label: 'Satisfaction Rate' },
            { value: '< 2min', label: 'Avg. Response Time' },
          ].map((stat, i) => (
            <div
              key={stat.label}
              className={`${styles.statItem} animate-fade-up delay-${i + 1}`}
            >
              <span className={styles.statValue}>{stat.value}</span>
              <span className={styles.statLabel}>{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section id="testimonials" className={styles.testimonials}>
        <div className={styles.sectionHeader}>
          <p className={`${styles.sectionLabel} animate-fade-up`}>
            Testimonials
          </p>
          <h2 className={`${styles.sectionTitle} animate-fade-up delay-1`}>
            What people are saying
          </h2>
        </div>

        <div className={styles.testimonialGrid}>
          {TESTIMONIALS.map((t, i) => (
            <blockquote
              key={t.author}
              className={`${styles.testimonialCard} animate-fade-up delay-${i + 2}`}
            >
              <p className={styles.testimonialQuote}>&ldquo;{t.quote}&rdquo;</p>
              <footer className={styles.testimonialFooter}>
                <div className={styles.testimonialAvatar}>
                  {t.author.charAt(0)}
                </div>
                <div>
                  <cite className={styles.testimonialAuthor}>{t.author}</cite>
                  <p className={styles.testimonialRole}>{t.role}</p>
                </div>
              </footer>
            </blockquote>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className={styles.cta}>
        <div className={`${styles.ctaInner} animate-fade-up`}>
          <h2 className={styles.ctaTitle}>
            Ready to experience
            <br />
            shopping, <em>reimagined</em>?
          </h2>
          <p className={styles.ctaSubtitle}>
            Join thousands of buyers and sellers who have already discovered a
            better way to connect.
          </p>
          <Link href="/auth/signup" className={styles.btnPrimary}>
            Create Free Account
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <span className={styles.footerLogo}>
              Vibe
            </span>
            <p className={styles.footerTagline}>
              Where commerce meets conversation.
            </p>
          </div>
          <div className={styles.footerLinks}>
            <div className={styles.footerCol}>
              <h4 className={styles.footerColTitle}>Product</h4>
              <a href="#features">Features</a>
              <a href="#">Pricing</a>
              <a href="#">Sellers</a>
            </div>
            <div className={styles.footerCol}>
              <h4 className={styles.footerColTitle}>Company</h4>
              <a href="#">About</a>
              <a href="#">Blog</a>
              <a href="#">Careers</a>
            </div>
            <div className={styles.footerCol}>
              <h4 className={styles.footerColTitle}>Support</h4>
              <a href="#">Help Center</a>
              <a href="#">Contact</a>
              <a href="#">Privacy</a>
            </div>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <p>&copy; 2026 Vibe. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
