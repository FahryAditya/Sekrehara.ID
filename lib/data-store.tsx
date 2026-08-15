"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  AttendanceMap,
  AttendanceStatus,
  Role,
  TransactionType,
} from "@/lib/types";
import { listAllMembersAction } from "@/lib/members-actions";
import type { MemberListItem } from "@/lib/members-actions";
import {
  createEventAction,
  deleteEventAction,
  listAllAttendanceAction,
  listEventsAction,
  setAttendanceStatusAction,
  type EventItem,
} from "@/lib/events-actions";
import {
  createTransactionAction,
  deleteTransactionAction,
  listTransactionsAction,
  type TransactionItem,
} from "@/lib/transactions-actions";
import {
  createAnnouncementAction,
  listAnnouncementsAction,
  type AnnouncementItem,
} from "@/lib/announcements-actions";
import {
  createUserAction,
  deleteUserAction,
  listUsersAction,
  type AdminUserItem,
} from "@/lib/users-actions";
import { updateUserRoleAction } from "@/lib/roles-actions";

type NewParticipantInput = {
  name: string;
  phone: string;
  email: string;
  kelas?: string | null;
  jurusan?: string | null;
  nomorInduk?: string | null;
};

type NewEventInput = {
  name: string;
  date: string;
  description: string;
};

type NewTransactionInput = {
  type: TransactionType;
  category: string;
  amount: number;
  description: string;
  date: string;
};

type NewAnnouncementInput = {
  subject: string;
  body: string;
  recipientCount: number;
};

type NewUserInput = {
  name: string;
  email: string;
  password: string;
  role: Role;
};

export type MutationResult = { ok: boolean; error?: string };

