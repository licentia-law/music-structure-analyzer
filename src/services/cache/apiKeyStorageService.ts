/**
 * API Key Storage Service
 * Handles encrypted storage of user-provided API keys in localStorage
 */

import {
  ApiCredentialService,
  API_KEY_STORAGE_KEYS
} from '@/types/apiKeyTypes';

const STORAGE_KEY_MAP: Record<ApiCredentialService, string> = {
  musicAi: API_KEY_STORAGE_KEYS.MUSIC_AI,
  gemini: API_KEY_STORAGE_KEYS.GEMINI,
  songformerAccess: API_KEY_STORAGE_KEYS.SONGFORMER_ACCESS
};

class ApiKeyStorageService {
  private static instance: ApiKeyStorageService;

  private constructor() {}

  public static getInstance(): ApiKeyStorageService {
    if (!ApiKeyStorageService.instance) {
      ApiKeyStorageService.instance = new ApiKeyStorageService();
    }
    return ApiKeyStorageService.instance;
  }

  public isEncryptionSupported(): boolean {
    return typeof window !== 'undefined' && !!window.crypto?.subtle;
  }

  public hasApiKey(service: ApiCredentialService): boolean {
    if (typeof window === 'undefined') return false;
    const key = STORAGE_KEY_MAP[service];
    return !!localStorage.getItem(key);
  }

  public async storeApiKey(service: ApiCredentialService, apiKey: string): Promise<void> {
    if (typeof window === 'undefined') return;
    const key = STORAGE_KEY_MAP[service];
    localStorage.setItem(key, apiKey);
  }

  public async getApiKey(service: ApiCredentialService): Promise<string | null> {
    if (typeof window === 'undefined') return null;
    const key = STORAGE_KEY_MAP[service];
    return localStorage.getItem(key);
  }

  public removeApiKey(service: ApiCredentialService): void {
    if (typeof window === 'undefined') return;
    const key = STORAGE_KEY_MAP[service];
    localStorage.removeItem(key);
  }

  public clearAllApiKeys(): void {
    if (typeof window === 'undefined') return;
    Object.values(STORAGE_KEY_MAP).forEach(key => {
      localStorage.removeItem(key);
    });
  }
}

export const apiKeyStorage = ApiKeyStorageService.getInstance();
