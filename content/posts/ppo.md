---
title: PPO Explain for beginners
slug: ppo-explain-for-beginners
createdAt: 2026-05-12
updatedAt: 2026-05-16
tags: [AI, RL, MachineLearning, GPU]
summary: A beginner-friendly breakdown of Proximal Policy Optimization — the RL algorithm that turned raw base models into useful AI assistants. Covers the core stability intuition, the clipped surrogate objective, and why running an Actor and Critic simultaneously pushes your GPU to its limits.
excerpt: A beginner-friendly breakdown of Proximal Policy Optimization — the RL algorithm that turned raw base models into useful AI assistants.
---

**Thesis:** Proximal Policy Optimization (PPO) is an RL algorithm that uses a secondary model to grade policy updates. The goal is to steer a model towards better output while preventing drastic, performance-crushing shifts.

## Core Intuition

At its core, PPO is about stability. In standard RL, if a model discovers an optimal path, it might try to rewrite its entire logic to follow that specific path. You may think this is good at first, but it often leads to over-optimization and the collapse of diverse paths.

I compare it to learning how to swing a golf club. If you happen to hit a single, beautiful 300-yard drive, you don't suddenly reinvent your entire stance, grip, and swing mechanics from scratch to try and replicate it. If you did, you'd completely wreck the foundational mechanics you've already built. Instead, you make tiny, incremental adjustments to your existing form through careful trial and error.

In short, PPO cares about stability and introduces a "safety harness" to protect the model from over-correcting on a single good run.

## The Math Under The Hood

Understanding the general purpose of PPO helps us unpack the math underneath. Now we have to play a little bit of a decoding game to see what each Greek symbol means, and how this relates to PPO's overall goal of stability.

The core math behind PPO relies on the Clipped Surrogate Objective function:

$$L^{CLIP}(\theta) = \hat{\mathbb{E}}_t \left[ \min(r_t(\theta)\hat{A}_t, \text{clip}(r_t(\theta), 1-\epsilon, 1+\epsilon)\hat{A}_t) \right]$$

Let's translate this dense math into natural English:

- $\theta$ **(Theta):** The current weights/parameters of the model we are training.
- $r_t(\theta)$ **(Probability Ratio):** The ratio between your new policy and your old policy.
- $\hat{A}_t$ **(Advantage Estimate):** A metric that tells us how much better a specific action was compared to what the model expected to happen.
- $\text{clip}$ & $\epsilon$ **(Epsilon):** The safety harness. $\epsilon$ is usually a small number like $0.1$ or $0.2$. The clip function forces the ratio to stay between $1 - \epsilon$ and $1 + \epsilon$.

I like to take a few minutes to try and parse through the dense math before moving on. PPO looks closely at that probability ratio, $r_t(\theta)$. If the ratio is 1, nothing has changed. If $\text{new policy} / \text{old policy} = 2$, the action is twice as likely now.

For developing intuition, my math teacher used to substitute large numbers into equations to help us understand. We can do the same here. If our new policy has a HUGE number that increases our probability of taking an action, compared to our much smaller old policy, then intuitively we know $\text{LARGE} / \text{SMALL} = \text{a larger number}$. Always greater than 0 at least.

This ratio tells us how much things changed, but we multiply it by the Advantage ($\hat{A}_t$) to determine if that change was actually a good move.

Now, at this point you might be thinking: isn't PPO about stability? If we have these LARGE numbers, wouldn't that cause drastic changes? Yes, it absolutely would. So that is why we introduce the Clipping Technique. All this does is truncate the ratio if it gets too high or too low, keeping our updates within a safe, predictable "trust region."

## Computing Efficiency

As a person who finds how this math translates to how code actually runs on hardware deeply interesting, I want to explore this a bit. PPO is computationally expensive compared to newer policy update methods like GRPO (Group Relative Policy Optimization). Why?

To do these policy evaluations, PPO requires a second, completely separate "critic" model alongside the main "actor" model. VRAM (Video RAM), which is already heavily contested in ML workloads, is pushed to its limits by introducing this second model to update weights.

Does this mean more HBM transfers and PCIe bus congestion?

Absolutely. Because you are maintaining two massive networks (Actor and Critic) simultaneously, your GPU's High Bandwidth Memory (HBM) is constantly working overtime to shuffle activations, weights, and gradients back and forth during the backward pass.

### The CPU-GPU Dance in PPO

To understand the bottleneck, look at how the CPU and GPU interact during PPO:

1. **The Generation Phase (Rollout):** The GPU runs the Actor model to generate text or actions. These trajectories are stored in VRAM.
2. **The Evaluation Phase:** The Critic model evaluates those exact same trajectories to calculate the expected "value" of each step.
3. **The Bottleneck:** If both models cannot comfortably fit into your GPU's VRAM alongside the massive optimizer states (like AdamW, which requires $4\times$ the memory of the model weights themselves), data must be swapped out to system RAM. This forces massive chunks of data across the PCIe bus. Because PCIe lanes are drastically slower than on-chip HBM, your expensive GPUs end up idling and spend time waiting for data.

## Why We Still Talk About It

PPO is not some archaic algorithm. It is actually a massive milestone that helped pave the way for more efficient modern architectures. It was the primary tool that took "raw," unpredictable base models and gave them the ability to follow instructions, respect guardrails, and act as useful assistants. PPO paved the path for the advanced reasoning models we use today, and its focus on stable learning remains a big concept in AI alignment.
