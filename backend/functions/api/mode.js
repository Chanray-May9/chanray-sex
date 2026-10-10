import { handleMode } from "./_activation.js";
import { json } from "./_http.js";
async function handle(context) { try { return await handleMode(context); } catch { return json({error:"activation unavailable"},503); } }
export const onRequestGet = handle;
export const onRequestPost = handle;
