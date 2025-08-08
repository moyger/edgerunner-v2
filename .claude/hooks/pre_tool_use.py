#!/usr/bin/env python3
"""
PreToolUse Hook
Exit code 2: Blocks the tool call, shows stderr to Claude
"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))
from hook_utils import *

def main():
    logger = HookLogger("pre_tool_use")
    tts = TTSManager()
    validator = HookValidator()
    
    # Parse input
    data = parse_hook_input()
    # Claude Code passes tool_name directly in data
    tool_name = data.get("tool_name") or data.get("tool", "unknown")
    tool_params = data.get("tool_input") or data.get("params", {})
    
    logger.log("info", f"Tool use requested: {tool_name}", data)
    
    # Check for dangerous operations
    if tool_name == "Bash":
        command = tool_params.get("command", "")
        
        # Check for dangerous commands
        if validator.is_dangerous_command(command):
            logger.log("error", f"Blocked dangerous command: {command}")
            exit_with_message(
                2,  # Block the tool call
                f"⚠️ BLOCKED: Dangerous command detected: {command}\nThis operation could harm the system.",
                speak=True,
                voice="sam"  # Error voice
            )
        
        # Warn about production operations
        if "production" in command.lower() or "live" in command.lower():
            tts.speak("Warning: Production command detected", voice="adam", async_mode=True)
    
    # Check file operations
    if tool_name in ["Write", "Edit", "MultiEdit", "Delete"]:
        file_path = tool_params.get("file_path", "")
        
        # Block modifications to critical files
        if validator.is_production_file(file_path):
            logger.log("error", f"Blocked modification to critical file: {file_path}")
            exit_with_message(
                2,  # Block the tool call
                f"⚠️ BLOCKED: Cannot modify critical system file: {file_path}",
                speak=True,
                voice="sam"
            )
        
        # Warn about important files
        if any(ext in file_path for ext in [".env", "config", "settings"]):
            tts.speak("Modifying configuration file", voice="adam", async_mode=True)
    
    # Check rate limiting for expensive operations
    if tool_name in ["WebSearch", "WebFetch", "Task"]:
        if not validator.check_rate_limit(f"expensive_{tool_name}", limit_seconds=2):
            logger.log("warning", f"Rate limit triggered for {tool_name}")
            exit_with_message(
                2,  # Block the tool call
                f"⚠️ RATE LIMIT: Please wait before using {tool_name} again",
                speak=True,
                voice="adam"
            )
    
    # After hours check for certain operations
    if validator.is_after_hours() and tool_name in ["Delete", "MultiEdit"]:
        logger.log("warning", "After hours operation attempted")
        tts.speak("After hours operation detected. Proceed with caution.", voice="adam", async_mode=True)
    
    # Disabled tool announcements - only keeping critical warnings above
    # tool_messages = {
    #     "Read": "Reading file",
    #     "Write": "Writing file",
    #     "Edit": "Editing file",
    #     "Bash": "Executing command",
    #     "WebSearch": "Searching the web",
    #     "WebFetch": "Fetching web content",
    #     "Task": "Launching agent",
    #     "Grep": "Searching codebase",
    #     "Glob": "Finding files",
    #     "LS": "Listing directory"
    # }
    # 
    # message = tool_messages.get(tool_name, f"Using {tool_name}")
    # tts.speak(message, voice="rachel", async_mode=True)
    
    # Success - allow tool to proceed
    sys.exit(0)

if __name__ == "__main__":
    main()