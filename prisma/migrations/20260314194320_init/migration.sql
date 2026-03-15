-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "capacityMw" REAL,
    "owner" TEXT,
    "epc" TEXT,
    "noticeToProceedDate" DATETIME,
    "targetCompletionDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Submittal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "submittalNumber" TEXT NOT NULL,
    "specSection" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "equipmentCategory" TEXT NOT NULL,
    "submittalType" TEXT NOT NULL DEFAULT 'product_data',
    "discipline" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'not_submitted',
    "revision" INTEGER NOT NULL DEFAULT 0,
    "submittedDate" DATETIME,
    "reviewDueDate" DATETIME,
    "approvedDate" DATETIME,
    "linkedPoDate" DATETIME,
    "manufacturingLeadTimeWeeks" INTEGER NOT NULL,
    "requiredOnSiteDate" DATETIME NOT NULL,
    "shippingBufferDays" INTEGER NOT NULL DEFAULT 14,
    "poProcessingDays" INTEGER NOT NULL DEFAULT 10,
    "vendor" TEXT NOT NULL,
    "vendorContact" TEXT,
    "vendorEmail" TEXT,
    "reviewer" TEXT NOT NULL,
    "reviewerEmail" TEXT,
    "submitter" TEXT,
    "riskLevel" TEXT,
    "riskScore" REAL,
    "daysUntilCritical" INTEGER,
    "riskCalculatedAt" DATETIME,
    "riskNotes" TEXT,
    "notes" TEXT,
    "sourceRow" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Submittal_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SubmittalStatusHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "submittalId" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT NOT NULL,
    "changedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changedBy" TEXT,
    "notes" TEXT,
    CONSTRAINT "SubmittalStatusHistory_submittalId_fkey" FOREIGN KEY ("submittalId") REFERENCES "Submittal" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Escalation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "submittalId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "recipientEmail" TEXT,
    "urgencyLevel" TEXT NOT NULL,
    "aiModel" TEXT,
    "promptVersion" TEXT,
    "generationTimeMs" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "editedBody" TEXT,
    "approvedAt" DATETIME,
    "approvedBy" TEXT,
    "sentAt" DATETIME,
    "dismissedAt" DATETIME,
    "dismissReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Escalation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Escalation_submittalId_fkey" FOREIGN KEY ("submittalId") REFERENCES "Submittal" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UploadLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "filename" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "rowCount" INTEGER NOT NULL,
    "importedCount" INTEGER NOT NULL,
    "skippedCount" INTEGER NOT NULL,
    "errorCount" INTEGER NOT NULL,
    "columnMapping" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL DEFAULT 'system',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "LeadTimeReference" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "equipmentCategory" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "typicalLeadTimeWeeks" INTEGER NOT NULL,
    "minLeadTimeWeeks" INTEGER NOT NULL,
    "maxLeadTimeWeeks" INTEGER NOT NULL,
    "typicalReviewDays" INTEGER NOT NULL,
    "notes" TEXT
);

-- CreateIndex
CREATE UNIQUE INDEX "Project_code_key" ON "Project"("code");

-- CreateIndex
CREATE INDEX "Submittal_projectId_riskLevel_idx" ON "Submittal"("projectId", "riskLevel");

-- CreateIndex
CREATE INDEX "Submittal_projectId_status_idx" ON "Submittal"("projectId", "status");

-- CreateIndex
CREATE INDEX "Submittal_equipmentCategory_idx" ON "Submittal"("equipmentCategory");

-- CreateIndex
CREATE UNIQUE INDEX "Submittal_projectId_submittalNumber_key" ON "Submittal"("projectId", "submittalNumber");

-- CreateIndex
CREATE INDEX "Escalation_projectId_status_idx" ON "Escalation"("projectId", "status");

-- CreateIndex
CREATE INDEX "Escalation_submittalId_idx" ON "Escalation"("submittalId");

-- CreateIndex
CREATE UNIQUE INDEX "LeadTimeReference_equipmentCategory_key" ON "LeadTimeReference"("equipmentCategory");
