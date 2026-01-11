import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Brio - App de Finanzas Personales Costa Rica";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0a0a0a",
          backgroundImage:
            "radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(34, 197, 94, 0.1) 0%, transparent 50%)",
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 100,
            height: 100,
            borderRadius: 24,
            backgroundColor: "#3b82f6",
            marginBottom: 24,
          }}
        >
          <svg
            width="56"
            height="56"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
            <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
          </svg>
        </div>

        {/* Title */}
        <div
          style={{
            display: "flex",
            fontSize: 72,
            fontWeight: 700,
            color: "white",
            marginBottom: 8,
          }}
        >
          Brio
        </div>

        {/* Subtitle */}
        <div
          style={{
            display: "flex",
            fontSize: 32,
            color: "#a1a1aa",
            marginBottom: 32,
          }}
        >
          App de Finanzas Personales
        </div>

        {/* Costa Rica badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "12px 24px",
            borderRadius: 24,
            backgroundColor: "#1e293b",
            marginBottom: 32,
          }}
        >
          <span style={{ fontSize: 24 }}>🇨🇷</span>
          <span style={{ fontSize: 20, color: "#22c55e" }}>
            Hecho en Costa Rica
          </span>
        </div>

        {/* Features */}
        <div
          style={{
            display: "flex",
            gap: 24,
            color: "#71717a",
            fontSize: 20,
          }}
        >
          <span>Multi-Moneda</span>
          <span>•</span>
          <span>Gastos Recurrentes</span>
          <span>•</span>
          <span>Suscripciones</span>
          <span>•</span>
          <span>Ahorro</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
