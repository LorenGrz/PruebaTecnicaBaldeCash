import Image from "next/image";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <Image
        src="/logo-balde-128.png"
        alt="BaldeCash"
        width={72}
        height={84}
        priority
      />
      <h1 className="text-3xl">Solicitudes de financiamiento</h1>
      <p className="text-bc-apagado max-w-md">
        Módulo en construcción. Las pantallas de ingreso, solicitud y gestión de
        créditos llegan en los siguientes PRs.
      </p>
    </main>
  );
}
