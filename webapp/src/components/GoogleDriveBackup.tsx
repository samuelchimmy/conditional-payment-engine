"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';
import { Cloud, Check, Loader2, AlertTriangle, RefreshCw } from 'lucide-react';

import { 
  encryptForBackup, 
  uploadBackup, 
  checkBackupExists 
} from '@/lib/googleDriveBackup';

// Replace with your actual client ID or load from env
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

interface GoogleDriveBackupProps {
  payloadToBackup: string; // The private key or seed phrase
  payTag: string;
  onSuccess?: () => void;
}

// Persist lightweight backup metadata locally so the card can show the
// "already backed up" state (date + email) on load without forcing a re-login.
interface BackupMeta { timestamp: number; email?: string }
function backupMetaKey(payTag: string) { return `tarena_backup_${payTag.toLowerCase()}`; }
function loadBackupMeta(payTag: string): BackupMeta | null {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(backupMetaKey(payTag)) : null;
    return raw ? JSON.parse(raw) as BackupMeta : null;
  } catch { return null; }
}
function saveBackupMeta(payTag: string, meta: BackupMeta) {
  try { localStorage.setItem(backupMetaKey(payTag), JSON.stringify(meta)); } catch { /* ignore */ }
}
function shortenEmail(email?: string | null): string {
  if (!email) return "";
  const [name, domain] = email.split("@");
  if (!domain) return email;
  const shownName = name.length > 3 ? `${name.slice(0, 3)}…` : name;
  return `${shownName}@${domain}`;
}

