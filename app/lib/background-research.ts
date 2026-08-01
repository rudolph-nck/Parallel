export type BackgroundResearchSnapshot<T> =
  | { status: "idle" }
  | { status: "running"; startedAt: number }
  | { status: "ready"; startedAt: number; completedAt: number; result: T }
  | { status: "error"; startedAt: number; completedAt: number; message: string };

export type BackgroundResearchController<T> = {
  start: (task: () => Promise<T>) => BackgroundResearchSnapshot<T>;
  read: () => BackgroundResearchSnapshot<T>;
  wait: () => Promise<BackgroundResearchSnapshot<T>>;
  seed: (result: T) => BackgroundResearchSnapshot<T>;
  reset: () => void;
};

export function createBackgroundResearchController<T>(): BackgroundResearchController<T> {
  let snapshot: BackgroundResearchSnapshot<T> = { status: "idle" };
  let pending: Promise<BackgroundResearchSnapshot<T>> | null = null;

  return {
    start(task) {
      if (snapshot.status === "running" || snapshot.status === "ready") return snapshot;
      const startedAt = Date.now();
      snapshot = { status: "running", startedAt };
      pending = task()
        .then((result) => {
          snapshot = { status: "ready", startedAt, completedAt: Date.now(), result };
          return snapshot;
        })
        .catch((error: unknown) => {
          snapshot = {
            status: "error",
            startedAt,
            completedAt: Date.now(),
            message: error instanceof Error ? error.message : "Background research could not finish.",
          };
          return snapshot;
        });
      return snapshot;
    },
    read() {
      return snapshot;
    },
    wait() {
      return pending ?? Promise.resolve(snapshot);
    },
    seed(result) {
      const now = Date.now();
      snapshot = { status: "ready", startedAt: now, completedAt: now, result };
      pending = Promise.resolve(snapshot);
      return snapshot;
    },
    reset() {
      snapshot = { status: "idle" };
      pending = null;
    },
  };
}
