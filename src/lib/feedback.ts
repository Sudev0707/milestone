import { toast } from "sonner";
import confetti from "canvas-confetti";

export function celebrate() {
  confetti({
    particleCount: 90,
    spread: 70,
    origin: { y: 0.6 },
    colors: ["#6366f1", "#10b981", "#f59e0b", "#3b82f6"],
    disableForReducedMotion: true,
  });
}

export const notify = toast;
