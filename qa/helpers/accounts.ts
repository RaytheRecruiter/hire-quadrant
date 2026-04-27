export const accounts = {
  adminPrimary: {
    email: process.env.QA_ADMIN_EMAIL ?? '',
    password: process.env.QA_ADMIN_PASSWORD ?? '',
  },
  adminBackup: {
    email: 'rrainey19138@gmail.com',
    password: 'TestPass123!',
  },
  employer: {
    email: 'test-employer-1@hirequadrant-test.com',
    password: 'TestBiz123!',
  },
  employerAlt: {
    email: 'test-employer-2@hirequadrant-test.com',
    password: 'TestBiz123!',
  },
  candidate: {
    email: 'seed-reviewer-1@hirequadrant-seed.test',
    password: 'TestPass123!',
  },
} as const;

export type Persona = keyof typeof accounts;
