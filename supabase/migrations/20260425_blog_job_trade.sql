-- PR X15: add job_trade tag to blog_posts so readers can filter by role.
-- job_trade is nullable (null = general / applies to any role).

alter table blog_posts
  add column if not exists job_trade text
    check (job_trade is null or job_trade in (
      'software-engineer',
      'data-science',
      'product-management',
      'design',
      'devops-sre',
      'sales',
      'marketing',
      'customer-success',
      'engineering-management',
      'cybersecurity',
      'healthcare-tech',
      'fintech',
      'hiring-manager'
    ));

create index if not exists blog_posts_job_trade_idx
  on blog_posts(job_trade) where job_trade is not null;

-- Populate job_trade on existing posts based on slug mapping.
update blog_posts set job_trade = 'software-engineer' where slug in (
  'technical-resume',
  'technical-interview-prep',
  'whiteboard-coding',
  'system-design-interview',
  'software-engineer-resume-template',
  'junior-engineer-getting-promoted',
  'mid-level-plateau',
  'senior-to-staff-engineer'
);

update blog_posts set job_trade = 'product-management' where slug in (
  'product-manager-interview-prep'
);

update blog_posts set job_trade = 'data-science' where slug in (
  'data-scientist-portfolio'
);

update blog_posts set job_trade = 'design' where slug in (
  'ux-designer-portfolio-case-studies',
  'portfolio-vs-resume'
);

update blog_posts set job_trade = 'devops-sre' where slug in (
  'devops-sre-interview'
);

update blog_posts set job_trade = 'sales' where slug in (
  'account-executive-resume'
);

update blog_posts set job_trade = 'marketing' where slug in (
  'marketing-manager-resume-portfolio'
);

update blog_posts set job_trade = 'customer-success' where slug in (
  'customer-success-manager-path'
);

update blog_posts set job_trade = 'engineering-management' where slug in (
  'engineering-manager-first-90-days',
  'first-management-role',
  'firing-with-empathy'
);

update blog_posts set job_trade = 'cybersecurity' where slug in (
  'cybersecurity-career-paths'
);

update blog_posts set job_trade = 'healthcare-tech' where slug in (
  'healthcare-tech-careers'
);

update blog_posts set job_trade = 'fintech' where slug in (
  'fintech-careers-2026'
);

update blog_posts set job_trade = 'hiring-manager' where slug in (
  'inclusive-job-descriptions',
  'designing-screening-loops',
  'structured-interviews',
  'reducing-hiring-bias',
  'candidate-experience',
  'offer-negotiation-employer-side',
  'background-checks',
  'remote-hiring',
  'culture-add-not-culture-fit',
  'skills-based-hiring',
  'ai-in-recruiting',
  'talent-density-hiring'
);

-- Everything else stays null (applies to any role).
