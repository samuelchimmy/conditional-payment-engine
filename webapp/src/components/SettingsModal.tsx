"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!mounted) return null;

  const ToggleSwitch = ({ checked, onChange }: { checked: boolean, onChange: (checked: boolean) => void }) => (
    <div 
      onClick={() => onChange(!checked)}
      className={`w-11 h-6 rounded-full p-1 cursor-pointer transition-colors duration-200 ease-in-out flex items-center ${checked ? 'bg-text-primary' : 'bg-border'}`}
    >
      <div 
        className={`w-4 h-4 rounded-full bg-surface shadow-md transform transition-transform duration-200 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'}`}
      />
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#050505]/80 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
            className="relative w-full max-w-[480px] bg-surface border border-border rounded-[16px] overflow-hidden flex flex-col shadow-2xl max-h-[90vh]"
          >
            {/* Header */}
            <div className="h-[64px] border-b border-divider flex items-center justify-between px-6 shrink-0">
              <h2 className="text-text-primary text-[18px] font-bold leading-tight">Settings</h2>
              <button 
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-border transition-colors text-text-muted"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 1L13 13M1 13L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto flex flex-col gap-8">
              
              {/* Backup Info */}
              <div className="flex flex-col gap-2">
                <span className="text-text-secondary text-[12px] uppercase tracking-[0.1em] font-bold mb-1">Backup</span>
                <div className="bg-bg-center border border-border rounded-[10px] p-4 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-text-primary font-bold text-[14px]">Connected via Google</span>
                    <span className="text-text-muted text-[13px] mt-0.5">user@example.com</span>
                    <span className="text-text-muted text-[12px] mt-2 flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#10B981]"></div>
                      Last backed up: Just now
                    </span>
                  </div>
                  <button className="text-text-primary border border-border hover:bg-border px-4 py-2 rounded-[8px] text-[13px] font-bold transition-colors">
                    Manage
                  </button>
                </div>
              </div>

              {/* Preferences */}
              <div className="flex flex-col gap-2">
                <span className="text-text-secondary text-[12px] uppercase tracking-[0.1em] font-bold mb-1">Preferences</span>
                <div className="bg-bg-center border border-border rounded-[10px] flex flex-col overflow-hidden">
                  
                  <div className="flex items-center justify-between px-4 py-4 border-b border-border">
                    <span className="text-text-primary text-[15px] font-medium">Notifications</span>
                    <ToggleSwitch checked={true} onChange={() => {}} />
                  </div>
                  
                  <div className="flex items-center justify-between px-4 py-4 border-b border-border">
                    <div className="flex flex-col">
                      <span className="text-text-primary text-[15px] font-medium">Payment alerts & updates</span>
                      <span className="text-text-muted text-[13px] mt-0.5">Receive updates when funds move</span>
                    </div>
                    <ToggleSwitch checked={true} onChange={() => {}} />
                  </div>

                  <div className="flex items-center justify-between px-4 py-4 border-b border-border">
                    <span className="text-text-primary text-[15px] font-medium">Sound Effects</span>
                    <ToggleSwitch checked={false} onChange={() => {}} />
                  </div>

                  <div className="flex items-center justify-between px-4 py-4 border-b border-border">
                    <span className="text-text-primary text-[15px] font-medium">Switch to dark theme</span>
                    <ToggleSwitch 
                      checked={theme === 'dark'} 
                      onChange={(checked) => setTheme(checked ? 'dark' : 'light')} 
                    />
                  </div>

                  <div className="flex items-center justify-between px-4 py-4">
                    <div className="flex flex-col">
                      <span className="text-text-primary text-[15px] font-medium">Approve tipping</span>
                      <span className="text-text-muted text-[13px] mt-0.5">Automatically sign transactions</span>
                    </div>
                    <ToggleSwitch checked={true} onChange={() => {}} />
                  </div>

                </div>
              </div>

              {/* Language */}
              <div className="flex flex-col gap-2 mb-2">
                <span className="text-text-secondary text-[12px] uppercase tracking-[0.1em] font-bold mb-1">Language</span>
                <div className="bg-bg-center border border-border rounded-[10px] px-4 py-4 flex items-center justify-between cursor-pointer hover:bg-border transition-colors">
                  <span className="text-text-primary text-[15px] font-medium">Select Language</span>
                  <div className="flex items-center gap-2">
                    <span className="text-text-secondary text-[15px]">English</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted">
                      <path d="m9 18 6-6-6-6"/>
                    </svg>
                  </div>
                </div>
              </div>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
