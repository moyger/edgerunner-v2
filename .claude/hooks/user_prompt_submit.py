#!/usr/bin/env python3
"""
UserPromptSubmit Hook
Exit code 2: Blocks prompt processing, erases prompt, shows stderr to user only
"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))
from hook_utils import *

def main():
    logger = HookLogger("user_prompt_submit")
    tts = TTSManager()
    validator = HookValidator()
    
    # Parse input
    data = parse_hook_input()
    prompt = data.get("prompt", "")
    
    logger.log("info", "User prompt submitted", {"prompt_length": len(prompt)})
    
    # Check for dangerous keywords in prompt
    dangerous_keywords = [
        "delete all",
        "rm -rf",
        "drop database",
        "format drive",
        "destroy",
        "wipe",
        "nuclear option",
        "kill all",
        "terminate everything"
    ]
    
    prompt_lower = prompt.lower()
    for keyword in dangerous_keywords:
        if keyword in prompt_lower:
            logger.log("error", f"Blocked dangerous prompt containing: {keyword}")
            exit_with_message(
                2,  # Block and erase prompt
                f"⚠️ BLOCKED: Your prompt contains potentially dangerous instructions: '{keyword}'\n"
                f"Please rephrase your request more specifically.",
                speak=True,
                voice="sam"
            )
    
    # Check for production/live trading requests without confirmation
    if ("live trading" in prompt_lower or "production" in prompt_lower) and "test" not in prompt_lower:
        logger.log("warning", "Production request without test flag")
        exit_with_message(
            2,  # Block and erase prompt
            "⚠️ SAFETY CHECK: Production/Live trading request detected.\n"
            "Please confirm by adding 'I understand the risks' to your prompt.\n"
            "Remember: Paper trading mode is recommended for testing.",
            speak=True,
            voice="adam"
        )
    
    # Check prompt length (prevent massive prompts)
    if len(prompt) > 10000:
        logger.log("warning", f"Prompt too long: {len(prompt)} characters")
        exit_with_message(
            2,  # Block and erase prompt
            "⚠️ PROMPT TOO LONG: Please break down your request into smaller parts.\n"
            f"Current length: {len(prompt)} characters (max: 10000)",
            speak=True,
            voice="adam"
        )
    
    # Check for rate limiting on rapid prompts
    if not validator.check_rate_limit("prompt_submit", limit_seconds=0.5):
        logger.log("warning", "Rapid prompt submission detected")
        exit_with_message(
            2,  # Block and erase prompt
            "⚠️ SLOW DOWN: Please wait a moment before submitting another prompt.",
            speak=True,
            voice="adam"
        )
    
    # Check for sensitive information in prompt
    sensitive_patterns = [
        r'\b[A-Z0-9]{20,}\b',  # API keys
        r'\b(?:\d{4}[-\s]?){3}\d{4}\b',  # Credit card numbers
        r'\b\d{3}-\d{2}-\d{4}\b',  # SSN
        r'password\s*[:=]\s*\S+',  # Passwords
        r'api[_-]?key\s*[:=]\s*\S+',  # API keys
    ]
    
    import re
    for pattern in sensitive_patterns:
        if re.search(pattern, prompt, re.IGNORECASE):
            logger.log("error", "Sensitive information detected in prompt")
            exit_with_message(
                2,  # Block and erase prompt
                "⚠️ SECURITY: Potential sensitive information detected in your prompt.\n"
                "Please remove any API keys, passwords, or personal information.",
                speak=True,
                voice="sam"
            )
    
    # Disabled greeting responses - keeping only critical warnings above
    # greetings = ["hello", "hi ", "hey", "good morning", "good afternoon", "good evening"]
    # if any(greeting in prompt_lower[:20] for greeting in greetings):
    #     tts.speak("Hello! Processing your request", voice="bella", async_mode=True)
    # else:
    #     # Normal prompt announcement
    #     tts.speak("Processing your request", voice="rachel", async_mode=True)
    
    # Track prompt metrics (silently)
    if "help" in prompt_lower or "?" in prompt:
        logger.log("info", "Help request detected")
        # tts.speak("Help request received", voice="bella", async_mode=True)
    
    # Success - allow prompt to proceed
    sys.exit(0)

if __name__ == "__main__":
    main()