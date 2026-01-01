import { useRef, type MouseEvent } from 'react';

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    isLoading?: boolean;
}

const ConfirmDialog = ({ isOpen, title, message, onConfirm, onCancel, isLoading }: ConfirmDialogProps) => {
    const dialogRef = useRef<HTMLDivElement>(null);

    if (!isOpen) return null;

    const handleBackdropClick = (e: MouseEvent<HTMLDivElement>) => {
        if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) {
            onCancel();
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
            onClick={handleBackdropClick}
        >
            <div
                ref={dialogRef}
                className="glass rounded-2xl p-6 w-full max-w-md animate-slideUp"
            >
                <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
                <p className="text-gray-400 mb-6">{message}</p>

                <div className="flex gap-3 justify-end">
                    <button
                        onClick={onCancel}
                        disabled={isLoading}
                        className="px-4 py-2 text-gray-300 hover:text-white transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Deleting...
                            </>
                        ) : (
                            'Delete'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDialog;
