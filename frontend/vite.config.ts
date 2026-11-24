import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Pasta com backend/ e profiles/. `MIDI_ROOT` permite testar numa cópia sem tocar nos seus vínculos. */
const ROOT = process.env.MIDI_ROOT ?? path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Só no `npm run dev` aberto no navegador: encaminha POST /__bridge para o
 * mesmo `backend/bridge.py` que o Tauri chama. Assim dá pra desenvolver a UI
 * com os dados reais, sem mock. No app (Tauri) isso não é usado.
 */
function pythonBridge(): Plugin {
  return {
    name: "python-bridge",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use("/__bridge", (req, res) => {
        let body = "";
        req.on("data", (chunk) => (body += chunk));
        req.on("end", () => {
          const { command, payload } = JSON.parse(body || "{}");
          const py = spawn("py", ["-3", "backend/bridge.py", String(command), JSON.stringify(payload ?? {})], {
            cwd: ROOT,
            env: { ...process.env, PYTHONIOENCODING: "utf-8", PYTHONUTF8: "1" },
          });
          let out = "";
          let err = "";
          py.stdout.on("data", (chunk) => (out += chunk));
          py.stderr.on("data", (chunk) => (err += chunk));
          py.on("close", () => {
            res.setHeader("content-type", "application/json; charset=utf-8");
            res.end(out.trim() || JSON.stringify({ ok: false, error: err.trim() || "backend sem resposta" }));
          });
        });
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), pythonBridge()],
  clearScreen: false,
  server: { strictPort: true, port: 5173 },
});
