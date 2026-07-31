export type DirectoryPerson = {
  displayName?: string;
  givenName?: string | null;
  surname?: string | null;
  mail?: string | null;
  userPrincipalName?: string;
};

export type ResolvedDirectoryPerson = {
  displayName: string;
  email: string;
  confidence: "exact" | "strong";
};

function normalizeName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9@.+\-\s']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function editDistance(left: string, right: string) {
  const rows = Array.from({ length: left.length + 1 }, (_, index) => index);

  for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
    let diagonal = rows[0];
    rows[0] = rightIndex;

    for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
      const previous = rows[leftIndex];
      rows[leftIndex] =
        left[leftIndex - 1] === right[rightIndex - 1]
          ? diagonal
          : Math.min(diagonal, rows[leftIndex - 1], previous) + 1;
      diagonal = previous;
    }
  }

  return rows[left.length];
}

function tokenScore(requested: string, candidate: string) {
  if (requested === candidate) return 1;

  const shorter = Math.min(requested.length, candidate.length);
  const longer = Math.max(requested.length, candidate.length);

  if (
    shorter >= 3 &&
    (requested.startsWith(candidate) || candidate.startsWith(requested))
  ) {
    return Math.max(0.86, 0.94 - (longer - shorter) * 0.02);
  }

  const distance = editDistance(requested, candidate);
  if (shorter >= 4 && distance === 1) return 0.88;
  if (shorter >= 5 && distance === 2) return 0.8;
  return 0;
}

function scorePerson(requestedName: string, person: DirectoryPerson) {
  const requested = normalizeName(requestedName);
  const displayName = normalizeName(
    person.displayName ||
      [person.givenName, person.surname].filter(Boolean).join(" "),
  );
  if (!requested || !displayName) return 0;
  if (requested === displayName) return 1;

  const requestedTokens = requested.split(" ");
  const candidateTokens = [
    ...displayName.split(" "),
    normalizeName(person.givenName ?? ""),
    normalizeName(person.surname ?? ""),
  ].filter(Boolean);

  const scores = requestedTokens.map((requestedToken) =>
    Math.max(
      ...candidateTokens.map((candidateToken) =>
        tokenScore(requestedToken, candidateToken),
      ),
    ),
  );
  if (scores.some((score) => score === 0)) return 0;

  const average =
    scores.reduce((total, score) => total + score, 0) / scores.length;
  return requestedTokens.length > 1 ? Math.min(0.99, average + 0.03) : average;
}

export function splitAttendeeNames(attendeeNames: string[]) {
  return attendeeNames
    .flatMap((value) => {
      const trimmed = value.trim();
      if (!trimmed) return [];
      if (trimmed.includes("@")) return [trimmed];
      return trimmed.split(/\s*(?:,|;|\band\b|&)\s*/i);
    })
    .map((value) => value.trim())
    .filter(Boolean);
}

export function resolveDirectoryPerson(
  requestedName: string,
  people: DirectoryPerson[],
): ResolvedDirectoryPerson | null {
  const ranked = people
    .map((person) => {
      const displayName =
        person.displayName?.trim() ||
        [person.givenName, person.surname].filter(Boolean).join(" ").trim();
      const email =
        person.mail?.trim() || person.userPrincipalName?.trim() || "";
      return {
        displayName,
        email,
        score: scorePerson(requestedName, person),
      };
    })
    .filter((person) => person.displayName && person.email && person.score >= 0.8)
    .sort((left, right) => right.score - left.score);

  const best = ranked[0];
  if (!best) return null;

  const runnerUp = ranked[1];
  if (runnerUp && best.score - runnerUp.score < 0.09) return null;

  return {
    displayName: best.displayName,
    email: best.email,
    confidence: best.score >= 0.97 ? "exact" : "strong",
  };
}
