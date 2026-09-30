# PMWeb - Technical Implementation Plan

This document is the authoritative technical plan for the PMWeb MVP. It states
the requirements the product must satisfy, the decisions that have been taken,
the data model, the architecture, and the order in which the work is built.

It was produced on 2026-09-16 from four specialist reviews, which are kept in
full under docs/plan/ as supporting detail:

| File | Scope |
| --- | --- |
| docs/plan/01-requirements-business-analysis.md | Functional requirements, user stories, business rules, edge cases |
| docs/plan/02-architecture-and-delivery.md | Layering, import rules, data flows, testing, delivery slices, risks |
| docs/plan/03-user-experience-and-interface.md | Board and dashboard design, tokens, copy, accessibility, responsive |
| docs/plan/04-backend-and-data.md | Schema, migrations, server contract, validation, queries, seed |

Where this document and a supporting document disagree, this document wins.
The conflicts that were arbitrated are listed in section 2 so the reasoning is
recoverable and does not get relitigated.

Slices 0 and 1 were built on 2026-09-29: the runnable shell, the Project model
and first migration, the create form, and the dashboard list. Everything for
later slices is still a design to be built and proved, not a description of
something that runs.

Status: Slices 0 to 3 done. Slice 4 next.

## IMPORTANT
When making the UI/UX design use skills in this order: ui-ux-pro-max then impeccable then taste-skill


---


## 1. Technology stack

Decided 2026-09-16 and recorded in CLAUDE.md section 7.

| Layer | Choice |
| --- | --- |
| Language | TypeScript, strict mode |
| Framework | Next.js, App Router, Server Components and Server Actions |
| UI | React with Tailwind CSS |
| Database | SQLite in development, PostgreSQL later |
| Data access | Prisma ORM 7 with the better-sqlite3 driver adapter |
| Validation | zod, at the server boundary only |
| Drag and drop | dnd-kit |
| Testing | Vitest, React Testing Library, one Playwright spec |
| Runtime | Node 24 |

The reasoning, the rejected alternatives, and the PostgreSQL migration
constraints are in CLAUDE.md section 5.

---

## 2. Decisions taken, including arbitrated conflicts

### 2.1 Where the specialists disagreed

#Delegation
**Card ordering inside a column. Resolved: no manual ordering in the MVP.**

Three of the four reviews independently recommended against a position column.
The backend review recommended one, using contiguous integers renormalized per
move inside a transaction. That review was asked a narrower question, namely
which of three ordering strategies to use, so it never evaluated the option of
having no manual ordering at all. Its analysis stands as the designated
strategy if manual ordering is later promoted, and it is preserved in
docs/plan/04-backend-and-data.md section 1.8 for that purpose.

Order within a column is therefore computed: priority descending, then due date
ascending with tasks that have no due date last, then creation date ascending.

The objection to this is real and is recorded rather than dismissed. A user who
drags a card to a specific spot in a column and sees it settle somewhere else
will read that as a bug. The reason it is acceptable here is that the interface
never offers the gesture: a column is a single drop zone, not a list of slots,
there is no insertion indicator between cards, and the dnd-kit sortable package
is not installed. Drag changes status and nothing else. A one-time hint
explains this the first time a user attempts an in-column drop, rather than
silently swallowing the gesture.

#Discernment
Revisit this if, in real use, the computed order repeatedly puts the wrong card
at the top of To do. That is the trigger, and it is the first post-MVP
candidate.

**Project status. Resolved: split into a manual lifecycle and derived progress.**

Four different shapes were proposed. The resolution keeps each half owned by
whoever actually knows the answer:

- lifecycle is a stored column set by the user: PLANNING, ACTIVE, ON_HOLD,
  COMPLETE. Only the user knows a project is paused or not yet started.
- Progress, per-status counts, blocked count, and overdue count are derived per
  request and never stored. Only the tasks know how far along the work is.
- archivedAt is a separate nullable column, not a lifecycle value. Archiving is
  orthogonal: a COMPLETE project and an ON_HOLD project can both be archived,
  and a separate timestamp records when without consuming a lifecycle state.

Storing a progress percentage would create a second source of truth that goes
stale the moment a task moves. It is never stored.

**Priority. Resolved: four levels, stored as an integer.**

The backend review proposed four integer levels; the requirements and design
reviews both proposed three, arguing that in a one-person backlog a fourth
level collapses into High in practice. This plan originally recorded three.



The developer decided four on 2026-09-16 and that decision stands. The reviews
were reasoning about a generic solo backlog; the person who will triage this
board every day wants a level above High. That was never a question the reviews
had standing to settle.

Integer storage was not in dispute. Priority is ordinal and the MVP must sort by
it, and a string column sorts alphabetically into nonsense.

Stored as Int: 10 is Low, 20 is Medium, 30 is High, 40 is Urgent. Default 20.
The spacing leaves room to insert a further level without a data migration.

#Delegation
### 2.2 Decisions carried from the reviews without conflict

| Decision | Detail |
| --- | --- |
| Local-only for the MVP | SQLite on the developer machine, dev server bound to localhost. A hosted PMWeb without authentication is a public database, so hosting is a post-MVP slice, not a deployment detail. |
| Archive and delete are different tools | Archive is reversible, lossless, hides the project from the dashboard, excludes it from totals, and makes it read-only. Delete is permanent and cascades to tasks. |
| Delete confirms, archive does not | Project delete requires typing the project name. Task delete requires a simple confirmation. Archive gets an undoable toast instead of a dialog. Confirming everything trains a user to dismiss dialogs unread. |
| Hard delete, not soft delete | One forgotten deletedAt filter puts a deleted card on a board during a screen share. The relation uses onDelete Cascade. |
| Stored values are constants, displayed values are plain language | IN_PROGRESS is stored, "In progress" is rendered. Satisfies both the PostgreSQL port and the CLAUDE.md rule against jargon and abbreviations in the interface. |
| Accessible move control ships before drag and drop | Slice 4 before Slice 5. If drag ships first the keyboard path becomes optional work that gets cut; if the control ships first, drag is a pure enhancement that can be abandoned. |
| No owner or user column now | Multi-user is not designed out, but an unused nullable column is speculative structure. The seam is documented in section 6.6 and added by migration when promoted. |
| Dark mode is out of the MVP | The board is a document that gets shown to others and printed. A second palette doubles the contrast verification burden. All colors are semantic custom properties, so adding it later is one variable block. |
| Task titles need not be unique | Repeated work genuinely repeats. A uniqueness rule blocks real usage to prevent a cosmetic annoyance. |
| Last write wins on concurrent field edits | The user is one person, so a genuine conflict is rare and cheap. Status moves must be idempotent, and any action on a deleted record must fail loudly. |
| dueOn is a calendar day, not an instant | A deadline that renders a day early on a client-facing board is a credibility bug. Stored as UTC midnight, constructed and read through one function each. |

### 2.3 Additions accepted beyond the MVP list as written

The requirements review found fourteen gaps in the MVP list in CLAUDE.md
section 4. These four are promoted into the MVP because the feature is unsafe
or unimplementable without them:

1. Restore an archived project. Archive with no way back is an unlabelled soft
   delete.
2. Confirmation before delete. Delete is the only irreversible action in the
   product and there is no undo.
3. A task detail view. CLAUDE.md requires that detail lives behind the card, so
   something must be behind the card. It appears nowhere in the MVP list.
