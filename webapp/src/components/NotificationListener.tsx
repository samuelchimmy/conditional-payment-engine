"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useWallet } from "@/components/WalletProvider";
import { toast } from "react-hot-toast";

const NOTIFICATION_SOUND_URL = "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3"; 

export function NotificationListener() {
  const { address } = useWallet();
  const [profile, setProfile] = useState<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio(NOTIFICATION_SOUND_URL);
      audioRef.current.volume = 0.5;
      
      if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
      }
    }
  }, []);

  useEffect(() => {
    if (!address) return;

    supabase
      .from("wallet_profiles")
      .select("*")
      .eq("wallet_address", address.toLowerCase())
      .single()
      .then(({ data }) => {
        if (data) setProfile(data);
      });
  }, [address]);

  useEffect(() => {
    if (!profile) return;

    const handles = [
      profile.x_username,
      profile.discord_id,
      profile.telegram_id,
      profile.wallet_address
    ].filter(Boolean);

    const channel = supabase.channel('realtime_payments')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conditional_payments' },
        (payload: any) => {
          const isRecipient = handles.some(h => 
            payload.new?.recipient_handle?.toLowerCase() === h?.toLowerCase()
          );
          
          const isSender = payload.new?.sender_id === profile.id;

          if (isRecipient || isSender) {
            playNotificationSound();
            
            let message = "You have a new transaction update!";
            if (payload.eventType === "INSERT") {
              if (isRecipient) message = `You received a conditional payment of ${payload.new.amount} USDT!`;
              if (isSender) message = `Your payment of ${payload.new.amount} USDT was initiated.`;
            } else if (payload.eventType === "UPDATE") {
              if (payload.new.status === "claimed") {
                 message = isRecipient 
                   ? `Your tip of ${payload.new.amount} USDT was successfully claimed!`
                   : `Your tip to ${payload.new.recipient_handle} was claimed!`;
              } else if (payload.new.status === "refunded") {
                 message = isSender ? `Your payment of ${payload.new.amount} USDT was refunded.` : message;
              }
            }

            showNotification("tether.arena", message);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile]);

  const playNotificationSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => console.log("Audio play blocked by browser", e));
    }
  };

  const showNotification = (title: string, body: string) => {
    // In-app Toast
    toast(body, {
      icon: '🔔',
      style: {
        borderRadius: '10px',
        background: '#0D0D0D',
        color: '#F2F1EF',
        border: '1px solid #3A3A3A',
        fontSize: '13px',
      },
    });

    // OS Level Push Notification
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body });
    }
  };

  return null;
}
