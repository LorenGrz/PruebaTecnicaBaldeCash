import Image from "next/image";
import { clases } from "./ui/clases";

/** Isotipo + logotipo. "Balde" en primario, "Cash" en acento. */
export function Marca({
  alto = 32,
  className,
}: {
  alto?: number;
  className?: string;
}) {
  const ancho = Math.round((alto * 109) / 128);
  return (
    <span className={clases("inline-flex items-center gap-2.5", className)}>
      <Image
        src="/logo-balde-128.png"
        alt=""
        width={ancho}
        height={alto}
        priority
        style={{ height: alto, width: "auto" }}
      />
      <span className="font-display text-xl font-extrabold tracking-tight">
        <span className="text-bc-primary">Balde</span>
        <span className="text-bc-acento">Cash</span>
      </span>
    </span>
  );
}
