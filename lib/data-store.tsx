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
  AppData,
  ActivityEvent,
  Announcement,
  AttendanceMap,
  AttendanceStatus,
  Participant,
  Role,
  Transaction,
  TransactionType,
  User,
} from "@/lib/types";
import { loadPersistedData, persistData } from "@/lib/storage";
import { generateId } from "@/lib/utils";

type NewParticipantInput = {
  name: string;
  phone: string;
  email: string;
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

type DataStoreValue = {
  users: User[];
  participants: Participant[];
  events: ActivityEvent[];
  attendance: AttendanceMap;
  transactions: Transaction[];
  announcements: Announcement[];
  addParticipant: (input: NewParticipantInput) => void;
  updateParticipant: (participantId: string, input: NewParticipantInput) => void;
  deleteParticipant: (participantId: string) => void;
  addEvent: (input: NewEventInput) => void;
  deleteEvent: (eventId: string) => void;
  setAttendanceStatus: (eventId: string, participantId: string, status: AttendanceStatus) => void;
  addTransaction: (input: NewTransactionInput) => void;
  deleteTransaction: (transactionId: string) => void;
  addAnnouncement: (input: NewAnnouncementInput) => void;
  addUser: (input: NewUserInput) => void;
  updateUserRole: (userId: string, role: Role) => void;
  deleteUser: (userId: string) => void;
};

const DataStoreContext = createContext<DataStoreValue | null>(null);

export function DataStoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => loadPersistedData());

  useEffect(() => {
    persistData(data);
  }, [data]);

  const addParticipant = useCallback((input: NewParticipantInput) => {
    setData((currentData) => {
      const newParticipant: Participant = {
        id: generateId(),
        name: input.name,
        phone: input.phone,
        email: input.email,
        createdAt: new Date().toISOString(),
      };
      return { ...currentData, participants: [...currentData.participants, newParticipant] };
    });
  }, []);

  const updateParticipant = useCallback((participantId: string, input: NewParticipantInput) => {
    setData((currentData) => ({
      ...currentData,
      participants: currentData.participants.map((participant) =>
        participant.id === participantId
          ? { ...participant, name: input.name, phone: input.phone, email: input.email }
          : participant
      ),
    }));
  }, []);

  const deleteParticipant = useCallback((participantId: string) => {
    setData((currentData) => {
      const nextAttendance: AttendanceMap = {};
      for (const eventId of Object.keys(currentData.attendance)) {
        const records = currentData.attendance[eventId];
        if (participantId in records) {
          const nextRecords = { ...records };
          delete nextRecords[participantId];
          nextAttendance[eventId] = nextRecords;
        } else {
          nextAttendance[eventId] = records;
        }
      }

      return {
        ...currentData,
        participants: currentData.participants.filter(
          (participant) => participant.id !== participantId
        ),
        attendance: nextAttendance,
      };
    });
  }, []);

  const addEvent = useCallback((input: NewEventInput) => {
    setData((currentData) => {
      const newEvent: ActivityEvent = {
        id: generateId(),
        name: input.name,
        date: input.date,
        description: input.description,
        createdAt: new Date().toISOString(),
      };
      return {
        ...currentData,
        events: [...currentData.events, newEvent],
        attendance: { ...currentData.attendance, [newEvent.id]: {} },
      };
    });
  }, []);

  const deleteEvent = useCallback((eventId: string) => {
    setData((currentData) => {
      const nextAttendance = { ...currentData.attendance };
      delete nextAttendance[eventId];
      return {
        ...currentData,
        events: currentData.events.filter((event) => event.id !== eventId),
        attendance: nextAttendance,
      };
    });
  }, []);

  const setAttendanceStatus = useCallback(
    (eventId: string, participantId: string, status: AttendanceStatus) => {
      setData((currentData) => {
        const eventRecords = currentData.attendance[eventId] ?? {};
        return {
          ...currentData,
          attendance: {
            ...currentData.attendance,
            [eventId]: { ...eventRecords, [participantId]: status },
          },
        };
      });
    },
    []
  );

  const addTransaction = useCallback((input: NewTransactionInput) => {
    setData((currentData) => {
      const newTransaction: Transaction = {
        id: generateId(),
        type: input.type,
        category: input.category,
        amount: input.amount,
        description: input.description,
        date: input.date,
        createdAt: new Date().toISOString(),
      };
      return { ...currentData, transactions: [...currentData.transactions, newTransaction] };
    });
  }, []);

  const deleteTransaction = useCallback((transactionId: string) => {
    setData((currentData) => ({
      ...currentData,
      transactions: currentData.transactions.filter(
        (transaction) => transaction.id !== transactionId
      ),
    }));
  }, []);

  const addAnnouncement = useCallback((input: NewAnnouncementInput) => {
    setData((currentData) => {
      const newAnnouncement: Announcement = {
        id: generateId(),
        subject: input.subject,
        body: input.body,
        recipientCount: input.recipientCount,
        sentAt: new Date().toISOString(),
      };
      return { ...currentData, announcements: [...currentData.announcements, newAnnouncement] };
    });
  }, []);

  const addUser = useCallback((input: NewUserInput) => {
    setData((currentData) => {
      const newUser: User = {
        id: generateId(),
        name: input.name,
        email: input.email,
        password: input.password,
        role: input.role,
        createdAt: new Date().toISOString(),
      };
      return { ...currentData, users: [...currentData.users, newUser] };
    });
  }, []);

  const updateUserRole = useCallback((userId: string, role: Role) => {
    setData((currentData) => ({
      ...currentData,
      users: currentData.users.map((user) =>
        user.id === userId ? { ...user, role } : user
      ),
    }));
  }, []);

  const deleteUser = useCallback((userId: string) => {
    setData((currentData) => ({
      ...currentData,
      users: currentData.users.filter((user) => user.id !== userId),
    }));
  }, []);

  const storeValue = useMemo<DataStoreValue>(
    () => ({
      users: data.users,
      participants: data.participants,
      events: data.events,
      attendance: data.attendance,
      transactions: data.transactions,
      announcements: data.announcements,
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
      data,
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
