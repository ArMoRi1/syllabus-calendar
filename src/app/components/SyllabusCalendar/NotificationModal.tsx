import React from 'react';
import { AlertCircle, AlertTriangle, Check, Info, X } from 'lucide-react';
import { ModalState, ModalType } from '../../types';

interface NotificationModalProps extends ModalState {
    onClose: () => void;
}

const NotificationModal: React.FC<NotificationModalProps> = ({
                                                                 isOpen,
                                                                 type,
                                                                 title,
                                                                 message,
                                                                 details,
                                                                 onClose,
                                                                 onConfirm,
                                                                 confirmText = 'OK'
                                                             }) => {
    if (!isOpen) return null;

    const getIcon = () => {
        switch (type) {
            case 'error':
                return <AlertCircle className="h-5 w-5 text-red-600" />;
            case 'warning':
                return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
            case 'success':
                return <Check className="h-5 w-5 text-green-600" />;
            case 'info':
            default:
                return <Info className="h-5 w-5 text-blue-600" />;
        }
    };

    const getColorScheme = () => {
        switch (type) {
            case 'error':
                return {
                    bg: 'bg-red-100',
                    border: 'border-red-200',
                    titleColor: 'text-red-900',
                    textColor: 'text-red-800',
                    detailBg: 'bg-red-50',
                    detailText: 'text-red-700',
                    button: 'bg-red-600 hover:bg-red-700'
                };
            case 'warning':
                return {
                    bg: 'bg-yellow-100',
                    border: 'border-yellow-200',
                    titleColor: 'text-yellow-900',
                    textColor: 'text-yellow-800',
                    detailBg: 'bg-yellow-50',
                    detailText: 'text-yellow-700',
                    button: 'bg-yellow-600 hover:bg-yellow-700'
                };
            case 'success':
                return {
                    bg: 'bg-green-100',
                    border: 'border-green-200',
                    titleColor: 'text-green-900',
                    textColor: 'text-green-800',
                    detailBg: 'bg-green-50',
                    detailText: 'text-green-700',
                    button: 'bg-green-600 hover:bg-green-700'
                };
            case 'info':
            default:
                return {
                    bg: 'bg-blue-100',
                    border: 'border-blue-200',
                    titleColor: 'text-blue-900',
                    textColor: 'text-blue-800',
                    detailBg: 'bg-blue-50',
                    detailText: 'text-blue-700',
                    button: 'bg-blue-600 hover:bg-blue-700'
                };
        }
    };

    const colors = getColorScheme();

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-gray-200 animate-fade-in">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 ${colors.bg} rounded-lg`}>
                            {getIcon()}
                        </div>
                        <h3 className={`text-lg font-semibold ${colors.titleColor}`}>{title}</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    <p className={`${colors.textColor} mb-4`}>{message}</p>

                    {details && details.length > 0 && (
                        <div className={`${colors.detailBg} rounded-lg p-4 mb-4`}>
                            <ul className="space-y-2 text-sm">
                                {details.map((detail, index) => (
                                    <li key={index} className={`flex items-start gap-2 ${colors.detailText}`}>
                                        <span className="text-xs mt-0.5">•</span>
                                        {detail}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex gap-3 p-6 border-t border-gray-100">
                    {onConfirm ? (
                        <>
                            <button
                                onClick={onClose}
                                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    onConfirm();
                                    onClose();
                                }}
                                className={`flex-1 px-4 py-2 ${colors.button} text-white rounded-lg transition-colors font-medium`}
                            >
                                {confirmText}
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
                        >
                            {confirmText}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NotificationModal;
