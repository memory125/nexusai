# NexusAI Plugin Development Guide

## Overview

NexusAI's plugin system allows developers to extend the application's functionality through a secure, hook-based architecture. Plugins can:

- Intercept and transform messages before sending
- Add custom UI elements to the sidebar or toolbar
- Access RAG knowledge bases
- Use MCP tools
- Read/write to local storage
- And more...

## Quick Start

### 1. Create a New Plugin

```bash
# Copy the example plugin
cp -r plugins/hello-world plugins/my-awesome-plugin
```

### 2. Modify the Manifest

Edit `plugins/my-awesome-plugin/index.ts` and update the manifest:

```typescript
const manifest = createManifest({
  id: 'my-awesome-plugin',
  name: 'My Awesome Plugin',
  version: '1.0.0',
  description: 'What my plugin does',
  author: 'Your Name',
  license: 'MIT',
  categories: ['productivity'],
  permissions: [
    'storage:read',
    'storage:write',
  ],
  hooks: ['before-message-send'],
});
```

### 3. Implement Hooks

```typescript
const plugin = new NexusAIPlugin({
  manifest,
  hooks: {
    'before-message-send': async (event) => {
      // Transform the message
      return {
        ...event.payload,
        content: event.payload.content + ' 🤖',
      };
    },
  },
});
```

## Architecture

### Plugin Runtime

The plugin runtime (`src/services/pluginRuntime.ts`) provides:

1. **Sandboxed Execution** - Plugins run in isolation
2. **Permission System** - Fine-grained access control
3. **Hook System** - Event-driven communication
4. **API Access** - Storage, chat, models, RAG, MCP

### Hooks

Available hooks:

| Hook | Description | Payload |
|------|-------------|---------|
| `before-message-send` | Transform message before sending | `{ content, conversationId }` |
| `after-message-receive` | Process received messages | `{ message }` |
| `on-conversation-start` | New conversation created | `{ conversationId }` |
| `on-conversation-end` | Conversation closed | `{ conversationId }` |
| `on-plugin-load` | Plugin activated | `{}` |
| `on-plugin-unload` | Plugin deactivated | `{}` |
| `on-theme-change` | Theme changed | `{ theme }` |
| `on-settings-change` | Settings updated | `{ settings }` |

### Permissions

Request only the permissions your plugin needs:

```typescript
permissions: [
  'storage:read',      // Read from plugin's storage
  'storage:write',     // Write to plugin's storage
  'network:fetch',     // Make HTTP requests
  'ui:sidebar',        // Add sidebar elements
  'ui:toolbar',        // Add toolbar buttons
  'chat:send-message', // Send chat messages
  'chat:receive-message', // Receive chat messages
  'chat:modify-input', // Modify input field
  'models:access',     // Access AI models
  'system:clipboard',  // Clipboard access
  'system:notification', // Show notifications
  'system:file-system', // File system access
  'mcp:use-tools',     // Use MCP tools
  'rag:access-knowledge-base', // Access RAG
]
```

## SDK Reference

### NexusAIPlugin

```typescript
import { NexusAIPlugin, createManifest } from '../../src/services/pluginSdk';

const plugin = new NexusAIPlugin({
  manifest: createManifest({ /* ... */ }),
  hooks: { /* handlers */ },
  onError: (err) => console.error(err),
});

await plugin.register();
await plugin.unregister();
```

### createManifest

Helper to create a valid manifest:

```typescript
const manifest = createManifest({
  id: 'my-plugin',
  name: 'My Plugin',
  version: '1.0.0',
  description: 'Description',
  author: 'Author Name',
  license: 'MIT',
  categories: ['utility'],
  permissions: ['storage:read'],
  hooks: ['before-message-send'],
  configSchema: {
    type: 'object',
    properties: {
      setting: {
        type: 'string',
        title: 'Setting',
        default: 'value',
      },
    },
  },
});
```

### Hook Helpers

```typescript
import { hooks } from '../../src/services/pluginSdk';

// Transform messages
hooks.beforeMessageSend((message) => {
  return message.toUpperCase();
});

// Process responses
hooks.afterMessageReceive((message) => {
  console.log('Received:', message);
  return message;
});
```

### PluginStorage

Simple key-value storage:

```typescript
import { PluginStorage } from '../../src/services/pluginSdk';

const storage = new PluginStorage('my-plugin-');

await storage.set('key', { foo: 'bar' });
const value = await storage.get('key');
await storage.delete('key');
```

## Building

```bash
# Build your plugin
npm run build

# The output will be in dist/
```

## Publishing

1. Create a `manifest.json` from your plugin
2. Submit to the NexusAI marketplace (future feature)
3. Or host it yourself and add the URL to marketplace

## Example: AI Response Enhancer

Here's a more complex example that enhances AI responses:

```typescript
import { NexusAIPlugin, createManifest } from '../../src/services/pluginSdk';

const manifest = createManifest({
  id: 'ai-enhancer',
  name: 'AI Response Enhancer',
  version: '1.0.0',
  description: 'Enhances AI responses with formatting',
  author: 'Developer',
  categories: ['ai-enhancement'],
  permissions: ['chat:receive-message'],
  hooks: ['after-message-receive'],
});

const plugin = new NexusAIPlugin({
  manifest,
  hooks: {
    'after-message-receive': async (event) => {
      if (event.type === 'after-message-receive') {
        const message = event.payload;
        
        // Add emoji reactions
        if (message.content.includes('success')) {
          message.reactions = ['✅', '🎉'];
        }
        
        return message;
      }
      return event.payload;
    },
  },
});

plugin.register();
```

## Best Practices

1. **Minimal Permissions** - Only request what you need
2. **Error Handling** - Always wrap async operations in try/catch
3. **Graceful Degradation** - Handle missing permissions gracefully
4. **Configuration** - Use configSchema for user settings
5. **Documentation** - Document what your plugin does

## Troubleshooting

### Permission Denied

```
Error: Permission denied: storage:read
```

Make sure your manifest includes the required permission.

### Hook Not Firing

Check that you've registered the hook in your manifest's `hooks` array.

### Plugin Not Loading

Check the browser console for errors. Ensure your plugin is properly exported.

## Support

- GitHub Issues: Report bugs
- Discord: Community discussion
- Email: support@nexusai.example.com
