import { site } from "@/config/site";

/** Whether a damage/defect claim can still be raised for an order delivered at `deliveredAt`. */
export function returnWindowOpen(deliveredAt: Date, now = new Date()) {
  return now.getTime() - deliveredAt.getTime() <= site.returns.windowHours * 3_600_000;
}
