import { getApiBaseUrl } from "@/lib/appSettings";

export type TutorialDifficulty = "Beginner" | "Intermediate" | "Advanced";

export interface TutorialLesson {
  id: string;
  title: string;
  category: string;
  difficulty: TutorialDifficulty;
  readTimeMin: number;
  summary: string;
  content: string[];
  sqlExamples: string[];
  checklist: string[];
}

const fallbackTutorials: TutorialLesson[] = [
  {
    id: "sql-basics",
    title: "SQL Basics and Core Terms",
    category: "Basics",
    difficulty: "Beginner",
    readTimeMin: 6,
    summary: "Understand databases, tables, rows, columns, and why SQL is declarative.",
    content: [
      "SQL is the standard language to communicate with relational databases.",
      "A database contains tables. A table contains rows (records) and columns (fields).",
      "SQL is declarative: you describe what data you want, and the database decides how to fetch it.",
      "Primary keys uniquely identify each row and are critical for clean relationships between tables.",
    ],
    sqlExamples: [
      "SELECT current_database();",
      "SELECT current_schema();",
    ],
    checklist: [
      "Identify the table and columns before writing a query.",
      "Understand which column can uniquely identify each record.",
      "Use explicit column names instead of SELECT * when possible.",
    ],
  },
  {
    id: "select-and-where",
    title: "SELECT and WHERE",
    category: "Queries",
    difficulty: "Beginner",
    readTimeMin: 8,
    summary: "Retrieve only the records you need using filters and operators.",
    content: [
      "Use SELECT to choose columns and FROM to choose table.",
      "Use WHERE to filter rows. Add AND/OR/NOT for multi-condition logic.",
      "Use IN, BETWEEN, LIKE, and IS NULL for common filtering patterns.",
      "Good filtering dramatically improves readability and performance.",
    ],
    sqlExamples: [
      "SELECT id, name FROM students;",
      "SELECT * FROM students WHERE marks >= 70;",
      "SELECT * FROM students WHERE class IN ('A', 'B');",
    ],
    checklist: [
      "Always verify column names from schema first.",
      "Use WHERE to avoid unnecessary result rows.",
      "Test complex filters with small datasets first.",
    ],
  },
  {
    id: "sort-limit",
    title: "ORDER BY, LIMIT, OFFSET",
    category: "Queries",
    difficulty: "Beginner",
    readTimeMin: 7,
    summary: "Control result ordering and paging for clean output and pagination.",
    content: [
      "ORDER BY sorts rows (ASC by default, DESC for reverse order).",
      "LIMIT constrains the number of rows returned.",
      "OFFSET skips rows and helps build pagination APIs.",
      "Combine ORDER BY + LIMIT for top-N style queries.",
    ],
    sqlExamples: [
      "SELECT * FROM students ORDER BY marks DESC LIMIT 5;",
      "SELECT * FROM students ORDER BY id LIMIT 10 OFFSET 10;",
    ],
    checklist: [
      "Use ORDER BY whenever result order matters.",
      "Add LIMIT for dashboard cards and previews.",
      "Avoid large OFFSET for huge tables when possible.",
    ],
  },
  {
    id: "joins",
    title: "JOINs for Multi-Table Queries",
    category: "Advanced",
    difficulty: "Intermediate",
    readTimeMin: 10,
    summary: "Combine related tables safely using INNER and LEFT JOIN.",
    content: [
      "INNER JOIN returns only matching rows between tables.",
      "LEFT JOIN returns all rows from left table plus matches on right.",
      "JOINs require a reliable relationship key (e.g., student_id, dept_id).",
      "Use aliases to keep long queries readable.",
    ],
    sqlExamples: [
      "SELECT s.name, c.course_name FROM students s INNER JOIN courses c ON s.course_id = c.id;",
      "SELECT s.name, m.marks FROM students s LEFT JOIN marks m ON s.id = m.student_id;",
    ],
    checklist: [
      "Confirm join keys are correct and indexed.",
      "Start with INNER JOIN, then move to LEFT JOIN if needed.",
      "Alias each table for readability.",
    ],
  },
  {
    id: "dml-safe",
    title: "INSERT, UPDATE, DELETE Safely",
    category: "Data Manipulation",
    difficulty: "Intermediate",
    readTimeMin: 9,
    summary: "Modify data safely and avoid accidental mass updates/deletes.",
    content: [
      "INSERT adds new rows to a table.",
      "UPDATE changes existing rows; always pair with a WHERE clause.",
      "DELETE removes rows; always validate target rows first.",
      "Run SELECT with same WHERE clause before UPDATE/DELETE.",
    ],
    sqlExamples: [
      "INSERT INTO students (name, marks) VALUES ('Aarav', 88);",
      "UPDATE students SET marks = 91 WHERE id = 3;",
      "DELETE FROM students WHERE id = 3;",
    ],
    checklist: [
      "Never run UPDATE/DELETE without WHERE.",
      "Preview affected rows with SELECT first.",
      "Use transactions for critical updates.",
    ],
  },
  {
    id: "aggregations",
    title: "Aggregations, GROUP BY, HAVING",
    category: "Advanced",
    difficulty: "Advanced",
    readTimeMin: 11,
    summary: "Build analytics queries with COUNT, SUM, AVG and grouped summaries.",
    content: [
      "Aggregate functions summarize data across rows.",
      "GROUP BY creates per-group aggregates (e.g., class-wise average marks).",
      "HAVING filters grouped rows after aggregation.",
      "Use WHERE before GROUP BY and HAVING after GROUP BY.",
    ],
    sqlExamples: [
      "SELECT class, COUNT(*) FROM students GROUP BY class;",
      "SELECT class, AVG(marks) AS avg_marks FROM students GROUP BY class HAVING AVG(marks) > 70;",
    ],
    checklist: [
      "Use WHERE for row-level filtering.",
      "Use HAVING for aggregate-level filtering.",
      "Name aggregate columns with aliases.",
    ],
  },
];

