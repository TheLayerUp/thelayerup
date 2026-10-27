import { HONEYPOT_FIELD } from "@/lib/honeypot";

/** Off-screen field that humans never see or fill; bots that auto-fill forms do. */
export default function Honeypot() {
  return (
    <div aria-hidden className="absolute -left-[10000px] h-px w-px overflow-hidden">
      <label>
        Leave this empty
        <input type="text" name={HONEYPOT_FIELD} tabIndex={-1} autoComplete="off" />
      </label>
    </div>
  );
}
