export type Entry = {
  entryId?: number;
  title: string;
  notes: string;
  photoUrl: string;
};

export async function readEntries(): Promise<Entry[]> {
  const response = await fetch('/api/entries');
  if (!response.ok) {
    throw new Error(`HTTP fetch error. status: ${response.status}`);
  }
  return (await response.json()) as Entry[];
}

export async function readEntry(entryId: number): Promise<Entry | undefined> {
  const response = await fetch(`/api/details/${entryId}`);
  if (!response.ok) {
    throw new Error(`HTTP fetch error. status: ${response.status}`);
  }
  return (await response.json()) as Entry;
}

export async function addEntry(entry: Entry): Promise<Entry> {
  const req = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
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
  const req = {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(entry),
  };
  const response = await fetch(`/api/details/${entry.entryId}`, req);
  if (!response.ok) throw new Error(`fetch Error ${response.status}`);
  return entry;
}

export async function removeEntry(entryId: number): Promise<void> {
  const response = await fetch(`/api/details/${entryId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error(`fetch Error ${response.status}`);
  }
}
