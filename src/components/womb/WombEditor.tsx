import React, { useRef, useEffect, useState } from 'react';
import { TooltipButton } from '../shared/TooltipButton';
import Editor, { useMonaco } from '@monaco-editor/react';

interface WombEditorProps {
    lang: 'ja' | 'en';
    content: string;
    setContent: (content: string) => void;
    displayTitle: string | undefined;
    isGenerating: boolean;
    onSave: () => void;
    onOpenFileList: () => void;
    onNewStory: () => void;
    showWombDebugInfo?: boolean;
}

export const WombEditor: React.FC<WombEditorProps> = ({
    lang, // Used in placeholder overlay
    content,
    setContent,
    displayTitle,
    isGenerating,
    onSave,
    onOpenFileList,
    onNewStory,
    showWombDebugInfo
}) => {
    const editorRef = useRef<any>(null); // Monaco editor instance
    const monaco = useMonaco();

    // Define Custom Language & Theme
    useEffect(() => {
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

    }, [monaco]);


    const [paddingLeft, setPaddingLeft] = useState(60); // Default approximation
    const [testViewZoneId, setTestViewZoneId] = useState<string | null>(null); // For test view zone
    const resizeObserverRef = useRef<ResizeObserver | null>(null); // To keep track and disconnect

    const handleEditorDidMount = (editor: any) => {
        editorRef.current = editor;

        // Initial layout update
        updateLayoutInfo(editor);

        // Listen for layout changes (e.g. window resize, line count change)
        editor.onDidLayoutChange(() => {
            updateLayoutInfo(editor);
        });
    };

    const updateLayoutInfo = (editor: any) => {
        const info = editor.getLayoutInfo();
        // contentLeft is the pixel count from the left edge of the editor to the text area
        setPaddingLeft(info.contentLeft);
    };

    const handleEditorChange = (value: string | undefined) => {
        setContent(value || '');
    };

    // --- Listen for Insert Instruction Events from CORD ---
    useEffect(() => {
        const handleInsertInstruction = (event: Event) => {
            const customEvent = event as CustomEvent;
            const instructionText = customEvent.detail?.instructionText;

            if (instructionText && editorRef.current) {
                const editor = editorRef.current;
                const selection = editor.getSelection();

                // Format the instruction with region markers
                const regionTemplate = `\n#region AI_INSTRUCTION\n// ${instructionText.split('\n').join('\n// ')}\n#endregion\n`;

                // Insert text at cursor
                const op = { range: selection, text: regionTemplate, forceMoveMarkers: true };
                editor.executeEdits("insert-instruction", [op]);

                // Focus back
                editor.focus();
            }
        };

        window.addEventListener('womb:insert-instruction', handleInsertInstruction);

        return () => {
            window.removeEventListener('womb:insert-instruction', handleInsertInstruction);
        };
    }, []);

    const handleInsertRegion = () => {
        if (!editorRef.current) return;

        const editor = editorRef.current;
        const selection = editor.getSelection();

        const regionTemplate = `\n#region AI_INSTRUCTION\n// style: horror\n// focus: auditory hallucinations\n#endregion\n`;

        // Insert text at cursor
        const op = { range: selection, text: regionTemplate, forceMoveMarkers: true };
        editor.executeEdits("insert-region", [op]);

        // Focus back
        editor.focus();
    };

    const handleToggleTestViewZone = () => {
        if (!editorRef.current) return;
        const editor = editorRef.current;

        editor.changeViewZones(function (changeAccessor: any) {
            if (testViewZoneId) {
                // Remove existing
                changeAccessor.removeZone(testViewZoneId);
                setTestViewZoneId(null);

                // Disconnect observer when removing the zone
                if (resizeObserverRef.current) {
                    resizeObserverRef.current.disconnect();
                    resizeObserverRef.current = null;
                }
            } else {
                // Add new
                const domNode = document.createElement('div');
                // The outer domNode is heavily manipulated by Monaco (absolute positioning, fixed height).
                // We leave its styling minimal and mostly let Monaco handle it.
                domNode.style.zIndex = '10';

                // Create an inner wrapper that will naturally expand to fit the text.
                // We will apply all the visual styles here.
                const innerDiv = document.createElement('div');
                innerDiv.style.background = 'rgba(74, 222, 128, 0.1)'; // green-400 with opacity
                innerDiv.style.borderLeft = '4px solid #4ade80';
                innerDiv.style.padding = '8px 16px';
                innerDiv.style.color = '#e2e8f0';
                innerDiv.style.fontFamily = 'monospace';
                innerDiv.style.fontSize = '14px';
                innerDiv.style.boxSizing = 'border-box';
                // Important: let the inner div grow naturally
                innerDiv.style.height = 'max-content';
                innerDiv.style.overflow = 'hidden';

                const contentText = '🤖 [AI Thought Process]\n・文脈を解析中...\n・View Zoneのテスト表示です。\n・この領域はユーザーが直接編集することはできません。\n・要素自体の高さで自動調整されています。';
                innerDiv.innerText = contentText;

                // Append inner wrapper to the outer node
                domNode.appendChild(innerDiv);

                const selection = editor.getSelection();
                // Insert after the current line, or line 1 if no selection
                const afterLineNumber = selection ? selection.positionLineNumber : 1;

                // Create the ViewZone object. Monaco retains a reference to this object,
                // so we can mutate its properties (like heightInPx) before calling layoutZone.
                const viewZone = {
                    afterLineNumber: afterLineNumber,
                    heightInPx: 100, // Initial dummy height
                    domNode: domNode,
                };

                const id = changeAccessor.addZone(viewZone);
                setTestViewZoneId(id);

                // Set up ResizeObserver to watch the *INNER* element's actual rendered height
                const observer = new ResizeObserver((entries) => {
                    for (let entry of entries) {
                        // Math.ceil ensures we never cut off sub-pixels
                        const pixelHeight = Math.ceil(entry.target.getBoundingClientRect().height);

                        // If height changed, update the original viewZone object and tell Monaco to re-layout
                        if (viewZone.heightInPx !== pixelHeight) {
                            viewZone.heightInPx = pixelHeight;

                            editor.changeViewZones((accessor: any) => {
                                accessor.layoutZone(id);
                            });
                        }
                    }
                });

                // Start observing the INNER created node
                observer.observe(innerDiv);
                resizeObserverRef.current = observer;
            }
        });
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            height: '100%',
            position: 'relative'
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0
            }}>
                <div style={{
                    color: 'white',
                    fontSize: '0.9rem',
                    fontWeight: 'bold',
                    letterSpacing: '0.1em',
                    maxWidth: '350px',
                    display: 'flex',
                    alignItems: 'center'
                }}>
                    <span style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>WOMB :: EDITOR</span>
                    {displayTitle && (
                        <>
                            <span style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>{' - [ '}</span>
                            <span style={{
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                minWidth: 0
                            }}>
                                {displayTitle}
                            </span>
                            <span style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>{' ]'}</span>
                        </>
                    )}
                </div>

                {/* Document Actions */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {showWombDebugInfo && (
                        <TooltipButton
                            label="Toggle Test ViewZone"
                            onClick={handleToggleTestViewZone}
                            icon={
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a2 2 0 0 0 1.808 2.95h10.944a2 2 0 0 0 1.808-2.95l-5.069-10.127A2 2 0 0 1 14 9.527V2" />
                                    <path d="M8.5 2h7" />
                                    <path d="M7 16h10" />
                                </svg>
                            }
                        />
                    )}
                    <TooltipButton
                        label="Insert AI Instruction"
                        onClick={handleInsertRegion}
                        icon={
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                                <line x1="16" y1="13" x2="8" y2="13"></line>
                                <line x1="16" y1="17" x2="8" y2="17"></line>
                                <polyline points="10 9 9 9 8 9"></polyline>
                            </svg>
                        }
                    />
                    <TooltipButton
                        label="Open Story"
                        onClick={onOpenFileList}
                        icon={
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                            </svg>
                        }
                    />
                    <TooltipButton
                        label="New Story"
                        onClick={onNewStory}
                        icon={
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 20h9"></path>
                                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                            </svg>
                        }
                    />
                </div>
            </div>

            <div style={{
                flex: 1,
                border: '1px solid rgba(148, 163, 184, 0.2)',
                borderRadius: '8px',
                overflow: 'hidden',
                backgroundColor: '#0f172a' // Solid dark background to prevent white flash / pink error
            }}>
                <Editor
                    height="100%"
                    defaultLanguage="deborah-lang"
                    language="deborah-lang"
                    theme="vs-dark"
                    value={content}
                    onChange={handleEditorChange}
                    onMount={handleEditorDidMount}
                    options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        wordWrap: 'on',
                        automaticLayout: true,
                        fontFamily: 'monospace',
                        scrollBeyondLastLine: false,
                        lineNumbers: 'on',
                        folding: true,
                        renderLineHighlight: 'all',
                        contextmenu: true,
                        padding: { top: 16, bottom: 64 }, // Space for button

                        // Hide the scrollbar decorations (Overview Ruler)
                        overviewRulerLanes: 0,
                        hideCursorInOverviewRuler: true,
                        overviewRulerBorder: false,
                        matchBrackets: 'never',
                        renderValidationDecorations: 'off',

                        // Disable word highlighting
                        occurrencesHighlight: 'off',
                        selectionHighlight: false
                    }}
                />

                {/* PLACEHOLDER OVERLAY */}
                {!content && (
                    <div style={{
                        position: 'absolute',
                        top: '100px', // Lower position to act as an instruction
                        left: `${paddingLeft}px`, // Dynamic left alignment
                        color: 'rgba(255, 255, 255, 0.3)',
                        pointerEvents: 'none', // Allow clicking through to editor
                        fontFamily: 'monospace',
                        fontSize: '14px',
                        userSelect: 'none'
                    }}>
                        {lang === 'en'
                            ? "Write your story here. The first line of the work will automatically become the title."
                            : "ここに物語を記述します。作品の1行目が自動でタイトルになります。"}
                    </div>
                )}
            </div>

            {/* GENERATE BUTTON */}
            <button
                onClick={onSave}
                disabled={isGenerating}
                style={{
                    position: 'absolute',
                    bottom: '1.5rem',
                    right: '1.5rem',
                    backgroundColor: isGenerating ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(5px)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '30px',
                    color: isGenerating ? 'rgba(255, 255, 255, 0.5)' : 'white',
                    padding: '0.5rem 1.5rem',
                    fontSize: '0.85rem',
                    fontWeight: 'bold',
                    letterSpacing: '0.1em',
                    cursor: isGenerating ? 'wait' : 'pointer',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    boxShadow: isGenerating ? 'none' : '0 4px 15px rgba(0, 0, 0, 0.3)',
                    zIndex: 10 // Ensure above editor
                }}
                onMouseEnter={(e) => {
                    if (!isGenerating) {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                        e.currentTarget.style.borderColor = 'white';
                        e.currentTarget.style.boxShadow = '0 0 15px rgba(255, 255, 255, 0.3)';
                    }
                }}
                onMouseLeave={(e) => {
                    if (!isGenerating) {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                        e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.3)';
                    }
                }}
            >
                {isGenerating ? (
                    <>
                        <span style={{
                            display: 'inline-block',
                            width: '8px',
                            height: '8px',
                            backgroundColor: 'white',
                            borderRadius: '50%',
                            animation: 'pulse 1s infinite'
                        }} />
                        SAVING...
                    </>
                ) : (
                    <>
                        <span style={{ fontSize: '1.1em' }}>✧</span> GENERATE
                    </>
                )}
            </button>
            <style>
                {`
                    @keyframes pulse {
                        0% { transform: scale(0.8); opacity: 0.5; }
                        50% { transform: scale(1.2); opacity: 1; }
                        100% { transform: scale(0.8); opacity: 0.5; }
                    }
                `}
            </style>
        </div>
    );
};