4. Enumerated values for priority, project lifecycle, and the default task
   status. All three are named as fields whose values are never listed, so they
   are not implementable as written.

One column is added beyond the reviews' schemas:

5. statusChangedAt. A client looking at the Blocked column cannot see why
   anything is blocked, which is the first question they ask. One column lets a
   blocked card show "Blocked for 3 days". BLOCKED is the column CLAUDE.md
   singles out as needing attention, so making it readable is core to the
   board-as-report promise rather than an extra.

The remaining gaps are answered in section 15 or in
docs/plan/01-requirements-business-analysis.md section 1.7.

---

## 3. Functional requirements

Every requirement is testable by observing the running application. MUST items
are MVP-blocking. SHOULD items ship if they are cheap and are dropped without
argument if they are not. WILL NOT items are stated to stop scope leaking in.

Traceability: MVP-1 through MVP-7 refer to the numbered MVP list in CLAUDE.md
section 4. GAP marks a requirement promoted under section 2.3.

### 3.1 Projects

| ID | Requirement | Trace |
| --- | --- | --- |
| PRJ-1 | The user MUST be able to create a project with a name. | MVP-1 |
| PRJ-2 | A project MUST accept an optional description, an optional start date, and an optional target date. | MVP-1 |
| PRJ-3 | The user MUST be able to edit a project name, description, lifecycle, and dates. | MVP-1 |
| PRJ-4 | Every project MUST have a lifecycle of PLANNING, ACTIVE, ON_HOLD, or COMPLETE, defaulting to ACTIVE. | MVP-1, GAP |
| PRJ-5 | The user MUST be able to archive a project. | MVP-1 |
| PRJ-6 | The user MUST be able to restore an archived project. | GAP |
| PRJ-7 | An archived project MUST be hidden from the default dashboard and excluded from its totals. | GAP |
| PRJ-8 | An archived project MUST remain fully readable and MUST be read-only until restored. | GAP |
| PRJ-9 | The user MUST be able to delete a project permanently. | MVP-1 |
| PRJ-10 | Deleting a project MUST require a confirmation that names the project and states its task count. | GAP |
| PRJ-11 | Deleting a project MUST delete all of its tasks. | MVP-1 |
| PRJ-12 | A project MUST be reachable at a readable URL that does not expose a raw identifier. | MVP-5 |
| PRJ-13 | Project names MUST be 1 to 120 characters after trimming. | MVP-1 |
| PRJ-14 | Archiving a project SHOULD offer an undo immediately after the action. | GAP |

### 3.2 Tasks

| ID | Requirement | Trace |
| --- | --- | --- |
| TSK-1 | The user MUST be able to create a task within a project with a title. | MVP-3 |
| TSK-2 | A task MUST accept optional notes and an optional due date. | MVP-3 |
| TSK-3 | Every task MUST have a status of NEW, TODO, IN_PROGRESS, BLOCKED, or DONE. | MVP-3 |
| TSK-4 | A task created from the project-level control MUST default to NEW. | GAP |
| TSK-5 | A task created from a column control MUST default to that column status. | GAP |
| TSK-6 | Every task MUST have a priority of Low, Medium, High, or Urgent, defaulting to Medium. | MVP-3, GAP |
| TSK-7 | The user MUST be able to edit every task field. | MVP-3 |
| TSK-8 | The user MUST be able to delete a task, with a confirmation. | MVP-3, GAP |
| TSK-9 | The user MUST be able to open a task detail view showing all fields including notes. | GAP |
| TSK-10 | Task titles MUST be 1 to 200 characters after trimming and need not be unique. | MVP-3 |
| TSK-11 | A task MUST record when its status last changed. | GAP |
| TSK-12 | A task MUST record when it entered DONE, and MUST clear that record when it leaves DONE. | MVP-4 |
| TSK-13 | A due date in the past MUST be accepted on create and edit. | MVP-3 |

### 3.3 Kanban board

| ID | Requirement | Trace |
| --- | --- | --- |
| BRD-1 | The board MUST show exactly five columns in the order New, To do, In progress, Blocked, Done. | MVP-5 |
| BRD-2 | Each card MUST appear in the column matching its status. | MVP-5 |
| BRD-3 | Each column MUST display its card count. | MVP-5 |
| BRD-4 | An empty column MUST still render with its label and a zero count. | MVP-5 |
| BRD-5 | The Blocked column MUST be visually distinct by at least three redundant signals that survive conversion to grayscale. | MVP-5 |
| BRD-6 | A card MUST show its title, its priority, and its due date when one is set, and nothing else. | MVP-5 |
| BRD-7 | An overdue due date MUST be visually distinct from a future one. | MVP-5 |
| BRD-8 | A card in Blocked MUST show how long it has been blocked. | GAP |
| BRD-9 | The user MUST be able to move a card to any other status by drag and drop. | MVP-4 |
| BRD-10 | The user MUST be able to move a card to any other status without dragging, by keyboard alone. | MVP-4 |
| BRD-11 | A failed move MUST return the card to its original column and state what went wrong. | MVP-4 |
| BRD-12 | A move MUST be announced to assistive technology naming the task and the destination column. | MVP-4 |
| BRD-13 | Order within a column MUST be priority descending, then due date ascending with no-due-date last, then created ascending. | MVP-6 |
| BRD-14 | The board MUST render no raw identifiers, debug output, or placeholder text. | MVP-5 |
| BRD-15 | A long title MUST be truncated on the card without breaking the layout, with the full title available on the detail view. | MVP-5 |
| BRD-16 | A column MUST remain usable at 100 or more cards. | MVP-5 |
| BRD-17 | The board MUST show a one-line summary of totals per status. | MVP-5 |
| BRD-18 | Drag and drop MUST be disabled below 768 pixels, where the non-drag control is the mechanism. | MVP-4 |
| BRD-19 | The board WILL NOT support reordering cards within a column. | Section 2.1 |
| BRD-20 | The board WILL NOT support moving a card to a different project. | Deferred |

### 3.4 Dashboard

| ID | Requirement | Trace |
| --- | --- | --- |
| DSH-1 | The dashboard MUST list every non-archived project. | MVP-2 |
| DSH-2 | Each project MUST show its name, its lifecycle, and its derived progress. | MVP-2 |
| DSH-3 | Progress MUST be shown as both a bar and a text value that does not rely on color. | MVP-2 |
| DSH-4 | Each project MUST show a per-status task count breakdown. | MVP-2 |
| DSH-5 | A project with blocked or overdue tasks MUST surface that on its summary. | MVP-2 |
| DSH-6 | A project with zero tasks MUST render correctly and MUST NOT show a misleading progress figure. | MVP-2 |
| DSH-7 | The dashboard MUST provide an explicit way to view archived projects. | GAP |
| DSH-8 | The dashboard MUST render a useful empty state when there are no projects. | MVP-2 |
| DSH-9 | Clicking a project MUST open its board. | MVP-5 |
| DSH-10 | The dashboard MUST remain readable at twenty projects. | MVP-2 |

### 3.5 Filtering and sorting

