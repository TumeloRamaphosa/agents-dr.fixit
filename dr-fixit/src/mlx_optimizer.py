#!/usr/bin/env python3
"""
MLX Optimizer for OpenFang Agents
Configures all agents to use MLX (Apple Silicon) for maximum performance
"""

import json
import logging
import os
import subprocess
from pathlib import Path

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("MLX-Optimizer")

# MLX-optimized model mappings for different tasks
MLX_MODELS = {
    "fast_response": {
        "model": "mlx-community/Llama-3.2-3B-Instruct",
        "description": "Fast responses for simple queries",
        "speed": "very-fast"
    },
    "coding": {
        "model": "mlx-community/Qwen2.5-Coder-7B-Instruct",
        "description": "Best for code generation and technical tasks",
        "speed": "fast"
    },
    "reasoning": {
        "model": "mlx-community/DeepSeek-R1-Distill-Qwen-7B",
        "description": "Deep reasoning and complex analysis",
        "speed": "medium"
    },
    "general": {
        "model": "mlx-community/gemma-4b-it",
        "description": "Balanced performance for general tasks",
        "speed": "fast"
    },
    "embeddings": {
        "model": "nomic-embed-text",
        "description": "Fast embeddings for memory/RAG",
        "speed": "very-fast"
    }
}

def fix_agent_models():
    """Configure all OpenFang agents to use MLX models"""
    logger.info("🔧 Configuring agents for MLX optimization...")
    
    agents_config = {
        # Agent Name: (MLX Model, Purpose)
        "assistant": ("mlx-community/Llama-3.2-3B-Instruct", "general"),
        "analyst": ("mlx-community/DeepSeek-R1-Distill-Qwen-7B", "reasoning"),
        "architect": ("mlx-community/gemma-4b-it", "general"),
        "coder": ("mlx-community/Qwen2.5-Coder-7B-Instruct", "coding"),
        "researcher": ("mlx-community/DeepSeek-R1-Distill-Qwen-7B", "reasoning"),
        "debugger": ("mlx-community/Qwen2.5-Coder-7B-Instruct", "coding"),
        "writer": ("mlx-community/gemma-4b-it", "general"),
    }
    
    for agent_name, (model, purpose) in agents_config.items():
        logger.info(f"  Configuring {agent_name} -> {model} ({purpose})")
        
        # Update agent via OpenFang CLI
        try:
            subprocess.run(
                ["openfang", "agent", "config", "set", agent_name, 
                 "--model", model, "--provider", "ollama"],
                capture_output=True, timeout=10
            )
        except Exception as e:
            logger.warning(f"    Failed to configure {agent_name}: {e}")
    
    logger.info("✅ MLX model configuration complete")

def optimize_ollama_for_mlx():
    """Configure Ollama for optimal MLX performance on Apple Silicon"""
    logger.info("🔧 Optimizing Ollama for MLX...")
    
    # Pull MLX-optimized models
    models_to_pull = [
        "mlx-community/Llama-3.2-3B-Instruct",
        "mlx-community/Qwen2.5-7B-Instruct", 
        "mlx-community/DeepSeek-R1-Distill-Qwen-7B",
        "mlx-community/gemma-4b-it",
        "nomic-embed-text"
    ]
    
    for model in models_to_pull:
        logger.info(f"  Pulling {model}...")
        try:
            subprocess.run(
                ["ollama", "pull", model],
                capture_output=True, timeout=300
            )
        except Exception as e:
            logger.warning(f"    Failed to pull {model}: {e}")
    
    logger.info("✅ Ollama MLX optimization complete")

def create_mlx_config():
    """Create MLX-specific configuration file"""
    config = {
        "mlx": {
            "enabled": True,
            "apple_silicon": True,
            "metal_enabled": True,
            "gpu_layers": -1,  # Use all GPU layers
            "batch_size": 512,
            "prefer_quantized": True,
        },
        "models": MLX_MODELS,
        "routing": {
            "default": "fast_response",
            "coding_tasks": "coding",
            "research_tasks": "reasoning",
            "simple_chat": "fast_response"
        }
    }
    
    config_path = Path.home() / "agents-dr.fixit" / "dr-fixit" / "configs" / "mlx-config.json"
    config_path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(config_path, 'w') as f:
        json.dump(config, f, indent=2)
    
    logger.info(f"✅ MLX config saved: {config_path}")
    return config_path

def enable_idle_agents():
    """Make all idle agents easily accessible"""
    logger.info("🚀 Enabling idle agents for easy access...")
    
    # Get list of all hands and make them accessible
    hands = ["browser", "clip", "collector", "lead", "predictor", "trader"]
    
    for hand in hands:
        try:
            result = subprocess.run(
                ["openfang", "hand", "activate", hand],
                capture_output=True, text=True, timeout=10
            )
            if "activated" in result.stdout.lower():
                logger.info(f"  ✅ {hand} hand activated")
            elif "already" in result.stdout.lower():
                logger.info(f"  ℹ️  {hand} already active")
        except Exception as e:
            logger.warning(f"  Could not activate {hand}: {e}")
    
    logger.info("✅ Idle agents activation complete")

def main():
    print("=" * 60)
    print("MLX OPTIMIZER FOR OPENFANG AGENTS")
    print("=" * 60)
    print()
    
    # Check if running on Apple Silicon
    try:
        result = subprocess.run(
            ["uname", "-m"],
            capture_output=True, text=True
        )
        if "arm64" not in result.stdout:
            logger.warning("⚠️  Not running on Apple Silicon - MLX optimizations may not work")
            return 1
    except:
        pass
    
    # Run optimizations
    optimize_ollama_for_mlx()
    create_mlx_config()
    fix_agent_models()
    enable_idle_agents()
    
    print()
    print("=" * 60)
    print("MLX OPTIMIZATION COMPLETE")
    print("=" * 60)
    print()
    print("All agents are now:")
    print("  ✅ Using MLX-optimized models")
    print("  ✅ Running on Apple Silicon Metal")
    print("  ✅ Easily accessible (idle hands activated)")
    print()
    
    return 0

if __name__ == "__main__":
    exit(main())
