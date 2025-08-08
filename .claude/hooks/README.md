# Claude Code Hooks for Edgerunner v2

This directory contains comprehensive hook scripts that provide intelligent monitoring, validation, and TTS feedback for all Claude Code operations.

## Hook Overview

Based on [Claude Code Hooks Documentation](https://docs.anthropic.com/en/docs/claude-code/hooks), these hooks leverage **Exit Code 2 behavior** for smart blocking and notifications:

| Hook Event | Script | Exit Code 2 Behavior | Purpose |
|------------|--------|--------------------|---------|
| **PreToolUse** | `pre_tool_use.py` | Blocks tool call, shows stderr to Claude | Validates and blocks dangerous operations |
| **PostToolUse** | `post_tool_use.py` | Shows stderr to Claude (tool ran) | Reports completion status and errors |
| **UserPromptSubmit** | `user_prompt_submit.py` | Blocks prompt, erases it, shows stderr to user | Validates and blocks unsafe prompts |
| **Stop** | `stop.py` | Blocks stoppage, shows stderr to Claude | Prevents stopping with unsaved work |
| **SubagentStop** | `subagent_stop.py` | Blocks stoppage, shows stderr to subagent | Manages agent lifecycle and cleanup |
| **Notification** | `notification.py` | N/A, shows stderr to user only | Categorized user notifications with TTS |
| **PreCompact** | `pre_compact.py` | N/A, shows stderr to user only | Memory management with context preservation |
| **SessionStart** | `session_start.py` | N/A, shows stderr to user only | Welcome message and project health check |

## Features

### 🔊 ElevenLabs TTS Integration
- **Voice Selection**: Different voices for different scenarios
  - `rachel` (default) - General operations
  - `bella` - Success notifications  
  - `adam` - Warnings and cautions
  - `sam` - Errors and blocks

### 🛡️ Safety & Validation
- **Dangerous Command Detection**: Blocks potentially harmful bash commands
- **Production File Protection**: Prevents modification of critical system files
- **Rate Limiting**: Prevents rapid-fire expensive operations
- **Prompt Validation**: Blocks unsafe or malicious prompts
- **Transaction Safety**: Prevents stopping during critical operations

### 📊 Intelligence & Context
- **Project Health Monitoring**: Checks backend, dependencies, git status
- **Memory Management**: Smart context preservation during compaction  
- **Agent Lifecycle Management**: Validates agent stops and cleanup
- **Performance Tracking**: Monitors agent metrics and success rates
- **Session State**: Maintains session context and recent activity

### 🎯 Trading Platform Specific
- **Paper Trading Enforcement**: Blocks live trading without explicit confirmation
- **Broker API Protection**: Validates API operations and rate limits
- **Build Process Monitoring**: Tracks development server and build states
- **Configuration Safety**: Warns when modifying .env and config files

## Hook Scripts

### `hook_utils.py` - Shared Utilities
Core utilities used by all hooks:
- **TTSManager**: ElevenLabs text-to-speech integration
- **HookLogger**: Structured logging for hook events  
- **HookValidator**: Common validation functions
- **Helper Functions**: Input parsing, exit handling, file utilities

### `pre_tool_use.py` - Tool Validation
**Exit Code 2 Blocks Tool Calls**
- Dangerous command detection (`rm -rf`, `shutdown`, etc.)
- Critical file protection (system directories, node_modules)
- Rate limiting for expensive operations (WebSearch, WebFetch)
- After-hours operation warnings
- Production operation alerts

### `post_tool_use.py` - Tool Completion
**Exit Code 2 Notifies Claude of Issues**
- Success/failure announcements with appropriate voices
- Error categorization (permission, not found, etc.)
- Output analysis for warnings and errors
- Performance tracking and metrics

### `user_prompt_submit.py` - Prompt Validation  
**Exit Code 2 Blocks and Erases Prompts**
- Dangerous keyword detection
- Live trading confirmation requirements
- Prompt length validation (max 10,000 chars)
- Rate limiting rapid submissions
- Sensitive information detection (API keys, passwords)
- Greeting recognition for friendly responses

### `stop.py` - Stop Validation
**Exit Code 2 Blocks Stopping**
- Unsaved work detection
- Critical process monitoring (builds, git operations)
- Open transaction validation
- Cleanup of temporary files
- Process-specific stop handling

### `subagent_stop.py` - Agent Management
**Exit Code 2 Blocks Agent Stopping**
- Critical work validation per agent type
- Multi-step operation completion checks
- Agent-specific validation (dev, ui, api, backtest, tester)
- Error state preservation for debugging
- Performance metrics tracking
- Artifact cleanup for successful completions

### `notification.py` - User Notifications
**No Blocking (Informational Only)**
- Categorized notifications: build, test, git, api, security, performance
- Context-aware TTS responses
- Voice selection based on severity level
- Timestamp logging to stderr

### `session_start.py` - Session Initialization
**No Blocking (Informational Only)**
- Time-appropriate greetings
- Project health assessment
- Backend connectivity check
- Dependency validation
- Git status reporting
- Welcome dashboard with commands and agents
- Session state tracking

### `pre_compact.py` - Memory Management
**No Blocking (Informational Only)**  
- Memory usage reporting and optimization
- Context preservation before compaction
- Recent file activity tracking
- Project state snapshots
- Cleanup of old context files
- Memory management tips

## Configuration

Hooks are configured in `claude_code_config.json` and use settings from `.claude/settings.json`.

### Required Environment Variables
```bash
ELEVENLABS_API_KEY=your_elevenlabs_api_key
```

### Dependencies
All hooks use the shared `hook_utils.py` which requires:
- `requests` - For ElevenLabs API calls
- `python-dotenv` - For environment variable loading

## Logging & Monitoring

### Hook Logs
- **Location**: `.claude/logs/hooks.log`
- **Format**: JSON structured logging with timestamps
- **Levels**: info, warning, error
- **Data**: Hook name, event details, contextual information

### Agent Metrics  
- **Location**: `.claude/metrics/agent_metrics.json`
- **Tracking**: Success rates, failure counts, runtime statistics
- **Per-Agent**: Individual performance metrics for each specialized agent

### Context Preservation
- **Location**: `.claude/context/`
- **Purpose**: Saves important context before memory compaction
- **Retention**: Last 10 compaction contexts preserved

### Session State
- **Location**: `.claude/sessions/{session_id}/`
- **Content**: Session metadata, start time, user info, activity tracking

## Usage Examples

### Blocking Dangerous Operations
```bash
# This command would be blocked by pre_tool_use.py
echo "rm -rf /" | claude
# Output: ⚠️ BLOCKED: Dangerous command detected
# TTS: "Blocked dangerous operation" (sam voice)
```

### Prompt Validation
```bash
# This prompt would be blocked by user_prompt_submit.py  
claude "Please delete all files in production"
# Output: ⚠️ BLOCKED: Your prompt contains potentially dangerous instructions
# TTS: "Dangerous request blocked" (sam voice)
```

### Agent Stop Protection
```bash
# Agent stop would be blocked if critical work in progress
# Exit code 2 prevents agent termination
# TTS: "Agent has critical work in progress" (sam voice)
```

### Session Welcome
```bash
# On session start
# TTS: "Good morning, Developer. Edgerunner v2 development session started."
# Displays project health dashboard
```

## Troubleshooting

### TTS Not Working
1. Check `ELEVENLABS_API_KEY` environment variable
2. Verify internet connection for API calls
3. Check `.claude/logs/hooks.log` for error details

### Hooks Not Triggering
1. Verify hook scripts are executable: `chmod +x .claude/hooks/*.py`
2. Check `claude_code_config.json` configuration
3. Ensure Python dependencies are installed

### False Positives
1. Check validation logic in respective hook scripts
2. Modify danger detection patterns if needed
3. Adjust rate limiting thresholds in `hook_utils.py`

## Extending Hooks

To add new hook functionality:

1. **Modify existing hooks**: Edit the relevant `.py` file
2. **Add new validations**: Extend `HookValidator` class in `hook_utils.py`
3. **New TTS messages**: Add to voice mappings in hook scripts  
4. **Custom notifications**: Extend category handlers in `notification.py`

## Security Considerations

- Hooks never expose sensitive information in logs
- TTS messages are sanitized to avoid speaking secrets
- File operations are validated against critical system paths
- Production operations require explicit confirmation
- All dangerous operations are logged for audit trails

This comprehensive hook system transforms Claude Code into an intelligent, safe, and user-friendly development environment specifically optimized for the Edgerunner v2 algorithmic trading platform.