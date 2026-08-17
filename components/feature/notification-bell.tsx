"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  listNotificationsAction,
  getUnreadCountAction,
  markNotificationReadAction,
  markAllNotificationsReadAction,
  type NotificationItem,
} from "@/lib/notifications-actions";
import { BellIcon } from "@/components/ui/icons";
import { combineClassNames } from "@/lib/utils";
import { formatRelative } from "@/lib/format";

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const popoverRef = useRef<HTMLDivElement>(null);

  const load = useCallback(() => {
    Promise.all([listNotificationsAction(8), getUnreadCountAction()])
      .then(([notifications, count]) => {
        setItems(notifications);
        setUnreadCount(count);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    load();
    let interval: ReturnType<typeof setInterval> | null = null;

    const startPolling = () => {
      if (interval !== null) return;
      interval = setInterval(load, 30000);
    };

    const stopPolling = () => {
      if (interval !== null) {
        clearInterval(interval);
        interval = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        load();
        startPolling();
      } else {
        stopPolling();
      }
    };

    if (document.visibilityState === "visible") {
      startPolling();
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [load]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleOpen = async () => {
    const next = !isOpen;
    setIsOpen(next);
    if (next) await load();
  };

  const handleMarkRead = async (id: string) => {
    await markNotificationReadAction(id);
    await load();
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsReadAction();
    await load();
  };

  return (
    <div ref={popoverRef} className="relative">
      <button
        type="button"
        aria-label={`Notifikasi${unreadCount > 0 ? `, ${unreadCount} belum dibaca` : ""}`}
        aria-haspopup="true"
        aria-expanded={isOpen}
        onClick={handleOpen}
        className="relative rounded-md p-2 text-muted transition-colors hover:bg-background hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        <BellIcon />
        {unreadCount > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-card border border-border bg-surface shadow-modal">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="text-sm font-semibold text-foreground">Notifikasi</span>
            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-xs font-medium text-primary hover:underline"
              >
                Tandai semua dibaca
              </button>
            ) : null}
          </div>
          <ul className="max-h-96 overflow-y-auto">
            {items.length > 0 ? (
              items.map((notification) => (
                <li key={notification.id}>
                  <button
                    type="button"
                    onClick={() => handleMarkRead(notification.id)}
                    className={combineClassNames(
                      "flex w-full flex-col gap-1 border-b border-border px-4 py-3 text-left transition-colors hover:bg-background",
                      !notification.isRead ? "bg-primary-soft/40" : ""
                    )}
                  >
                    <span className="flex items-center gap-2">
                      {!notification.isRead ? (
                        <span className="h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                      ) : null}
                      <span className="text-sm font-medium text-foreground">{notification.title}</span>
                    </span>
                    {notification.message ? (
                      <span className="text-xs text-muted">{notification.message}</span>
                    ) : null}
                    <span className="text-xs text-muted">{formatRelative(notification.createdAt)}</span>
                  </button>
                </li>
              ))
            ) : (
              <li className="px-4 py-8 text-center text-sm text-muted">Tidak ada notifikasi.</li>
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
