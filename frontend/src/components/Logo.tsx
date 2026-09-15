import Image from "next/image";
import ui from "@/app/ui.module.css";

type Props = {
  variant?: "mark" | "lockup";
  className?: string;
  priority?: boolean;
};

export function Logo({ variant = "mark", className, priority = false }: Props) {
  const lockup = variant === "lockup";
  return (
    <Image
      src={lockup ? "/brand/kse-lockup.jpg" : "/brand/kse-mark.jpg"}
      alt=""
      width={lockup ? 1024 : 1024}
      height={lockup ? 152 : 1024}
      className={className ?? (lockup ? ui.logoLockup : ui.logoMark)}
      priority={priority}
    />
  );
}
