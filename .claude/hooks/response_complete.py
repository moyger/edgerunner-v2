#!/usr/bin/env python3
"""
Response Complete Hook - Simple notification when Claude finishes responding
"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))
from hook_utils import *

def main():
    logger = HookLogger("response_complete")
    tts = TTSManager()
    
    # Parse input
    data = parse_hook_input()
    
    logger.log("info", "Response complete, awaiting user input")
    
    # Simple chime to indicate Claude is done and waiting
    tts.speak("Ready", voice="bella", async_mode=True)
    
    # Success
    sys.exit(0)

if __name__ == "__main__":
    main()