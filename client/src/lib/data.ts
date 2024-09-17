import { User } from '../components/UserContext';

const authKey = 'um.auth';

type Auth = {
  user: User;
  token: string;
};

export function saveAuth(user: User, token: string): void {
  const auth: Auth = { user, token };
  localStorage.setItem(authKey, JSON.stringify(auth));
}

export function removeAuth(): void {
  localStorage.removeItem(authKey);
}

export function readUser(): User | undefined {
  const auth = localStorage.getItem(authKey);
  if (!auth) return undefined;
  return (JSON.parse(auth) as Auth).user;
}

export function readToken(): string | undefined {
  const auth = localStorage.getItem(authKey);
  if (!auth) return undefined;
  return (JSON.parse(auth) as Auth).token;
}
export type Entry = {
  entryId?: number;
  title: string;
  notes: string;
  photoUrl: string;
};

export async function readEntries(): Promise<Entry[]> {
  const token = readToken();
  if (!token) {
    return [];
  }
  const req = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  const response = await fetch('/api/entries', req);
  if (!response.ok) {
    throw new Error(`HTTP fetch error. status: ${response.status}`);
  }

  return (await response.json()) as Entry[];
}

export async function readEntry(entryId: number): Promise<Entry | undefined> {
  const token = readToken();
  const req = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  const response = await fetch(`/api/details/${entryId}`, req);
  if (!response.ok) {
    throw new Error(`HTTP fetch error. status: ${response.status}`);
  }
  return (await response.json()) as Entry;
}

export async function addEntry(entry: Entry): Promise<Entry> {
  const token = readToken();
  const req = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(entry),
  };
  const response = await fetch('/api/details/new', req);
  if (!response.ok) {
    throw new Error(`fetch Error ${response.status}`);
  }
  const newEntry = await response.json();
  return newEntry;
}

export async function updateEntry(entry: Entry): Promise<Entry> {
  const token = readToken();
  const req = {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(entry),
  };
  const response = await fetch(`/api/details/${entry.entryId}`, req);
  if (!response.ok) throw new Error(`fetch Error ${response.status}`);
  return entry;
}

export async function removeEntry(entryId: number): Promise<void> {
  const token = readToken();
  const response = await fetch(`/api/details/${entryId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error(`fetch Error ${response.status}`);
  }
}
