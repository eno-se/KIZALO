-- DropForeignKey
ALTER TABLE "BlockedFan" DROP CONSTRAINT "BlockedFan_creatorId_fkey";

-- DropForeignKey
ALTER TABLE "BlockedFan" DROP CONSTRAINT "BlockedFan_fanId_fkey";

-- AlterTable
ALTER TABLE "CreatorProfile" DROP COLUMN "showKizakiCard",
ADD COLUMN     "showMostCard" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showStreakCard" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "cardOrder" SET DEFAULT 'fastest,random,most,streak';

-- DropTable
DROP TABLE "BlockedFan";
