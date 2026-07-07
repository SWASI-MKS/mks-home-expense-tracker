import { useState } from 'react';
import { useFamilyStore, VALID_MEMBERS, FamilyMember } from '@/stores/useFamilyStore';
import { Button } from '@/components/common/Button';
import toast from 'react-hot-toast';
import { Users, RefreshCw, LogOut } from 'lucide-react';

export function FamilySettings() {
  const { familyCode, displayName, setDisplayName } = useFamilyStore();
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState<FamilyMember | ''>(displayName || '');

  const handleUpdateName = () => {
    if (!newName) {
      toast.error('Please select a Family Member');
      return;
    }
    setDisplayName(newName);
    setIsEditing(false);
    toast.success('Member updated');
  };

  const handleReconnect = () => {
    window.location.reload(); // Hard reload to re-initialize sync and fetch fresh data
  };

  const handleSignOut = () => {
    if (confirm('Are you sure you want to sign out? You will need to select your name again.')) {
      setDisplayName(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          Family Synchronization
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your shared family planner connection.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-muted/30 p-4 rounded-lg border border-border">
          <h3 className="text-sm font-medium text-muted-foreground mb-1">Current Family Code</h3>
          <p className="text-2xl font-mono tracking-widest font-bold uppercase">{familyCode || 'NONE'}</p>
        </div>
        <div className="bg-muted/30 p-4 rounded-lg border border-border">
          <h3 className="text-sm font-medium text-muted-foreground mb-1">Current Member</h3>
          <p className="text-2xl font-bold">{displayName || 'Unknown'}</p>
          {!isEditing && (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="mt-4">
              Change Member
            </Button>
          )}
        </div>
      </div>

      {isEditing && (
        <div className="space-y-4 max-w-sm p-4 border border-border rounded-lg bg-card">
          <h3 className="text-base font-medium">Select Family Member</h3>
          <div className="space-y-2">
            {VALID_MEMBERS.map((member) => (
              <label 
                key={member}
                className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                  newName === member 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:bg-muted'
                }`}
              >
                <input
                  type="radio"
                  name="settingsFamilyMember"
                  value={member}
                  checked={newName === member}
                  onChange={(e) => setNewName(e.target.value as FamilyMember)}
                  className="w-4 h-4 text-primary border-muted-foreground focus:ring-primary"
                />
                <span className="ml-3 font-medium">{member}</span>
              </label>
            ))}
          </div>
          <div className="flex gap-2 pt-2">
            <Button onClick={handleUpdateName} disabled={!newName} className="flex-1">Save</Button>
            <Button variant="outline" onClick={() => { setIsEditing(false); setNewName(displayName || ''); }} className="flex-1">Cancel</Button>
          </div>
        </div>
      )}

      <div className="pt-6 border-t border-border flex flex-wrap gap-4">
        <Button variant="outline" onClick={handleReconnect} className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          Force Sync (Reload)
        </Button>
        <Button variant="destructive" onClick={handleSignOut} className="flex items-center gap-2">
          <LogOut className="w-4 h-4" />
          Sign out
        </Button>
      </div>
    </div>
  );
}
