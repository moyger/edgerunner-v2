#!/usr/bin/env python3
"""
Claude Code Hook Utilities
Shared utilities for all hook scripts including ElevenLabs TTS integration
"""

import os
import sys
import json
import tempfile
import subprocess
import platform
import time
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, Any
import requests
from dotenv import load_dotenv

# Load environment variables from project root
project_root = Path(__file__).parent.parent.parent
env_file = project_root / ".env"
load_dotenv(env_file)

# ElevenLabs configuration
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1"

# Voice configurations for different scenarios
VOICES = {
    "rachel": "21m00Tcm4TlvDq8ikWAM",    # Default female voice
    "adam": "pNInz6obpgDQGcFmaJgB",      # Male voice for warnings
    "bella": "EXAVITQu4vr4xnSDxMaL",     # Female voice for notifications
    "sam": "yoZ06aMxZJJ28mfd3POQ",       # Male voice for errors
}

class HookLogger:
    """Logger for hook events"""
    def __init__(self, hook_name: str):
        self.hook_name = hook_name
        self.log_dir = Path(".claude/logs")
        self.log_dir.mkdir(parents=True, exist_ok=True)
        self.log_file = self.log_dir / "hooks.log"
    
    def log(self, level: str, message: str, data: Dict = None):
        """Log an event"""
        timestamp = datetime.now().isoformat()
        log_entry = {
            "timestamp": timestamp,
            "hook": self.hook_name,
            "level": level,
            "message": message
        }
        if data:
            log_entry["data"] = data
        
        try:
            with open(self.log_file, "a") as f:
                f.write(json.dumps(log_entry) + "\n")
        except Exception as e:
            print(f"Failed to log: {e}", file=sys.stderr)

class TTSManager:
    """Manages ElevenLabs TTS functionality"""
    def __init__(self, api_key: str = None):
        self.api_key = api_key or ELEVENLABS_API_KEY
        self.headers = {
            "Accept": "audio/mpeg",
            "Content-Type": "application/json",
            "xi-api-key": self.api_key
        } if self.api_key else None
    
    def speak(self, text: str, voice: str = "rachel", async_mode: bool = True) -> bool:
        """Generate and play TTS"""
        # Use macOS say command directly for reliability
        if platform.system() == "Darwin":
            try:
                if async_mode:
                    # Run in background without blocking
                    subprocess.Popen(["say", text], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                else:
                    subprocess.run(["say", text], capture_output=True)
                return True
            except:
                pass
        
        # Fallback to ElevenLabs if not on macOS and API key is available
        if self.api_key:
            voice_id = VOICES.get(voice, VOICES["rachel"])
            audio_data = self._generate_speech(text, voice_id)
            
            if audio_data:
                if async_mode:
                    # Play audio in background
                    subprocess.Popen(
                        [sys.executable, "-c", 
                         f"import sys; sys.path.insert(0, '{os.path.dirname(__file__)}'); "
                         f"from hook_utils import TTSManager; "
                         f"TTSManager()._play_audio_sync({repr(audio_data)})"],
                        stdout=subprocess.DEVNULL,
                        stderr=subprocess.DEVNULL
                    )
                else:
                    self._play_audio_sync(audio_data)
                return True
        
        return False
    
    def _generate_speech(self, text: str, voice_id: str) -> Optional[bytes]:
        """Generate speech from text"""
        url = f"{ELEVENLABS_API_URL}/text-to-speech/{voice_id}"
        
        data = {
            "text": text,
            "model_id": "eleven_monolingual_v1",
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.5,
                "style": 0.0,
                "use_speaker_boost": True
            }
        }
        
        try:
            response = requests.post(url, json=data, headers=self.headers, timeout=5)
            response.raise_for_status()
            return response.content
        except Exception:
            return None
    
    def _play_audio_sync(self, audio_data: bytes):
        """Play audio synchronously"""
        try:
            with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tmp_file:
                tmp_file.write(audio_data)
                tmp_path = tmp_file.name
            
            system = platform.system()
            try:
                if system == "Darwin":  # macOS
                    subprocess.run(["afplay", tmp_path], check=True, capture_output=True)
                elif system == "Linux":
                    for player in ["mpg123", "play", "ffplay"]:
                        try:
                            subprocess.run([player, tmp_path], check=True, capture_output=True)
                            break
                        except (subprocess.CalledProcessError, FileNotFoundError):
                            continue
                elif system == "Windows":
                    subprocess.run(
                        ["powershell", "-c", f"(New-Object Media.SoundPlayer '{tmp_path}').PlaySync()"],
                        check=True, capture_output=True
                    )
            finally:
                try:
                    os.unlink(tmp_path)
                except:
                    pass
        except Exception:
            pass

class HookValidator:
    """Validates hook conditions and permissions"""
    
    @staticmethod
    def is_dangerous_command(command: str) -> bool:
        """Check if a command is potentially dangerous"""
        dangerous_patterns = [
            "rm -rf /",
            "sudo rm",
            "format",
            "del /s /q",
            "shutdown",
            "reboot",
            "> /dev/sda",
            "dd if=/dev/zero",
            "fork bomb",
            ":(){ :|:& };:",
        ]
        command_lower = command.lower()
        return any(pattern in command_lower for pattern in dangerous_patterns)
    
    @staticmethod
    def is_production_file(file_path: str) -> bool:
        """Check if file is in production/critical directory"""
        critical_paths = [
            "/etc/",
            "/usr/bin/",
            "/System/",
            "node_modules/",
            ".git/",
            "dist/",
            "build/",
        ]
        return any(path in file_path for path in critical_paths)
    
    @staticmethod
    def is_after_hours() -> bool:
        """Check if current time is after working hours"""
        current_hour = datetime.now().hour
        return current_hour < 9 or current_hour > 18
    
    @staticmethod
    def check_rate_limit(hook_name: str, limit_seconds: int = 1) -> bool:
        """Check if hook is being called too frequently"""
        rate_limit_file = Path(f".claude/temp/{hook_name}_last_call")
        rate_limit_file.parent.mkdir(parents=True, exist_ok=True)
        
        try:
            if rate_limit_file.exists():
                last_call = float(rate_limit_file.read_text())
                if time.time() - last_call < limit_seconds:
                    return False
            
            rate_limit_file.write_text(str(time.time()))
            return True
        except:
            return True

def parse_hook_input() -> Dict[str, Any]:
    """Parse input from stdin or arguments"""
    data = {}
    
    # Try to read from stdin
    if not sys.stdin.isatty():
        try:
            stdin_data = sys.stdin.read()
            if stdin_data:
                data = json.loads(stdin_data)
        except:
            pass
    
    # Add command line arguments
    if len(sys.argv) > 1:
        data["args"] = sys.argv[1:]
    
    # Add environment context
    data["env"] = {
        "cwd": os.getcwd(),
        "user": os.getenv("USER", "unknown"),
        "timestamp": datetime.now().isoformat()
    }
    
    return data

def exit_with_message(code: int, message: str, speak: bool = True, voice: str = "rachel"):
    """Exit with a specific code and optionally speak message"""
    if speak and ELEVENLABS_API_KEY:
        tts = TTSManager()
        tts.speak(message, voice=voice, async_mode=(code == 0))
    
    if code == 2:
        # Exit code 2 - message goes to stderr
        print(message, file=sys.stderr)
    
    sys.exit(code)