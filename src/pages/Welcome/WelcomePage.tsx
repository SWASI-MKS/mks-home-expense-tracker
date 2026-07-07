import { useState, useEffect, FormEvent } from 'react';
import { useFamilyStore, VALID_MEMBERS, FamilyMember } from '@/stores/useFamilyStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { dbService } from '@/services/firestore/dbService';
import { authService } from '@/services/firestore/authService';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { User, Lock, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

export function WelcomePage() {
  const [selectedMember, setSelectedMember] = useState<FamilyMember | ''>('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<'select' | 'password'>('select');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  
  const { setDisplayName } = useFamilyStore();
  const { login } = useAuthStore();
  const hasLocalData = useTransactionStore(state => state.transactions.length > 0);

  // Check lockout on render and interval
  const [lockoutRemaining, setLockoutRemaining] = useState(0);
  
  useEffect(() => {
    if (!lockoutUntil) {
      setLockoutRemaining(0);
      return;
    }
    
    const interval = setInterval(() => {
      const remaining = Math.ceil((lockoutUntil - Date.now()) / 1000);
      if (remaining <= 0) {
        setLockoutUntil(null);
        setFailedAttempts(0);
        setLockoutRemaining(0);
        clearInterval(interval);
      } else {
        setLockoutRemaining(remaining);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [lockoutUntil]);

  const handleMemberSelect = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedMember) {
      toast.error('Please select your name.');
      return;
    }
    setStep('password');
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (lockoutUntil) return;
    if (!selectedMember || !password) return;

    console.log("Login button clicked");
    setIsVerifying(true);
    try {
      const isValid = await authService.verifyPassword(selectedMember as FamilyMember, password);
      
      if (isValid) {
        console.log("Authentication successful");
        setFailedAttempts(0);
        
        // Log in immediately and open dashboard
        setDisplayName(selectedMember as FamilyMember);
        login(selectedMember as FamilyMember);
        
        // Import local data in the background, non-blocking
        if (hasLocalData) {
          dbService.importLocalData().catch((err) => {
            console.error("Failed to merge local data on login:", err);
          });
        }
        
        toast.success(`Welcome ${selectedMember}!`);
      } else {
        console.log("Authentication failed");
        const newAttempts = failedAttempts + 1;
        setFailedAttempts(newAttempts);
        setPassword('');
        
        if (newAttempts >= 5) {
          setLockoutUntil(Date.now() + 60000); // 60 seconds
          toast.error('Too many failed attempts. Please try again in 60 seconds.');
        } else {
          toast.error('Incorrect password.');
        }
      }
    } catch (error) {
      console.error("Authentication Error:", error);
      toast.error(error instanceof Error ? error.message : "Authentication failed");
    } finally {
      console.log("Loading reset");
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 shadow-xl border-primary/20">
        
        {step === 'select' ? (
          <>
            <div className="flex flex-col items-center mb-8">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <User className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-center">Who are you?</h1>
              <p className="text-muted-foreground text-center mt-2">Select your name to sign in.</p>
            </div>

            <form onSubmit={handleMemberSelect} className="space-y-6">
              <div className="space-y-4">
                {VALID_MEMBERS.map((member) => (
                  <label 
                    key={member}
                    className={`flex items-center p-4 border rounded-xl cursor-pointer transition-colors ${
                      selectedMember === member 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:bg-muted'
                    }`}
                  >
                    <input
                      type="radio"
                      name="familyMember"
                      value={member}
                      checked={selectedMember === member}
                      onChange={(e) => setSelectedMember(e.target.value as FamilyMember)}
                      className="w-5 h-5 text-primary border-muted-foreground focus:ring-primary"
                    />
                    <span className="ml-3 text-lg font-medium">{member}</span>
                  </label>
                ))}
              </div>
              
              <Button type="submit" disabled={!selectedMember} className="w-full h-12 text-lg">
                Continue
              </Button>
            </form>
          </>
        ) : (
          <>
            <div className="flex flex-col items-center mb-8">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Lock className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-center">Welcome, {selectedMember}</h1>
              <p className="text-muted-foreground text-center mt-2">Please enter your password to continue.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-4">
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full p-4 border border-border rounded-xl bg-background pr-12 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    disabled={!!lockoutUntil || isVerifying}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    disabled={!!lockoutUntil || isVerifying}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                
                {lockoutUntil && (
                  <p className="text-destructive text-sm text-center">
                    Too many failed attempts.<br/>Please try again in {lockoutRemaining} seconds.
                  </p>
                )}
              </div>
              
              <div className="flex flex-col gap-3">
                <Button 
                  type="submit" 
                  disabled={!password || !!lockoutUntil || isVerifying} 
                  className="w-full h-12 text-lg"
                >
                  {isVerifying ? 'Verifying...' : 'Login'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setStep('select');
                    setPassword('');
                    setFailedAttempts(0);
                    setLockoutUntil(null);
                  }}
                  className="w-full h-12 text-lg"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </>
        )}

      </Card>
    </div>
  );
}
