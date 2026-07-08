import { motion, AnimatePresence } from "framer-motion";

const CELOSCAN = "https://celoscan.io/tx/";

function short(v?: string, head = 8, tail = 6) {
  if (!v) return "—";
  return v.length > head + tail + 3 ? `${v.slice(0, head)}…${v.slice(-tail)}` : v;
}

function Row({ label, value, mono = true, strong = false }: { label: string; value: React.ReactNode; mono?: boolean; strong?: boolean }) {
  return (
    <div className="flex justify-between items-center gap-4">
      <span className="text-[#797977] font-normal">{label}</span>
      <span className={`${mono ? "font-mono" : ""} ${strong ? "font-bold" : "font-medium"} text-right break-all`}>{value}</span>
    </div>
  );
}

/**
 * Unified receipt for any history entry — a conditional bet, a deposit, or a
 * withdrawal. Pass `entry` with a `kind` discriminator.
 */
export function ReceiptModal({ isOpen, onClose, entry }: { isOpen: boolean; onClose: () => void; entry: any }) {
  return (
    <AnimatePresence>
      {isOpen && entry && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
            className="relative w-full max-w-[420px] bg-[#F2F1EF] rounded-[16px] p-8 text-[#050505] shadow-2xl"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors"
              aria-label="Close receipt"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>

            {/* Brand */}
            <div className="flex justify-center mb-7">
              <div className="flex items-baseline gap-0.5">
                <span className="font-[800] text-[20px] tracking-tight">tether</span>
                <span className="font-[800] text-[#797977] text-[20px]">.</span>
                <span className="font-[400] text-[20px] tracking-tight">arena</span>
              </div>
            </div>

            {entry.kind === "deposit" || entry.kind === "withdrawal"
              ? <TransferReceipt entry={entry} />
              : <BetReceipt bet={entry} />}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function TransferReceipt({ entry }: { entry: any }) {
  const isDeposit = entry.kind === "deposit";
  const amount = Number(entry.amount || 0);
  const date = entry.timestamp ? new Date(entry.timestamp) : null;

  return (
    <>
      <div className="mb-6 text-center">
        <span className="text-[#797977] text-[10px] font-normal uppercase tracking-[0.1em]">RECEIPT</span>
        <h1 className="text-[22px] font-[800] leading-tight mt-1 mb-2 tracking-tight">
          {isDeposit ? "Deposit" : "Withdrawal"}
        </h1>
        <p className="text-[18px] font-bold" style={{ color: isDeposit ? "#009393" : "#050505" }}>
          {isDeposit ? "+" : "−"}{amount.toFixed(2)} USDT
        </p>
      </div>

      <div className="mb-6 bg-[#E2E1DF] p-4 rounded-[10px] text-[13px] flex flex-col gap-2 border border-[#D1D1D1]">
        <Row label={isDeposit ? "From" : "To"} value={short(entry.counterparty)} />
        <Row label="Network" value="Celo" mono={false} />
        <Row label="Date" value={date ? date.toLocaleString() : "—"} mono={false} />
        <Row label="Status" value={<span className="text-[#009393] font-bold">Completed</span>} mono={false} />
      </div>

      <a
        href={`${CELOSCAN}${entry.txHash}`}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full h-[46px] bg-[#050505] text-[#F2F1EF] font-bold rounded-[10px] flex items-center justify-center gap-2 hover:opacity-90 transition-opacity text-[14px]"
      >
        View on CeloScan
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 17L17 7M17 7H8M17 7V16" />
        </svg>
      </a>
    </>
  );
}

function BetReceipt({ bet }: { bet: any }) {
  const amount = parseFloat(bet.amount || 0);
  const fee = amount * 0.006;
  const net = amount - fee;
  const date = bet.created_at ? new Date(bet.created_at) : null;

  return (
    <>
      <div className="mb-6">
        <span className="text-[#797977] text-[10px] font-normal uppercase tracking-[0.1em]">RECEIPT</span>
        <h1 className="text-[32px] font-[800] leading-none mt-2 mb-2 tracking-tight">Conditional Bet</h1>
        <p className="text-[#797977] text-[14px]">{bet.condition_str || "Custom condition"}</p>
      </div>

      <div className="mb-6 bg-[#E2E1DF] p-4 rounded-[10px] text-[13px] flex flex-col gap-2 border border-[#D1D1D1]">
        {bet.sender_id && <Row label="Sender" value={short(String(bet.sender_id))} />}
        <Row label="Recipient" value={bet.recipient_handle || "—"} />
        <Row label="Platform" value={<span className="capitalize">{bet.platform || "webapp"}</span>} mono={false} />
        <Row label="Date" value={date ? date.toLocaleDateString() : "—"} mono={false} />
        <Row label="Status" value={<span className="capitalize font-bold">{bet.status || "pending"}</span>} mono={false} />
      </div>

      <div className="mb-6 flex flex-col gap-1 text-[15px] font-mono">
        <Row label="Amount" value={`${amount.toFixed(2)} USDT`} strong />
        <Row label="Fee" value={`${fee.toFixed(2)} USDT`} />
        <div className="border-t border-[#C9C8C6] pt-1 mt-1">
          <Row label="Net" value={`${net.toFixed(2)} USDT`} strong />
        </div>
      </div>

      {bet.tx_hash && bet.tx_hash.startsWith("0x") && (
        <a
          href={`${CELOSCAN}${bet.tx_hash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full h-[46px] bg-[#050505] text-[#F2F1EF] font-bold rounded-[10px] flex items-center justify-center gap-2 hover:opacity-90 transition-opacity text-[14px]"
        >
          View on CeloScan
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 17L17 7M17 7H8M17 7V16" />
          </svg>
        </a>
      )}
    </>
  );
}
