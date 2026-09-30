// Demo data: what appears in screenshots, demos, and whenever the board needs
// checking. Run with `npm run db:seed` against an empty database.
//
// It goes through the same services as the app, so every rule the app
// enforces (slugs, status timestamps, archived projects) holds here too.
// Due dates are relative to today, so "overdue" and "due today" stay true
// whenever the seed runs.

import { db } from "@/db/client";
import { toCalendarDate } from "@/lib/domain/dates";
import type { ProjectLifecycle } from "@/lib/domain/lifecycle";
import { PRIORITY, type TaskPriority } from "@/lib/domain/priority";
import type { TaskStatus } from "@/lib/domain/status";
import { archiveProject, createProject } from "@/server/services/projects";
import { createTask } from "@/server/services/tasks";

// A calendar day `offset` days from today, today being the local date.
function day(offset: number): Date {
  const now = new Date();
  const shifted = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + offset));
  return toCalendarDate(shifted.toISOString().slice(0, 10));
}

type SeedTask = [TaskStatus, string, TaskPriority, number | null, string?];

const { LOW, MEDIUM, HIGH, URGENT } = PRIORITY;

const projects: {
  name: string;
  lifecycle: ProjectLifecycle;
  description: string | null;
  start: number | null;
  target: number | null;
  archived?: boolean;
  tasks: SeedTask[];
}[] = [
  {
    name: "Client website relaunch",
    lifecycle: "ACTIVE",
    description:
      "Replace the 2019 marketing site with the new design system.\nKeep every existing blog URL working.",
    start: -40,
    target: 50,
    tasks: [
      ["NEW", "Collect testimonials from three recent clients", MEDIUM, null],
      ["NEW", "Draft the case study for the logistics project", LOW, 90],
      ["NEW", "Check colour contrast on the pricing table", HIGH, 12],
      ["TODO", "Rewrite the pricing page copy", HIGH, 3, "Shorter than the current page. Lead with the monthly plan."],
      ["TODO", "Agree the hosting plan with the client", URGENT, 0],
      ["TODO", "Add redirects for every old blog URL", HIGH, 14, "Export the list from the current CMS first."],
      ["TODO", "Compress hero images", LOW, null],
      [
        "TODO",
        "Replace the placeholder illustrations on the services pages with the commissioned artwork once the illustrator delivers the final files, and check every image has alt text that describes what it shows",
        MEDIUM,
        21,
      ],
      ["IN_PROGRESS", "Build the new navigation", HIGH, 5],
      ["IN_PROGRESS", "Fix the contact form on mobile Safari", URGENT, -6, "Submit does nothing on iOS 18. Reproduced on two phones."],
      ["BLOCKED", "Connect the newsletter signup", MEDIUM, 7, "Waiting for the client's mailing list API key."],
      ["DONE", "Set up the staging site", MEDIUM, null],
      ["DONE", "Choose the typeface", LOW, null],
      ["DONE", "Audit the old sitemap", MEDIUM, null],
      ["DONE", "Agree the page list with the client", HIGH, null],
      ["DONE", "Move the domain", HIGH, null],
      ["DONE", "Write the accessibility statement", LOW, null],
    ],
  },
  {
    name: "Internal API rewrite",
    lifecycle: "ACTIVE",
    description: "Replace the reporting endpoints before the old framework loses support.",
    start: -60,
    target: 20,
    tasks: [
      ["TODO", "Write the migration guide for API consumers", MEDIUM, 10],
      ["IN_PROGRESS", "Port the invoice endpoints", HIGH, 4],
      ["IN_PROGRESS", "Add request logging", LOW, null],
      ["BLOCKED", "Rotate the production database credentials", URGENT, -3, "Needs a maintenance window from the hosting provider."],
      ["BLOCKED", "Decide the pagination format", HIGH, 2, "Waiting on the mobile team's answer."],
      ["DONE", "Map every existing endpoint", MEDIUM, null],
      ["DONE", "Set up the test database", MEDIUM, null],
    ],
  },
  {
    name: "Mobile companion app",
    lifecycle: "PLANNING",
    description: "A small app for checking project status away from the desk.",
    start: 30,
    target: 150,
    tasks: [
      ["NEW", "List the screens for the first version", HIGH, null],
      ["NEW", "Compare the two cross-platform frameworks", MEDIUM, 20],
      ["NEW", "Sketch the sign-in flow", MEDIUM, null],
      ["NEW", "Ask three users which view they check most", LOW, null],
      ["NEW", "Estimate the app store review time", LOW, null],
      ["NEW", "Decide whether offline mode is in scope", URGENT, 9],
    ],
  },
  {
    name: "Billing integration",
    lifecycle: "COMPLETE",
    description: "Card payments through the new provider, live since last month.",
    start: -120,
    target: -30,
    tasks: [
      ["DONE", "Choose the payment provider", HIGH, null],
      ["DONE", "Build the checkout form", HIGH, null],
      ["DONE", "Handle failed card payments", URGENT, null],
      ["DONE", "Send receipts by email", MEDIUM, null],
      ["DONE", "Add refunds to the admin screen", MEDIUM, null],
      ["DONE", "Test with the provider's sandbox", MEDIUM, null],
      ["DONE", "Write the support team's guide", LOW, null],
      ["DONE", "Switch on live payments", URGENT, null],
      ["DONE", "Remove the old invoice form", LOW, null],
    ],
  },
  {
    name: "Portfolio refresh",
    lifecycle: "PLANNING",
    description: null,
    start: null,
    target: null,
    tasks: [],
  },
  {
    name: "Legacy CMS migration",
    lifecycle: "ON_HOLD",
    description: "Paused until the client confirms next year's budget.",
    start: -200,
    target: null,
    archived: true,
    tasks: [
      ["NEW", "List the plugins still in use", LOW, null],
      ["TODO", "Export the media library", MEDIUM, null],
      ["TODO", "Map old user roles to new ones", MEDIUM, null],
      ["IN_PROGRESS", "Migrate the news archive", HIGH, null],
      ["BLOCKED", "Get admin access to the old server", HIGH, null, "The previous agency has not replied."],
      ["DONE", "Audit the page templates", MEDIUM, null],
      ["DONE", "Agree the content freeze date", HIGH, null],
      ["DONE", "Back up the old database", URGENT, null],
      ["DONE", "Count pages per section", LOW, null],
      ["DONE", "Write the migration plan", MEDIUM, null],
      ["DONE", "Test an import of ten pages", MEDIUM, null],
    ],
  },
];

