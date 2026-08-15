-- DropForeignKey
ALTER TABLE "Attendance" DROP CONSTRAINT "Attendance_participantId_fkey";

-- DropIndex
DROP INDEX "Attendance_eventId_participantId_key";

-- AlterTable
ALTER TABLE "Attendance" DROP COLUMN "participantId",
ADD COLUMN     "memberId" TEXT NOT NULL;

-- DropTable
DROP TABLE "Participant";

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_eventId_memberId_key" ON "Attendance"("eventId", "memberId");

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
