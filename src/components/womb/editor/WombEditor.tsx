import React, { useRef, useEffect, useState } from 'react';
import Editor, { useMonaco } from '@monaco-editor/react';

import { setupDeborahMonaco } from './setupDeborahMonaco';
import { WombEditorHeader } from './WombEditorHeader';
import { WombEditorOverlays } from './WombEditorOverlays';
import { WombEditorBottomActions } from './WombEditorBottomActions';

interface WombEditorProps {
    lang: 'ja' | 'en';
    content: string;
    setContent: (content: string) => void;
    displayTitle: string | undefined;
    isGenerating: boolean;
    onSave: () => void;
    onManualSave?: () => void;
    onOpenFileList: () => void;
    onNewStory: () => void;
    onUndo?: () => void;
    onRedo?: () => void;
    canUndo?: boolean;
    canRedo?: boolean;
    redoBranchCount?: number;
    showWombDebugInfo?: boolean;
    isCordProcessing?: boolean;
    onOpenChatModal: () => void;
}

export const WombEditor: React.FC<WombEditorProps> = ({
    lang, // Used in placeholder overlay
    content,
    setContent,
    displayTitle,
    isGenerating,
    onSave,
    onManualSave,
    onOpenFileList,
    onNewStory,
    onUndo,
    onRedo,
    canUndo,
    canRedo,
    redoBranchCount = 0,
    showWombDebugInfo,
    isCordProcessing,
    onOpenChatModal
}) => {
    const editorRef = useRef<any>(null); // Monaco editor instance
    const monaco = useMonaco();

    const isLocked = isGenerating || isCordProcessing || false;

    // Define Custom Language & Theme
    useEffect(() => {
        setupDeborahMonaco(monaco);
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

                // Temporarily lift readOnly restriction if it's currently locked
                if (isLocked) {
                    editor.updateOptions({ readOnly: false });
                }

                const selection = editor.getSelection();

                // Format the instruction with region markers
                const regionTemplate = `\n#region AI_INSTRUCTION\n// ${instructionText.split('\n').join('\n// ')}\n#endregion\n`;

                // Insert text at cursor
                const op = { range: selection, text: regionTemplate, forceMoveMarkers: true };
                editor.executeEdits("insert-instruction", [op]);

                // Restore readOnly restriction if it was locked
                if (isLocked) {
                    editor.updateOptions({ readOnly: true });
                }

                // Focus back
                editor.focus();
            }
        };

        window.addEventListener('womb:insert-instruction', handleInsertInstruction);

        return () => {
            window.removeEventListener('womb:insert-instruction', handleInsertInstruction);
        };
    }, [isLocked]); // Added isLocked to dependency array to have the current lock state

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
            <WombEditorHeader
                displayTitle={displayTitle}
                content={content}
                isLocked={isLocked}
                showWombDebugInfo={showWombDebugInfo}
                onToggleTestViewZone={handleToggleTestViewZone}
                onManualSave={onManualSave}
                onInsertRegion={handleInsertRegion}
                onOpenFileList={onOpenFileList}
                onNewStory={onNewStory}
            />

            <div style={{
                flex: 1,
                border: '1px solid rgba(148, 163, 184, 0.2)',
                borderRadius: '8px',
                overflow: 'hidden',
                backgroundColor: '#0f172a', // Solid dark background to prevent white flash / pink error
                position: 'relative' // Added for overlay absolute positioning relative to editor box
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
                        selectionHighlight: false,

                        // Disable editing when system is locked
                        readOnly: isLocked
                    }}
                />

                <WombEditorOverlays
                    lang={lang}
                    content={content}
                    paddingLeft={paddingLeft}
                    isCordProcessing={isCordProcessing}
                    isGenerating={isGenerating}
                />
            </div>

            <WombEditorBottomActions
                lang={lang}
                isLocked={isLocked}
                isGenerating={isGenerating}
                onOpenChatModal={onOpenChatModal}
                onUndo={onUndo}
                canUndo={canUndo}
                onRedo={onRedo}
                canRedo={canRedo}
                redoBranchCount={redoBranchCount}
                onSave={onSave}
            />
        </div>
    );
};
