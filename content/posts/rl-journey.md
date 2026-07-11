---
title: "Why I Am Studying Classic Reinforcement Learning Now"
slug: rl-journey
excerpt: "Modern AI is rediscovering old reinforcement learning problems: reward design, credit assignment, exploration, evaluation, and learning from feedback."
status: idea
createdAt: 2026-07-08
publishedAt: 2026-07-08
updatedAt: 2026-07-08
tags: [AI, RL, RLVR, Reinforcement Learning]
summary: "A personal argument for studying classic reinforcement learning before chasing every new post-training trend."
---

**Thesis:** Modern AI involves classic reinforcement learning problems all the way back from the 1960's. The vocabulary has changed, but many of the hard problems are old. Specifically reward design, exploration, credit assignment, evaluation, and learning from feedback.

The current frontier does not look like the reinforcement learning I first associated with Atari, MuJoCo, robotics, or AlphaGo. Today people talk about RLHF, RLAIF, RLVR, reasoning models, coding agents, verifiers, tool use, and post-training.

But underneath the new words, the old questions still remain.

- What should the model optimize?
- How do we define a useful reward?
- How do we know whether the system is actually improving?
- How do we avoid reward hacking?
- How do we assign credit across long chains of reasoning or action?

The classic RL loop makes this concrete. An agent observes a state, takes an action, receives reward, and changes the environment.

![Classic reinforcement learning loop with agent, environment, action, state, and reward](/blog/rl-journey/classic-rl-loop.svg)

_The classic loop: agent, environment, action, state, and reward._

Modern systems look different because the nouns changed. The agent is now a model, the action might be a tool call, the state is context, and the reward can come from humans, AI feedback, tests, or verifiers.

![Modern language-model reinforcement learning loop with swapped labels and variables](/blog/rl-journey/modern-rl-loop.svg)

_The modern loop: model agents, context, tool calls, and verifier feedback._

That is why I think there is a real danger in diving straight into the newest RL regime without first understanding the older one. It is like trying to jump straight into calculus without first building strong algebra. With enough effort, you can still make progress by memorizing steps, copying solutions, and grinding through examples. But compared with someone who has the fundamentals, you miss the deeper structure.

RL has already been part of LLM post-training for years. What feels different now is that more of the frontier is moving from one-time preference tuning toward systems that act, verify, retry, use tools, and learn from feedback. In that world, people with strong RL foundations will have an advantage because they can recognize old problems beneath new terminology.

I make four claims in this blog:

- Modern AI is rediscovering classic RL problems through language models, agents, verifiers, tool use, and feedback loops.
- People with strong classical RL foundations are better positioned to understand what is happening.
- Studying classic RL is a way to build better taste.
- A practical study path still exists if you focus on fundamentals first and modern post-training second.

## Modern AI Is Rediscovering Classic RL

Modern AI is rediscovering classic reinforcement learning because the frontier is shifting from prediction to action.

Once models act, receive feedback, and improve through interaction, the old RL problems return.

I will focus on three of them: reward design, credit assignment, and exploration.

### Reward Design

The classic version is reward shaping. This answers the question of "How can you give AI hints to speed up learning without changing its actual goal?

