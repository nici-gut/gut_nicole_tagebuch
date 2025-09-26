// entry.ts

// Öffne die Deno KV Datenbank.
const kv = await Deno.openKv();

export interface Entry {
  id: string;
  title: string;
  content: string;
  date?: string; // Geändert: Datum ist jetzt optional
  done: boolean;
}

// Alle Einträge aus der KV-Datenbank auslesen
export async function getEntries(): Promise<Entry[]> {
  const entries: Entry[] = [];
  for await (const entry of kv.list<Entry>({ prefix: ["entries"] })) {
    entries.push(entry.value);
  }
  return entries;
}

// Einen neuen Eintrag erstellen
export async function createEntry(title: string, content: string): Promise<Entry> {
  const newEntry: Entry = {
    id: crypto.randomUUID(),
    title,
    content,
    // Die Zeile für das Datum wurde entfernt
    done: false,
  };
  await kv.set(["entries", newEntry.id], newEntry);
  return newEntry;
}

// Einen Eintrag aktualisieren
export async function updateEntry(id: string, title: string, content: string): Promise<Entry | null> {
  const key = ["entries", id];
  const entry = await kv.get<Entry>(key);

  if (!entry.value) {
    return null;
  }

  // Die Zeile für das Datum wurde entfernt
  const updatedEntry = { ...entry.value, title, content };
  await kv.set(key, updatedEntry);
  return updatedEntry;
}

// Einen Eintrag löschen
export async function deleteEntry(id: string): Promise<void> {
  await kv.delete(["entries", id]);
}