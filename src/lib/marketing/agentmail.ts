const BASE_URL = "https://api.agentmail.dev/v1";

function getApiKey(): string {
  const key = process.env.AGENTMAIL_API_KEY;
  if (!key) throw new Error("AGENTMAIL_API_KEY not set");
  return key;
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`AgentMail ${path} failed (${response.status}): ${text}`);
  }

  return response.json() as Promise<T>;
}

export interface Inbox {
  id: string;
  email: string;
  createdAt: string;
}

export async function createInbox(): Promise<Inbox> {
  const data = await request<any>("POST", "/inboxes", {});
  return {
    id: data.id,
    email: data.email,
    createdAt: data.created_at,
  };
}

export interface Email {
  id: string;
  from: string;
  subject: string;
  body: string;
  html: string;
  receivedAt: string;
}

export async function getEmails(inboxId: string): Promise<Email[]> {
  const data = await request<any>("GET", `/inboxes/${inboxId}/messages`);
  const messages = data.messages ?? data ?? [];

  return (Array.isArray(messages) ? messages : []).map((m: any) => ({
    id: m.id ?? "",
    from: m.from ?? "",
    subject: m.subject ?? "",
    body: m.text ?? m.body ?? "",
    html: m.html ?? "",
    receivedAt: m.received_at ?? m.date ?? "",
  }));
}

export async function deleteInbox(inboxId: string): Promise<void> {
  await request("DELETE", `/inboxes/${inboxId}`);
}
