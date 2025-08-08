#!/usr/bin/env python3

import sys
import subprocess
import os

def play_sound(event_type="default", message="Hook triggered"):
    """Play TTS sound based on event type"""
    
    # Map event types to messages
    messages = {
        "tool_use": "Tool executed",
        "error": "Error occurred", 
        "success": "Task completed",
        "start": "Starting task",
        "default": message
    }
    
    # Get the appropriate message
    text = messages.get(event_type, message)
    
    # Use macOS say command for TTS (runs in background)
    try:
        subprocess.Popen(["say", text])
    except Exception as e:
        print(f"Failed to play sound: {e}", file=sys.stderr)

if __name__ == "__main__":
    # Get event type and message from command line args
    event_type = sys.argv[1] if len(sys.argv) > 1 else "default"
    message = sys.argv[2] if len(sys.argv) > 2 else "Hook triggered"
    
    play_sound(event_type, message)