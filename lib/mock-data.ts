import type {
  AppData,
  Announcement,
  Participant,
  ActivityEvent,
  AttendanceMap,
  Transaction,
  User,
} from "@/lib/types";

const users: User[] = [];

const participants: Participant[] = [];

const events: ActivityEvent[] = [];

const attendance: AttendanceMap = {};

const transactions: Transaction[] = [];

const announcements: Announcement[] = [];

export function createSeedData(): AppData {
  return {
    users,
    participants,
    events,
    attendance,
    transactions,
    announcements,
  };
}
