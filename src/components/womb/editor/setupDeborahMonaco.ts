export const setupDeborahMonaco = (monaco: any) => {
    if (!monaco) return;

    // 1. Register Custom Language
    monaco.languages.register({ id: 'deborah-lang' });

    // 2. Define Tokens
    monaco.languages.setMonarchTokensProvider('deborah-lang', {
        tokenizer: {
            root: [
                // Region markers (force match from start of line)
                [/^\s*#region.*$/, 'region.marker'],
                [/^\s*#endregion.*$/, 'region.marker'],

                // Comments (// and everything after)
                [/\/\/.*$/, 'comment'],

                // Standard text (anything that isn't start of a comment)
                [/[^/#]+/, 'string'], // Optimize: grab chunks of non-special chars
                [/./, 'string']       // Fallback: grab single chars including / or # if not matched above
            ]
        }
    });

    // 3. Define Theme
    monaco.editor.defineTheme('deborah-dark', {
        base: 'vs-dark', // Important: Inherit from dark theme
        inherit: true,
        rules: [
            { token: 'region.marker', foreground: '808080', fontStyle: 'bold' }, // VS Code style grey
            { token: 'comment', foreground: '6A9955' }, // Standard VS Code comment green
            { token: 'string', foreground: 'FFFFFF' }, // Make sure strings are white
            { token: '', foreground: 'FFFFFF' } // Default catch-all
        ],
        colors: {
            'editor.foreground': '#FFFFFF', // Default editor text color
            'editor.background': '#1e1e1e00', // Transparent
            // If transparency causes issues, we might need a solid dark color like #0f172a (Slate-950)
            // Let's try explicit transparent again, but ensure logic is correct
        }
    });

    // 4. Define Folding Rules
    monaco.languages.setLanguageConfiguration('deborah-lang', {
        folding: {
            markers: {
                start: /^\s*#region\b/i,
                end: /^\s*#endregion\b/i
            }
        }
    });

    // Force set theme
    monaco.editor.setTheme('deborah-dark');
};
