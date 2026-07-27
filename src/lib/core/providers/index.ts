export interface Provider {
  name: string;
  isConfigured(): boolean;
}

export interface ProviderRegistry<T extends Provider> {
  register(name: string, provider: T): void;
  get(name: string): T | undefined;
  getAll(): T[];
  getConfigured(): T[];
  has(name: string): boolean;
}

export function createProviderRegistry<T extends Provider>(): ProviderRegistry<T> {
  const providers = new Map<string, T>();

  return {
    register(name: string, provider: T): void {
      providers.set(name, provider);
    },

    get(name: string): T | undefined {
      return providers.get(name);
    },

    getAll(): T[] {
      return Array.from(providers.values());
    },

    getConfigured(): T[] {
      return Array.from(providers.values()).filter((p) => p.isConfigured());
    },

    has(name: string): boolean {
      return providers.has(name);
    },
  };
}