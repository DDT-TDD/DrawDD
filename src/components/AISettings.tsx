import { useState, useEffect } from 'react';
import { aiService } from '../services/ai';
import { Check, AlertCircle, Loader2, Sparkles, ExternalLink } from 'lucide-react';

export function AISettings() {
    const [apiKey, setApiKey] = useState('');
    const [provider, setProvider] = useState<'gemini-flash' | 'gemini-nano'>('gemini-flash');
    const [status, setStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
    const [nanoAvailable, setNanoAvailable] = useState(false);

    useEffect(() => {
        const config = aiService.getConfig();
        setApiKey(config.apiKey || '');
        setProvider(config.provider);

        // Check Nano availability
        aiService.checkNanoAvailability().then(setNanoAvailable);
    }, []);

    const handleSave = async () => {
        setStatus('checking');

        if (provider === 'gemini-flash') {
            const isValid = await aiService.verifyFlashKey(apiKey);
            if (isValid) {
                setStatus('valid');
                aiService.saveConfig({ provider, apiKey });
            } else {
                setStatus('invalid');
            }
        } else {
            // For Nano, just save
            aiService.saveConfig({ provider, apiKey: '' }); // Clear key if switching to Nano? Or keep it?
            // Let's keep the key in memory but update provider
            aiService.saveConfig({ provider, apiKey });
            setStatus('valid');
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
                    <Sparkles className="text-yellow-500" size={20} />
                    AI Assistant Configuration
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Configure AI providers to enable smart features like expanding topics and text enhancement.
                    Your data and keys are stored locally.
                </p>
            </div>

            <div className="space-y-4">
                {/* Provider Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        AI Provider
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => setProvider('gemini-flash')}
                            className={`flex flex-col items-center p-4 border-2 rounded-xl transition-all ${provider === 'gemini-flash'
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                }`}
                        >
                            <span className="font-semibold text-gray-900 dark:text-white">Gemini Flash</span>
                            <span className="text-xs text-gray-500 mt-1">Free Tier • Cloud API</span>
                        </button>
                        <button
                            onClick={() => setProvider('gemini-nano')}
                            disabled={!nanoAvailable}
                            className={`flex flex-col items-center p-4 border-2 rounded-xl transition-all ${provider === 'gemini-nano'
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                } ${!nanoAvailable ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <span className="font-semibold text-gray-900 dark:text-white">Gemini Nano</span>
                            <span className="text-xs text-gray-500 mt-1">
                                {nanoAvailable ? 'Ready • Local (Chrome)' : 'Not Available in Browser'}
                            </span>
                        </button>
                    </div>
                </div>

                {/* Gemini Flash Configuration */}
                {provider === 'gemini-flash' && (
                    <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Gemini API Key
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="password"
                                    value={apiKey}
                                    onChange={(e) => {
                                        setApiKey(e.target.value);
                                        setStatus('idle');
                                    }}
                                    placeholder="AIzaSy..."
                                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                                <button
                                    onClick={handleSave}
                                    disabled={!apiKey || status === 'checking'}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {status === 'checking' ? (
                                        <Loader2 size={16} className="animate-spin" />
                                    ) : status === 'valid' ? (
                                        <Check size={16} />
                                    ) : (
                                        'Verify & Save'
                                    )}
                                </button>
                            </div>

                            {/* Status Messages */}
                            {status === 'valid' && (
                                <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                                    <Check size={12} /> Key validated and saved successfully.
                                </p>
                            )}
                            {status === 'invalid' && (
                                <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                                    <AlertCircle size={12} /> Invalid API key. Please check and try again.
                                </p>
                            )}
                        </div>

                        <div className="text-xs text-gray-500 dark:text-gray-400">
                            <p className="mb-2">
                                Get a free API key from Google AI Studio.
                                <a
                                    href="https://aistudio.google.com/app/apikey"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline inline-flex items-center gap-0.5 ml-1"
                                >
                                    Get Key <ExternalLink size={10} />
                                </a>
                            </p>
                            <p>
                                Note: Keys are stored locally in your browser and never sent to our servers.
                            </p>
                        </div>
                    </div>
                )}

                {/* Gemini Nano Info */}
                {provider === 'gemini-nano' && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-sm text-blue-800 dark:text-blue-200">
                        Gemini Nano is running locally in your browser. No data leaves your device.
                        This feature is experimental and depends on Chrome's built-in AI capabilities.
                    </div>
                )}
            </div>
        </div>
    );
}
