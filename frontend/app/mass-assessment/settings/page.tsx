'use client';

export default function Settings() {
    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Mass Assessment Settings</h1>
            <p className="text-gray-600 mb-8">Configure default settings for mass assessments</p>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Tier Allocation Thresholds</h2>
                <p className="text-sm text-gray-600 mb-4">
                    Customize the score thresholds for automatic tier allocation
                </p>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tier 3 Threshold (High Risk)
                        </label>
                        <div className="flex items-center gap-4">
                            <input
                                type="number"
                                defaultValue={40}
                                min={0}
                                max={100}
                                className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <span className="text-sm text-gray-600">
                                Students scoring below this percentage will be allocated to Tier 3
                            </span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tier 2 Threshold (At Risk)
                        </label>
                        <div className="flex items-center gap-4">
                            <input
                                type="number"
                                defaultValue={70}
                                min={0}
                                max={100}
                                className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <span className="text-sm text-gray-600">
                                Students scoring below this percentage will be allocated to Tier 2
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">AI Analysis</h2>
                <div className="space-y-4">
                    <label className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            defaultChecked
                            className="h-4 w-4 text-blue-600 rounded"
                        />
                        <span className="text-sm text-gray-700">
                            Automatically generate AI insights after completing assessments
                        </span>
                    </label>

                    <label className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            defaultChecked
                            className="h-4 w-4 text-blue-600 rounded"
                        />
                        <span className="text-sm text-gray-700">
                            Include intervention group recommendations in reports
                        </span>
                    </label>
                </div>
            </div>

            <div className="mt-6 flex justify-end">
                <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Save Settings
                </button>
            </div>
        </div>
    );
}

