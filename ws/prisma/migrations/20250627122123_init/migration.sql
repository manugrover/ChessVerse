
-- DropForeignKey
ALTER TABLE "Game" DROP CONSTRAINT "Game_blackPlayerId_fkey";

-- DropForeignKey
ALTER TABLE "Game" DROP CONSTRAINT "Game_whitePlayerId_fkey";

-- DropIndex
DROP INDEX "User_rating_idx";

-- AlterTable
ALTER TABLE "Game" DROP COLUMN "StartingFen",
DROP COLUMN "currentFen",
DROP COLUMN "endAt",
DROP COLUMN "event",
DROP COLUMN "opening",
DROP COLUMN "startAt",
DROP COLUMN "timeControl";

-- AlterTable
ALTER TABLE "Move" DROP COLUMN "after",
DROP COLUMN "before",
DROP COLUMN "comments",
DROP COLUMN "createdAt",
DROP COLUMN "san",
DROP COLUMN "timeTaken";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "createdAt",
DROP COLUMN "lastLogin",
DROP COLUMN "password",
DROP COLUMN "provider";

-- DropTable
DROP TABLE "Otp";

-- DropEnum
DROP TYPE "AuthProvider";

-- DropEnum
DROP TYPE "TimeControl";

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
