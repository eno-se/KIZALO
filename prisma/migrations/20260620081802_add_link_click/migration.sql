-- CreateTable
CREATE TABLE "LinkClick" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "linkId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LinkClick_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LinkClick_creatorId_date_idx" ON "LinkClick"("creatorId", "date");

-- AddForeignKey
ALTER TABLE "LinkClick" ADD CONSTRAINT "LinkClick_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "CreatorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
