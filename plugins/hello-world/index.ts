/**
 * Example Plugin: Hello World
 * 
 * This is a minimal example plugin that demonstrates the basic structure
 * and capabilities of the NexusAI plugin system.
 * 
 * To create your own plugin:
 * 1. Copy this folder and modify the manifest
 * 2. Implement your hooks in index.ts
 * 3. Build and publish to the marketplace
 */

import { NexusAIPlugin, createManifest, hooks } from '../../src/services/pluginSdk';

/**
 * Plugin manifest - defines plugin metadata and capabilities
 */
const manifest = createManifest({
  id: 'example-hello-world',
  name: 'Hello World',
  version: '1.0.0',
  description: 'A simple example plugin that demonstrates the plugin system',
  author: 'NexusAI Team',
  license: 'MIT',
  homepage: 'https://nexusai.example.com/plugins/hello-world',
  keywords: ['example', 'tutorial', 'hello-world'],
  categories: ['utility'],
  
  engines: {
    nexusai: '>=1.0.0',
  },
  
  main: 'dist/index.js',
  
  // Required permissions - only request what you need!
  permissions: [
    'storage:read',
    'storage:write',
    'system:notification',
  ],
  
  // Register for hooks
  hooks: [
    'on-plugin-load',
    'before-message-send',
  ],
  
  // Optional configuration schema
  configSchema: {
    type: 'object',
    properties: {
      greeting: {
        type: 'string',
        title: 'Greeting Message',
        description: 'Customize the greeting message',
        default: 'Hello',
      },
      showNotification: {
        type: 'boolean',
        title: 'Show Notifications',
        description: 'Show a notification when plugin loads',
        default: true,
      },
    },
  },
});

/**
 * Create the plugin instance
 */
const plugin = new NexusAIPlugin({
  manifest,
  
  // Hook handlers
  hooks: {
    // Called when plugin is loaded
    'on-plugin-load': async () => {
      console.log('[HelloWorld] Plugin loaded!');
      return { success: true, timestamp: Date.now() };
    },
    
    // Transform messages before they're sent
    'before-message-send': hooks.beforeMessageSend(async (message) => {
      // Add a prefix to messages
      return `Hello: ${message}`;
    }),
  },
  
  // Error handler
  onError: (error) => {
    console.error('[HelloWorld] Error:', error);
  },
});

// Auto-register when loaded as module
if (typeof window !== 'undefined') {
  // In development, auto-register
  plugin.register().catch(console.error);
}

export default plugin;
export { manifest };
