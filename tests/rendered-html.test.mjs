import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${pathname}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the Parallel Friday dashboard", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Parallel — Move through work with clarity<\/title>/i);
  assert.match(html, /Move through work with clarity\./);
  assert.match(html, /Good morning, Nick\./);
  assert.match(html, /Talk to Friday/);
  assert.match(html, /Friday proposes\./);
  assert.match(html, /You decide\./);
  assert.doesNotMatch(html, /Your site is taking shape|Building your site/);
});

test("keeps the permanent key on the server and configures live Recall voice", async () => {
  const [page, route, gitignore] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/realtime/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../.gitignore", import.meta.url), "utf8"),
  ]);

  assert.match(page, /new RTCPeerConnection\(\)/);
  assert.match(page, /navigator\.mediaDevices\.getUserMedia/);
  assert.match(page, /fetch\("\/api\/realtime\/"/);
  assert.match(page, /response\.output_audio\.delta/);
  assert.match(page, /search_recall/);
  assert.match(page, /approve_pending_action/);
  assert.match(page, /setMicrophoneEnabled\(false\)/);
  assert.match(page, /Noise filter on/);
  assert.match(page, /No external message sent/);
  assert.doesNotMatch(page, /OPENAI_API_KEY/);

  assert.match(route, /process\.env\.OPENAI_API_KEY/);
  assert.match(route, /https:\/\/api\.openai\.com\/v1\/realtime\/calls/);
  assert.match(route, /gpt-realtime-2\.1/);
  assert.match(route, /voice:\s*"marin"/);
  assert.match(route, /name:\s*"search_recall"/);
  assert.match(route, /type:\s*"server_vad"/);
  assert.match(route, /threshold:\s*0\.75/);
  assert.match(route, /interrupt_response:\s*false/);
  assert.match(route, /name:\s*"prepare_message_for_approval"/);
  assert.match(route, /name:\s*"approve_pending_action"/);
  assert.match(route, /tool_choice:\s*"auto"/);

  assert.match(gitignore, /\.env\*/);
});
