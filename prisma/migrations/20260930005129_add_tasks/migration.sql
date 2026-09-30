-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "priority" INTEGER NOT NULL DEFAULT 20,
    "dueOn" DATETIME,
    "statusChangedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    -- Hand-added. Prisma drops these on any table rebuild; paste them back.
    CONSTRAINT "Task_status_check"
        CHECK ("status" IN ('NEW', 'TODO', 'IN_PROGRESS', 'BLOCKED', 'DONE')),
    CONSTRAINT "Task_priority_check"
        CHECK ("priority" IN (10, 20, 30, 40)),
    CONSTRAINT "Task_title_check"
        CHECK (length(trim("title")) BETWEEN 1 AND 200),
    CONSTRAINT "Task_completedAt_check"
        CHECK (("status" = 'DONE') = ("completedAt" IS NOT NULL)),
    CONSTRAINT "Task_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Task_projectId_status_idx" ON "Task"("projectId", "status");

-- CreateIndex
CREATE INDEX "Task_projectId_dueOn_idx" ON "Task"("projectId", "dueOn");
