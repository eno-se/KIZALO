-- CreateIndex
CREATE INDEX "FanFollow_creatorId_totalKizari_idx" ON "FanFollow"("creatorId", "totalKizari");

-- CreateIndex
CREATE INDEX "FanFollow_creatorId_streakDays_idx" ON "FanFollow"("creatorId", "streakDays");

-- CreateIndex
CREATE INDEX "Kizari_creatorId_date_createdAt_idx" ON "Kizari"("creatorId", "date", "createdAt");
