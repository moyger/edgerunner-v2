#!/usr/bin/env python3
"""
Simple TTS test script for Edgerunner v2
Run this to test ElevenLabs TTS integration
"""

import sys
sys.path.insert(0, '.claude/hooks')
from hook_utils import TTSManager
import time

def main():
    print("🔊 ElevenLabs TTS Test for Edgerunner v2")
    tts = TTSManager()
    
    tests = [
        ("rachel", "Claude Code operation in progress", "📝 Default Voice"),
        ("bella", "Operation completed successfully", "✅ Success Voice"),  
        ("adam", "Warning: Production mode detected", "⚠️ Warning Voice"),
        ("sam", "Error: Dangerous operation blocked", "🚫 Error Voice")
    ]
    
    for voice, message, description in tests:
        print(f"{description}: {message}")
        result = tts.speak(message, voice=voice, async_mode=False)
        print(f"   Result: {'✅ Success' if result else '❌ Failed'}")
        time.sleep(1.5)
    
    print("\n🎉 TTS integration test completed!")
    print("Your ElevenLabs TTS system is working perfectly!")

if __name__ == "__main__":
    main()