type DataStoreValue = {
  users: AdminUserItem[];
  participants: MemberListItem[];
  events: EventItem[];
  attendance: AttendanceMap;
  transactions: TransactionItem[];
  announcements: AnnouncementItem[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addParticipant: (input: NewParticipantInput) => Promise<MutationResult>;
  updateParticipant: (participantId: string, input: NewParticipantInput) => Promise<MutationResult>;
  deleteParticipant: (participantId: string) => Promise<MutationResult>;
  addEvent: (input: NewEventInput) => Promise<MutationResult>;
  deleteEvent: (eventId: string) => Promise<MutationResult>;
  setAttendanceStatus: (
    eventId: string,
    memberId: string,
    status: AttendanceStatus
  ) => Promise<MutationResult>;
  addTransaction: (input: NewTransactionInput) => Promise<MutationResult>;
  deleteTransaction: (transactionId: string) => Promise<MutationResult>;
  addAnnouncement: (input: NewAnnouncementInput) => Promise<MutationResult>;
  addUser: (input: NewUserInput) => Promise<MutationResult>;
  updateUserRole: (userId: string, role: Role) => Promise<MutationResult>;
  deleteUser: (userId: string) => Promise<MutationResult>;
};

const DataStoreContext = createContext<DataStoreValue | null>(null);

export function DataStoreProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [participants, setParticipants] = useState<MemberListItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [attendance, setAttendance] = useState<AttendanceMap>({});
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await Promise.all([
        listUsersAction(),
        listAllMembersAction(),
        listEventsAction(),
        listAllAttendanceAction(),
        listTransactionsAction(),
        listAnnouncementsAction(),
      ]);
      setUsers(data[0]);
      setParticipants(data[1]);
      setEvents(data[2]);
      setAttendance(data[3]);
      setTransactions(data[4]);
      setAnnouncements(data[5]);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Gagal memuat data.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      listUsersAction(),
      listAllMembersAction(),
      listEventsAction(),
      listAllAttendanceAction(),
      listTransactionsAction(),
      listAnnouncementsAction(),
    ])
      .then((data) => {
        if (cancelled) return;
        setUsers(data[0]);
        setParticipants(data[1]);
        setEvents(data[2]);
        setAttendance(data[3]);
        setTransactions(data[4]);
        setAnnouncements(data[5]);
      })
      .catch((loadError) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Gagal memuat data.");
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const addParticipant = useCallback(
    async (input: NewParticipantInput): Promise<MutationResult> => {
      try {
        const { createMemberAction } = await import("@/lib/members-actions");
        const result = await createMemberAction({
          name: input.name,
          phone: input.phone,
          email: input.email,
          kelas: input.kelas,
          jurusan: input.jurusan,
          nomorInduk: input.nomorInduk,
        });
        if ("error" in result) return { ok: false, error: result.error };
        await refresh();
        return { ok: true };
      } catch (mutateError) {
        return {
          ok: false,
          error: mutateError instanceof Error ? mutateError.message : "Gagal menambah peserta.",
        };
      }
    },
    [refresh]
  );

  const deleteParticipant = useCallback(
    async (participantId: string): Promise<MutationResult> => {
      try {
        const { deleteMemberAction } = await import("@/lib/members-actions");
        const result = await deleteMemberAction(participantId);
        if ("error" in result) return { ok: false, error: result.error };
        await refresh();
        return { ok: true };
      } catch (mutateError) {
        return {
          ok: false,
          error: mutateError instanceof Error ? mutateError.message : "Gagal menghapus peserta.",
        };
      }
    },
    [refresh]
  );

  const updateParticipant = useCallback(
    async (participantId: string, input: NewParticipantInput): Promise<MutationResult> => {
      try {
        const { updateMemberAction } = await import("@/lib/members-actions");
        const result = await updateMemberAction(participantId, {
          name: input.name,
          phone: input.phone,
          email: input.email,
          kelas: input.kelas,
          jurusan: input.jurusan,
          nomorInduk: input.nomorInduk,
        });
        if ("error" in result) return { ok: false, error: result.error };
        await refresh();
        return { ok: true };
      } catch (mutateError) {
        return {
          ok: false,
          error: mutateError instanceof Error ? mutateError.message : "Gagal memperbarui peserta.",
        };
      }
    },
    [refresh]
  );

  const addEvent = useCallback(
    async (input: NewEventInput): Promise<MutationResult> => {
      try {
        const result = await createEventAction(input);
        if ("error" in result) return { ok: false, error: result.error };
        await refresh();
        return { ok: true };
      } catch (mutateError) {
        return {
          ok: false,
          error: mutateError instanceof Error ? mutateError.message : "Gagal membuat kegiatan.",
        };
      }
    },
    [refresh]
  );

  const deleteEvent = useCallback(
    async (eventId: string): Promise<MutationResult> => {
      try {
        const result = await deleteEventAction(eventId);
        if ("error" in result) return { ok: false, error: result.error };
        await refresh();
        return { ok: true };
      } catch (mutateError) {
        return {
          ok: false,
          error: mutateError instanceof Error ? mutateError.message : "Gagal menghapus kegiatan.",
        };
      }
    },
    [refresh]
  );

  const setAttendanceStatus = useCallback(
    async (eventId: string, memberId: string, status: AttendanceStatus): Promise<MutationResult> => {
      try {
        const result = await setAttendanceStatusAction(eventId, memberId, status);
        if ("error" in result) return { ok: false, error: result.error };
        setAttendance((currentMap) => ({
          ...currentMap,
          [eventId]: { ...(currentMap[eventId] ?? {}), [memberId]: status },
        }));
        return { ok: true };
      } catch (mutateError) {
        return {
          ok: false,
          error: mutateError instanceof Error ? mutateError.message : "Gagal memperbarui kehadiran.",
        };
      }
    },
    []
  );

  const addTransaction = useCallback(
    async (input: NewTransactionInput): Promise<MutationResult> => {
      try {
        const result = await createTransactionAction(input);
        if ("error" in result) return { ok: false, error: result.error };
        await refresh();
        return { ok: true };
      } catch (mutateError) {
        return {
          ok: false,
          error: mutateError instanceof Error ? mutateError.message : "Gagal mencatat transaksi.",
        };
      }
    },
    [refresh]
  );

  const deleteTransaction = useCallback(
    async (transactionId: string): Promise<MutationResult> => {
      try {
        const result = await deleteTransactionAction(transactionId);
        if ("error" in result) return { ok: false, error: result.error };
        await refresh();
        return { ok: true };
      } catch (mutateError) {
        return {
          ok: false,
          error: mutateError instanceof Error ? mutateError.message : "Gagal menghapus transaksi.",
        };
      }
    },
    [refresh]
  );

  const addAnnouncement = useCallback(
    async (input: NewAnnouncementInput): Promise<MutationResult> => {
      try {
        const result = await createAnnouncementAction(input);
        if ("error" in result) return { ok: false, error: result.error };
        await refresh();
        return { ok: true };
      } catch (mutateError) {
        return {
          ok: false,
          error: mutateError instanceof Error ? mutateError.message : "Gagal mengirim pengumuman.",
        };
      }
    },
    [refresh]
  );

  const addUser = useCallback(
    async (input: NewUserInput): Promise<MutationResult> => {
      try {
        const result = await createUserAction(input);
        if ("error" in result) return { ok: false, error: result.error };
        await refresh();
        return { ok: true };
      } catch (mutateError) {
        return {
          ok: false,
          error: mutateError instanceof Error ? mutateError.message : "Gagal menambah pengguna.",
        };
      }
    },
    [refresh]
  );

  const updateUserRole = useCallback(
    async (userId: string, role: Role): Promise<MutationResult> => {
      try {
        const result = await updateUserRoleAction({ userId, role });
        if ("error" in result) return { ok: false, error: result.error };
        await refresh();
        return { ok: true };
      } catch (mutateError) {
        return {
          ok: false,
          error: mutateError instanceof Error ? mutateError.message : "Gagal mengubah peran.",
        };
      }
    },
    [refresh]
  );

  const deleteUser = useCallback(
    async (userId: string): Promise<MutationResult> => {
      try {
        const result = await deleteUserAction(userId);
        if ("error" in result) return { ok: false, error: result.error };
        await refresh();
        return { ok: true };
      } catch (mutateError) {
        return {
          ok: false,
          error: mutateError instanceof Error ? mutateError.message : "Gagal menghapus pengguna.",
        };
      }
    },
    [refresh]
  );

  const storeValue = useMemo<DataStoreValue>(
    () => ({
      users,
      participants,
      events,
      attendance,
      transactions,
      announcements,
      isLoading,
      error,
      refresh,
      addParticipant,
      updateParticipant,
      deleteParticipant,
      addEvent,
      deleteEvent,
      setAttendanceStatus,
      addTransaction,
      deleteTransaction,
      addAnnouncement,
      addUser,
      updateUserRole,
      deleteUser,
    }),
    [
      users,
      participants,
      events,
      attendance,
      transactions,
      announcements,
      isLoading,
      error,
      refresh,
      addParticipant,
      updateParticipant,
      deleteParticipant,
      addEvent,
      deleteEvent,
      setAttendanceStatus,
      addTransaction,
      deleteTransaction,
      addAnnouncement,
      addUser,
      updateUserRole,
      deleteUser,
    ]
  );

  return <DataStoreContext.Provider value={storeValue}>{children}</DataStoreContext.Provider>;
}

export function useDataStore(): DataStoreValue {
  const contextValue = useContext(DataStoreContext);
  if (!contextValue) {
    throw new Error("useDataStore harus digunakan di dalam DataStoreProvider");
  }
  return contextValue;
}
