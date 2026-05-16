import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { Bell, CheckCheck } from 'lucide-react';
import { api, getApiBaseUrl } from '../../services/client';
import { getAuthToken } from '../../utils/userManager';

export default function NotificationBell({ darkMode }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);

  const load = async () => {
    try {
      const { data } = await api.get('/notifications');
      const list = data.notifications || [];
      setItems(list);
      setUnread(list.filter((n) => !n.read).length);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const apiOrigin = getApiBaseUrl();
    if (!getAuthToken()) return undefined;
    const socket = io(apiOrigin, {
      transports: ['websocket'],
      auth: { token: getAuthToken() },
    });
    socket.on('notifications:new', () => {
      load();
    });
    return () => {
      socket.disconnect();
    };
  }, []);

  const markOne = async (id) => {
    await api.patch(`/notifications/${id}/read`);
    load();
  };

  const markAll = async () => {
    await api.post('/notifications/read-all');
    load();
  };

  const syncAi = async () => {
    await api.post('/notifications/sync');
    load();
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`relative p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold px-1.5 rounded-full">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          className={`absolute right-0 mt-2 w-80 max-h-96 overflow-auto rounded-xl shadow-2xl border z-50 ${
            darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
          }`}
        >
          <div className="flex justify-between items-center px-3 py-2 border-b border-gray-500/20">
            <span className="text-sm font-semibold">AI Notifications</span>
            <div className="flex gap-1">
              <button type="button" className="text-xs text-indigo-500" onClick={syncAi}>
                Sync AI
              </button>
              <button type="button" className="text-xs flex items-center gap-1" onClick={markAll}>
                <CheckCheck className="h-3 w-3" /> All read
              </button>
            </div>
          </div>
          <div className="divide-y divide-gray-500/10">
            {items.length === 0 && (
              <p className="p-4 text-sm opacity-70">You&apos;re all caught up.</p>
            )}
            {items.map((n) => (
              <button
                key={n._id}
                type="button"
                onClick={() => !n.read && markOne(n._id)}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-black/5 ${!n.read ? 'bg-indigo-500/10' : ''}`}
              >
                <p className="font-medium">{n.title}</p>
                <p className="opacity-80 text-xs mt-0.5">{n.message}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
