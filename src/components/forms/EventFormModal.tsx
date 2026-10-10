import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Alert } from '../ui/Alert';
import { api } from '../../services/api';
import { getTodayDateString } from '../../utils/date';

interface EventFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const EventFormModal: React.FC<EventFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState(getTodayDateString());
  const [budget, setBudget] = useState('');
  const [status, setStatus] = useState<'UPCOMING' | 'COMPLETED' | 'CANCELLED'>('UPCOMING');
  const [description, setDescription] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setEventName('');
    setEventDate(getTodayDateString());
    setBudget('');
    setStatus('UPCOMING');
    setDescription('');
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!eventName.trim()) {
      setError('Please provide an event name.');
      return;
    }

    if (!eventDate) {
      setError('Please select an event date.');
      return;
    }

    const parsedBudget = parseFloat(budget);
    if (isNaN(parsedBudget) || parsedBudget < 0) {
      setError('Please enter a valid allocated budget amount.');
      return;
    }

    setIsLoading(true);
    try {
      await api.addEvent({
        event_name: eventName.trim(),
        event_date: eventDate,
        budget: parsedBudget,
        status,
        description: description.trim() || undefined,
      });

      resetForm();
      onSuccess();
      onClose();
    } catch (err) {
      setError((err as Error).message || 'Failed to create event. Please verify connection.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        resetForm();
        onClose();
      }}
      title="Create Youth Event / Project"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert type="error">{error}</Alert>}

        <Input
          id="event_name"
          label="Event / Project Name"
          type="text"
          placeholder="e.g. SMYM Youth Football Tournament 2026"
          value={eventName}
          onChange={(e) => setEventName(e.target.value)}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            id="event_date"
            label="Scheduled Date"
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            required
          />

          <Input
            id="budget"
            label="Allocated Budget (₹)"
            type="number"
            step="1"
            min="0"
            placeholder="50000"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            required
          />
        </div>

        <Select
          id="event_status"
          label="Initial Status"
          value={status}
          onChange={(e) => setStatus(e.target.value as any)}
          options={[
            { value: 'UPCOMING', label: 'Upcoming (In Planning)' },
            { value: 'COMPLETED', label: 'Completed (Settled)' },
            { value: 'CANCELLED', label: 'Cancelled' },
          ]}
        />

        <div>
          <label
            htmlFor="description"
            className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1"
          >
            Description & Objectives (Optional)
          </label>
          <textarea
            id="description"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief scope, target collections, and key volunteers"
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all resize-none"
          />
        </div>

        <div className="pt-2 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              resetForm();
              onClose();
            }}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            Create Event
          </Button>
        </div>
      </form>
    </Modal>
  );
};
