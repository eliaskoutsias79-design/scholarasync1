import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import vm from "node:vm";

const root = resolve(import.meta.dirname, "..");
const read = (path) => readFileSync(join(root, path), "utf8");

const requiredFiles = [
  "public/.well-known/assetlinks.json",
  "public/manifest.webmanifest",
  "public/service-worker.js",
  "src/services/androidNotifications.js",
  "supabase/functions/send-web-push/index.ts",
  "supabase/migrations/202607230001_create_study_groups.sql",
  "supabase/migrations/202607230002_web_push.sql",
  "supabase/migrations/202607240001_android_fcm.sql",
  "supabase/migrations/202607240002_personal_assignments.sql",
  "supabase/migrations/202607240003_assignment_upgrades.sql",
  "vercel.json",
];

requiredFiles.forEach((path) => {
  assert.ok(existsSync(join(root, path)), `Missing required file: ${path}`);
});

[
  "public/.well-known/assetlinks.json",
  "public/manifest.webmanifest",
  "vercel.json",
].forEach((path) => {
  assert.doesNotThrow(() => JSON.parse(read(path)), `Invalid JSON: ${path}`);
});

const styles = read("src/styles.css");
assert.match(
  styles,
  /\.sidebar \.mobile-navigation\s*\{[\s\S]*?grid-template-columns:\s*repeat\(6,/,
  "Mobile navigation must use exactly six equal slots.",
);
assert.match(styles, /\.mobile-more-sheet\s*\{/, "Missing More-sheet styling.");
assert.match(
  styles,
  /@media screen and \(min-width: 721px\)[\s\S]*?\.sidebar \.desktop-navigation\s*\{[\s\S]*?display:\s*flex !important/,
  "Desktop navigation visibility rule is missing.",
);

const appRoutes = read("src/AppRoutes.jsx");
assert.match(
  appRoutes,
  /view === "admin" && !isAdmin \? "calendar" : view/,
  "The non-admin route guard is missing.",
);

const edgeFunction = read("supabase/functions/send-web-push/index.ts");
assert.equal(
  edgeFunction,
  read("functions/send-web-push/index.ts"),
  "The two send-web-push copies are out of sync.",
);
assert.match(
  edgeFunction,
  /table === "personal_assignment_reminders"/,
  "Deadline reminder delivery is missing from send-web-push.",
);

const migrationWithSecrets = [
  read("supabase/migrations/202607230002_web_push.sql"),
  read("supabase/migrations/202607240003_assignment_upgrades.sql"),
];
for (const migration of migrationWithSecrets) {
  assert.match(
    migration,
    /YOUR_WEBHOOK_SECRET/,
    "Webhook migration must keep a safe placeholder in Git.",
  );
}

const ignoredDirectories = new Set([".git", "dist", "node_modules"]);
const sourceFiles = [];
const privateKeyPattern = new RegExp(
  ["-----BEGIN", "PRIVATE KEY-----"].join(" "),
);
const walk = (directory) => {
  for (const entry of readdirSync(directory)) {
    if (ignoredDirectories.has(entry)) continue;
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) walk(path);
    else sourceFiles.push(path);
  }
};
walk(root);

for (const path of sourceFiles) {
  const extension = path.split(".").pop()?.toLowerCase();
  if (!["js", "jsx", "ts", "json", "md", "sql", "html", "css"].includes(extension)) {
    continue;
  }
  const content = readFileSync(path, "utf8");
  assert.doesNotMatch(
    content,
    privateKeyPattern,
    `Private key found in ${relative(root, path)}`,
  );
}

const listeners = new Map();
const serviceWorkerContext = {
  URL,
  Response,
  Set,
  Promise,
  console,
  fetch: async () => new Response("ok"),
  caches: {
    async delete() {
      return true;
    },
    async keys() {
      return [];
    },
    async match() {
      return null;
    },
    async open() {
      return {
        async addAll() {},
        async put() {},
      };
    },
  },
  self: {
    location: { origin: "https://scholarasync.vercel.app" },
    clients: {
      claim() {},
      matchAll: async () => [],
      openWindow: async () => undefined,
    },
    registration: { showNotification: async () => undefined },
    skipWaiting() {},
    addEventListener(type, handler) {
      listeners.set(type, handler);
    },
  },
};

vm.runInNewContext(read("public/service-worker.js"), serviceWorkerContext);
const fetchHandler = listeners.get("fetch");
assert.equal(typeof fetchHandler, "function", "Service worker fetch handler missing.");

let crossOriginIntercepted = false;
fetchHandler({
  request: {
    method: "GET",
    mode: "cors",
    destination: "",
    url: "https://example.supabase.co/rest/v1/profiles",
  },
  respondWith() {
    crossOriginIntercepted = true;
  },
});
assert.equal(
  crossOriginIntercepted,
  false,
  "Service worker must not intercept or cache cross-origin API requests.",
);

let navigationIntercepted = false;
fetchHandler({
  request: {
    method: "GET",
    mode: "navigate",
    destination: "document",
    url: "https://scholarasync.vercel.app/?view=calendar",
  },
  respondWith(promise) {
    navigationIntercepted = true;
    void promise;
  },
});
assert.equal(
  navigationIntercepted,
  true,
  "Service worker should provide an offline fallback for app navigation.",
);

console.log("Repository validation passed.");
