#!/usr/bin/env python3
"""
Assistant Done Hook - Notifies when Claude is done and waiting for user input
"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))
from hook_utils import *

def main():
    logger = HookLogger("assistant_done")
    tts = TTSManager()
    
    # Parse input
    data = parse_hook_input()
    
    logger.log("info", "Assistant finished, waiting for user input")
    
    # Simple notification that Claude is done and waiting
    tts.speak("Ready for your input", voice="bella", async_mode=True)
    
    # Success
    sys.exit(0)

if __name__ == "__main__":
    main()