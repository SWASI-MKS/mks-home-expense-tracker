import { useState, FormEvent } from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { authService } from '@/services/firestore/authService';
import { useAuthStore } from '@/stores/useAuthStore';
import { Lock, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

export function SecuritySettings() {
  const { currentMember, logout } = useAuthStore();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentMember) return;
    
    if (newPassword.length < 4) {
      toast.error('New password must be at least 4 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }
    if (currentPassword === newPassword) {
      toast.error('New password cannot be the same as the current password.');
      return;
    }

    setIsSaving(true);
    try {
      const success = await authService.changePassword(currentMember, currentPassword, newPassword);
      if (success) {
        toast.success('Password changed successfully! Please log in again.');
        logout();
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to change password.');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Lock className="w-5 h-5 text-primary" />
          Security Settings
        </h2>
        <p className="text-sm text-muted-foreground mt-1">Change your password.</p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
          <div className="space-y-2">
            <label className="text-sm font-medium">Current Password</label>
            <div className="relative">
              <input
                type={showPasswords ? "text" : "password"}
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                className="w-full p-2 border border-border rounded-lg bg-background pr-10"
                required
                disabled={isSaving}
              />
              <button
                type="button"
                onClick={() => setShowPasswords(!showPasswords)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                disabled={isSaving}
              >
                {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">New Password</label>
            <div className="relative">
              <input
                type={showPasswords ? "text" : "password"}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full p-2 border border-border rounded-lg bg-background pr-10"
                required
                disabled={isSaving}
                minLength={4}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Confirm New Password</label>
            <div className="relative">
              <input
                type={showPasswords ? "text" : "password"}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full p-2 border border-border rounded-lg bg-background pr-10"
                required
                disabled={isSaving}
                minLength={4}
              />
            </div>
          </div>

          <Button type="submit" disabled={isSaving || !currentPassword || !newPassword || !confirmPassword} className="w-full">
            {isSaving ? 'Saving...' : 'Change Password'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
