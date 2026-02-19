/**
 * BISON Parser
 * 
 * Responsible for parsing the DEBORAH System's custom syntax.
 * Separates "Story Content" from "System Instructions" (AI Directives).
 * 
 * Syntax Rules:
 * 1. Instructions are enclosed in #region ... #endregion blocks (case-insensitive).
 * 2. Inside blocks, only lines starting with // (ignoring whitespace) are valid instructions.
 * 3. Text inside blocks WITHOUT // is treated as comment/ignored.
 * 4. Text outside blocks is treated as Story Content.
 * 5. Unclosed #region consumes the rest of the file.
 */

/**
 * BISON Parser
 * 
 * Responsible for parsing the DEBORAH System's custom syntax.
 * FILTERING ONLY: Keeps instructions in-place, removes ignored content.
 * 
 * Syntax Rules:
 * 1. #region ... #endregion blocks are PRESERVED in the output.
 * 2. Inside blocks, lines starting with // are PRESERVED.
 * 3. Inside blocks, lines NOT starting with // are REMOVED (ignored).
 * 4. Outside blocks, everything is PRESERVED.
 */

export const parseStoryContent = (fullText: string): string => {
    const lines = fullText.split('\n');
    let outputLines: string[] = [];
    let inRegion = false;

    // Regex for detecting region markers (case-insensitive, allows whitespace)
    const regionStartRegex = /^\s*#region\b/i;
    const regionEndRegex = /^\s*#endregion\b/i;
    // Regex for detecting instruction lines (starts with //)
    const instructionLineRegex = /^\s*\/\/(.*)$/;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // check for #region start
        if (!inRegion && regionStartRegex.test(line)) {
            inRegion = true;
            outputLines.push(line); // Keep marker
            continue;
        }

        // check for #endregion end
        if (inRegion && regionEndRegex.test(line)) {
            inRegion = false;
            outputLines.push(line); // Keep marker
            continue;
        }

        if (inRegion) {
            // Inside Region: ONLY keep lines with //
            if (instructionLineRegex.test(line)) {
                outputLines.push(line);
            }
            // Non-commented lines are IGNORED (dropped)
        } else {
            // Outside Region: Keep everything
            outputLines.push(line);
        }
    }

    return outputLines.join('\n');
};
