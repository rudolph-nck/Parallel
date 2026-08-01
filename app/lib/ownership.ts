export type OwnershipResolution = {
  role: "owner" | "dependency" | "unclear";
  ownerLabel: string;
  basis: "first_person" | "explicit_assignment" | "named_other" | "ambiguous";
  confidence: number;
  araMayAct: boolean;
};

const normalize = (value: string) => value.trim().toLowerCase();

export function resolveWorkOwnership(
  ownerLabel: string,
  currentUserLabels = ["nick", "nick rudolph", "me", "i"],
): OwnershipResolution {
  const owner = normalize(ownerLabel);
  if (!owner || owner === "unclear" || owner === "unknown" || owner === "someone") {
    return {
      role: "unclear",
      ownerLabel: ownerLabel.trim() || "Unclear",
      basis: "ambiguous",
      confidence: 0,
      araMayAct: false,
    };
  }

  if (currentUserLabels.map(normalize).includes(owner)) {
    return {
      role: "owner",
      ownerLabel: ownerLabel.trim(),
      basis: owner === "me" || owner === "i" ? "first_person" : "explicit_assignment",
      confidence: 1,
      araMayAct: true,
    };
  }

  return {
    role: "dependency",
    ownerLabel: ownerLabel.trim(),
    basis: "named_other",
    confidence: 0.95,
    araMayAct: false,
  };
}
