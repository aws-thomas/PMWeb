-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "lifecycle" TEXT NOT NULL DEFAULT 'ACTIVE',
    "startOn" DATETIME,
    "targetOn" DATETIME,
    "archivedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    -- Hand-added. Prisma drops these on any table rebuild; paste them back.
    CONSTRAINT "Project_lifecycle_check"
        CHECK ("lifecycle" IN ('PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETE')),
    CONSTRAINT "Project_name_check"
        CHECK (length(trim("name")) BETWEEN 1 AND 120),
    CONSTRAINT "Project_dates_check"
        CHECK ("startOn" IS NULL OR "targetOn" IS NULL OR "targetOn" >= "startOn")
);

-- CreateIndex
CREATE UNIQUE INDEX "Project_slug_key" ON "Project"("slug");

-- CreateIndex
CREATE INDEX "Project_archivedAt_idx" ON "Project"("archivedAt");
