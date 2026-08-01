import assert from "node:assert/strict";
import test from "node:test";

import { createBackgroundResearchController } from "../app/lib/background-research.ts";

test("starts research once and makes the result available later", async () => {
  const research = createBackgroundResearchController();
  let runs = 0;
  let release;
  const task = () => {
    runs += 1;
    return new Promise((resolve) => {
      release = resolve;
    });
  };

  assert.equal(research.start(task).status, "running");
  assert.equal(research.start(task).status, "running");
  assert.equal(runs, 1);
  release({ signal: "ready" });

  const completed = await research.wait();
  assert.equal(completed.status, "ready");
  assert.deepEqual(completed.result, { signal: "ready" });
});

test("contains a background failure without rejecting the conversation", async () => {
  const research = createBackgroundResearchController();
  research.start(async () => {
    throw new Error("Microsoft timed out");
  });

  const completed = await research.wait();
  assert.equal(completed.status, "error");
  assert.equal(completed.message, "Microsoft timed out");
});