| ID | Requirement | Trace |
| --- | --- | --- |
| FLT-1 | The user MUST be able to filter board tasks by priority. | MVP-6 |
| FLT-2 | The user MUST be able to filter board tasks by due date using a fixed choice set: overdue, due today, due within 7 days, has no due date, any. | MVP-6, GAP |
| FLT-3 | The user MUST be able to show and hide individual columns, which is what filtering by status means on a board. | MVP-6 |
| FLT-4 | The user MUST be able to override the default within-column sort to sort by due date or by title. | MVP-6 |
| FLT-5 | Active filters MUST be visible, and MUST be clearable in one action. | MVP-6 |
| FLT-6 | Column counts MUST reflect the filtered set and MUST make clear that a filter is active. | MVP-6 |
| FLT-7 | Filter and sort state SHOULD live in the URL so a filtered board can be reloaded and linked. | MVP-6 |
| FLT-8 | The product WILL NOT support saved views or named filters. | Deferred |

### 3.6 Persistence

| ID | Requirement | Trace |
| --- | --- | --- |
| PER-1 | Every project and task MUST survive an application restart. | MVP-7 |
| PER-2 | Every schema change MUST be applied by a committed, versioned migration. | MVP-7 |
| PER-3 | The database file MUST NOT be committed to version control. | MVP-7 |
| PER-4 | Acting on a record that no longer exists MUST fail loudly with a clear message, not silently succeed. | MVP-7 |
| PER-5 | A seed command MUST populate a demonstrable board and dashboard. | MVP-7 |

---
## 4. Non-functional requirements

### 4.1 The five-second board test

This is the defining constraint of the product and it is made falsifiable here
so it can actually be checked rather than asserted.

Procedure: show the board to someone who has not seen the project, for five
seconds, then hide it and ask four questions. What is finished? What is being
worked on? What is stuck? What has not been started? The test passes when they
answer all four without help. Run it once, on a real board with real data,
before the MVP is called done. A failure is a design defect, not a nitpick.

| ID | Requirement |
| --- | --- |
| NFR-1 | The board MUST pass the five-second test with a viewer who has not been briefed. |
| NFR-2 | The board MUST be presentable during a screen share with no debug output, raw identifiers, or placeholder text. |
| NFR-3 | The board MUST remain readable when printed or screenshotted in grayscale. |
| NFR-4 | All interface copy MUST be plain language: no jargon, no abbreviations, no ticket syntax, no emojis. |

### 4.2 Performance

Targets are stated as measurable numbers so they can be failed.

| ID | Requirement |
| --- | --- |
| NFR-5 | The board MUST render in under 500 ms on a project with 200 tasks, measured from request to first contentful paint locally. |
| NFR-6 | The dashboard MUST render in under 500 ms with 20 projects and 2000 total tasks. |
| NFR-7 | The dashboard MUST issue a bounded number of database queries regardless of project count. A per-project query loop is a defect. |
| NFR-8 | A status move MUST reflect optimistically in under 100 ms, before the server responds. |
| NFR-9 | A column MUST cap its rendered cards at 50 with an explicit indication that more exist, so a year-old Done column does not destroy the board as a report. |

### 4.3 Accessibility

Treated as a requirement, not an enhancement. The keyboard path is the
accessible path and it ships first.

| ID | Requirement |
| --- | --- |
| NFR-10 | Every interaction MUST be completable by keyboard alone, including moving a task between statuses. |
| NFR-11 | Every text foreground and background pair MUST meet WCAG AA contrast: 4.5 to 1 for body text, 3 to 1 for large text and interface boundaries. |
| NFR-12 | Status MUST NOT be communicated by color alone. |
| NFR-13 | Focus MUST be visible on every interactive element and MUST follow a sensible order. |
| NFR-14 | A status change MUST be announced in a live region naming the task and its destination. |
| NFR-15 | Interactive targets MUST be at least 44 by 44 pixels on touch. |
| NFR-16 | Form fields MUST have associated labels, and validation errors MUST be programmatically associated with their field. |

### 4.4 Data and operations

| ID | Requirement |
| --- | --- |
| NFR-17 | Server-side validation MUST be authoritative. Client-side validation is a convenience and MUST NOT be the only check. |
| NFR-18 | The application MUST run locally with one documented command. |
| NFR-19 | Configuration MUST come from environment variables, with a committed .env.example and an uncommitted .env. |
| NFR-20 | No secret MUST ever be committed to the repository. |
| NFR-21 | The application MUST bind to localhost only, because there is no authentication. |
| NFR-22 | Every timestamp MUST be stored in UTC. |
| NFR-23 | The test database MUST be isolated from the development database, and a test run MUST NOT be able to destroy development data. |
| NFR-24 | Backup is documented as copying the database file while the application is stopped. No automated backup is built. |

### 4.5 Compatibility

| ID | Requirement |
| --- | --- |
| NFR-25 | The application MUST work in current Chrome, Edge, and Firefox. Legacy browsers are out of scope. |
| NFR-26 | The board MUST be usable from 360 pixels wide upward. |
| NFR-27 | The application MUST NOT require JavaScript for creating, editing, or deleting a project or task. Drag and drop is the only JavaScript-dependent feature and it has a non-JavaScript equivalent. |

---

## 5. Architecture

### 5.1 Three layers

There is deliberately no repository layer wrapping Prisma. Prisma is the data
access layer. The split that earns its keep is between logic that needs a
database and logic that does not.

| Layer | Location | May import | May NOT import |
| --- | --- | --- | --- |
| Domain | src/lib/domain/ | Nothing but other domain modules | Prisma, React, Next, any I/O |
| Service | src/server/services/ | Prisma, domain, zod schemas | React, anything from next/cache |
| Routes | src/app/ | Services, domain, server actions | Prisma directly |
| Components | src/components/ | Domain types, server actions | Prisma, services, anything in src/server |

The rule in one sentence: if logic can be written without touching the
database, it belongs in the domain layer.

Two mechanisms stop this rotting, and both fail the build rather than shipping
a bug:

1. The server-only package imported at the top of every service file and of the
   Prisma client. Importing a service into a client component then fails at
   build time instead of bundling Prisma for the browser.
2. ESLint no-restricted-imports zones per directory, so a domain module that
   imports Prisma fails lint.

A load-bearing corollary: revalidatePath is called only in actions, never in
services, because it throws outside a Next request context. That single rule is
what makes the entire service layer testable as plain Node against a real
SQLite file.

### 5.2 Server and client components

Server Components are the default. A component becomes a Client Component only
when it needs state, an event handler, or a browser API.

Client Components in the MVP: Board, BoardColumn, TaskCard, MoveTaskControl,
TaskForm, TaskDialog, and the delete buttons. Everything else is a Server
Component, including the whole dashboard.

A "use client" directive in a layout converts the entire subtree to client code
with no error, so it must never appear in one.

### 5.3 Directory layout

