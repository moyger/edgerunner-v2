#!/usr/bin/env python3
"""
PreCompact Hook
Exit code 2: N/A, shows stderr to user only
"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))
from hook_utils import *

def main():
    logger = HookLogger("pre_compact")
    tts = TTSManager()
    
    # Parse input
    data = parse_hook_input()
    memory_usage = data.get("memory_usage", {})
    compact_reason = data.get("reason", "memory_limit")
    
    logger.log("info", f"Memory compaction requested: {compact_reason}", memory_usage)
    
    # Announce memory management
    if compact_reason == "memory_limit":
        tts.speak("Memory optimization in progress", voice="rachel", async_mode=True)
        message = "🧠 MEMORY: Optimizing conversation memory to improve performance."
    elif compact_reason == "user_requested":
        tts.speak("Compacting memory as requested", voice="rachel", async_mode=True)
        message = "🧠 MEMORY: Compacting conversation history as requested."
    elif compact_reason == "context_limit":
        tts.speak("Reaching context limit, optimizing", voice="adam", async_mode=True)
        message = "⚠️ MEMORY: Approaching context limit, compacting conversation."
    else:
        tts.speak("Memory management operation", voice="rachel", async_mode=True)
        message = f"🧠 MEMORY: {compact_reason}"
    
    # Save important context before compaction
    context_dir = Path(".claude/context")
    context_dir.mkdir(parents=True, exist_ok=True)
    
    # Save current session state
    session_state = {
        "timestamp": datetime.now().isoformat(),
        "reason": compact_reason,
        "memory_usage": memory_usage,
        "active_tasks": get_active_tasks(),
        "recent_files": get_recent_files(),
        "project_state": get_project_state()
    }
    
    compact_id = datetime.now().strftime("%Y%m%d_%H%M%S")
    context_file = context_dir / f"pre_compact_{compact_id}.json"
    context_file.write_text(json.dumps(session_state, indent=2))
    
    # Memory usage reporting
    if memory_usage:
        total_mb = memory_usage.get("total_mb", 0)
        used_mb = memory_usage.get("used_mb", 0)
        percentage = memory_usage.get("percentage", 0)
        
        if percentage > 80:
            urgency = "HIGH"
            voice = "adam"
        elif percentage > 60:
            urgency = "MEDIUM"
            voice = "rachel"
        else:
            urgency = "LOW"
            voice = "rachel"
        
        memory_info = f"Memory usage: {used_mb}MB / {total_mb}MB ({percentage}%) - {urgency} priority"
        print(f"📊 {memory_info}", file=sys.stderr)
        
        if urgency == "HIGH":
            tts.speak("High memory usage detected", voice="adam", async_mode=True)
    
    # Clean up old context files (keep last 10)
    context_files = sorted(context_dir.glob("pre_compact_*.json"))
    if len(context_files) > 10:
        for old_file in context_files[:-10]:
            try:
                old_file.unlink()
                logger.log("info", f"Cleaned up old context file: {old_file.name}")
            except:
                pass
    
    # Tips for memory management
    tips = [
        "💡 TIP: Use specific questions to reduce context size",
        "💡 TIP: Break large tasks into smaller steps",
        "💡 TIP: Previous context saved for reference",
        "💡 TIP: Memory compaction helps maintain performance"
    ]
    
    import random
    tip = random.choice(tips)
    
    print(message, file=sys.stderr)
    print(tip, file=sys.stderr)
    print("", file=sys.stderr)
    
    sys.exit(0)

def get_active_tasks():
    """Get list of currently active tasks"""
    tasks = []
    
    # Check for build processes
    try:
        import subprocess
        result = subprocess.run(["pgrep", "-f", "npm"], capture_output=True, text=True)
        if result.stdout:
            tasks.append("npm process running")
    except:
        pass
    
    # Check for backend
    try:
        import requests
        response = requests.get("http://localhost:8000/health", timeout=1)
        if response.status_code == 200:
            tasks.append("backend running")
    except:
        pass
    
    return tasks

def get_recent_files():
    """Get list of recently modified files"""
    try:
        import subprocess
        result = subprocess.run([
            "find", ".", "-type", "f", "-name", "*.py", "-o", "-name", "*.ts", "-o", "-name", "*.tsx",
            "-mtime", "-1"
        ], capture_output=True, text=True, cwd=".")
        
        files = [f for f in result.stdout.split("\n") if f and not f.startswith("./node_modules")]
        return files[:10]  # Last 10 files
    except:
        return []

def get_project_state():
    """Get current project state"""
    state = {
        "git_branch": "unknown",
        "uncommitted_changes": False,
        "backend_status": "unknown",
        "last_build": None
    }
    
    # Git branch
    try:
        import subprocess
        result = subprocess.run(["git", "branch", "--show-current"], 
                              capture_output=True, text=True)
        if result.returncode == 0:
            state["git_branch"] = result.stdout.strip()
    except:
        pass
    
    # Uncommitted changes
    try:
        result = subprocess.run(["git", "status", "--porcelain"], 
                              capture_output=True, text=True)
        if result.returncode == 0:
            state["uncommitted_changes"] = bool(result.stdout.strip())
    except:
        pass
    
    # Last build time
    build_dir = Path("dist")
    if build_dir.exists():
        try:
            state["last_build"] = datetime.fromtimestamp(
                build_dir.stat().st_mtime
            ).isoformat()
        except:
            pass
    
    return state

if __name__ == "__main__":
    main()