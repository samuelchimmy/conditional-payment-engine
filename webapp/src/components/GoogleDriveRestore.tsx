"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';
import { Cloud, Loader2, AlertTriangle, Download, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { downloadBackup, decryptFromBackup } from '@/lib/googleDriveBackup';
import { supabase } from '@/lib/supabaseClient'; // Ensure you have a generic supabase client exported here

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

interface GoogleDriveRestoreProps {
  onRestore: (payload: string, pin: string) => Promise<{ success: boolean; error?: string; profileId?: string; walletAddress?: string }>;
}

function RestoreContent({ onRestore }: GoogleDriveRestoreProps) {
  const router = useRouter();
  const [status, setStatus] = useState<'idle' | 'authenticating' | 'downloading' | 'decrypting' | 'restoring' | 'success' | 'error' | 'not_found'>('idle');
  const [pin, setPin] = useState('');
  const [showPinInput, setShowPinInput] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [backupData, setBackupData] = useState<{ encryptedData: string; iv: string; salt: string; payTag?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);

  const googleLogin = useGoogleLogin({
    onSuccess: async (response) => {
      setAccessToken(response.access_token);
      setStatus('downloading');
      
      const backup = await downloadBackup(response.access_token);
      
      if (!backup) {
        setStatus('not_found');
        setError('No backup found on Google Drive');
        return;
      }

      setBackupData(backup);
      setShowPinInput(true);
      setStatus('idle');
    },
    onError: () => {
      setStatus('error');
      setError('Google sign-in failed');
    },
    scope: 'openid email profile https://www.googleapis.com/auth/drive.appdata',
  });

  const handleStartRestore = () => {
    setStatus('authenticating');
    setError(null);
    googleLogin();
  };

  const handleDecryptAndRestore = async () => {
    if (pin.length !== 4 || !backupData) return;

    setStatus('decrypting');
    setError(null);

    try {
      const payload = await decryptFromBackup(
        backupData.encryptedData,
        backupData.iv,
        backupData.salt,
        pin
      );

      setStatus('restoring');

      const result = await onRestore(payload, pin);

      if (result.success) {
        setStatus('success');

        if (accessToken && result.profileId && result.walletAddress && supabase) {
          (async () => {
            try {
              const uiRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${accessToken}` },
              });
              if (!uiRes.ok) return;
              const ui = await uiRes.json() as { email?: string; picture?: string };
              if (!ui?.email && !ui?.picture) return;
              await supabase.functions.invoke('social-identity', {
                body: {
                  action: 'link-google',
                  profileId: result.profileId,
                  walletAddress: result.walletAddress,
                  googleEmail: ui.email,
                  googlePicture: ui.picture,
                },
              });
            } catch (e) {
              console.warn('[GoogleDriveRestore] linkGoogle failed:', e);
            }
          })();
        }
        
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);
      } else {
        setError(result.error || 'Restore failed');
        setStatus('error');
      }
    } catch (e) {
      console.error('Decryption error:', e);
      setError('Incorrect PIN');
      setStatus('idle');
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  if (status === 'success') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center py-6"
      >
        <div className="w-16 h-16 rounded-[10px] bg-surface flex items-center justify-center mb-4">
          <Check className="w-8 h-8 text-text-primary" />
        </div>
        <p className="text-[15px] font-bold text-text-primary mb-1">Wallet Restored!</p>
        <p className="text-[13px] text-text-muted">Logging you in...</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      {!showPinInput ? (
        <>
          <div className="text-center mb-4">
            <div className="w-16 h-16 mx-auto rounded-[10px] bg-surface flex items-center justify-center mb-3">
              <Cloud className="w-8 h-8 text-text-primary" />
            </div>
            <h3 className="text-[15px] font-bold text-text-primary mb-1">Restore from Google Drive</h3>
            <p className="text-[13px] text-text-muted">
              Sign in to retrieve your wallet backup
            </p>
          </div>

          <button
            onClick={handleStartRestore}
            disabled={status === 'authenticating' || status === 'downloading'}
            className="w-full h-[46px] flex items-center justify-center bg-[#D53131] hover:bg-[#D53131]/90 text-[#000000] text-[14px] font-bold rounded-[10px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === 'authenticating' || status === 'downloading' ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>{status === 'downloading' ? 'Searching...' : 'Connecting...'}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                <span>Sign in with Google</span>
              </div>
            )}
          </button>

          {status === 'not_found' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#050505] border border-[#2A2A2A] rounded-[10px] p-3 flex items-center gap-3"
            >
              <AlertTriangle className="w-5 h-5 text-accent flex-shrink-0" />
              <p className="text-[13px] text-text-primary">
                No backup found. Make sure you're using the same Google account.
              </p>
            </motion.div>
          )}

          {status === 'error' && error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#050505] border border-[#2A2A2A] rounded-[10px] p-3 flex items-center gap-3"
            >
              <AlertTriangle className="w-5 h-5 text-[#D53131] flex-shrink-0" />
              <p className="text-[13px] text-[#D53131]">{error}</p>
            </motion.div>
          )}
        </>
      ) : (
        <>
          <div className="text-center mb-4">
            <div className="w-16 h-16 mx-auto rounded-[10px] bg-surface flex items-center justify-center mb-3">
              <Check className="w-8 h-8 text-text-primary" />
            </div>
            <h3 className="text-[15px] font-bold text-text-primary mb-1">Backup Found!</h3>
            {backupData?.payTag && (
              <p className="text-[13px] text-text-primary font-bold">@{backupData.payTag}</p>
            )}
            <p className="text-[13px] text-text-muted mt-1">
              Enter your PIN to decrypt your wallet
            </p>
          </div>

          <motion.div
            animate={shake ? { x: [-10, 10, -10, 10, 0] } : {}}
            transition={{ duration: 0.4 }}
          >
            <input
              type="password"
              inputMode="numeric"
              value={pin}
              onChange={(e) => {
                setPin(e.target.value.replace(/\D/g, '').slice(0, 4));
                setError(null);
              }}
              placeholder="••••"
              className="w-full h-[46px] text-2xl text-center tracking-[0.5em] font-bold rounded-[10px] bg-bg-center border-border text-text-primary focus-visible:ring-0 focus-visible:border-border-emphasis px-3"
              maxLength={4}
              disabled={status === 'decrypting' || status === 'restoring'}
              autoFocus
            />
          </motion.div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-center gap-2 text-[#D53131] mt-3"
            >
              <AlertTriangle className="w-4 h-4" />
              <span className="text-[13px]">{error}</span>
            </motion.div>
          )}

          <button
            onClick={handleDecryptAndRestore}
            disabled={pin.length !== 4 || status === 'decrypting' || status === 'restoring'}
            className="w-full h-[46px] mt-4 flex items-center justify-center bg-[#D53131] hover:bg-[#D53131]/90 text-[#000000] text-[14px] font-bold rounded-[10px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === 'decrypting' || status === 'restoring' ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>{status === 'decrypting' ? 'Decrypting...' : 'Restoring...'}</span>
              </div>
            ) : (
              'Restore Wallet'
            )}
          </button>
        </>
      )}
    </div>
  );
}

export function GoogleDriveRestore(props: GoogleDriveRestoreProps) {
  if (!GOOGLE_CLIENT_ID) {
    return (
      <div className="text-center py-4">
        <p className="text-[13px] text-[#797977]">Cloud restore not configured</p>
      </div>
    );
  }

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <RestoreContent {...props} />
    </GoogleOAuthProvider>
  );
}