function BackupContent({ payloadToBackup, payTag, onSuccess }: GoogleDriveBackupProps) {
  const [status, setStatus] = useState<'idle' | 'authenticating' | 'checking' | 'verifying' | 'backing_up' | 'success' | 'error' | 'conflict'>('idle');
  const [pin, setPin] = useState('');
  const [showPinInput, setShowPinInput] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastBackup, setLastBackup] = useState<number | null>(null);
  const [existingBackupDate, setExistingBackupDate] = useState<number | null>(null);
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [email, setEmail] = useState<string | null>(null);

  // On mount, hydrate the "already backed up" state from local metadata.
  useEffect(() => {
    const meta = loadBackupMeta(payTag);
    if (meta?.timestamp) {
      setLastBackup(meta.timestamp);
      setExistingBackupDate(meta.timestamp);
      if (meta.email) setEmail(meta.email);
    }
  }, [payTag]);

  const googleLogin = useGoogleLogin({
    onSuccess: async (response) => {
      setAccessToken(response.access_token);
      setStatus('checking');

      // Capture the account email (best-effort) for display.
      try {
        const info = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${response.access_token}` },
        }).then((r) => r.ok ? r.json() : null);
        if (info?.email) setEmail(info.email);
      } catch { /* ignore */ }

      try {
        const result = await checkBackupExists(response.access_token);
        if (result.exists && result.timestamp) {
          setExistingBackupDate(result.timestamp);
          setLastBackup(result.timestamp);
        }
      } catch (e) {
        console.error('Failed to check backup:', e);
      }

      setStatus('idle');
      setShowPinInput(true);
    },
    onError: () => {
      setStatus('error');
      setError('Google sign-in failed');
    },
    scope: 'openid email https://www.googleapis.com/auth/drive.appdata',
  });

  const handleStartBackup = () => {
    setStatus('authenticating');
    setError(null);
    googleLogin();
  };

  const handleBackup = async (forceOverwrite = false) => {
    if (pin.length !== 4 || !accessToken) return;

    setStatus('verifying');
    setError(null);

    try {
      if (!lastBackup && !forceOverwrite && existingBackupDate) {
        setStatus('conflict');
        setShowConflictDialog(true);
        return;
      }

      setStatus('backing_up');

      // Encrypt for backup
      const { encryptedData, iv, salt } = await encryptForBackup(payloadToBackup, pin);

      // Upload to Google Drive
      const result = await uploadBackup(accessToken, encryptedData, iv, salt, payTag);

      if (result.success) {
        const ts = result.timestamp || Date.now();
        setStatus('success');
        setLastBackup(ts);
        setExistingBackupDate(ts);
        saveBackupMeta(payTag, { timestamp: ts, email: email || undefined });
        setShowConflictDialog(false);
        if (onSuccess) {
          setTimeout(onSuccess, 1500);
        }
      } else {
        setError(result.error || 'Backup failed');
        setStatus('error');
      }
    } catch (e) {
      console.error('Backup error:', e);
      setError('Failed to backup wallet');
      setStatus('error');
    }
  };

  const handleOverwrite = () => {
    setShowConflictDialog(false);
    handleBackup(true);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-surface border border-border rounded-[10px] overflow-hidden">
      <div className="px-5 py-5 flex items-center gap-4">
        <div className={`w-12 h-12 rounded-[10px] flex items-center justify-center ${
          status === 'success' || lastBackup ? 'bg-success/10' : 'bg-bg-edge'
        }`}>
          {status === 'success' || lastBackup ? (
            <Check className="w-5 h-5 text-success" />
          ) : (
            <Cloud className="w-5 h-5 text-text-primary" />
          )}
        </div>
        <div className="flex-1 flex flex-col">
          <span className="text-text-primary font-bold text-[13px]">
            {lastBackup ? (email ? shortenEmail(email) : "Connected via Google") : "No Cloud Backup"}
          </span>
          {lastBackup && existingBackupDate && (
            <span className="text-text-muted text-[12px] mt-0.5">Last backup: {formatDate(existingBackupDate)}</span>
          )}
          <span className="text-text-muted text-[11px] mt-2 flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${lastBackup ? "bg-success" : "bg-text-muted"}`}></div>
            {lastBackup ? "Backed up" : "Not backed up"}
          </span>
        </div>

        {!showPinInput && status !== 'success' && (
          <button
            onClick={handleStartBackup}
            disabled={status === 'authenticating'}
            className={`px-4 py-2 rounded-md ${lastBackup ? 'bg-transparent border border-border text-text-primary' : 'bg-accent text-accent-text font-bold'}`}
          >
            {status === 'authenticating' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : lastBackup ? (
              <span className="flex items-center"><RefreshCw className="w-4 h-4 mr-1.5" /> Update</span>
            ) : (
              'Backup'
            )}
          </button>
        )}
      </div>

      <AnimatePresence>
        {showPinInput && status !== 'success' && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-2 border-t border-divider">
              <p className="text-[13px] text-text-muted mb-3">
                Enter a 4-digit PIN to encrypt your wallet
              </p>

              <div className="flex gap-3">
                <input
                  type="password"
                  inputMode="numeric"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="••••"
                  className="h-[52px] text-xl text-center tracking-[0.5em] font-bold rounded-[10px] flex-1 bg-bg-center border border-border text-text-primary focus-visible:ring-0 focus-visible:border-border-emphasis px-3"
                  maxLength={4}
                  disabled={status === 'verifying' || status === 'backing_up'}
                />
                <button
                  onClick={() => handleBackup()}
                  disabled={pin.length !== 4 || status === 'verifying' || status === 'backing_up'}
                  className="w-[64px] h-[52px] flex-shrink-0 bg-accent hover:opacity-90 text-accent-text rounded-[10px] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {status === 'verifying' || status === 'backing_up' ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Cloud className="w-5 h-5" />
                  )}
                </button>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 mt-3 text-accent"
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-[13px]">{error}</span>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        {status === 'success' && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-2 border-t border-divider">
              <div className="bg-success/10 rounded-[10px] p-3 flex items-center gap-3">
                <Check className="w-5 h-5 text-success" />
                <p className="text-[13px] text-text-primary font-bold">
                  Wallet backed up successfully!
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showConflictDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface border border-border rounded-[10px] p-8 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-[10px] bg-bg-edge flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-text-primary" />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-text-primary">Existing Backup Found</h3>
                  <p className="text-[13px] text-text-muted">
                    From {existingBackupDate ? formatDate(existingBackupDate) : 'an earlier date'}
                  </p>
                </div>
              </div>

              <p className="text-[13px] text-text-secondary mb-8">
                We found a wallet backup in your Google Drive. Overwriting will replace the old backup permanently.
              </p>

              <div className="space-y-3">
                <button
                  onClick={handleOverwrite}
                  className="w-full h-[52px] bg-accent text-accent-text font-bold rounded-[10px]"
                >
                  Overwrite with Current Wallet
                </button>
                <button
                  onClick={() => {
                    setShowConflictDialog(false);
                    setStatus('idle');
                  }}
                  className="w-full h-[52px] bg-transparent border border-border text-text-primary rounded-[10px]"
                >
                  Cancel
                </button>
              </div>

              <p className="text-[11px] text-text-muted mt-6 text-center uppercase tracking-wider">
                This action cannot be undone
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function GoogleDriveBackup(props: GoogleDriveBackupProps) {
  if (!GOOGLE_CLIENT_ID) {
    return (
      <div className="bg-surface border border-border rounded-[10px] overflow-hidden opacity-50">
        <div className="px-5 py-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-[10px] bg-bg-edge flex items-center justify-center">
            <Cloud className="w-5 h-5 text-text-muted" />
          </div>
          <div className="flex-1"/>
        </div>
      </div>
    );
  }

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BackupContent {...props} />
    </GoogleOAuthProvider>
  );
}
