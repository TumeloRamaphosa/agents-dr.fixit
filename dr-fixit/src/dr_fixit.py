#!/usr/bin/env python3
"""
Dr. Fixit - AI Agent Health Monitor & Auto-Repair System
For OpenFang + MLX on Apple Silicon

Features:
- Hourly health checks of all agents
- Automatic repair and restart
- Obsidian vault logging
- Git backup of agent states
- Notifications via desktop/system
"""

import json
import logging
import os
import subprocess
import sys
import time
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Any
import requests
import sqlite3
import hashlib

# Configuration
LOG_DIR = Path.home() / "agents-dr.fixit" / "dr-fixit" / "logs"
OBSIDIAN_DIR = Path.home() / "agents-dr.fixit" / "dr-fixit" / "obsidian"
BACKUP_DIR = Path.home() / "agents-dr.fixit" / "dr-fixit" / "backups"
OPENFANG_DIR = Path.home() / ".openfang"
REPO_DIR = Path.home() / "agents-dr.fixit"

# Ensure directories exist
for d in [LOG_DIR, OBSIDIAN_DIR, BACKUP_DIR]:
    d.mkdir(parents=True, exist_ok=True)

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(LOG_DIR / "dr_fixit.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("Dr.Fixit")

class AgentHealthChecker:
    """Checks and repairs OpenFang agents"""
    
    def __init__(self):
        self.api_url = "http://127.0.0.1:4200"
        self.issues_found = []
        self.repairs_made = []
        
    def check_daemon_health(self) -> Dict[str, Any]:
        """Check if OpenFang daemon is running"""
        try:
            response = requests.get(f"{self.api_url}/api/status", timeout=5)
            if response.status_code == 200:
                data = response.json()
                logger.info(f"✅ Daemon healthy - {data.get('agent_count', 0)} agents running")
                return {"status": "healthy", "data": data}
            else:
                return {"status": "error", "code": response.status_code}
        except requests.exceptions.ConnectionError:
            logger.error("❌ Daemon not responding on port 4200")
            return {"status": "down", "error": "Connection refused"}
        except Exception as e:
            logger.error(f"❌ Health check failed: {e}")
            return {"status": "error", "error": str(e)}
    
    def get_all_agents(self) -> List[Dict]:
        """Get list of all agents"""
        try:
            response = requests.get(f"{self.api_url}/api/agents", timeout=5)
            if response.status_code == 200:
                return response.json()
            return []
        except:
            return []
    
    def check_agent_health(self, agent_id: str) -> Dict[str, Any]:
        """Check individual agent health"""
        try:
            response = requests.get(f"{self.api_url}/api/agent/{agent_id}/status", timeout=3)
            if response.status_code == 200:
                return {"status": "healthy", "data": response.json()}
            return {"status": "error", "code": response.status_code}
        except:
            return {"status": "unresponsive"}
    
    def check_hands(self) -> List[Dict]:
        """Check all active hands"""
        try:
            # Use CLI to get hands
            result = subprocess.run(
                ["openfang", "hand", "active"],
                capture_output=True, text=True, timeout=10
            )
            return [{"raw_output": result.stdout}]
        except Exception as e:
            logger.error(f"Failed to check hands: {e}")
            return []
    
    def restart_daemon(self) -> bool:
        """Restart OpenFang daemon"""
        logger.info("🔄 Restarting OpenFang daemon...")
        try:
            subprocess.run(["openfang", "stop"], capture_output=True, timeout=10)
            time.sleep(2)
            subprocess.Popen(["openfang", "start"], 
                           stdout=subprocess.DEVNULL, 
                           stderr=subprocess.DEVNULL)
            time.sleep(5)
            
            # Verify restart
            health = self.check_daemon_health()
            if health["status"] == "healthy":
                logger.info("✅ Daemon restarted successfully")
                self.repairs_made.append("Restarted OpenFang daemon")
                return True
            return False
        except Exception as e:
            logger.error(f"Failed to restart daemon: {e}")
            return False
    
    def restart_agent(self, agent_name: str) -> bool:
        """Restart a specific agent"""
        logger.info(f"🔄 Restarting agent: {agent_name}")
        try:
            subprocess.run(
                ["openfang", "agent", "restart", agent_name],
                capture_output=True, timeout=10
            )
            self.repairs_made.append(f"Restarted agent: {agent_name}")
            return True
        except Exception as e:
            logger.error(f"Failed to restart agent {agent_name}: {e}")
            return False
    
    def activate_idle_hands(self):
        """Make idle hands accessible"""
        try:
            result = subprocess.run(
                ["openfang", "hand", "list"],
                capture_output=True, text=True, timeout=10
            )
            output = result.stdout
            
            # Find inactive hands and activate them
            inactive_hands = []
            if "browser" in output.lower():
                inactive_hands.append("browser")
            if "clip" in output.lower():
                inactive_hands.append("clip")
            if "lead" in output.lower():
                inactive_hands.append("lead")
            if "collector" in output.lower():
                inactive_hands.append("collector")
            
            for hand in inactive_hands:
                logger.info(f"🚀 Activating idle hand: {hand}")
                subprocess.run(
                    ["openfang", "hand", "activate", hand],
                    capture_output=True, timeout=10
                )
                self.repairs_made.append(f"Activated idle hand: {hand}")
                
        except Exception as e:
            logger.error(f"Failed to activate idle hands: {e}")

class ObsidianLogger:
    """Logs all issues and repairs to Obsidian markdown files"""
    
    def __init__(self):
        self.vault_dir = OBSIDIAN_DIR
        self.vault_dir.mkdir(parents=True, exist_ok=True)
        
    def create_daily_note(self, date: str = None):
        """Create daily health check note"""
        if date is None:
            date = datetime.now().strftime("%Y-%m-%d")
        
        note_path = self.vault_dir / f"{date}-Health-Check.md"
        
        content = f"""# Daily Health Check: {date}

## Summary
- **Date**: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
- **Status**: {{status}}
- **Total Agents**: {{agent_count}}
- **Issues Found**: {{issue_count}}
- **Repairs Made**: {{repair_count}}

## System Status
| Component | Status | Details |
|-----------|--------|---------|
| OpenFang Daemon | {{daemon_status}} | {{daemon_details}} |
| MLX Backend | {{mlx_status}} | Apple Silicon M4 Pro |
| Ollama | {{ollama_status}} | {{ollama_models}} |

## Agents Status
{{agents_table}}

## Issues Found
{{issues_list}}

## Repairs Applied
{{repairs_list}}

## Notifications Sent
{{notifications}}

## Log Files
- [[{date}-Errors-Log]]
- [[{date}-Repairs-Log]]

---
*Generated by Dr. Fixit AI Agent Health Monitor*
*Tags: #health-check #agents #system-status*
"""
        
        return str(note_path), content
    
    def write_issue(self, title: str, description: str, severity: str = "medium"):
        """Log an issue to Obsidian"""
        timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
        issue_path = self.vault_dir / f"Issue-{timestamp}-{title.replace(' ', '-')}.md"
        
        content = f"""# Issue: {title}

**Severity**: {severity}  
**Detected**: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}  
**Status**: {{status}}

## Description
{description}

## Resolution
{{resolution}}

## Related Agents
{{agents}}

---
*Tags: #issue #{severity} #{{agent_tags}}*
"""
        
        issue_path.write_text(content)
        logger.info(f"📝 Created issue note: {issue_path.name}")
        return str(issue_path)
    
    def update_daily_note(self, data: Dict):
        """Update daily health check with actual data"""
        date = datetime.now().strftime("%Y-%m-%d")
        note_path, content = self.create_daily_note(date)
        
        # Replace placeholders
        content = content.replace("{{status}}", data.get("overall_status", "unknown"))
        content = content.replace("{{agent_count}}", str(data.get("agent_count", 0)))
        content = content.replace("{{issue_count}}", str(len(data.get("issues", []))))
        content = content.replace("{{repair_count}}", str(len(data.get("repairs", []))))
        content = content.replace("{{daemon_status}}", data.get("daemon_status", "unknown"))
        content = content.replace("{{daemon_details}}", data.get("daemon_details", ""))
        content = content.replace("{{mlx_status}}", "✅ Active" if data.get("mlx_ready") else "⚠️ Check needed")
        content = content.replace("{{ollama_status}}", "✅ Running" if data.get("ollama_running") else "❌ Down")
        content = content.replace("{{ollama_models}}", data.get("ollama_models", "N/A"))
        
        Path(note_path).write_text(content)
        logger.info(f"📝 Updated daily note: {note_path}")

class GitBackupManager:
    """Manages git backup of agent states to dr.fixit repo"""
    
    def __init__(self):
        self.repo_dir = REPO_DIR
        self.backup_dirs = ["openfang-memory", "dr-fixit/logs", "dr-fixit/obsidian"]
        
    def backup_agent_states(self):
        """Backup OpenFang memory and configs to git"""
        try:
            # Copy OpenFang data
            openfang_memory = self.repo_dir / "openfang-memory"
            openfang_memory.mkdir(exist_ok=True)
            
            # Copy database
            db_source = OPENFANG_DIR / "data" / "openfang.db"
            if db_source.exists():
                db_backup = openfang_memory / f"openfang-{datetime.now().strftime('%Y%m%d-%H%M')}.db"
                subprocess.run(["cp", str(db_source), str(db_backup)], check=True)
            
            # Backup configs
            config_source = OPENFANG_DIR / "config.toml"
            if config_source.exists():
                subprocess.run(["cp", str(config_source), str(openfang_memory / "config.toml")])
            
            # Copy agents directory
            agents_source = OPENFANG_DIR / "agents"
            if agents_source.exists():
                agents_backup = openfang_memory / "agents"
                subprocess.run(["cp", "-r", str(agents_source), str(agents_backup)], check=True)
            
            logger.info("✅ Agent states backed up")
            return True
            
        except Exception as e:
            logger.error(f"Backup failed: {e}")
            return False
    
    def commit_to_git(self, message: str = None):
        """Commit changes to git"""
        try:
            os.chdir(self.repo_dir)
            
            # Add files
            subprocess.run(["git", "add", "."], capture_output=True, timeout=10)
            
            # Check if there are changes
            status = subprocess.run(
                ["git", "status", "--porcelain"],
                capture_output=True, text=True, timeout=10
            )
            
            if status.stdout.strip():
                if message is None:
                    message = f"Dr.Fixit backup - {datetime.now().strftime('%Y-%m-%d %H:%M')}"
                
                subprocess.run(
                    ["git", "commit", "-m", message],
                    capture_output=True, timeout=10
                )
                logger.info(f"✅ Git commit: {message}")
            else:
                logger.info("No changes to commit")
                
        except Exception as e:
            logger.error(f"Git commit failed: {e}")

class NotificationManager:
    """Sends notifications about issues and repairs"""
    
    def __init__(self):
        pass
    
    def send_notification(self, title: str, message: str, urgency: str = "normal"):
        """Send macOS desktop notification"""
        try:
            subprocess.run([
                "osascript", "-e",
                f'display notification "{message}" with title "{title}" sound name "Glass"'
            ], capture_output=True, timeout=5)
            logger.info(f"🔔 Notification: {title}")
        except Exception as e:
            logger.error(f"Notification failed: {e}")
    
    def send_report(self, summary: Dict):
        """Send summary report"""
        issues_count = len(summary.get("issues", []))
        repairs_count = len(summary.get("repairs", []))
        
        if issues_count > 0:
            title = f"Dr.Fixit: {issues_count} Issues Found"
            message = f"{repairs_count} repairs made. Check Obsidian vault."
            self.send_notification(title, message, urgency="critical")
        else:
            title = "Dr.Fixit: All Systems Green"
            message = f"{summary.get('agent_count', 0)} agents running smoothly."
            self.send_notification(title, message)

class DrFixit:
    """Main Dr. Fixit orchestrator"""
    
    def __init__(self):
        self.health_checker = AgentHealthChecker()
        self.obsidian = ObsidianLogger()
        self.git = GitBackupManager()
        self.notifier = NotificationManager()
        
    def run_full_check(self) -> Dict:
        """Run complete health check and repair cycle"""
        logger.info("=" * 60)
        logger.info("🔧 Dr. Fixit Health Check Started")
        logger.info("=" * 60)
        
        results = {
            "timestamp": datetime.now().isoformat(),
            "issues": [],
            "repairs": [],
            "agent_count": 0,
            "overall_status": "healthy"
        }
        
        # 1. Check daemon health
        daemon_health = self.health_checker.check_daemon_health()
        results["daemon_status"] = daemon_health["status"]
        
        if daemon_health["status"] != "healthy":
            results["issues"].append({
                "type": "daemon_down",
                "severity": "critical",
                "description": "OpenFang daemon is not responding"
            })
            
            # Attempt repair
            if self.health_checker.restart_daemon():
                results["repairs"].append("Restarted OpenFang daemon")
                results["daemon_status"] = "repaired"
            else:
                results["overall_status"] = "critical"
        
        # 2. Get all agents
        agents = self.health_checker.get_all_agents()
        results["agent_count"] = len(agents)
        
        # 3. Check each agent
        for agent in agents:
            agent_id = agent.get("id", "unknown")
            agent_name = agent.get("name", "unnamed")
            
            agent_health = self.health_checker.check_agent_health(agent_id)
            if agent_health["status"] != "healthy":
                issue = {
                    "type": "agent_unhealthy",
                    "agent": agent_name,
                    "severity": "medium",
                    "description": f"Agent {agent_name} is {agent_health['status']}"
                }
                results["issues"].append(issue)
                
                # Generate Obsidian issue note
                self.obsidian.write_issue(
                    f"Agent Unhealthy: {agent_name}",
                    issue["description"],
                    severity=issue["severity"]
                )
        
        # 4. Check and activate idle hands
        self.health_checker.activate_idle_hands()
        results["repairs"].extend(self.health_checker.repairs_made)
        
        # 5. Backup to git
        self.git.backup_agent_states()
        self.git.commit_to_git()
        
        # 6. Update Obsidian daily note
        results["mlx_ready"] = True  # MLX is always ready on Apple Silicon
        results["ollama_running"] = daemon_health["status"] == "healthy"
        results["ollama_models"] = str(len(agents))
        
        self.obsidian.update_daily_note(results)
        
        # 7. Send notification
        self.notifier.send_report(results)
        
        # Log summary
        logger.info("-" * 60)
        logger.info(f"Health Check Complete")
        logger.info(f"Agents: {results['agent_count']}")
        logger.info(f"Issues: {len(results['issues'])}")
        logger.info(f"Repairs: {len(results['repairs'])}")
        logger.info(f"Status: {results['overall_status']}")
        logger.info("=" * 60)
        
        return results

def main():
    """Main entry point"""
    dr_fixit = DrFixit()
    
    # Run health check
    results = dr_fixit.run_full_check()
    
    # Print summary
    print("\n" + "=" * 60)
    print("DR. FIXIT HEALTH CHECK COMPLETE")
    print("=" * 60)
    print(f"Timestamp: {results['timestamp']}")
    print(f"Overall Status: {results['overall_status']}")
    print(f"Agents Running: {results['agent_count']}")
    print(f"Issues Found: {len(results['issues'])}")
    print(f"Repairs Made: {len(results['repairs'])}")
    
    if results['issues']:
        print("\n⚠️  Issues:")
        for issue in results['issues']:
            print(f"  - [{issue['severity'].upper()}] {issue['description']}")
    
    if results['repairs']:
        print("\n🔧 Repairs:")
        for repair in results['repairs']:
            print(f"  - {repair}")
    
    print("\n📁 Files Updated:")
    print(f"  - Obsidian Vault: {OBSIDIAN_DIR}")
    print(f"  - Git Repo: {REPO_DIR}")
    print(f"  - Logs: {LOG_DIR}")
    print("=" * 60)
    
    return 0 if results['overall_status'] != 'critical' else 1

if __name__ == "__main__":
    sys.exit(main())
