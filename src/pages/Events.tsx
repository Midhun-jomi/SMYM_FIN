import React, { useState, useEffect } from 'react';
import { Calendar, TrendingUp, TrendingDown, PlusCircle } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { EventItem, User } from '../types';
import { api } from '../services/api';
import { formatINR } from '../utils/currency';
import { formatDate } from '../utils/date';
import { EventFormModal } from '../components/forms/EventFormModal';

interface EventsPageProps {
  currentUser: User;
}

export const Events: React.FC<EventsPageProps> = ({ currentUser }) => {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const fetchEvents = async () => {
    try {
      const data = await api.getEvents();
      setEvents(data);
    } catch (err) {
      console.error('Failed to fetch events', err);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Youth Events & Projects
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Budgeting and financial performance tracking for youth festivals, camps, and tournaments.
          </p>
        </div>

        {currentUser.role !== 'PUBLIC_VIEWER' && (
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsAddModalOpen(true)}
            >
              <PlusCircle className="h-4 w-4" />
              <span>Create Event</span>
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {events.map((ev) => {
          const isProfitable = ev.net_balance >= 0;
          return (
            <Card key={ev.event_id} hoverable className="flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
                    {ev.event_name}
                  </h3>
                  <Badge
                    variant={ev.status === 'COMPLETED' ? 'emerald' : 'blue'}
                    size="sm"
                  >
                    {ev.status}
                  </Badge>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-3">
                  <Calendar className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Scheduled: {formatDate(ev.event_date)}</span>
                </div>

                {ev.description && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 mb-4 line-clamp-2">
                    {ev.description}
                  </p>
                )}

                <div className="space-y-2 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <TrendingUp className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> Total Collections:
                    </span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatINR(ev.total_income)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <TrendingDown className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" /> Total Spent:
                    </span>
                    <span className="font-bold text-rose-600 dark:text-rose-400">{formatINR(ev.total_expense)}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">Profit / Loss:</span>
                    <span
                      className={`font-extrabold font-mono text-sm ${
                        isProfitable ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {isProfitable ? '+' : ''}
                      {formatINR(ev.net_balance)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300">
                  Linked to society general ledger
                </span>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Event Creation Modal */}
      <EventFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchEvents}
      />
    </div>
  );
};