async function main(): Promise<void> {
  // This writes to whatever DATABASE_URL points at, so it only accepts a
  // local SQLite file, and never mixes demo data into a database in use.
  const url = process.env.DATABASE_URL;
  if (!url?.startsWith("file:")) {
    throw new Error("Refusing to seed: DATABASE_URL is not a local SQLite file.");
  }
  const existing = await db.project.count();
  if (existing > 0) {
    throw new Error(
      `Refusing to seed: the database already has ${existing} project(s). ` +
        "Seed only an empty database. To start over with demo data only, run npm run db:reset, " +
        "which deletes everything in it.",
    );
  }

  for (const seed of projects) {
    const project = await createProject({
      name: seed.name,
      description: seed.description,
      lifecycle: seed.lifecycle,
      startOn: seed.start === null ? null : day(seed.start),
      targetOn: seed.target === null ? null : day(seed.target),
    });
    for (const [status, title, priority, due, notes] of seed.tasks) {
      await createTask(
        project.id,
        { title, description: notes ?? null, priority, dueOn: due === null ? null : day(due) },
        status,
      );
    }
    // Tasks first: an archived project accepts no new tasks.
    if (seed.archived) await archiveProject(project.id);
  }

  const taskCount = await db.task.count();
  console.log(`Seeded ${projects.length} projects and ${taskCount} tasks.`);
}

await main().finally(() => db.$disconnect());
