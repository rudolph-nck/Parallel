"use client";

import { useEffect, useState } from "react";
import { broadcastResponseToMainFrame } from "@azure/msal-browser/redirect-bridge";

export default function MicrosoftCallback() {
  const [message, setMessage] = useState("Finishing your secure connection…");

  useEffect(() => {
    broadcastResponseToMainFrame().catch(() => {
      setMessage("The connection could not be completed. You can close this window.");
    });
  }, []);

  return (
    <main className="microsoft-callback">
      <span className="parallel-mark callback-mark" aria-hidden="true">
        <i />
        <i />
      </span>
      <p>{message}</p>
    </main>
  );
}
