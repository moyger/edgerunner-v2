#!/usr/bin/env python3
"""
SubagentStop Hook
Exit code 2: Blocks stoppage, shows stderr to Claude subagent
"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))
from hook_utils import *

def main():
    logger = HookLogger("subagent_stop")
    tts = TTSManager()
    
    # Parse input
    data = parse_hook_input()
    agent_name = data.get("agent", "unknown")
    task_id = data.get("task_id", "unknown")
    completion_status = data.get("status", "unknown")
    reason = data.get("reason", "task_complete")
    
    logger.log("info", f"Subagent stop requested: {agent_name}", {
        "task_id": task_id,
        "status": completion_status,
        "reason": reason
    })
    
    # Check if agent has critical work in progress
    if has_critical_work(agent_name, task_id):
        logger.log("error", f"Critical work detected for agent {agent_name}")
        exit_with_message(
            2,  # Block stoppage
            f"⚠️ BLOCKED: Agent {agent_name} has critical work in progress.\n"
            f"Task ID: {task_id}\n"
            f"Please complete the current operation before stopping.",
            speak=True,
            voice="sam"
        )
    
    # Check for incomplete multi-step operations
    if is_multi_step_incomplete(agent_name, task_id):
        logger.log("warning", f"Multi-step operation incomplete for {agent_name}")
        exit_with_message(
            2,  # Block stoppage
            f"⚠️ BLOCKED: Multi-step operation incomplete for {agent_name}.\n"
            f"Stopping now may leave the project in an inconsistent state.\n"
            f"Please complete the current sequence or explicitly force stop.",
            speak=True,
            voice="adam"
        )
    
    # Agent-specific stop validation
    agent_validators = {
        "claude-dev": validate_dev_agent_stop,
        "claude-ui": validate_ui_agent_stop,
        "claude-api": validate_api_agent_stop,
        "claude-backtest": validate_backtest_agent_stop,
        "claude-tester": validate_tester_agent_stop,
    }
    
    validator = agent_validators.get(agent_name)
    if validator:
        should_block, block_reason = validator(data)
        if should_block:
            logger.log("error", f"Agent-specific validation failed: {block_reason}")
            exit_with_message(
                2,  # Block stoppage
                f"⚠️ BLOCKED: {block_reason}",
                speak=True,
                voice="sam"
            )
    
    # Handle different completion statuses - only announce major completions
    if completion_status == "error":
        logger.log("error", f"Agent {agent_name} stopping due to error")
        # Keep error notification
        tts.speak("Task failed", voice="sam", async_mode=True)
        
        # Save error state for debugging
        save_agent_state(agent_name, task_id, data, "error")
        
    elif completion_status == "success":
        logger.log("info", f"Agent {agent_name} completed successfully")
        # Announce major task completion
        tts.speak("Task completed", voice="bella", async_mode=True)
        
        # Clean up successful task artifacts
        cleanup_agent_artifacts(agent_name, task_id)
        
    # Silent for timeout, cancelled, and other statuses
    
    # Update agent metrics
    update_agent_metrics(agent_name, completion_status, task_id, data)
    
    # Success - allow agent to stop
    sys.exit(0)

def has_critical_work(agent_name: str, task_id: str) -> bool:
    """Check if agent has critical work that shouldn't be interrupted"""
    critical_markers = [
        f".claude/temp/{agent_name}_critical",
        f".claude/temp/{task_id}_critical",
        f".claude/temp/database_transaction_{agent_name}",
        f".claude/temp/file_operation_{agent_name}",
    ]
    
    return any(Path(marker).exists() for marker in critical_markers)

def is_multi_step_incomplete(agent_name: str, task_id: str) -> bool:
    """Check if multi-step operation is incomplete"""
    sequence_file = Path(f".claude/temp/{agent_name}_sequence_{task_id}.json")
    if not sequence_file.exists():
        return False
    
    try:
        sequence_data = json.loads(sequence_file.read_text())
        total_steps = sequence_data.get("total_steps", 0)
        completed_steps = sequence_data.get("completed_steps", 0)
        
        return completed_steps < total_steps
    except:
        return False

