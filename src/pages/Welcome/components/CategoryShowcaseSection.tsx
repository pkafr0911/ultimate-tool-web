import React, { useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Link } from 'umi';
import { Button, Input } from 'antd';
import { ArrowRightOutlined, SearchOutlined } from '@ant-design/icons';
import { categories } from '../constants';
import { pages } from '@/constants';
import styles from '../neural.less';
import { discoverTools } from '../discovery';

export default function CategoryShowcaseSection() {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState('all');
  const reducedMotion = useReducedMotion();
  const groups = useMemo(
    () => discoverTools(pages, categories, query, selected),
    [query, selected],
  );
  const count = groups.reduce((sum, group) => sum + group.items.length, 0);
  return (
    <section id="category-showcase" className={styles.discovery} aria-labelledby="directory-title">
      <div className={styles.discoveryHeading}>
        <div>
          <span className={styles.eyebrow}>01 / EXPLORE THE TOOLKIT</span>
          <h2 id="directory-title">Find your next solution.</h2>
        </div>
        <p>All your favorite tools, in one place.</p>
      </div>
      <div className={styles.discoveryControls}>
        <Input
          size="large"
          prefix={<SearchOutlined />}
          allowClear
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search tools, descriptions, categories…"
          aria-label="Search tools"
        />
        <span role="status" aria-live="polite">
          {count} {count === 1 ? 'tool' : 'tools'}
        </span>
      </div>
      <nav className={styles.categoryNav} aria-label="Filter tools by category">
        <button type="button" aria-pressed={selected === 'all'} onClick={() => setSelected('all')}>
          All tools <span>{pages.length}</span>
        </button>
        {categories.map((category) => (
          <button
            type="button"
            key={category.pathPrefix}
            aria-pressed={selected === category.pathPrefix}
            onClick={() => setSelected(category.pathPrefix)}
          >
            {category.title}
            <span>{pages.filter((page) => page.path.startsWith(category.pathPrefix)).length}</span>
          </button>
        ))}
      </nav>
      <div className={styles.categoryGroups}>
        {groups.map((category) => (
          <section
            key={category.pathPrefix}
            className={styles.categoryGroup}
            style={{ '--category-accent': category.accent } as React.CSSProperties}
            aria-label={category.title}
          >
            <div className={styles.categoryIntro}>
              <span className={styles.categoryTagline}>{category.tagline}</span>
              <h3>
                {category.title}
                <span>{String(category.items.length).padStart(2, '0')}</span>
              </h3>
              <p>{category.desc}</p>
              {category.features && (
                <ul>
                  {category.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
              )}
              {category.title === 'Playground' && (
                <ul>
                  <li>Write and execute code instantly in multiple languages</li>
                  <li>Real-time preview and output display</li>
                  <li>No setup required — start coding immediately</li>
                </ul>
              )}
              <Link
                to={pages.find((page) => page.path.startsWith(category.pathPrefix))?.path || '/'}
              >
                {category.title === 'Playground' ? 'Try Playground' : `Explore ${category.title}`}{' '}
                <ArrowRightOutlined />
              </Link>
              {category.testimonial && (
                <details>
                  <summary>Community perspective</summary>
                  <blockquote>
                    “{category.testimonial.quote}”
                    <footer>
                      {category.testimonial.author} · {category.testimonial.role}
                    </footer>
                  </blockquote>
                </details>
              )}
            </div>
            <div className={styles.toolGrid}>
              {category.items.map((item) => (
                <motion.div
                  key={`${item.path}:${item.name}`}
                  whileHover={reducedMotion ? undefined : { y: -4 }}
                  transition={{ duration: 0.2 }}
                  className={styles.toolCard}
                >
                  <Link to={item.path}>
                    <div className={styles.toolCardTop}>
                      <span className={styles.toolIcon}>{item.icon}</span>
                      <ArrowRightOutlined className={styles.toolArrow} />
                    </div>
                    <h4>{item.name}</h4>
                    <p>{item.desc}</p>
                    <span className={styles.openTool}>
                      Open tool <span>↗</span>
                    </span>
                  </Link>
                </motion.div>
              ))}
            </div>
          </section>
        ))}
      </div>
      {!count && (
        <div className={styles.emptyState}>
          <h3>No tools match “{query}”</h3>
          <p>Try another name or browse all categories.</p>
          <Button
            onClick={() => {
              setQuery('');
              setSelected('all');
            }}
          >
            Clear filters
          </Button>
        </div>
      )}
    </section>
  );
}
