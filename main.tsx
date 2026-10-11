import { createRoot } from "react-dom/client";
import { Ruirui } from "./components/Ruirui";
import { Chat } from "./components/Chat";
import { AdminPanel } from "./components/AdminPanel";
import { SiteContentProvider } from "./components/SiteContent";
import "./app/globals.css";
import "./app/ruirui.css";
const path = location.pathname.slice(import.meta.env.BASE_URL.length).replace(/\/$/, "");
if(path === "admin") { const meta=document.createElement("meta");meta.name="robots";meta.content="noindex";document.head.appendChild(meta); }
createRoot(document.getElementById("root")!).render(<SiteContentProvider>{path === "chat" ? <Chat/> : path === "admin" ? <AdminPanel/> : <Ruirui/>}</SiteContentProvider>);
