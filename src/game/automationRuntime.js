const TARGET_TYPES = ["plant", "tree"];

const normalizeTarget = (value) => {
  const target = value.toLowerCase();
  return TARGET_TYPES.includes(target) ? target : null;
};

const findRepeatedTargets = (code, language) => {
  const pattern =
    language === "python"
      ? /while\s+drone\.can_harvest\(\s*["'](plant|tree)["']\s*\)\s*:/gi
      : /while\s*\(\s*drone\.canHarvest\(\s*["'](plant|tree)["']\s*\)\s*\)\s*\{/gi;

  return [...code.matchAll(pattern)]
    .map((match) => normalizeTarget(match[1]))
    .filter(
      (target, index, targets) => target && targets.indexOf(target) === index,
    );
};

const findRequestedTargets = (code, language) => {
  const targets = [];
  const patterns =
    language === "python"
      ? [
          /drone\.harvest\(\s*["'](plant|tree)["']\s*\)/gi,
          /drone\.find_nearest\(\s*["'](plant|tree)["']\s*\)/gi,
        ]
      : [
          /drone\.harvest\(\s*["'](plant|tree)["']\s*\)/gi,
          /drone\.findNearest\(\s*["'](plant|tree)["']\s*\)/gi,
        ];

  for (const pattern of patterns) {
    for (const match of code.matchAll(pattern)) {
      const target = normalizeTarget(match[1]);
      if (target && !targets.includes(target)) targets.push(target);
    }
  }

  const harvestVariable =
    language === "python"
      ? /drone\.harvest\(\s*([A-Za-z_][\w]*)\s*\)/g
      : /drone\.harvest\(\s*([A-Za-z_][\w]*)\s*\)/g;

  for (const match of code.matchAll(harvestVariable)) {
    const variablePattern = new RegExp(
      `${match[1]}\\s*=\\s*drone\\.${language === "python" ? "find_nearest" : "findNearest"}\\(\\s*["'](plant|tree)["']\\s*\\)`,
      "i",
    );
    const variableMatch = code.match(variablePattern);
    const target = variableMatch && normalizeTarget(variableMatch[1]);
    if (target && !targets.includes(target)) targets.push(target);
  }

  return targets;
};

export function runAutomationProgram({ code, language, tiles }) {
  const requestedTargets = findRequestedTargets(code, language);
  const repeatedTargets = findRepeatedTargets(code, language);
  const harvestedIds = [];
  const messages = [];

  if (requestedTargets.length === 0) {
    return {
      harvestedIds,
      messages: [
        'No harvest command found. Try drone.harvest("plant") or drone.harvest("tree").',
      ],
    };
  }

  for (const target of requestedTargets) {
    const matchingTiles = tiles.filter(
      (candidate) => candidate.resource === target && !candidate.harvested,
    );
    const targetTiles = repeatedTargets.includes(target)
      ? matchingTiles
      : matchingTiles.slice(0, 1);

    if (targetTiles.length === 0) {
      messages.push(`No unharvested ${target} remains in range.`);
      continue;
    }

    harvestedIds.push(...targetTiles.map((tile) => tile.id));
    messages.push(
      repeatedTargets.includes(target)
        ? `Queued all remaining ${target}s for harvest.`
        : `Drone harvested ${target} at tile ${targetTiles[0].id}.`,
    );
  }

  return { harvestedIds, messages };
}

export const starterPrograms = {
  javascript: `const target = drone.findNearest("tree");
drone.harvest(target);`,
  python: `target = drone.find_nearest("tree")
drone.harvest(target)`,
};
