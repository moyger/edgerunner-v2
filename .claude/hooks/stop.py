#!/usr/bin/env python3
"""
Stop Hook - Triggers when Claude finishes responding
Exit code 2: Blocks stoppage, shows stderr to Claude
"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))
from hook_utils import *

def main():
    logger = HookLogger("stop")
    tts = TTSManager()
    
    # Parse input
    data = parse_hook_input()
    reason = data.get("reason", "response_complete")
    force = data.get("force", False)
    
    logger.log("info", f"Stop requested: {reason}", data)
    
    # Check for unsaved work
    unsaved_markers = [
        ".claude/temp/unsaved_work",
        ".claude/temp/in_progress",
        ".claude/temp/critical_operation"
    ]
    
    unsaved_work = False
    for marker in unsaved_markers:
        if Path(marker).exists():
            unsaved_work = True
            logger.log("warning", f"Unsaved work detected: {marker}")
            break
    
    if unsaved_work and not force:
        exit_with_message(
            2,  # Block stoppage
            "⚠️ BLOCKED: Unsaved work detected!\n"
            "Please save your work or use force stop.\n"
            "Files may be in an inconsistent state.",
            speak=True,
            voice="sam"
        )
    
    # Check for running processes
    critical_processes = [
        "npm run build",
        "npm test",
        "python backend/start.py",
        "git push",
        "git commit"
    ]
    
    try:
        import subprocess
        result = subprocess.run(["ps", "aux"], capture_output=True, text=True)
        processes = result.stdout.lower()
        
        for process in critical_processes:
            if process.lower() in processes:
                logger.log("warning", f"Critical process running: {process}")
                exit_with_message(
                    2,  # Block stoppage
                    f"⚠️ BLOCKED: Critical process still running: {process}\n"
                    "Please wait for it to complete or terminate it manually.",
                    speak=True,
                    voice="sam"
                )
    except:
        pass
    
    # Check for open transactions
    transaction_file = Path(".claude/temp/open_transaction")
    if transaction_file.exists():
        transaction_id = transaction_file.read_text().strip()
        logger.log("error", f"Open transaction detected: {transaction_id}")
        exit_with_message(
            2,  # Block stoppage
            f"⚠️ BLOCKED: Open transaction detected: {transaction_id}\n"
            "Please complete or rollback the transaction first.",
            speak=True,
            voice="sam"
        )
    
    # Simple notification when Claude finishes responding
    logger.log("info", "Claude finished responding, ready for user input")
    
    # Play a simple "ready" sound to indicate Claude is done and waiting
    result = tts.speak("Ready", voice="bella", async_mode=True)
    logger.log("info", f"TTS speak result: {result}, API key present: {tts.api_key is not None}")
    
    # Clean up temp files
    temp_dir = Path(".claude/temp")
    if temp_dir.exists():
        for temp_file in temp_dir.glob("*"):
            try:
                if temp_file.is_file():
                    temp_file.unlink()
            except:
                pass
    
    # Success - allow stop
    sys.exit(0)

if __name__ == "__main__":
    main()