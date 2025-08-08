#!/usr/bin/env python3
"""
Notification Hook
Exit code 2: N/A, shows stderr to user only
"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))
from hook_utils import *

def main():
    logger = HookLogger("notification")
    tts = TTSManager()
    
    # Parse input
    data = parse_hook_input()
    message = data.get("message", "")
    level = data.get("level", "info")
    category = data.get("category", "general")
    
    logger.log(level, f"Notification: {category}", {"message": message})
    
    # Voice selection based on level
    voice_map = {
        "error": "sam",
        "warning": "adam",
        "success": "bella",
        "info": "rachel"
    }
    
    voice = voice_map.get(level, "rachel")
    
    # Only notify for critical events and completion
    if level == "error":
        tts.speak("Error occurred", voice="sam", async_mode=True)
    elif category == "completion" or "complete" in message.lower() or "done" in message.lower():
        tts.speak("Ready", voice="bella", async_mode=True)
    # All other notifications are silent
    
    # Log to user (since exit code 2 shows stderr to user only)
    timestamp = datetime.now().strftime("%H:%M:%S")
    print(f"[{timestamp}] {level.upper()}: {message}", file=sys.stderr)
    
    # Always exit 0 for notifications (they don't block anything)
    sys.exit(0)

def handle_build_notification(message, level, tts, voice):
    """Handle build-related notifications"""
    if "error" in message.lower():
        tts.speak("Build failed", voice="sam", async_mode=True)
    elif "success" in message.lower() or "complete" in message.lower():
        tts.speak("Build successful", voice="bella", async_mode=True)
    elif "warning" in message.lower():
        tts.speak("Build completed with warnings", voice="adam", async_mode=True)
    else:
        tts.speak("Build update", voice=voice, async_mode=True)

def handle_test_notification(message, level, tts, voice):
    """Handle test-related notifications"""
    if "passed" in message.lower():
        tts.speak("Tests passed", voice="bella", async_mode=True)
    elif "failed" in message.lower():
        tts.speak("Tests failed", voice="sam", async_mode=True)
    elif "coverage" in message.lower():
        tts.speak("Coverage report ready", voice="rachel", async_mode=True)
    else:
        tts.speak("Test update", voice=voice, async_mode=True)

def handle_git_notification(message, level, tts, voice):
    """Handle git-related notifications"""
    if "commit" in message.lower():
        tts.speak("Git commit", voice="rachel", async_mode=True)
    elif "push" in message.lower():
        tts.speak("Git push", voice="rachel", async_mode=True)
    elif "pull" in message.lower():
        tts.speak("Git pull", voice="rachel", async_mode=True)
    elif "conflict" in message.lower():
        tts.speak("Git conflict detected", voice="sam", async_mode=True)
    else:
        tts.speak("Git update", voice=voice, async_mode=True)

def handle_api_notification(message, level, tts, voice):
    """Handle API-related notifications"""
    if "connection" in message.lower():
        if "failed" in message.lower():
            tts.speak("API connection failed", voice="sam", async_mode=True)
        else:
            tts.speak("API connected", voice="bella", async_mode=True)
    elif "rate limit" in message.lower():
        tts.speak("Rate limit reached", voice="adam", async_mode=True)
    elif "timeout" in message.lower():
        tts.speak("API timeout", voice="adam", async_mode=True)
    else:
        tts.speak("API notification", voice=voice, async_mode=True)

def handle_security_notification(message, level, tts, voice):
    """Handle security-related notifications"""
    if level == "error":
        tts.speak("Security alert", voice="sam", async_mode=True)
    elif "vulnerability" in message.lower():
        tts.speak("Vulnerability detected", voice="sam", async_mode=True)
    elif "scan" in message.lower():
        tts.speak("Security scan complete", voice="rachel", async_mode=True)
    else:
        tts.speak("Security notification", voice=voice, async_mode=True)

def handle_performance_notification(message, level, tts, voice):
    """Handle performance-related notifications"""
    if "slow" in message.lower() or "lag" in message.lower():
        tts.speak("Performance issue detected", voice="adam", async_mode=True)
    elif "optimized" in message.lower():
        tts.speak("Performance improved", voice="bella", async_mode=True)
    elif "memory" in message.lower():
        tts.speak("Memory usage alert", voice="adam", async_mode=True)
    else:
        tts.speak("Performance update", voice=voice, async_mode=True)

if __name__ == "__main__":
    main()