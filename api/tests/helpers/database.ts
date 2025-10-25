import { pool } from '../../src/db/connection';
import { IssueModel } from '../../src/models/issue';
import type { Issue } from '../../src/types/index';

// Clean up database before/after tests
export async function cleanDatabase(): Promise<void> {
  try {
    await IssueModel.deleteAll();
  } catch (error) {
    console.error('Error cleaning database:', error);
  }
}

// Seed database with test data
export async function seedDatabase(
  issues: Array<Omit<Issue, 'id' | 'createdAt' | 'updatedAt'>>,
): Promise<Issue[]> {
  try {
    const inserted: Issue[] = [];
    for (const issue of issues) {
      const created = await IssueModel.create(issue);
      inserted.push(created);
    }
    return inserted;
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}

// Close database connection
export async function closeDatabase(): Promise<void> {
  try {
    await pool.end();
  } catch (error) {
    console.error('Error closing database:', error);
  }
}
