"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'ja', label: 'Japanese' },
  { code: 'zh', label: 'Chinese' },
  { code: 'ar', label: 'Arabic' },
  { code: 'ru', label: 'Russian' },
  { code: 'de', label: 'German' },
  { code: 'hi', label: 'Hindi' },
];

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [allowanceAmount, setAllowanceAmount] = useState("50.00");
  const [isAllowanceModalOpen, setIsAllowanceModalOpen] = useState(false);
  const [tempAllowance, setTempAllowance] = useState(allowanceAmount);
  
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(LANGUAGES[0]);

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

                  <div className="flex flex-col px-4 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-text-primary text-[15px] font-medium">Approve tipping</span>
                        <span className="text-text-muted text-[13px] mt-0.5">Approved amount: {allowanceAmount} USDT</span>
                      </div>
                      <button 
                        onClick={() => {
                          setTempAllowance(allowanceAmount);
                          setIsAllowanceModalOpen(true);
                        }}
                        className="px-5 py-2 bg-accent text-accent-text font-bold rounded-[8px] text-[13px] hover:opacity-90 transition-opacity"
                      >
                        Approve
                      </button>
                    </div>
                  </div>

                </div>
              </div>

              {/* Language */}
              <div className="flex flex-col gap-2 mb-2">
                <span className="text-text-secondary text-[12px] uppercase tracking-[0.1em] font-bold mb-1">Language</span>
                <div 
                  onClick={() => setIsLanguageModalOpen(true)}
                  className="bg-bg-center border border-border rounded-[10px] px-4 py-4 flex items-center justify-between cursor-pointer hover:bg-border transition-colors"
                >
                  <span className="text-text-primary text-[15px] font-medium">Select Language</span>
                  <div className="flex items-center gap-2">
                    <span className="text-text-secondary text-[15px]">{selectedLanguage.label}</span>
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
      
      {/* Allowance Sub-Modal */}
      {isAllowanceModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsAllowanceModalOpen(false)}
            className="absolute inset-0 bg-[#050505]/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
            className="relative w-full max-w-[400px] bg-surface border border-border rounded-[16px] overflow-hidden flex flex-col shadow-2xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-text-primary text-[18px] font-bold">Approve Allowance</h3>
              <button 
                onClick={() => setIsAllowanceModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-border transition-colors text-text-muted"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 1L13 13M1 13L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            
            <div className="flex flex-col gap-4 mb-8">
              <p className="text-text-muted text-[14px]">
                Enter the maximum amount of USDT you want to allow the tipping engine to spend automatically.
              </p>
              <div className="relative w-full">
                <input 
                  type="number" 
                  value={tempAllowance}
                  onChange={(e) => setTempAllowance(e.target.value)}
                  className="w-full h-[52px] bg-bg-center border border-border rounded-[10px] px-4 text-text-primary text-[16px] focus:outline-none focus:border-border-emphasis font-mono"
                  placeholder="0.00"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary text-[14px] font-mono">
                  USDT
                </span>
              </div>
            </div>
            
            <button 
              onClick={() => {
                setAllowanceAmount(tempAllowance || "0.00");
                setIsAllowanceModalOpen(false);
              }}
              className="w-full h-[52px] bg-accent text-accent-text font-bold rounded-[10px] hover:opacity-90 transition-opacity"
            >
              Confirm Approval
            </button>
          </motion.div>
        </div>
      )}

      {/* Language Sub-Modal */}
      {isLanguageModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsLanguageModalOpen(false)}
            className="absolute inset-0 bg-[#050505]/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
            className="relative w-full max-w-[400px] bg-surface border border-border rounded-[16px] overflow-hidden flex flex-col shadow-2xl max-h-[80vh]"
          >
            <div className="h-[64px] border-b border-divider flex items-center justify-between px-6 shrink-0">
              <h3 className="text-text-primary text-[18px] font-bold">Select Language</h3>
              <button 
                onClick={() => setIsLanguageModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-border transition-colors text-text-muted"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 1L13 13M1 13L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto flex flex-col gap-1">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setSelectedLanguage(lang);
                    setIsLanguageModalOpen(false);
                  }}
                  className={`w-full h-[52px] px-4 rounded-[10px] flex items-center justify-between transition-colors ${selectedLanguage.code === lang.code ? 'bg-bg-center border border-border-emphasis' : 'hover:bg-border border border-transparent'}`}
                >
                  <span className={`text-[15px] ${selectedLanguage.code === lang.code ? 'text-text-primary font-bold' : 'text-text-secondary font-medium'}`}>
                    {lang.label}
                  </span>
                  {selectedLanguage.code === lang.code && (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D53131" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      )}

    </AnimatePresence>
  );
}
