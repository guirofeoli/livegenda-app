// API Client - connects to Cloudflare Pages Functions
import { apiClient } from './apiClient';

// Export API client as base44 to maintain compatibility
export const base44 = apiClient;

export default apiClient;
