#!/usr/bin/env python3
"""
PostToolUse Hook
Exit code 2: Shows stderr to Claude (tool already ran)
"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))
from hook_utils import *

def main():
    logger = HookLogger("post_tool_use")
    tts = TTSManager()
    
    # Parse input
    data = parse_hook_input()
    # Claude Code passes tool_name directly in data
    tool_name = data.get("tool_name") or data.get("tool", "unknown")
    success = data.get("success", True)
    result = data.get("result", {})
    
    logger.log("info", f"Tool completed: {tool_name}", {"success": success})
    
    # Handle failures
    if not success:
        error_msg = result.get("error", "Unknown error")
        logger.log("error", f"Tool {tool_name} failed: {error_msg}")
        
        # Speak error notification
        tts.speak(f"{tool_name} failed", voice="sam", async_mode=True)
        
        # Exit code 2 to notify Claude about the failure
        if "permission" in error_msg.lower():
            print(f"⚠️ Permission issue with {tool_name}: {error_msg}", file=sys.stderr)
            sys.exit(2)
        elif "not found" in error_msg.lower():
            print(f"⚠️ Resource not found in {tool_name}: {error_msg}", file=sys.stderr)
            sys.exit(2)
    
    # Disabled success notifications - only keeping error notifications
    # success_messages = {
    #     "Write": ("File saved", "bella"),
    #     "Edit": ("File updated", "bella"),
    #     "MultiEdit": ("Multiple edits completed", "bella"),
    #     "Delete": ("File deleted", "adam"),
    #     "Bash": ("Command completed", "rachel"),
    #     "Task": ("Agent task completed", "bella"),
    #     "NotebookEdit": ("Notebook updated", "bella")
    # }
    # 
    # if tool_name in success_messages:
    #     message, voice = success_messages[tool_name]
    #     tts.speak(message, voice=voice, async_mode=True)
    
    # Only notify for major task completions (like Task agent completion)
    if tool_name == "Task" and success:
        tts.speak("Task completed", voice="bella", async_mode=True)
    
    # Disabled command output warnings
    # if tool_name == "Bash" and result.get("output"):
    #     output = str(result["output"]).lower()
    #     
    #     # Check for common issues in output
    #     if "error" in output or "failed" in output:
    #         tts.speak("Command completed with errors", voice="adam", async_mode=True)
    #     elif "warning" in output:
    #         tts.speak("Command completed with warnings", voice="adam", async_mode=True)
    
    # Disabled search result notifications
    # if tool_name == "WebSearch":
    #     results_count = result.get("count", 0)
    #     if results_count == 0:
    #         tts.speak("No search results found", voice="adam", async_mode=True)
    
    sys.exit(0)

if __name__ == "__main__":
    main()