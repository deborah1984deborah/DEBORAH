import React, { useState, useEffect } from 'react';

type VerificationStatus = 'searching' | 'result' | 'error';

interface CelebrityVerificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    celebrityName: string;
    lang: 'ja' | 'en';
}

export const CelebrityVerificationModal: React.FC<CelebrityVerificationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    celebrityName,
    lang
}) => {
    const [status, setStatus] = useState<VerificationStatus>('searching');
    const [imageUrl, setImageUrl] = useState<string>('');
    const [isSuccess, setIsSuccess] = useState<boolean>(false);

    useEffect(() => {
        if (isOpen) {
            setStatus('searching');
            setImageUrl('');
            setIsSuccess(false);

            // Mock API Call
            const timer = setTimeout(() => {
                if (celebrityName.trim().toLowerCase() === 'error') {
                    // Failure Case
                    setIsSuccess(false);
                    setStatus('result');
                } else {
                    // Success Case
                    setIsSuccess(true);
                    setStatus('result');
                    // Placeholder image
                    setImageUrl('https://placehold.co/300x400/22c55e/ffffff?text=Celebrity+Found');
                }
            }, 1500);

            return () => clearTimeout(timer);
        }
    }, [isOpen, celebrityName]);

    const getReason = () => {
        if (isSuccess) {
            return lang === 'ja'
                ? '該当する有名人が確認されました。以下の画像を参照してください。'
                : 'Celebrity verified. Please check the image below.';
        } else {
            return lang === 'ja'
                ? 'データベースに該当する有名人が見つかりませんでした。綴りを確認してください。'
                : 'No such celebrity found in our database. Please check the spelling.';
        }
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.0)',
            backdropFilter: 'blur(2px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000 // Higher than other modals
        }} onClick={onClose}>
            <div style={{
                backgroundColor: '#1A1A20',
                border: '1px solid #FF69B4', // Pink for Mommy identity
                borderRadius: '16px',
                padding: '2rem',
                maxWidth: '500px',
                width: '90%',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 0 30px rgba(255, 105, 180, 0.2)',
                color: 'white',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem',
                position: 'relative'
            }} onClick={e => e.stopPropagation()}>

                {/* Header */}
                <h2 className="text-2xl font-bold text-center text-[#FF69B4] drop-shadow-md">
                    Celebrity Verification
                </h2>

                {/* Content based on Status */}
                {status === 'searching' && (
                    <div className="flex flex-col items-center justify-center py-8 gap-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FF69B4]"></div>
                        <p className="text-lg opacity-80">
                            {lang === 'ja'
                                ? `"${celebrityName}" を検索中...`
                                : `Searching for "${celebrityName}"...`
                            }
                        </p>
                    </div>
                )}

                {status === 'result' && (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1.5rem',
                        alignItems: 'center',
                        width: '100%'
                    }}>
                        {isSuccess ? (
                            <>
                                {/* 1. Question (Header-like) */}
                                <h3 style={{
                                    fontSize: '1.25rem',
                                    fontWeight: 'bold',
                                    color: 'white',
                                    textAlign: 'center',
                                    margin: 0
                                }}>
                                    {lang === 'ja'
                                        ? 'この人物で間違いありませんか？'
                                        : 'Is this the correct person?'
                                    }
                                </h3>

                                {/* 2. Image */}
                                {imageUrl && (
                                    <div style={{
                                        width: '240px',
                                        height: '320px', // 3:4 aspect
                                        backgroundColor: '#000',
                                        borderRadius: '12px',
                                        overflow: 'hidden',
                                        border: '2px solid rgba(255, 255, 255, 0.2)',
                                        backgroundImage: `url(${imageUrl})`,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                        boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
                                    }}></div>
                                )}

                                {/* 3. Reason / Status */}
                                <div style={{
                                    width: '100%',
                                    padding: '1rem',
                                    borderRadius: '0.5rem',
                                    backgroundColor: 'rgba(34, 197, 94, 0.1)', // green-500/10
                                    border: '1px solid rgba(34, 197, 94, 0.3)', // green-500/30
                                    textAlign: 'center'
                                }}>
                                    <p style={{ fontWeight: 'bold', color: '#4ade80', marginBottom: '0.25rem' }}>
                                        {lang === 'ja' ? '✅ 検証成功' : '✅ Verified'}
                                    </p>
                                    <p style={{ fontSize: '0.875rem', opacity: 0.8 }}>{getReason()}</p>
                                </div>

                                {/* 4. Buttons */}
                                <div style={{
                                    display: 'flex',
                                    gap: '1rem',
                                    justifyContent: 'center',
                                    width: '100%',
                                    marginTop: '0.5rem'
                                }}>
                                    <button
                                        onClick={onClose}
                                        style={{
                                            flex: 1,
                                            maxWidth: '140px',
                                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                            color: 'white',
                                            fontWeight: 'bold',
                                            padding: '0.75rem 1.5rem',
                                            borderRadius: '9999px',
                                            border: 'none',
                                            cursor: 'pointer',
                                            transition: 'background-color 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                                    >
                                        {lang === 'ja' ? 'いいえ' : 'No'}
                                    </button>
                                    <button
                                        onClick={onConfirm}
                                        style={{
                                            flex: 1,
                                            maxWidth: '140px',
                                            backgroundColor: '#FF69B4',
                                            color: 'white',
                                            fontWeight: 'bold',
                                            padding: '0.75rem 1.5rem',
                                            borderRadius: '9999px',
                                            border: 'none',
                                            cursor: 'pointer',
                                            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                                            transition: 'transform 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                    >
                                        {lang === 'ja' ? 'はい' : 'Yes'}
                                    </button>
                                </div>
                            </>
                        ) : (
                            // Failure Case
                            <>
                                <div style={{
                                    width: '100%',
                                    padding: '1.5rem',
                                    borderRadius: '0.5rem',
                                    backgroundColor: 'rgba(239, 68, 68, 0.1)', // red-500/10
                                    border: '1px solid rgba(239, 68, 68, 0.3)', // red-500/30
                                    textAlign: 'center',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.5rem'
                                }}>
                                    <p style={{ fontWeight: 'bold', color: '#f87171', fontSize: '1.125rem' }}>
                                        {lang === 'ja' ? '❌ 検証失敗' : '❌ Verification Failed'}
                                    </p>
                                    <p style={{ opacity: 0.9 }}>{getReason()}</p>
                                </div>
                                <button
                                    onClick={onClose}
                                    style={{
                                        marginTop: '1rem',
                                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                        color: 'white',
                                        fontWeight: 'bold',
                                        padding: '0.75rem 2rem',
                                        borderRadius: '9999px',
                                        border: 'none',
                                        cursor: 'pointer',
                                        transition: 'background-color 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                                >
                                    {lang === 'ja' ? '修正する' : 'Back to Edit'}
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
