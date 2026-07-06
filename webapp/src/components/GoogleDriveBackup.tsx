"use client";

import { useState } from 'react';
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

function BackupContent({ payloadToBackup, payTag, onSuccess }: GoogleDriveBackupProps) {
  const [status, setStatus] = useState<'idle' | 'authenticating' | 'checking' | 'verifying' | 'backing_up' | 'success' | 'error' | 'conflict'>('idle');
  const [pin, setPin] = useState('');
  const [showPinInput, setShowPinInput] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastBackup, setLastBackup] = useState<number | null>(null);
  const [existingBackupDate, setExistingBackupDate] = useState<number | null>(null);
  const [showConflictDialog, setShowConflictDialog] = useState(false);

  const googleLogin = useGoogleLogin({
    onSuccess: async (response) => {
      setAccessToken(response.access_token);
      setStatus('checking');
      
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
    scope: 'https://www.googleapis.com/auth/drive.appdata',
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
        setStatus('success');
        setLastBackup(result.timestamp || Date.now());
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
    <div className="bg-[#0D0D0D] border border-[#2A2A2A] rounded-[10px] overflow-hidden">
      <div className="px-5 py-5 flex items-center gap-4">
        <div className={`w-12 h-12 rounded-[10px] flex items-center justify-center ${
          status === 'success' || lastBackup ? 'bg-[#F2F1EF]/10' : 'bg-[#181818]'
        }`}>
          {status === 'success' || lastBackup ? (
            <Check className="w-5 h-5 text-[#F2F1EF]" />
          ) : (
            <Cloud className="w-5 h-5 text-[#F2F1EF]" />
          )}
        </div>
        <div className="flex-1">
          <p className="font-bold text-[#F2F1EF]">Google Drive Backup</p>
          <p className="text-[13px] text-[#797977]">
            {lastBackup 
              ? `Last backup: ${formatDate(lastBackup)}`
              : 'Securely backup your wallet to cloud'
            }
          </p>
        </div>
        {!showPinInput && status !== 'success' && (
          <button
            onClick={handleStartBackup}
            disabled={status === 'authenticating'}
            className={`px-4 py-2 rounded-md ${lastBackup ? 'bg-transparent border border-[#2A2A2A] text-[#F2F1EF]' : 'bg-[#D53131] text-[#000000] font-bold'}`}
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
            <div className="px-5 pb-5 pt-2 border-t border-[#1A1A1A]">
              <p className="text-[13px] text-[#797977] mb-3">
                Enter a 4-digit PIN to encrypt your wallet
              </p>
              
              <div className="flex gap-3">
                <input
                  type="password"
                  inputMode="numeric"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="••••"
                  className="h-[52px] text-xl text-center tracking-[0.5em] font-bold rounded-[10px] flex-1 bg-[#050505] border-[#2A2A2A] text-[#F2F1EF] focus-visible:ring-0 focus-visible:border-[#3A3A3A] px-3"
                  maxLength={4}
                  disabled={status === 'verifying' || status === 'backing_up'}
                />
                <button
                  onClick={() => handleBackup()}
                  disabled={pin.length !== 4 || status === 'verifying' || status === 'backing_up'}
                  className="h-[52px] px-6 bg-[#D53131] hover:bg-[#D53131]/90 text-[#000000] rounded-[10px] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
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
                  className="flex items-center gap-2 mt-3 text-[#D53131]"
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
            <div className="px-5 pb-5 pt-2 border-t border-[#1A1A1A]">
              <div className="bg-[#181818] rounded-[10px] p-3 flex items-center gap-3">
                <Check className="w-5 h-5 text-[#F2F1EF]" />
                <p className="text-[13px] text-[#F2F1EF] font-bold">
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
            className="fixed inset-0 z-50 bg-[#050505]/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0D0D0D] border border-[#2A2A2A] rounded-[10px] p-8 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-[10px] bg-[#181818] flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-[#F2F1EF]" />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-[#F2F1EF]">Existing Backup Found</h3>
                  <p className="text-[13px] text-[#797977]">
                    From {existingBackupDate ? formatDate(existingBackupDate) : 'an earlier date'}
                  </p>
                </div>
              </div>

              <p className="text-[13px] text-[#A5A5A3] mb-8">
                We found a wallet backup in your Google Drive. Overwriting will replace the old backup permanently.
              </p>

              <div className="space-y-3">
                <button
                  onClick={handleOverwrite}
                  className="w-full h-[52px] bg-[#D53131] text-[#000000] font-bold rounded-[10px]"
                >
                  Overwrite with Current Wallet
                </button>
                <button
                  onClick={() => {
                    setShowConflictDialog(false);
                    setStatus('idle');
                  }}
                  className="w-full h-[52px] bg-transparent border border-[#2A2A2A] text-[#F2F1EF] rounded-[10px]"
                >
                  Cancel
                </button>
              </div>

              <p className="text-[11px] text-[#797977] mt-6 text-center uppercase tracking-wider">
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
      <div className="bg-[#0D0D0D] border border-[#2A2A2A] rounded-[10px] overflow-hidden opacity-50">
        <div className="px-5 py-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-[10px] bg-[#181818] flex items-center justify-center">
            <Cloud className="w-5 h-5 text-[#797977]" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-[#F2F1EF]">Google Drive Backup</p>
            <p className="text-[13px] text-[#797977]">Not configured</p>
          </div>
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
