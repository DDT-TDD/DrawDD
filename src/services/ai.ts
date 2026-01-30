/**
 * AI Service for DRAWDD
 * Handles integration with Gemini Flash (via API) and Gemini Nano (via Chrome built-in AI)
 */

export interface AIConfig {
    provider: 'gemini-flash' | 'gemini-nano';
    apiKey?: string; // For Flash
}

const STORAGE_KEY = 'drawdd-ai-config';

export class AIService {
    private config: AIConfig;

    constructor() {
        this.config = this.loadConfig();
    }

    private loadConfig(): AIConfig {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (e) {
            console.error('Failed to load AI config', e);
        }
        // Default to Flash as it's more widely available currently (Nano requires specific Chrome flags)
        return { provider: 'gemini-flash', apiKey: '' };
    }

    public saveConfig(config: AIConfig) {
        this.config = config;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    }

    public getConfig(): AIConfig {
        return { ...this.config };
    }

    public hasKey(): boolean {
        return !!this.config.apiKey && this.config.apiKey.length > 0;
    }

    /**
     * Verify the API key by making a minimal request to Gemini Flash
     */
    public async verifyFlashKey(key: string): Promise<boolean> {
        if (!key) return false;

        try {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{ text: "Hello" }]
                        }]
                    })
                }
            );

            return response.ok;
        } catch (error) {
            console.error('Gemini Flash verification failed:', error);
            return false;
        }
    }

    /**
     * Check if Gemini Nano is available (via window.ai)
     */
    public async checkNanoAvailability(): Promise<boolean> {
        if ('ai' in window) {
            try {
                // As of Chrome Canary 127+, window.ai or similar API
                // This is a placeholder as the API is experimental and changing
                // We'll check for generic existence for now
                return true;
            } catch (e) {
                return false;
            }
        }
        return false;
    }
}

export const aiService = new AIService();
