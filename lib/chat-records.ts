export type SavedMessage = { id: number; role: "user" | "assistant"; content: string; mode: "whisper" | "ai"; image?: string; failed?: boolean };
export type ChatRecord = { id: string; updatedAt: number; mode: "whisper" | "ai"; messages: SavedMessage[]; scope?: "normal" | "hidden" };
export type RecordSummary = { id: string; updatedAt: number; title: string; image: boolean };
let opening: Promise<IDBDatabase> | undefined;
let writes = Promise.resolve();
function database() {
  if (!opening) opening = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open("ruirui-chat-records", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("conversations", { keyPath: "id" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => { opening = undefined; reject(request.error); };
    request.onblocked = () => { opening = undefined; reject(new Error("database blocked")); };
  });
  return opening;
}
function valid(record: ChatRecord): boolean {
  return Boolean(record && typeof record.id === "string" && typeof record.updatedAt === "number" && ["ai", "whisper"].includes(record.mode) && Array.isArray(record.messages) && record.messages.every(message => message && Number.isSafeInteger(message.id) && ["user", "assistant"].includes(message.role) && ["ai", "whisper"].includes(message.mode) && typeof message.content === "string" && (!message.image || /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/.test(message.image))));
}
export function summary(record: ChatRecord): RecordSummary {
  const user = record.messages.find(message => message.role === "user");
  return { id: record.id, updatedAt: record.updatedAt, title: user?.content.slice(0, 25) || "", image: Boolean(user?.image) };
}
export async function loadRecords(scope: "normal" | "hidden" = "normal"): Promise<ChatRecord[]> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const request = db.transaction("conversations").objectStore("conversations").getAll();
    request.onsuccess = () => resolve((request.result as ChatRecord[]).filter(valid).filter(record => (record.scope || "normal") === scope).sort((a, b) => b.updatedAt - a.updatedAt));
    request.onerror = () => reject(request.error);
  });
}
export async function loadRecord(id: string): Promise<ChatRecord | undefined> {
  await writes;
  const db = await database();
  return new Promise((resolve, reject) => {
    const request = db.transaction("conversations").objectStore("conversations").get(id);
    request.onsuccess = () => resolve(valid(request.result) ? request.result : undefined);
    request.onerror = () => reject(request.error);
  });
}
export function saveRecord(record: ChatRecord): Promise<void> {
  const saved = structuredClone(record);
  const next = writes.catch(() => {}).then(async () => {
    const db = await database();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction("conversations", "readwrite");
      transaction.objectStore("conversations").put(saved);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  });
  writes = next.catch(() => {});
  return next;
}
