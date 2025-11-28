// Standalone client (without Base44 SDK)
import { mockClient } from './mockClient';

// Export mock client as base44 to maintain compatibility
export const base44 = mockClient;

export default mockClient;