def validate_dev_agent_stop(data: Dict) -> tuple[bool, str]:
    """Validate stopping claude-dev agent"""
    # Check for running builds
    try:
        import subprocess
        result = subprocess.run(["pgrep", "-f", "vite"], capture_output=True)
        if result.returncode == 0:
            return True, "Build process still running - stop build first"
    except:
        pass
    
    return False, ""

def validate_ui_agent_stop(data: Dict) -> tuple[bool, str]:
    """Validate stopping claude-ui agent"""
    # Check for unsaved component work
    if Path(".claude/temp/component_draft").exists():
        return True, "Unsaved component work detected"
    
    return False, ""

def validate_api_agent_stop(data: Dict) -> tuple[bool, str]:
    """Validate stopping claude-api agent"""
    # Check for active API connections
    connection_file = Path(".claude/temp/active_connections.json")
    if connection_file.exists():
        try:
            connections = json.loads(connection_file.read_text())
            if connections.get("active", 0) > 0:
                return True, f"{connections['active']} API connections still active"
        except:
            pass
    
    return False, ""

def validate_backtest_agent_stop(data: Dict) -> tuple[bool, str]:
    """Validate stopping claude-backtest agent"""
    # Check for running backtests
    if Path(".claude/temp/backtest_running").exists():
        return True, "Backtest simulation in progress - may take time to complete"
    
    return False, ""

def validate_tester_agent_stop(data: Dict) -> tuple[bool, str]:
    """Validate stopping claude-tester agent"""
    # Check for running tests
    try:
        import subprocess
        result = subprocess.run(["pgrep", "-f", "vitest"], capture_output=True)
        if result.returncode == 0:
            return True, "Test suite still running"
    except:
        pass
    
    return False, ""

def save_agent_state(agent_name: str, task_id: str, data: Dict, status: str):
    """Save agent state for debugging"""
    state_dir = Path(f".claude/agent_states/{agent_name}")
    state_dir.mkdir(parents=True, exist_ok=True)
    
    state_file = state_dir / f"{task_id}_{status}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    state_file.write_text(json.dumps(data, indent=2))

def cleanup_agent_artifacts(agent_name: str, task_id: str):
    """Clean up temporary artifacts from successful agent runs"""
    cleanup_patterns = [
        f".claude/temp/{agent_name}_*",
        f".claude/temp/{task_id}_*",
    ]
    
    import glob
    for pattern in cleanup_patterns:
        for file_path in glob.glob(pattern):
            try:
                Path(file_path).unlink()
            except:
                pass

def update_agent_metrics(agent_name: str, status: str, task_id: str, data: Dict):
    """Update agent performance metrics"""
    metrics_file = Path(".claude/metrics/agent_metrics.json")
    metrics_file.parent.mkdir(parents=True, exist_ok=True)
    
    # Load existing metrics
    try:
        metrics = json.loads(metrics_file.read_text()) if metrics_file.exists() else {}
    except:
        metrics = {}
    
    # Initialize agent metrics if not exists
    if agent_name not in metrics:
        metrics[agent_name] = {
            "total_tasks": 0,
            "successful_tasks": 0,
            "failed_tasks": 0,
            "cancelled_tasks": 0,
            "total_runtime": 0,
            "last_activity": None
        }
    
    # Update metrics
    agent_metrics = metrics[agent_name]
    agent_metrics["total_tasks"] += 1
    agent_metrics["last_activity"] = datetime.now().isoformat()
    
    if status == "success":
        agent_metrics["successful_tasks"] += 1
    elif status == "error":
        agent_metrics["failed_tasks"] += 1
    elif status == "cancelled":
        agent_metrics["cancelled_tasks"] += 1
    
    # Update runtime if available
    runtime = data.get("runtime_seconds", 0)
    if runtime:
        agent_metrics["total_runtime"] += runtime
    
    # Save metrics
    try:
        metrics_file.write_text(json.dumps(metrics, indent=2))
    except:
        pass

if __name__ == "__main__":
    main()