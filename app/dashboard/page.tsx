"use client";

import { useEffect, useState } from "react";

export default function Dashboard() {
  const [emails, setEmails] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/gmail")
      .then((res) => res.json())
      .then((data) => {
        setEmails(data.messages || []);
      });
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h1>Inbox</h1>

      {emails.map((email) => (
        <div
          key={email.id}
          style={{
            border: "1px solid #333",
            padding: "10px",
            marginBottom: "10px",
          }}
        >
          <p>{email.id}</p>
        </div>
      ))}
    </div>
  );
}