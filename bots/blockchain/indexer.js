import { decodeEventLog } from 'viem';
import { buildCeloClients } from './celoClient.js';
import { IOU_REGISTRY_V3_ABI } from './iouV3.js';
import { supabase } from '../db/supabase.js';

// Push Notification Helper
async function triggerPushNotification(payload) {
  try {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return;

    await fetch(`${url}/functions/v1/onesignal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
      },
      body: JSON.stringify(payload)
    });
  } catch (error) {
    console.error("Failed to trigger push:", error);
  }
}

export async function startIndexer() {
  const { publicClient } = buildCeloClients();
  const registry = process.env.IOU_REGISTRY_V3;
  if (!registry) throw new Error("IOU_REGISTRY_V3 missing");

  console.log(`Starting indexer for registry ${registry}...`);

  publicClient.watchEvent({
    address: registry,
    events: IOU_REGISTRY_V3_ABI.filter(a => a.type === 'event'),
    onLogs: async logs => {
      for (const log of logs) {
        try {
          const decoded = decodeEventLog({
            abi: IOU_REGISTRY_V3_ABI,
            data: log.data,
            topics: log.topics
          });

          if (decoded.eventName === 'ConditionalIOUCreated') {
            console.log("Found IOUCreated:", decoded.args);
            
            const iouId = decoded.args.iouId.toString();
            const sender = decoded.args.sender;
            const amount = decoded.args.grossAmount.toString();
            const recipientId = decoded.args.recipientId;

            // 1. Trustlessly Insert into conditional_payments
            await supabase.from('conditional_payments').upsert({
              iou_id: iouId,
              sender_id: sender,
              amount: amount,
              status: 'pending',
              tx_hash: log.transactionHash
            }, { onConflict: 'iou_id' });

            // 2. Trigger Push Notification to Sender
            // We use Edge Function onesignal to send it
            await triggerPushNotification({
              targetWalletAddresses: [sender],
              title: "Payment Locked",
              message: `Your payment of ${Number(amount) / 1e6} USDT has been secured in escrow. Matches starting soon!`
            });

            // Note: If we had the recipient's wallet address, we would notify them too.
            // But we only have the recipientId hash here. 
            // In a pro system, we'd look up the recipientId in wallet_profiles.
          }
          
          if (decoded.eventName === 'ConditionalIOUClaimed') {
            const iouId = decoded.args.iouId.toString();
            await supabase.from('conditional_payments').update({
              status: 'claimed'
            }).eq('iou_id', iouId);

            // Fetch payment details to notify
            const { data } = await supabase.from('conditional_payments').select('sender_id').eq('iou_id', iouId).single();
            if (data) {
              await triggerPushNotification({
                targetWalletAddresses: [data.sender_id],
                title: "Payment Claimed",
                message: "A recipient has claimed your tip!"
              });
            }
          }
          
        } catch (err) {
          console.error("Error processing log:", err);
        }
      }
    }
  });
}

// Auto-start if run directly
if (process.argv[1].endsWith('indexer.js')) {
  startIndexer().catch(console.error);
}