Only what the MVP needs. No speculative structure.

    PMWeb/
      CLAUDE.md                     standing project context
      projectdevelopmentstatus.md   build progress, single source of truth
      technicalplan.md              this document
      README.md                     prerequisites, setup, the one run command
      .gitignore                    node_modules, .next, .env, *.db, coverage
      .env.example                  committed template: DATABASE_URL only
      package.json                  scripts: dev, build, start, test, lint, db:*
      tsconfig.json                 strict true, paths @/* to ./src/*
      next.config.ts                near-empty, no custom webpack
      eslint.config.mjs             next/core-web-vitals plus the import zones
      vitest.config.mts             node environment, non-UTC TZ; jsdom project added with the first component test
      prisma.config.ts              Prisma 7 config: schema path, migrations path, DATABASE_URL
      docs/plan/                    the four specialist reviews

      prisma/
        schema.prisma               Project and Task, the durable asset
        migrations/                 generated, committed, never hand-edited blindly
        seed.mts                    six projects, 50 tasks, every dashboard and board state

      e2e/
        mvp-happy-path.spec.ts      the single end-to-end spec, added in Slice 8

      src/
        app/
          layout.tsx                html shell, nav, Tailwind import
          globals.css               Tailwind directives and the color tokens
          page.tsx                  the dashboard
          error.tsx                 route error boundary
          not-found.tsx             404 page
          projects/
            actions.ts              create, update, archive, restore, delete project
            new/page.tsx            new project form
            archived/page.tsx       archived projects list
            [slug]/
              page.tsx              the kanban board
              error.tsx             board-scoped error boundary
              actions.ts            create, update, delete, move task
              edit/page.tsx         edit project form
              tasks/[taskId]/page.tsx   task detail view

        components/
          board/
            Board.tsx               CLIENT. DndContext, useOptimistic, move dispatch
            BoardColumn.tsx         CLIENT. useDroppable, heading, count, empty state
            TaskCard.tsx            CLIENT. useDraggable, title, priority, due date
            MoveTaskControl.tsx     CLIENT. the keyboard path, a labelled select
            BoardAnnouncer.tsx      live region for status change announcements
            BoardSummary.tsx        SERVER. the one-line totals sentence
          tasks/
            TaskForm.tsx            CLIENT. useActionState, field errors
            TaskDialog.tsx          CLIENT. native dialog wrapping TaskForm
            DeleteTaskButton.tsx    CLIENT. confirm then submit
          projects/
            ProjectForm.tsx         CLIENT. useActionState, field errors
            ProjectSummaryCard.tsx  SERVER. one dashboard tile
            ProgressBar.tsx         SERVER. done over total, with accessible text
            LifecycleBadge.tsx      SERVER. Planning, Active, On hold, Complete
            DeleteProjectDialog.tsx CLIENT. type-the-name confirmation
          ui/
            Field.tsx               label, control slot, error text, id wiring
            Button.tsx              the three button variants
            EmptyState.tsx          shared empty-column and empty-dashboard copy
          nav/
            SiteNav.tsx             SERVER. dashboard and new project links

        db/
          client.ts                 Prisma singleton, HMR-safe, imports server-only

        lib/
          domain/
            types.ts                Project, Task, TaskCard, ProjectSummary shapes
            status.ts               TASK_STATUSES, labels, column order, transitions
            priority.ts             PRIORITIES, labels, comparator
            progress.ts             summarize, progressOf - pure counting
            sort.ts                 sortTasksForColumn, applyTaskFilters
            board.ts                resolveDragEnd - the pure drag decision
            dates.ts                toCalendarDate, dueDateState, daysSince
          result.ts                 the ActionResult discriminated union

        server/
          services/
            projects.ts             list, get, create, update, archive, restore, delete
            tasks.ts                listForBoard, create, update, delete, move
          validation/
            project-input.ts        zod schemas for project forms
            task-input.ts           zod schemas for task forms and moves

        test/
          db.ts                     test database setup and reset helper

Unit tests are colocated beside the file they test. There is no parallel test
tree; src/test/ holds helpers only.

### 5.4 The three critical data flows

**Creating a task.** The form is a Client Component using useActionState and
posts to createTask in the route's actions.ts. The action parses FormData with
zod. On failure it returns field errors and the form renders them beside the
fields; nothing reaches the service. On success it calls the service, which
writes through Prisma, then calls revalidatePath on the board route. The board
re-renders on the server with the new card in place.

**Dragging a card from To do to In progress.** dnd-kit reports the drag end to
Board. Board calls the pure resolveDragEnd to decide whether this is a real
status change; if not, nothing happens. If it is, Board applies an optimistic
update through useOptimistic so the card appears in the destination column
immediately, then dispatches moveTask. The service validates the transition and
writes status, statusChangedAt, and completedAt together. On success,
revalidatePath replaces the optimistic state with server state. On failure, the
optimistic state is discarded, React returns the card to its original column,
and an error message states what went wrong. The announcement fires in both
cases.

**Loading the dashboard.** The page is a Server Component. It runs exactly two
queries: one for the non-archived projects, one groupBy over tasks aggregating
counts by projectId and status. The domain layer joins them into summaries and
computes progress. A per-project query loop is the obvious wrong implementation
here and is explicitly a defect under NFR-7.

### 5.5 Implementation notes from Slice 1

Facts learned while building, recorded so later slices do not rediscover them.

- Prisma 7 differs from the version this plan was first written against. The
  database URL lives in prisma.config.ts, not the schema; the generator is
  prisma-client with an explicit output under src/generated (gitignored and
  rebuilt by postinstall); SQLite needs the @prisma/adapter-better-sqlite3
  driver adapter; and migrate dev no longer runs generate. The database file
  resolves relative to the project root, so dev.db sits there.
- Route files split from components in the layer table. Pages must call
  service read functions (section 7.3) and actions must call service writes,
  so src/app may import services; src/components may not. ESLint enforces both.
- Pages that read the database call await connection() first. better-sqlite3
  is synchronous, so without it Next prerenders the query once at build time.
- Form actions return FormState, which echoes the submitted values. React resets
  an uncontrolled form after its action returns, and without the echo a
  validation error would wipe what the user typed.
- The error summary lists each problem as a link to its field, because without
  JavaScript nothing moves focus and the summary is the only route to the fix.
- createProject redirects to the dashboard until the board exists in Slice 4,
  when it should redirect to the new project's board.
- server-only throws outside a React Server Components bundle, so Vitest
  aliases it to an empty module; next build still enforces it.
- Slice 2: the slugs "new" and "archived" are reserved, because those fixed
  routes sit beside /projects/[slug]. A project named New gets new-2.
- Slice 2: dashboard and archived-list notices come from query parameters
  (archived, deleted, missing, restored). The archive and restore notices are
  checked against the database, so a stale link never offers an Undo that
  would do nothing.
- Slice 2: instants such as archivedAt are shown with formatLocalDay, in the
  server's timezone, which is the user's while PMWeb is local-only. Calendar
  days keep formatCalendarDate in UTC. Node 24's British English data writes
  September as "Sept"; that is kept.
- Slice 2: the base CSS rules sit in @layer base. Unlayered, the global
  :focus-visible outline beat every utility, so focus-visible:outline-none on
  the radio tiles and card links never applied.
- Slice 2 departures from the UX review, both from the finish review: below
  768px the breadcrumb shows the parent crumb and the current page (the review
  said the project name; the parent is the way back, so a task page shows its
  project; revised in Slice 3), and form buttons put
  Cancel first at every width so the tab order matches what is on screen (the
  review said primary on top on mobile).
- Slice 3: the seed is prisma/seed.mts, run by `npm run db:seed` through
  `prisma db seed`, which runs `tsx --conditions=react-server`. The .mts
  extension makes it an ES module (the package is not "type": "module", so a
  .ts file is CommonJS and cannot use top-level await); the react-server
  condition lets it import the server-only services, so demo data obeys the
  same rules as the app. It refuses a non-empty database. In Prisma 7,
  `prisma migrate reset` does not run the seed (the CLI calls the seed runner
  only from `db seed`), and it refuses to run when invoked by an AI agent
  without the user's explicit consent.
- Slice 3: SQLite enforces foreign keys through the better-sqlite3 adapter;
  the BR-4 cascade test passes against the real database. Task writes carry
  the archived check in the same statement (a relation filter in the update
  and delete where clause) or in the same transaction (create).
- Slice 3: the plain task list is ordered in the domain layer (compareForList:
  column order, then BR-13), because SQLite sorts NULL due dates first.
- Slice 3: overdue dates are not marked in the plain list; BRD-7 belongs to the
  board in Slice 4.
- npm run build deletes .next/dev/types first (the prebuild script). The dev
  server writes .next/dev/types/validator.ts, which imports every page by
  path, and Next adds that folder to tsconfig include and re-adds it if
  removed. next build type-checks it, so deleting or renaming a page after a
  dev run failed the build with TS2307 on a file that no longer exists, until
  a dev server ran again. Reproduced and fixed on 2026-09-29. The build still
  type-checks every current page through its own .next/types/validator.ts; a
  planted type error in a page still fails it.
- In dev, whether a page exists is decided in two places: the route table
  built from Next's file watcher, which is also written to
  .next/dev/types/routes.d.ts, and Turbopack's entrypoints, which come from
  its on-disk cache in .next/dev/cache. A dev server once returned 404 for an
  existing page until the file was touched. A faithful replay of the session
  did not reproduce it. A watcher that cannot read a folder at startup drops
  the route silently and does not recover even when the file is touched, so
  that was not the cause; a stale Turbopack cache fits the symptoms but is
  unproven. If it recurs, check routes.d.ts for the route before touching
  anything: absent means the watcher lost it, present points at Turbopack.

---

## 6. Data model

### 6.1 The schema

    // prisma/schema.prisma

    generator client {
      provider = "prisma-client"
      output   = "../src/generated/prisma"
    }

    datasource db {
      provider = "sqlite"
    }

    model Project {
      id          String    @id @default(cuid())
      slug        String    @unique
      name        String
      description String?
      lifecycle   String    @default("ACTIVE")
      startOn     DateTime?
      targetOn    DateTime?
      archivedAt  DateTime?
      createdAt   DateTime  @default(now())
      updatedAt   DateTime  @updatedAt

      tasks Task[]

      @@index([archivedAt])
    }

    model Task {
      id              String    @id @default(cuid())
      projectId       String
      title           String
      description     String?
      status          String    @default("NEW")
      priority        Int       @default(20)
      dueOn           DateTime?
      statusChangedAt DateTime  @default(now())
      completedAt     DateTime?
      createdAt       DateTime  @default(now())
      updatedAt       DateTime  @updatedAt

      project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)

      @@index([projectId, status])
      @@index([projectId, dueOn])
    }

That is the entire MVP schema. Two models, no join tables, no lookup tables, no
history tables.

### 6.2 Field decisions

**Keys.** cuid string primary keys, plus an immutable server-generated slug on
Project so URLs read /projects/client-website. No identifier is ever rendered as
text, satisfying BRD-14; ids live in DOM attributes and action arguments only.
There is no task reference number because CLAUDE.md bans ticket syntax on cards.

**Status.** A String column, because Prisma does not support enums on SQLite.
Type safety comes from one const tuple that serves simultaneously as the board
column order, the source for a zod enum on writes, the one sanctioned cast on
reads, and a CHECK constraint in the database. Values use IN_PROGRESS with an
underscore so the PostgreSQL port is a pure ALTER COLUMN with zero data
transformation.

**Priority.** Int at 10, 20, 30, 40 for Low, Medium, High, Urgent, higher
meaning more urgent, default 20. Integer because priority is ordinal and BRD-13
sorts by it. The CHECK constraint admits exactly these four values.

**Dates.** dueOn, startOn, and targetOn are calendar days stored as UTC
midnight, named with the On suffix rather than Date to keep that visible at
every call site. Construction goes through toCalendarDate and reading goes
through one formatter; a stray new Date(userInput) in a non-UTC process writes
the wrong calendar day. The test suite runs under a non-UTC timezone while the
server is pinned to UTC, so that class of bug fails in tests rather than on a
client's screen.

**statusChangedAt.** Set on create and rewritten on every status change. Powers
BRD-8, the blocked duration on a card.

**completedAt.** Set when a task enters DONE and cleared when it leaves. It is
the only derived-looking column that is stored, and it is stored because
"finished in the last 30 days" needs it and it cannot be recovered afterward.

**Deletion.** Hard delete with onDelete Cascade. Soft delete was rejected
because one forgotten filter puts a deleted card on a board during a screen
share. Archive is a separate, reversible, lossless archivedAt on Project that
touches no task.

### 6.3 Indexes

| Index | Serves |
| --- | --- |
| Project.archivedAt | The dashboard filter, which excludes archived projects on every load |
| Task.projectId + status | The board query and the dashboard groupBy |
| Task.projectId + dueOn | The due date filter and sort |

### 6.4 Migrations

Migrations are generated with prisma migrate dev, committed, and never edited
after they have been applied anywhere. The database file is gitignored; the
migration history is the durable artifact.

One ritual must be documented and followed: on SQLite, Prisma implements every
structural change as a table rebuild driven by its own generated DDL, which has
no knowledge of hand-added CHECK constraints. A routine migration six months
from now will silently drop them. The mitigation is a schema-guard test that
reads sqlite_master and asserts each constraint by name, so their loss fails
the suite in the commit that caused it. Without that test the constraints are a
comforting lie.

### 6.5 The path to PostgreSQL

Kept cheap by four rules followed from the first commit: every timestamp in
UTC; no reliance on SQLite loose typing; status and priority as portable
String and Int with application constants; every foreign key and cascade
declared in the schema rather than enforced only in code.

The move itself is a datasource provider change, a regenerated migration
history against an empty PostgreSQL database, and a data copy. Status becomes a
real PostgreSQL enum at that point with no value rewriting, because the stored
strings were chosen to be valid enum labels.

### 6.6 The multi-user seam

Not built now. When multi-user is promoted, the change is a User model, an
ownerId on Project with an index, and a filter on ownerId in the project
queries. Tasks are reached through their project and need no owner column.
Nothing in the MVP schema contradicts that addition, which is why adding it
later is a migration rather than a rewrite.

---
## 7. Server contract

Every write is a Server Action. There are no route handlers in the MVP, because
there is no external consumer of an API.

Actions return a discriminated union rather than throwing for expected
outcomes:

    type ActionResult<T = void> =
      | { ok: true; data: T }
      | { ok: false; formErrors: Record<string, string[]>; message?: string }

Expected outcomes are validation failures and acting on a missing record. A
genuine fault, such as the database being unreachable, throws and hits the
route error boundary. That distinction is the whole error strategy.

### 7.1 Project actions

As built in Slice 2. The id and destination are bound on the server page
with .bind; forms post everything else.

    createProject(prev: FormState, form: FormData): Promise<FormState>
    updateProject(id: string, prev: FormState, form: FormData): Promise<FormState>
    archiveProject(id: string): Promise<void>
    restoreProject(id: string, destination: "dashboard" | "archived" | "project"): Promise<void>
    deleteProject(id: string, prev: FormState, form: FormData): Promise<FormState>

createProject and updateProject redirect to the project page. archiveProject
redirects to /?archived=<slug>, where the dashboard offers Undo.
restoreProject redirects to the dashboard, to the archived list with a
restored notice, or to the project page, chosen from a fixed set so a crafted
form cannot redirect elsewhere. deleteProject reads the typed name from the
confirmation field and compares it with the stored name inside the delete
statement itself (BR-5); the confirmation is a server-side rule, not a
client-side dialog that can be skipped. It redirects to /?deleted=<name>.

Archive and restore are plain buttons with nowhere to show an error, so a
project deleted meanwhile sends them to /?missing=1 instead (PER-4).

Revalidation: every project action revalidates the dashboard, the archived
list, and the project page.

### 7.2 Task actions

As built in Slice 3 (moveTask arrives in Slice 4):

    createTask(projectId: string, prev: FormState, form: FormData): Promise<FormState>
    updateTask(taskId: string, prev: FormState, form: FormData): Promise<FormState>
    deleteTask(taskId: string): Promise<FormState>
    moveTask(taskId: string, toStatus: TaskStatus): Promise<ActionResult>

All three redirect to the project page; deleteTask adds ?deletedTask=<title>
for the notice. The redirect slug is read from the database after the write,
never taken from the request. The task form has no status field (developer
decision, 2026-09-30); tasks start as New, and the service's optional status
parameter exists for the board's per-column add (BR-14) and the seed.

moveTask is the single entry point for a status change. Drag and drop and the
explicit control both call it, which is why the keyboard path costs almost
nothing once drag exists, and why shipping the control first costs nothing
either. It is idempotent: moving a task to the status it already has succeeds
and writes nothing.

Revalidation: every task action revalidates the dashboard and everything under
the project's URL.

### 7.3 Read functions

Reads are plain async functions called directly from Server Components, not
actions.

    listProjectSummaries(opts: { includeArchived: boolean }): Promise<ProjectSummary[]>
    getProjectBySlug(slug: string): Promise<Project | null>
    listTasksForBoard(projectId: string, filters: TaskFilters): Promise<BoardData>
    getTask(taskId: string): Promise<Task | null>

---

## 8. Validation

zod is accepted. It earns its place because FormData arrives as unknown strings
and something must parse and coerce it; hand-written parsing for eleven fields
across two forms is more code than the dependency, and zod produces the
field-error map the forms already need.

Validation runs in exactly one place: the top of each Server Action, before the
service is called. Not in the service, not in the component, not in both.
Client-side validation is limited to native HTML attributes such as required
and maxlength, which are a convenience and never the only check (NFR-17).

### 8.1 Rules per field

| Field | Rule |
| --- | --- |
| Project name | Trimmed, 1 to 120 characters, required |
| Project description | Trimmed, 0 to 2000 characters, empty becomes null |
| Project lifecycle | One of PLANNING, ACTIVE, ON_HOLD, COMPLETE |
| Project startOn, targetOn | Optional calendar date; if both are set, targetOn must not precede startOn |
| Task title | Trimmed, 1 to 200 characters, required |
| Task description | Trimmed, 0 to 5000 characters, empty becomes null |
| Task status | One of the five status constants |
| Task priority | One of 10, 20, 30, 40 |
| Task dueOn | Optional calendar date; past dates are valid (TSK-13) |

### 8.2 What not to write

The no-unnecessary-defensive-programming rule applies here with force:

- No try/catch that only rethrows, or logs and continues.
- No null check on a value that cannot be null by construction. If a Server
  Component already loaded the project, the service does not re-check it.
- No revalidation of the same rule in the component, the action, and the
  service. The action validates; the service trusts its typed input.

What is caught: zod parse failures, which become form errors; Prisma's
record-not-found error, which becomes a loud "this no longer exists" message
satisfying PER-4; and nothing else.

---

## 9. Business rules

These live in the service layer and hold regardless of the interface.

| ID | Rule |
| --- | --- |
| BR-1 | Archiving a project sets archivedAt and touches no task. Tasks keep their status. |
| BR-2 | An archived project and its tasks are read-only. Every edit to the project or its tasks refuses while archivedAt is set. Restore and permanent delete remain available (developer decision, 2026-09-29). |
| BR-3 | Restoring a project clears archivedAt and restores writability. Nothing else changes. |
| BR-4 | Deleting a project deletes every one of its tasks by database cascade. |
| BR-5 | Deleting a project requires the submitted name to match the stored name exactly. |
| BR-6 | A task may move from any status to any other status. There is no forbidden transition, including DONE back to IN_PROGRESS. |
| BR-7 | Entering DONE sets completedAt. Leaving DONE clears it. |
| BR-8 | A move sets statusChangedAt only when the new status differs from the current one. A move to the status the task already has is a no-op and writes nothing. |
| BR-9 | Project progress is DONE tasks divided by total tasks, computed per request and never stored. |
| BR-10 | A project with zero tasks has no progress percentage. It reports "No tasks yet", not zero percent. |
| BR-11 | Project lifecycle is set by the user and is never inferred from tasks. |
| BR-12 | Archived projects are excluded from the dashboard and from every dashboard total. |
| BR-13 | Order within a column is priority descending, then dueOn ascending with nulls last, then createdAt ascending. |
| BR-14 | A task created from a column control takes that column status; one created from the project-level control takes NEW. |
| BR-15 | A slug is generated from the name at creation, made unique with a numeric suffix if needed, and never changes afterward. |
| BR-16 | Acting on a deleted record fails loudly and reports that it no longer exists. |

BR-6 deserves a note. It is tempting to forbid DONE to NEW or to warn on
backward moves. Every such rule is a rule the user has to fight on the day the
work genuinely goes backward, which happens. The board's job is to record
reality, not to police it.

---

## 10. Queries

### 10.1 The dashboard aggregate

The one query shape that must not be written naively. Two queries total,
independent of project count:

    const projects = await db.project.findMany({
      where: { archivedAt: includeArchived ? undefined : null },
      orderBy: { createdAt: "desc" },
    });

    const counts = await db.task.groupBy({
      by: ["projectId", "status"],
      _count: { _all: true },
      where: { projectId: { in: projects.map((p) => p.id) } },
    });

The domain layer joins them into ProjectSummary values and computes progress.
Iterating projects and querying per project is the obvious wrong version and is
a defect under NFR-7.

### 10.2 The board query

One query, ordered in the database so the domain layer does not re-sort the
whole set:

    const tasks = await db.task.findMany({
      where: { projectId, ...filterClause },
      orderBy: [
        { priority: "desc" },
        { dueOn: "asc" },
        { createdAt: "asc" },
      ],
    });

SQLite sorts NULL first on ascending order, so the nulls-last part of BR-13 is
applied in the domain layer when grouping into columns. This is one of the
SQLite behaviors that differs from PostgreSQL, which is exactly why it is
handled in domain code and covered by a unit test rather than left to the
database.

### 10.3 Filters

Filters compose into the where clause. The due date filter maps its fixed
choice set onto date ranges computed from today in the server timezone:
overdue is dueOn less than today with status not DONE, due today is dueOn equal
to today, due within 7 days is dueOn between today and today plus 7, has no due
date is dueOn null.

---
## 11. Interface specification

The full specification, including every copy string, layout sketch, and
breakpoint, is in docs/plan/03-user-experience-and-interface.md. This section
records the decisions that constrain implementation.

### 11.1 Screens

| Screen | URL |
| --- | --- |
| Dashboard | / |
| Archived projects | /projects/archived |
| New project | /projects/new |
| Project page, becomes the board in Slice 4 | /projects/[slug] |
| Edit project | /projects/[slug]/edit |
| Delete project confirmation | /projects/[slug]/delete |
| Task detail | /projects/[slug]/tasks/[taskId] |

### 11.2 Label casing

Stored values are constants; displayed values are sentence case: New, To do,
In progress, Blocked, Done. CLAUDE.md requires plain language with no jargon
and no abbreviations, and NEW or IN PROGRESS in all caps reads as a machine
constant and scans more slowly. This is a deliberate reading of the contract
and is ratified in the decision log.

### 11.3 The board summary line

One sentence directly under the toolbar, at 14px with tabular numerals:

    34 tasks: 4 new, 9 to do, 3 in progress, 2 blocked, 16 done

This is the highest-value element for the five-second read because it survives
being photographed or viewed from across a room, and it is also the summary a
screen reader user hears before navigating a single card. When a filter is
active a second line appears: "Filters are hiding 6 tasks." with a Clear
filters text button.

### 11.4 Making Blocked distinct

Five redundant, independent cues, so the distinction survives grayscale and
every form of color blindness:

1. The word. The column is headed Blocked.
2. Surface temperature. The column body is warm at #FFF7ED with a #FFEDD5
   header, against the cool #EFF1F4 of the other four.
3. Border weight. A 3px bottom border on the header against 1px elsewhere.
4. Pill fill. The count pill is solid; every other column's is outlined.
5. Darkness. The #92400E accent has luminance 0.098, roughly 60 percent darker
   than the next darkest status color, so it is the heaviest thing on the board.

Deliberately not used: red, an alarm glyph, an exclamation mark, a pulsing
animation, or a per-card badge. Amber-brown reads as "this needs a decision";
red reads as "something has broken", and a board with two blocked items is a
normal healthy board.

The shipping check: screenshot the board, convert to grayscale, confirm Blocked
is still obvious.

### 11.5 The task card

Title, priority, and due date when set. Nothing else, per CLAUDE.md.

Priority is shown by chip weight rather than four colors, so the ladder reads
in grayscale: Urgent is a solid dark fill with white text, High is a tinted fill
with dark text, Medium is outlined, and Low is bare text. Four densities rather
than four hues is what keeps a board of mostly-Medium tasks calm, so Urgent and
High actually stand out.

An overdue due date renders in #B91C1C with the word "Overdue" rather than
color alone. A card in Blocked additionally shows how long it has been blocked,
computed from statusChangedAt.

A long title is clamped to three lines on the card; the full title is on the
detail view.

### 11.6 Moving a card without dragging

Two independent non-drag paths, and the plain one ships first:

- Slice 4 ships a labelled select inside a form on the task detail view and on
  the card. It is a native control, so keyboard, screen reader, touch, and
  no-JavaScript all work with zero custom ARIA, and it satisfies BRD-10 and
  NFR-27 before dnd-kit is installed at all.
- Slice 5 adds the designed card actions menu with roving focus, type-ahead,
  and printed shortcut hints, plus number keys 1 through 5 on a focused card.
  The native form remains as the no-JavaScript fallback.

Single-key shortcuts are suppressed whenever the event target is an input,
textarea, select, or contenteditable, or whenever a dialog is open.

### 11.7 Drag behavior

A column is a single drop zone. The whole column tints on drag-over; there is
no insertion indicator between cards, because there is no in-column ordering to
indicate. Drag is disabled entirely below 768 pixels, where the menu is the
mechanism. A failed drop returns the card to its origin column and states what
went wrong. Every move, dragged or not, is announced in a live region.

### 11.8 Dashboard

A project summary card shows the name, the lifecycle badge, a progress bar with
a text value beside it, and the per-status breakdown. A project needing
attention surfaces an explicit line naming the reason, such as blocked or
overdue counts. Blocked is not a project lifecycle value: a project with one
blocked task and four in progress is simply active, and blockage surfaces
through the more precise attention line instead.

A project with zero tasks shows "No tasks yet", never zero percent, which would
imply work that has not started rather than work that does not exist.

### 11.9 Forms and destructive actions

Create and edit both use a modal dialog built on the native dialog element,
which gives focus trapping and Escape handling without custom code.

Validation errors render beside their field, are programmatically associated
with it, and never appear only as a summary.

Irreversible actions confirm; reversible ones offer undo. Deleting a project
requires typing its name. Deleting a task takes a simple confirmation.
Archiving a project shows no dialog at all, only an undoable toast. Confirming
everything trains a user to dismiss dialogs unread, which is how the one
confirmation that mattered gets clicked through.

### 11.10 Color tokens

All colors are semantic CSS custom properties, which is what makes dark mode a
later one-block change rather than a refactor.

| Token | Hex | Role |
| --- | --- | --- |
| --color-canvas | #F6F7F9 | Page background |
| --color-surface | #FFFFFF | Cards, dialogs, inputs |
| --color-surface-sunken | #EFF1F4 | Column bodies |
| --color-border | #DDE1E7 | Default hairline |
| --color-text | #16202B | Primary text |
| --color-text-muted | #5A6675 | Dates, counts, secondary text |
| --color-primary | #1D4ED8 | Primary button, links, focus ring |
| --color-danger | #B91C1C | Overdue, delete, error text |

Status accents, each meeting WCAG AA on both white and its own tint: New
#6D28D9, To do #475569, In progress #1D4ED8, Blocked #92400E, Done #15803D.
The tightest pair is Done on its own tint at 4.79 to 1, which clears 4.5 and is
used only for a 13px weight-600 label, never body copy.

Priority chips, as a weight ladder rather than a hue scale:

| Priority | Treatment | Text | Fill | Contrast |
| --- | --- | --- | --- | --- |
| Urgent | Solid fill, white text | #FFFFFF | #991B1B | 8.3 to 1 |
| High | Tinted fill, dark text | #991B1B | #FEE2E2, #FCA5A5 border | 6.80 to 1 |
| Medium | Outlined | #5A6675 | transparent, #DDE1E7 border | 5.85 to 1 |
| Low | Bare text | #667180 | none | 4.95 to 1 |

Urgent uses red where Blocked uses amber-brown, and that separation is
deliberate rather than incidental. Red is a priority the user chose; amber is a
state the work is in. A single card can be both an Urgent task and a Blocked
one, so the two signals must never be confusable. This is the one real design
consequence of adding a fourth priority level, because a three-level scale never
needed a color strong enough to compete with the Blocked column.

### 11.11 Responsive

| Width | Board layout |
| --- | --- |
| 1280 and up | Five columns visible, no horizontal scroll |
| 1024 to 1279 | Five columns, horizontal scroll with snap |
| 768 to 1023 | Horizontal scroll, drag still enabled |
| Below 768 | Single column at a time with a status switcher; drag disabled, menu is the move mechanism |

---

## 12. Testing strategy

Tests live beside the code they test. Every bug fixed gets a test that would
have caught it.

| Layer | Approach |
| --- | --- |
| Domain | Plain Vitest unit tests. Highest value per line: sorting, progress arithmetic, date state, the drag decision, status transitions. No mocks needed because there is no I/O. |
| Services | Vitest against a real SQLite file, not a mock. A per-test-file database in a temp directory, deleted afterward, so a test run can never touch the development database (NFR-23). |
| Components | React Testing Library in jsdom for forms and the keyboard move path. |
| End to end | Exactly one Playwright spec covering the happy path, added in Slice 8. |
| Schema guard | A test that reads sqlite_master and asserts each CHECK constraint by name, so a Prisma table rebuild that drops them fails the suite. |

**The dnd-kit testing problem.** Do not simulate pointer drags in jsdom; those
tests assert the behavior of your own stubs and pass while the feature is
broken. Instead extract the decision from the gesture: a pure
resolveDragEnd({ activeId, overId, fromStatus }) in src/lib/domain/board.ts
holds the only interesting logic and is trivially unit tested, leaving the
dnd-kit handler with three lines that are not worth testing. The keyboard path
is tested properly in RTL. Pointer dragging is covered exactly once in the
Playwright spec, which can be deleted if it flakes without losing coverage of
anything that matters.

**Deliberately not tested:** Prisma itself, Next.js routing, Tailwind output,
and the visual appearance of components. The five-second test in section 4.1 is
a manual procedure run once before the MVP gate, not an automated check.

The timezone rule: the test suite runs under a non-UTC timezone while the
server is pinned to UTC, so that calendar-date bugs surface in tests rather
than on a client's screen.

---

## 13. Incremental delivery plan

Each slice leaves the application runnable and demonstrable. This supersedes
the numbered list in projectdevelopmentstatus.md, which is updated to match.

Five corrections were made to that list: the end-of-project test pass was
removed because it contradicts Rule 2 and tests belong inside each slice; the
two data-model items were folded into the slices that need them because they
are not independently demonstrable; and three missing MVP requirements were
added, namely archiving a project, deleting a task, and the keyboard move
control, which was scheduled nowhere despite being a recorded decision.

| Slice | The user can | Done when |
| --- | --- | --- |
| 0. Repository and shell | See a running page at localhost | git initialized, Next.js and Tailwind scaffolded, .env.example committed, README documents one run command, lint and test scripts pass with zero tests |
| 1. Projects persist | Create a project and see it listed | Prisma schema for Project, first migration, create form, dashboard list, service tests against a real database |
| 2. Project lifecycle | Edit, archive, restore, and delete a project | Edit form, archive with undo, restore, type-the-name delete, archived view, BR-1 through BR-5 and BR-15 tested |
| 3. Tasks exist | Create, edit, and delete tasks in a project, seen as a plain list | Task model and migration, task forms, task detail view, delete confirmation, seed script |
| 4. The board, with the accessible move control | See the kanban board and move a card between statuses by keyboard | Five columns, counts, empty columns, card anatomy, summary line, Blocked treatment, native select move form, moveTask action, BR-6 through BR-8 tested. MVP requirements 4 and 5 are met here. |
| 5. Drag and drop | Drag a card between columns | dnd-kit installed, optimistic update, failure rollback, live-region announcement, card actions menu, number-key shortcuts, resolveDragEnd unit tested |
| 6. The dashboard | See status and progress across all projects at a glance | Two-query aggregate, progress bar, per-status breakdown, attention line, zero and twenty project states, NFR-7 verified by counting queries |
| 7. Filtering and sorting | Filter by priority and due date, show and hide columns, change the sort | Filter toolbar, URL state, filtered counts, clear-filters action |
| 8. Hardening and the MVP gate | Trust it | One Playwright happy-path spec, the five-second test run with a real person, grayscale screenshot check, accessibility pass, 100-card and 20-project performance checks against section 4.2 |

Slice 5 is the only slice that can be abandoned without failing the MVP,
because slice 4 already satisfies requirement 4. That is the reason for the
ordering.

---

## 14. Risks

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| The RSC and server-action mental model fails silently | High | High | Importing a service into a client component bundles Prisma for the browser; a forgotten revalidatePath leaves the board stale; "use client" in a layout converts the whole subtree. None fail loudly and all are the default thing to write. The server-only package, the ESLint import zones, and the single Playwright spec exist specifically to convert these into build and test failures. |
| CHECK constraints silently dropped by a Prisma migration | Medium | High | On SQLite every structural change is a table rebuild from Prisma's own DDL, which does not know about hand-added constraints. The schema-guard test fails in the commit that causes it; the documented ritual is to paste the constraint lines back into any generated migration that rebuilds a table. |
| Calendar dates written a day off | Medium | High | A deadline wrong by a day on a client-facing board is a credibility bug. All construction routes through toCalendarDate, new Date(userInput) is banned for date-only values, and tests run under a non-UTC timezone. |
| dnd-kit accessibility and testing | Medium | Medium | The accessible path ships first in Slice 4 and does not depend on dnd-kit. The drag decision is extracted into a pure function. Slice 5 is abandonable. |
| Users expect to reorder within a column | High | Low | Documented in section 2.1 with an explicit revisit trigger. A one-time hint explains the behavior rather than swallowing the gesture. |
| Done column grows to hundreds of cards | High | Medium | 50-card cap per column with an explicit indication that more exist. The post-MVP fix is a "finished in the last 30 days" default for Done. |
| Scope leaks into deferred features | High | Medium | The ten adjacency points are named in docs/plan/01-requirements-business-analysis.md section 6: filters next to saved views, BLOCKED next to dependencies, progress next to burndown, notes next to attachments. Any of them requires an explicit decision recorded in CLAUDE.md section 7. |
| params and searchParams are Promises in Next 15 and later (the project is on 16) | High | Low | Must be awaited. A common early bug in exactly the two dynamic routes this app has. Caught at build time by TypeScript if strict mode is on. |
| No authentication, if the app is ever exposed | Low | High | Bind to localhost. Hosting is a post-MVP slice gated on authentication, not a deployment detail. |

---

## 15. Open items requiring the developer's confirmation

These change the schema or the product and are cheap now, expensive later.
CLAUDE.md Rule 5 requires confirmation before the schema is written. Five of
the seven were answered on 2026-09-16; the two that remain still gate Slice 1.

### Confirmed by the developer on 2026-09-16

1. **Project lifecycle values.** PLANNING, ACTIVE, ON_HOLD, COMPLETE, defaulting
   to ACTIVE. CONFIRMED. This also settles the derived-versus-manual project
   status question that was open in CLAUDE.md section 7, because it confirms the
   manual lifecycle half of the split described in section 2.1.
2. **Priority levels.** CHANGED BY THE DEVELOPER. Four levels, not three: Low,
   Medium, High, Urgent, stored as 10, 20, 30, 40, defaulting to Medium.
   Sections 2.1, 3.2, 6.2, 8.1, 11.5, and 11.10 are updated to match.
3. **Delete cascades to tasks.** CONFIRMED.
4. **dueOn is a calendar day, not an instant.** CONFIRMED.
5. **statusChangedAt is in scope.** CONFIRMED.

### Confirmed by the developer on 2026-09-29

6. **Slugs are immutable after creation.** CONFIRMED. Renaming a project does
   not change its URL, because a URL that changes underneath a bookmark is worse
   than a URL that no longer matches a renamed project. BR-15 stands as written.
7. **The four promoted gaps in section 2.3.** CONFIRMED, all four: restore an
   archived project, confirmation before delete, the task detail view, and the
   enumerated value sets. Only the value sets touch the schema; the other three
   are screens and server checks.

Nothing in this section remains open. Slice 1 is unblocked.

---

## 16. What the next session does

1. Slice 4: the kanban board with the accessible move control. Five columns,
   counts, empty columns, card anatomy, summary line, Blocked treatment, the
   native move control, moveTask, and BR-6 to BR-8 tested.

Do not start Slice 1 before those two are answered. The schema is the durable
asset and it is the one thing that is expensive to change later.
