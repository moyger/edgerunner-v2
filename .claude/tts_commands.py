#!/usr/bin/env python3
"""
Manual TTS Commands for Edgerunner v2
Since automated hooks aren't triggering, use these for on-demand TTS
"""

import sys
sys.path.insert(0, '.claude/hooks')
from hook_utils import TTSManager

def speak(message, voice="rachel"):
    """Quick TTS function"""
    tts = TTSManager()
    return tts.speak(message, voice=voice, async_mode=False)

# Quick command shortcuts
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 .claude/tts_commands.py <command> [message]")
        print("Commands:")
        print("  start     - Session start message")
        print("  success   - Success notification")
        print("  warning   - Warning notification") 
        print("  error     - Error notification")
        print("  say <msg> - Speak custom message")
        sys.exit(1)
    
    command = sys.argv[1].lower()
    
    if command == "start":
        speak("Edgerunner v2 development session ready", "bella")
    elif command == "success":
        speak("Operation completed successfully", "bella")
    elif command == "warning":
        speak("Warning: Review changes before proceeding", "adam")
    elif command == "error":
        speak("Error detected, please check logs", "sam")
    elif command == "say" and len(sys.argv) > 2:
        message = " ".join(sys.argv[2:])
        speak(message, "rachel")
    else:
        speak("Command not recognized", "sam")