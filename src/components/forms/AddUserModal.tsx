import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Alert } from '../ui/Alert';
import { UserRole } from '../../types';
import { api } from '../../services/api';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddUserModal: React.FC<AddUserModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<UserRole>('EDITOR');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setEmail('');
    setDisplayName('');
    setRole('EDITOR');
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !email.includes('@')) {
      setError('Please provide a valid Google or Workspace email address.');
      return;
    }

    if (!displayName.trim()) {
      setError('Please provide the member or official display name.');
      return;
    }

    setIsLoading(true);
    try {
      await api.addUser({
        email: email.trim().toLowerCase(),
        display_name: displayName.trim(),
        role,
        status: 'ACTIVE',
      });

      resetForm();
      onSuccess();
      onClose();
    } catch (err) {
      setError((err as Error).message || 'Failed to add authorized user.');
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
      title="Authorize New Parish / Society Member"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert type="error">{error}</Alert>}

        <Input
          id="member_name"
          label="Full Name / Designation"
          type="text"
          placeholder="e.g. Robin Mathew (Joint Treasurer)"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
        />

        <Input
          id="member_email"
          label="Google Account Email"
          type="email"
          placeholder="e.g. robin.mathew@gmail.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <Select
          id="member_role"
          label="Authorized System Role"
          value={role}
          onChange={(e) => setRole(e.target.value as UserRole)}
          options={[
            { value: 'EDITOR', label: 'Editor — Add/Edit Transactions, Manage Bills & Events' },
            { value: 'ADMIN', label: 'Admin — Full Control, Void Transactions, Manage Users' },
          ]}
        />

        <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
          * Authorized users will automatically inherit their permissions upon signing in with their Google account.
        </p>

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
            Grant Authorization
          </Button>
        </div>
      </form>
    </Modal>
  );
};
