'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface TierOverrideModalProps {
    isOpen: boolean;
    onClose: () => void;
    student: {
        studentId: string;
        studentName: string;
        tier: string;
    } | null;
    onSave: (newTier: string, reason: string) => Promise<void>;
}

export default function TierOverrideModal({ isOpen, onClose, student, onSave }: TierOverrideModalProps) {
    const [newTier, setNewTier] = useState('');
    const [reason, setReason] = useState('');
    const [saving, setSaving] = useState(false);

    if (!isOpen || !student) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTier || !reason.trim()) {
            alert('Please select a tier and provide a reason');
            return;
        }

        setSaving(true);
        try {
            await onSave(newTier, reason);
            setNewTier('');
            setReason('');
            onClose();
        } catch (error) {
            console.error('Failed to override tier:', error);
            alert('Failed to override tier');
        } finally {
            setSaving(false);
        }
    };

    const getTierLabel = (tier: string) => {
        if (tier === 'TIER_1_UNIVERSAL') return 'Tier 1 - Universal';
        if (tier === 'TIER_2_AT_RISK') return 'Tier 2 - At Risk';
        return 'Tier 3 - High Risk';
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                <div className="flex justify-between items-center p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">Override Tier Allocation</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    <div className="mb-4">
                        <p className="text-sm text-gray-600 mb-2">Student</p>
                        <p className="font-semibold text-gray-900">{student.studentName}</p>
                    </div>

                    <div className="mb-4">
                        <p className="text-sm text-gray-600 mb-2">Current Tier</p>
                        <p className="font-semibold text-gray-900">{getTierLabel(student.tier)}</p>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            New Tier *
                        </label>
                        <select
                            required
                            value={newTier}
                            onChange={(e) => setNewTier(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">Select new tier</option>
                            <option value="TIER_1_UNIVERSAL">Tier 1 - Universal (On Track)</option>
                            <option value="TIER_2_AT_RISK">Tier 2 - At Risk (Need Support)</option>
                            <option value="TIER_3_HIGH_RISK">Tier 3 - High Risk (Intensive Intervention)</option>
                        </select>
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Reason for Override *
                        </label>
                        <textarea
                            required
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            rows={4}
                            placeholder="Explain why you are overriding the AI-suggested tier allocation..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            This reason will be recorded for tracking purposes
                        </p>
                    </div>

                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? 'Saving...' : 'Save Override'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