function normalizeLesson(raw: Record<string, unknown>, index: number): TutorialLesson {
  const difficultyRaw = String(raw.difficulty || "Beginner") as TutorialDifficulty;
  const difficulty: TutorialDifficulty =
    difficultyRaw === "Intermediate" || difficultyRaw === "Advanced" ? difficultyRaw : "Beginner";

  return {
    id: String(raw.id || `lesson-${index + 1}`),
    title: String(raw.title || `Lesson ${index + 1}`),
    category: String(raw.category || "General"),
    difficulty,
    readTimeMin: Number(raw.readTimeMin) > 0 ? Number(raw.readTimeMin) : 5,
    summary: String(raw.summary || ""),
    content: Array.isArray(raw.content) ? raw.content.map((x) => String(x)) : [],
    sqlExamples: Array.isArray(raw.sqlExamples) ? raw.sqlExamples.map((x) => String(x)) : [],
    checklist: Array.isArray(raw.checklist) ? raw.checklist.map((x) => String(x)) : [],
  };
}

export async function fetchTutorialLessons(): Promise<TutorialLesson[]> {
  try {
    const baseUrl = getApiBaseUrl();
    const response = await fetch(`${baseUrl}/tutorials`);

    if (!response.ok) {
      return fallbackTutorials;
    }

    const payload = (await response.json()) as unknown;
    if (!Array.isArray(payload)) {
      return fallbackTutorials;
    }

    const normalized = payload
      .map((item, index) => normalizeLesson((item && typeof item === "object" ? item : {}) as Record<string, unknown>, index))
      .filter((item) => item.title.trim().length > 0);

    return normalized.length ? normalized : fallbackTutorials;
  } catch {
    return fallbackTutorials;
  }
}

export function getTutorialCategories(lessons: TutorialLesson[]): string[] {
  return ["All", ...Array.from(new Set(lessons.map((lesson) => lesson.category)))];
}

// File use case:
// This module provides dynamic tutorial lesson data for the Tutorials page.
// It supports backend API loading from /tutorials and safely falls back to local lessons.
// It also exposes normalization and category helper utilities for consistent UI behavior.
