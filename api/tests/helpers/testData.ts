// Test data helpers
import type { Issue } from '../../src/types/index';

export const validIssue: Omit<Issue, 'id' | 'createdAt' | 'updatedAt'> = {
  title: 'Test Issue',
  description: 'This is a test issue description',
  site: 'Site-101',
  severity: 'major',
  status: 'open',
};

export const createTestIssue = (
  overrides: Partial<Issue> = {},
): Omit<Issue, 'id' | 'createdAt' | 'updatedAt'> => {
  return {
    ...validIssue,
    ...overrides,
  } as Omit<Issue, 'id' | 'createdAt' | 'updatedAt'>;
};

export const testIssues: Array<Omit<Issue, 'id' | 'createdAt' | 'updatedAt'>> = [
  {
    title: 'Missing consent form',
    description: 'Consent form not in file for patient 003',
    site: 'Site-101',
    severity: 'major',
    status: 'open',
  },
  {
    title: 'Late visit',
    description: 'Visit week 4 occurred on week 6',
    site: 'Site-202',
    severity: 'minor',
    status: 'in_progress',
  },
  {
    title: 'Drug temp excursion',
    description: 'IP stored above max temp for 6 hours',
    site: 'Site-101',
    severity: 'critical',
    status: 'open',
  },
  {
    title: 'Unblinded email',
    description: 'Coordinator emailed treatment arm to CRA',
    site: 'Site-303',
    severity: 'major',
    status: 'resolved',
  },
];

export const invalidIssues = {
  missingTitle: {
    description: 'Description without title',
    site: 'Site-101',
    severity: 'major',
  },
  missingDescription: {
    title: 'Title without description',
    site: 'Site-101',
    severity: 'major',
  },
  invalidSeverity: {
    title: 'Invalid severity',
    description: 'Test description',
    site: 'Site-101',
    severity: 'invalid',
  },
  invalidStatus: {
    title: 'Invalid status',
    description: 'Test description',
    site: 'Site-101',
    severity: 'major',
    status: 'invalid',
  },
  emptyFields: {
    title: '',
    description: '',
    site: '',
    severity: '',
  },
};

export const validCsvContent = `title,description,site,severity,status,createdAt
Missing consent form,Consent form not in file for patient 003,Site-101,major,open,2025-05-01T09:00:00Z
Late visit,Visit week 4 occurred on week 6,Site-202,minor,in_progress,2025-05-03T12:30:00Z
Drug temp excursion,IP stored above max temp for 6 hours,Site-101,critical,open,2025-05-10T08:15:00Z
Unblinded email,Coordinator emailed treatment arm to CRA,Site-303,major,resolved,2025-05-14T16:00:00Z`;

export const invalidCsvContent = `title,description,site,severity,status
,Missing description,Site-101,major,open
Invalid severity,Test description,Site-101,wrong_severity,open
No site,Test description,,major,open`;
