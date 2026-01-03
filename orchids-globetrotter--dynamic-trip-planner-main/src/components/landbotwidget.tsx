"use client";

import { useEffect, useState } from "react";

export default function LandbotWidget() {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!open || loaded) return;

    const script = document.createElement("script");
    script.id = "landbot-script";
    script.type = "module";
    script.src = "https://cdn.landbot.io/landbot-3/landbot-3.0.0.mjs";
    script.async = true;

    document.body.appendChild(script);

    script.onload = () => {
      // @ts-ignore
      new window.Landbot.Container({
        container: "#myLandbot",
        configUrl:
          "https://storage.googleapis.com/landbot.online/v3/H-3289902-XZGRYNL2XI36CXKM/index.json",
      });
      setLoaded(true);
    };
  }, [open, loaded]);

  return (
    <>
      {/* CHAT WINDOW */}
      {open && (
        <div
          id="myLandbot"
          style={{
            position: "fixed",
            bottom: "90px",
            right: "20px",
            width: "360px",
            height: "520px",
            borderRadius: "16px",
            overflow: "hidden",
            boxShadow: "0 12px 32px rgba(0,0,0,0.25)",
            zIndex: 9999,
            background: "#ffffff",
          }}
        />
      )}

      {/* FLOATING TOGGLE BUTTON */}
      <button
        onClick={() => setOpen(!open)}
        aria-label="Toggle AI Travel Assistant"
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          background: "#2563eb",
          color: "#ffffff",
          border: "none",
          cursor: "pointer",
          boxShadow: "0 10px 24px rgba(0,0,0,0.25)",
          zIndex: 10000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "22px",
        }}
      >
        {open ? "✕" : "💬"}
      </button>
    </>
  );
}
