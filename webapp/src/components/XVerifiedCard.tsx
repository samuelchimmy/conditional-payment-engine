import { motion } from "framer-motion";

const EXHIBIT_URL = "https://developer.x.com/exhibit/tether-arenaai";

export function XVerifiedCard() {
  return (
    <motion.a
      href={EXHIBIT_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="View Tether Arena on the X Developer Platform exhibit"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
      className="group w-full max-w-[520px] bg-[#0D0D0D] border border-[#2A2A2A] rounded-[10px] px-5 py-4 flex items-center gap-4 mx-auto hover:border-[#3A3A3A] transition-colors cursor-pointer"
    >
      {/* X Logo */}
      <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-[#181818] rounded-[8px]">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M18.244 2.25H21.552L14.325 10.51L22.827 21.75H16.17L10.956 14.933L4.99 21.75H1.68L9.41 12.915L1.254 2.25H8.08L12.793 8.481L18.244 2.25ZM17.083 19.77H18.916L7.084 4.126H5.117L17.083 19.77Z"
            fill="#F2F1EF"
          />
        </svg>
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-[#F2F1EF] text-[14px] font-bold leading-tight">
            Featured on X Developer Platform
          </p>
          {/* Blue verified checkmark */}
          <svg width="16" height="16" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
            <path
              d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.062-.315.094-.635.096-.957-.001-.32-.031-.641-.094-.955.493-.754.757-1.643.757-2.552 0-.912-.266-1.802-.761-2.556-.496-.755-1.195-1.344-2.012-1.695-1.16-.502-2.5-.447-3.612.145a4.012 4.012 0 00-1.51-1.12c-.867-.38-1.838-.464-2.759-.238-.92.226-1.745.738-2.35 1.462-.615.735-.97 1.654-.993 2.613-.316.062-.627.165-.918.305-.58.274-1.076.701-1.437 1.235a3.977 3.977 0 00-.568 1.814c-.018.633.157 1.258.505 1.793-.347.535-.523 1.16-.505 1.793.036.64.225 1.26.552 1.808.327.549.783.999 1.325 1.306.27.152.557.268.854.345-.018.218-.016.436.007.653-.049.31-.049.63 0 .94.232 1.02.837 1.913 1.695 2.509.858.597 1.907.852 2.946.718.364.35.79.627 1.255.815.894.362 1.886.397 2.8.099.916-.298 1.698-.897 2.21-1.697.59.133 1.2.132 1.788-.003.59-.135 1.139-.406 1.602-.796.465-.39.835-.882 1.084-1.437.25-.557.374-1.162.362-1.772.3-.08.588-.196.858-.349.543-.308 1-.76 1.328-1.31.327-.549.515-1.171.547-1.812zm-9.54 6.862c-.21.105-.438.169-.673.19a1.876 1.876 0 01-.69-.076 1.865 1.865 0 01-.602-.323 1.84 1.84 0 01-.415-.53 1.8 1.8 0 01-.21-.65c.268-.09.527-.211.77-.36l3.67-2.175c.27.168.556.307.853.415l-2.703 3.51zm5.92-5.51l-3.673 2.175-3.673-2.175V8.327l3.673-2.175 3.673 2.175v3.525z"
              fill="#1D9BF0"
            />
          </svg>
        </div>
        <p className="text-[#797977] text-[12px] leading-snug">
          Verified in the X Developer Exhibit. tether.arena is an approved platform for conditional social payments.
        </p>
      </div>

      {/* External-link chevron */}
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="flex-shrink-0 text-[#555] group-hover:text-[#888] transition-colors" xmlns="http://www.w3.org/2000/svg">
        <path d="M7 17L17 7M17 7H8M17 7V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </motion.a>
  );
}
