#!/usr/bin/env python3
"""
SessionStart Hook
Exit code 2: N/A, shows stderr to user only
"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))
from hook_utils import *

def main():
    logger = HookLogger("session_start")
    tts = TTSManager()
    
    # Parse input
    data = parse_hook_input()
    session_id = data.get("session_id", "unknown")
    user = data.get("user", os.getenv("USER", "Developer"))
    
    logger.log("info", f"Session started: {session_id}", {"user": user})
    
    # Create session directory
    session_dir = Path(f".claude/sessions/{session_id}")
    session_dir.mkdir(parents=True, exist_ok=True)
    
    # Initialize session state
    session_state = {
        "id": session_id,
        "user": user,
        "start_time": datetime.now().isoformat(),
        "project": "Edgerunner v2",
        "last_activity": datetime.now().isoformat()
    }
    
    session_file = session_dir / "session.json"
    session_file.write_text(json.dumps(session_state, indent=2))
    
    # Welcome message based on time of day
    current_hour = datetime.now().hour
    
    if 5 <= current_hour < 12:
        greeting = f"Good morning, {user}"
        voice = "bella"
    elif 12 <= current_hour < 17:
        greeting = f"Good afternoon, {user}"
        voice = "rachel"
    elif 17 <= current_hour < 22:
        greeting = f"Good evening, {user}"
        voice = "rachel"
    else:
        greeting = f"Working late, {user}?"
        voice = "adam"
    
    # Check project health
    health_status = check_project_health()
    
    welcome_message = f"{greeting}. Edgerunner v2 development session started."
    
    if health_status["issues"]:
        welcome_message += f" {len(health_status['issues'])} issues detected."
        voice = "adam"
    else:
        welcome_message += " All systems ready."
    
    # Speak welcome message
    tts.speak(welcome_message, voice=voice, async_mode=False)
    
    # Display project status
    status_lines = [
        f"🚀 Edgerunner v2 Development Session",
        f"📅 {datetime.now().strftime('%Y-%m-%d %H:%M')}",
        f"👤 Developer: {user}",
        f"🔧 Session ID: {session_id[:8]}...",
    ]
    
    if health_status["backend_running"]:
        status_lines.append("✅ Backend: Running")
    else:
        status_lines.append("❌ Backend: Not running")
    
    if health_status["dependencies_ok"]:
        status_lines.append("✅ Dependencies: OK")
    else:
        status_lines.append("⚠️ Dependencies: Issues detected")
    
    # Display any specific issues
    for issue in health_status["issues"][:3]:  # Show top 3 issues
        status_lines.append(f"⚠️  {issue}")
    
    if len(health_status["issues"]) > 3:
        status_lines.append(f"   ... and {len(health_status['issues']) - 3} more")
    
    status_lines.extend([
        "",
        "🎯 Available Commands:",
        "  npm run dev    - Start full application",
        "  npm test       - Run test suite",
        "  npm run build  - Build for production",
        "",
        "🤖 Specialized Agents:",
        "  /claude-dev    - Development & Build",
        "  /claude-ui     - UI/UX Design",
        "  /claude-api    - API Integration",
        "  /claude-backtest - Strategy Testing",
        "  /claude-tester - Testing & QA",
        "",
        "Happy coding! 🎉"
    ])
    
    for line in status_lines:
        print(line, file=sys.stderr)
    
    sys.exit(0)

def check_project_health():
    """Check the health of the project"""
    health = {
        "backend_running": False,
        "dependencies_ok": True,
        "issues": []
    }
    
    # Check if backend is running
    try:
        import requests
        response = requests.get("http://localhost:8000/health", timeout=2)
        health["backend_running"] = response.status_code == 200
    except:
        health["issues"].append("Backend not responding on port 8000")
    
    # Check for package.json
    if not Path("package.json").exists():
        health["issues"].append("package.json not found")
        health["dependencies_ok"] = False
    
    # Check for node_modules
    if not Path("node_modules").exists():
        health["issues"].append("node_modules not found - run 'npm install'")
        health["dependencies_ok"] = False
    
    # Check for backend directory
    if not Path("backend").exists():
        health["issues"].append("Backend directory not found")
    
    # Check for .env file
    if not Path(".env").exists():
        health["issues"].append(".env file not found - API keys may be missing")
    
    # Check for ELEVENLABS_API_KEY
    if not os.getenv("ELEVENLABS_API_KEY"):
        health["issues"].append("ELEVENLABS_API_KEY not set in environment")
    
    # Check git status
    if Path(".git").exists():
        try:
            import subprocess
            result = subprocess.run(["git", "status", "--porcelain"], 
                                  capture_output=True, text=True)
            if result.stdout.strip():
                health["issues"].append("Uncommitted changes in git")
        except:
            pass
    
    return health

if __name__ == "__main__":
    main()