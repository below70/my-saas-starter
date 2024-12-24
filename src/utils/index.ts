// You can adjust these interfaces as your data structure evolves
export interface StrategyData {
  strategyName: string; // e.g., "Strategy 1"
  title: string; // e.g., "Boosting Brand Awareness on Meta"
  details: string[]; // lines from the "Text" section
  keyTactics: string[]; // lines from the "Key Tactics" section
}

export interface ParsedResult {
  strategies: StrategyData[];
  additionalMetaDetails: string[];
  additionalTikTokDetails: string[];
}

export function parseStrategies(rawData: string): ParsedResult {
  const lines = rawData.split('\n').map((line) => line.trim());

  const parsedResult: ParsedResult = {
    strategies: [],
    additionalMetaDetails: [],
    additionalTikTokDetails: [],
  };

  let currentStrategy: StrategyData | null = null;
  let currentSection: 'title' | 'details' | 'keyTactics' | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // --- 1) Detect "Strategy X" lines ---
    if (line.match(/\*\*Strategy\s+\d+\*\*/i)) {
      // If we already have a strategy being built, push it to the array
      if (currentStrategy) {
        parsedResult.strategies.push(currentStrategy);
      }

      // Start a new strategy
      const strategyName = line.replace(/\*\*/g, '').trim(); // e.g. "Strategy 1"
      currentStrategy = {
        strategyName,
        title: '',
        details: [],
        keyTactics: [],
      };
      currentSection = null;
      continue;
    }

    // --- 2) Detect "Title:" lines ---
    if (line.startsWith('**Title**:')) {
      if (currentStrategy) {
        currentStrategy.title = line.replace('**Title**:', '').trim();
      }
      currentSection = 'title'; // So we know we’re in the Title block, if needed
      continue;
    }

    // --- 3) Detect "Text" lines => i.e. the bullet points below "Text" ---
    if (line.startsWith('**Text**:')) {
      // The next lines (bullets) will go into currentStrategy.details
      currentSection = 'details';
      continue;
    }

    // If line starts with a hyphen and we are in the "details" section, it’s a bullet point
    if (currentSection === 'details' && line.startsWith('-')) {
      if (currentStrategy) {
        // Remove the leading '- ' and all '**' characters
        const cleanedLine = line
          .replace(/^-\s*/, '') // Removes the leading '- ' and any following whitespace
          .replace(/\*\*/g, ''); // Removes all '**' occurrences

        currentStrategy.details.push(cleanedLine);
      }
      continue;
    }

    // --- 4) Detect "Key Tactics" section ---
    if (line.startsWith('**Key Tactics**:')) {
      currentSection = 'keyTactics';
      continue;
    }

    // If line starts with a hyphen and we are in the "keyTactics" section
    if (currentSection === 'keyTactics' && line.startsWith('-')) {
      console.log('line', line);
      if (currentStrategy) {
        if (line !== '---') {
          currentStrategy.keyTactics.push(line.replace(/^-\s*/, ''));
        }
      }
      continue;
    }

    // --- 5) Detect "Additional Meta Details" section ---
    if (line.startsWith('**Additional Meta Details**')) {
      currentSection = null; // not inside a strategy’s details now
      continue;
    }

    // If line starts with a hyphen after "Additional Meta Details"
    if (
      (line.startsWith('-') || line.startsWith('•')) &&
      parsedResult.strategies.length > 0 &&
      lines[i - 1]?.startsWith('**Additional Meta Details**')
    ) {
      parsedResult.additionalMetaDetails.push(line.replace(/^-\s*/, ''));
      continue;
    }

    // --- 6) Detect "Additional TikTok Details" section ---
    if (line.startsWith('**Additional TikTok Details**')) {
      currentSection = null; // not inside a strategy’s details
      continue;
    }

    // If line starts with a hyphen after "Additional TikTok Details"
    if (
      (line.startsWith('-') || line.startsWith('•')) &&
      parsedResult.strategies.length > 0 &&
      lines[i - 1]?.startsWith('**Additional TikTok Details**')
    ) {
      parsedResult.additionalTikTokDetails.push(line.replace(/^-\s*/, ''));
      continue;
    }
  }

  // If the text ends and there’s a strategy in progress, push it in
  if (currentStrategy) {
    parsedResult.strategies.push(currentStrategy);
  }

  return parsedResult;
}