In 1999, [Andrew Ng, Daishi Harada, and Stuart Russell](https://www.andrewng.org/publications/policy-invariance-under-reward-transformations-theory-and-application-to-reward-shaping/) tried to solve this eaxact problem. They proved that you give give an agent extra guidance as long as the bonus follows a strict mathematical rule.

$$
F(s, a, s^{\prime}) = \gamma \Phi(s^{\prime}) - \Phi(s)
$$

When I first saw this equation, I had no idea what it meant, so here is a quick breakdown.

$F(s, a, s^{\prime})$ is the extra "bonus" reward the agent gets for taking an action ($a$) to move from its current state ($s$) to a new state ($s^{\prime}$).

$\Phi$ (Phi) is a "potential" score. It estimates how close a specific state is to the final goal.

$\gamma$ (Gamma) is just a scaling factor to keep the math stable over time.

Think of it like elevation on a hike. If you walk uphill from basecamp to a ridge, you gain elevation (positive reward). But if you turn around and walk back down to basecamp, you lose that exact same amount of elevation (negative reward). Because the reward is tied purely to the "elevation" of the states, the agent cannot artificially farm points by walking back and forth between the same two spots.

![A small agent looping between two states to collect reward while ignoring the real goal](/blog/rl-journey/reward-loop.png)

_Bad reward design can turn a learning problem into a loop that looks productive but misses the goal._

Today, we face the exact same problem, but under new acronyms like RLHF, RLAIF, and RLVR.

The challenge with modern language models is that you cannot write a simple mathematical equation for "be helpful" or "do not be toxic." Because the goal is fuzzy, AI labs had to get creative about how they generate the reward signal:

RLHF (OpenAI’s InstructGPT): They had humans rate different AI responses, trained a secondary "reward model" to predict what humans would like, and then optimized the main AI against that proxy.

RLAIF (Anthropic’s Constitutional AI): Human grading is slow and expensive. Anthropic swapped the humans out for an AI, asking it to grade responses based on a written list of rules (a "constitution") to generate the feedback.

RLVR (Verifiable Rewards): For math or coding, the system uses an automated checker—like running unit tests—to provide a definitive pass/fail reward.

Regardless of which method you use, the modern question is the exact same as the classic one:

Does the reward actually capture what we want, or just what is easy to score?

If the reward signal is flawed, the model will learn the wrong behavior. It may become overly confident because confidence scores well with human raters. It may become sycophantic because agreeing with the user gets rewarded. A coding model might hardcode the exact answers to the visible tests instead of writing a general function. A reasoning model might learn to produce long, smart-sounding thought traces that look convincing to a grader, without actually becoming more accurate.

### Credit Assignment

The classic version is the credit-assignment problem.

In 1961, [Marvin Minsky](https://courses.csail.mit.edu/6.803/pdf/steps.pdf) described the problem using games like chess and checkers. If a system wins or loses after many decisions, how do we know which earlier decisions caused the outcome?

That question is still everywhere.

In chess, the reward might arrive only at the end:

```text
win = +1
loss = 0
```

But the game may have lasted 60 moves. Which move deserves credit? Was it the final checkmate? A sacrifice 20 moves earlier? A quiet positional move that made the ending possible?

The modern version appears in reasoning models and coding agents.

A reasoning model may generate hundreds or thousands of tokens before producing a final answer. A coding agent may make many edits before the tests pass. When the system finally receives a reward, which tokens or actions should be reinforced?

![A small AI agent following a long winding trail of actions before receiving a final reward](/blog/rl-journey/delayed-credit-assignment.png)

_A final reward can be clear while the useful earlier action remains ambiguous._

[DeepSeek-R1](https://arxiv.org/abs/2501.12948) is a useful example here because its RL setup used final-answer correctness as the reward signal, without directly supervising every step of the reasoning process. That makes the credit-assignment problem visible again. The model gets feedback on the outcome, but the hard part is deciding which parts of the trajectory helped.

Again, the packaging changed. The problem did not.

### Exploration

The classic version is the exploration-exploitation tradeoff.

In a bandit problem, you face a simple question: do you keep choosing the option that currently looks best, or do you try another option that might be better?

Too much exploitation and you get stuck with the best thing you have already found. Too much exploration and you waste time trying bad options.

This is the slot-machine problem, but it also shows up in daily life. If you are in a new city and always go to the restaurant you already know is good, you get reliable meals but may miss the best place in the city. If you try a new place every single time, you may discover something great, but you will also eat a lot of mediocre dinners.

The modern version shows up when language models search for better reasoning strategies, tool-use patterns, proof attempts, or code solutions.

DeepSeek-R1 explicitly argued that relying too heavily on human-written reasoning traces can limit exploration, while RL can let new behaviors emerge: self-reflection, backtracking, and strategy adaptation.

That is a very RL-flavored claim.

Good agents need enough exploration to discover better behavior and enough exploitation to make consistent progress. This is true for bandits, games, robotics, theorem proving, coding agents, and probably most interesting AI systems.

## Classical RL People Have Leverage

The people who spent years thinking about rewards, environments, exploration, evaluation, credit assignment, self-play, and learning from feedback are naturally better positioned for this moment.

![David Silver, Marc Bellemare, and Sergey Levine](/blog/rl-journey/classic-rl-people.jpg)

_Classic RL intuition now shows up in search, benchmark design, robotics, and agent training._

[David Silver](https://www.wired.com/story/david-silver-ai-ineffable-intelligence-reinforcement-learning/) is one example. His work on AlphaGo and AlphaZero showed that a system could improve through search, self-play, feedback, and repeated interaction with an environment. That intuition becomes valuable again when people ask how models can learn beyond imitation. Silver now leads Ineffable Intelligence, which has reportedly raised \$1.1 billion at a \$5.1 billion valuation.

[Marc Bellemare](https://arxiv.org/abs/1207.4708) is another example. His work on the Arcade Learning Environment helped define how RL agents should be evaluated across many tasks. That connects directly to today's concerns about whether models are actually improving, overfitting to benchmarks, optimizing flawed rewards, or failing outside the test setting. Bellemare also co-founded [Reliant AI](https://cohere.com/blog/cohere-acquires-reliant-ai-expand-sovereign-enterprise-ai), which Cohere acquired to expand its sovereign enterprise AI work in biopharma and healthcare.

[Sergey Levine](https://www.wired.com/story/physical-intelligence-ai-robotics-startup/) shows the same pattern in robotics. A robot does more than predict the next token. It acts, observes consequences, fails, and tries again. It has to learn policies that work in messy environments. Levine co-founded [Physical Intelligence](https://www.physicalintelligence.company/), which raised \$400 million at a valuation above \$2 billion. That style of thinking becomes more useful as AI systems move from chat interfaces toward agents that take actions in the world.

Classic RL have given these 3 specific examples a conceptual map. When a new post-training method appears, they can ask sharper questions:

- What is the reward?
- What is the environment?
- What behavior is being reinforced?
- Is the feedback dense or sparse?
- Where can reward hacking appear?
- Is the benchmark measuring capability, or just creating an incentive to overfit?

## Studying Classic RL Builds Taste

Studying classic RL matters because it builds taste.

Modern post-training can look like a blur of acronyms and new vocabulary: RLHF, RLAIF, RLVR, PPO, GRPO, verifiers, reasoning models, agents, tool use, process reward models, outcome reward models, and so on.

Classic RL gives you the underlying language for understanding what is actually happening.

This is the part I find useful in practice. When I read a new post-training paper, I do not want to get hypnotized by the acronym. I want to know what is actually doing the work.

If a paper uses a reward model, I want to ask what behavior that reward model makes easier to learn. If it uses a verifier, I want to ask what kind of environment that verifier creates. If it trains on long reasoning traces, I want to ask where credit assignment is happening. If it reports gains on a coding benchmark, I want to ask whether the model learned to solve the task or learned the shape of the benchmark.

That is a different feeling from memorizing definitions and is more like having a debugging lens for AI systems.

This is why classic RL is practical, not just historical.

It gives you a stronger filter for new papers, new systems, and new claims. Instead of chasing every new post-training trend, you can recognize the old problem underneath the new name. That makes it easier to judge what matters, avoid fragile ideas, and come up with more original ones!

## My Study Path

My approach is simple: study classic RL before chasing every new post-training trend.

![An open reinforcement learning textbook beside notes, gridworld tiles, and a learning curve](/blog/rl-journey/rl-study-desk.png)

_The point is not to read every new paper first. It is to build the vocabulary that makes new papers easier to judge._

First, I want to work through [Sutton and Barto](http://incompleteideas.net/book/the-book-2nd.html).

That gives the field's basic language: agents, environments, rewards, value functions, policies, exploration, temporal-difference learning, and policy improvement. It also forces you through the classical exercises: bandits, gridworlds, dynamic programming, Monte Carlo learning, TD learning, Sarsa, Q-learning, policy gradients, and actor-critic methods.

Second, I want to revisit [David Silver's RL lectures](https://www.davidsilver.uk/teaching/).

They move from MDPs and dynamic programming to model-free control, value-function approximation, policy gradients, and planning. They help connect the textbook ideas into a clearer mental model of how RL systems actually learn.

Third, I want to read modern post-training papers with the old concepts in mind.

When a new method appears, I want to ask:

- What is the reward?
- What is the environment?
- What feedback is delayed?
- What behavior is being reinforced?
- What is being explored?
- Where can the system exploit the evaluation?

That is the reason I am studying classic reinforcement learning now.

The future of AI may be built by people who do more than chase the newest acronym. It may be built by people who understand the older problems well enough to recognize them when they return, translate them into new systems, and use them to create better agents.

## Sources

- [Policy invariance under reward transformations: Theory and application to reward shaping](https://www.andrewng.org/publications/policy-invariance-under-reward-transformations-theory-and-application-to-reward-shaping/)
- [Steps Toward Artificial Intelligence, Marvin Minsky](https://courses.csail.mit.edu/6.803/pdf/steps.pdf)
- [InstructGPT: Training language models to follow instructions with human feedback](https://arxiv.org/abs/2203.02155)
- [Constitutional AI: Harmlessness from AI Feedback](https://arxiv.org/abs/2212.08073)
- [DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via Reinforcement Learning](https://arxiv.org/abs/2501.12948)
- [The Arcade Learning Environment: An Evaluation Platform for General Agents](https://arxiv.org/abs/1207.4708)
- [Cohere acquires Reliant AI to expand sovereign enterprise AI](https://cohere.com/blog/cohere-acquires-reliant-ai-expand-sovereign-enterprise-ai)
- [The Man Behind AlphaGo Thinks AI Is Taking the Wrong Path](https://www.wired.com/story/david-silver-ai-ineffable-intelligence-reinforcement-learning/)
- [Inside the Billion-Dollar Startup Bringing AI Into the Physical World](https://www.wired.com/story/physical-intelligence-ai-robotics-startup)
- [Physical Intelligence](https://www.physicalintelligence.company/)
- [Reinforcement Learning: An Introduction, Sutton and Barto](http://incompleteideas.net/book/the-book-2nd.html)
- [David Silver's Reinforcement Learning Course](https://www.davidsilver.uk/teaching/)
