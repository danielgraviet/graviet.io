---
title: "GRPO: Learning From the Other Answers in the Room"
slug: grpo-simple-explanation
status: idea
createdAt: 2026-05-27
publishedAt: 2026-05-27
updatedAt: 2026-05-27
tags: [GRPO, PPO, RLVR, Reinforcement Learning]
summary: I want this one to build off of my PPO blog, and take the same simple approach to explaing this concept. I want to go into the math underneath it, how it works on the hardware level, etc. 
---

I think of a language model solving a math problem like a student at a whiteboard.

It tries a solution. Maybe it gets the answer right. Maybe it makes an algebra mistake. It is easy to tell if the final solution is correct, but much harder to figure out which specific step led to that outcome and how to get the model to take those steps more consistently.

![An AI student tracing correct and incorrect solution paths on a whiteboard](/blog/grpo/whiteboard-credit-assignment.png)

_Scoring the final answer is easy. Finding the exact step that made it succeed or fail is harder._

That is the job of reinforcement learning.

In this context, the “policy” is just the language model itself. Given a prompt, it chooses the next token, then the next token, then the next token, until it has produced a full response.

Reinforcement learning updates that policy so it becomes more likely to produce high-reward responses and less likely to produce low-reward ones.

In a recent blog, I covered [PPO](https://www.graviet.io/blog/ppo-explain-for-beginners): one popular reinforcement learning method for language models. In PPO, we usually train the policy model while also maintaining extra machinery like a reward model, a reference model, and a value model.

That extra machinery matters because big models are already expensive to train. PPO is not just “update the model.” It often means keeping multiple models or learned components around at once: the policy we are training, a reference model to keep it from drifting too far, a reward model to score outputs, and a value model to estimate future reward.

![Oversized model blocks being crammed into a realistic GPU](/blog/grpo/ppo-model-stack.png)

_PPO often means trying to fit several large model components into the same scarce GPU memory._

That is a lot to fit in GPU memory, and a lot to keep coordinated during training.

The value model, also called the critic, tries to predict how good the current state or partial answer is. That prediction is used to calculate the “advantage”: how much better or worse the model did than expected. PPO is powerful, but this critic can be expensive. GRPO is a way to remove it while still getting useful policy updates.

GRPO stands for **Group Relative Policy Optimization**. The useful idea is not “reinforcement learning without rewards.” The useful idea is **reinforcement learning without a separate value model**.

GRPO keeps the main idea of policy optimization, but changes one important piece: how we decide whether an answer was better or worse than expected.

PPO asks a value model to estimate that baseline.

GRPO uses the other sampled answers as the baseline.

Imagine we give a model one math problem and sample four answers:

| Sample | Verifier score |
|---|---:|
| Answer A | 1 |
| Answer B | 0 |
| Answer C | 1 |
| Answer D | 0 |

The average score is 0.5:

```text
(1 + 0 + 1 + 0) / 4 = 0.5
```

Answers A and C are better than the group average, so the model should become more likely to produce responses like them. Answers B and D are worse than the group average, so the model should become less likely to produce responses like them.

That is the core move: **use the group as the baseline**.

This is why the “group” in GRPO matters. The model creates several answers to the same prompt, scores each one, and asks: which answers beat the group average?

Those better-than-average answers get a positive advantage. The worse-than-average answers get a negative advantage.

There are extra details in the formal algorithm, like reward normalization, but we can leave those aside for now. The main idea is simple: GRPO learns by comparing each answer to the other answers in the same group.

The [DeepSeekMath paper](https://arxiv.org/abs/2402.03300) says this more formally, because papers are legally required to make simple things look scarier. But the intuition is the same: sample a group of outputs, score them, and use the relative scores inside the group to decide which responses the model should move toward.

This also clears up a common misunderstanding that I had. GRPO does **not** mean there is no reward signal. There still has to be some way to score the outputs.

In math, that might be a checker that compares the final answer to the known solution. In code, it might be unit tests. In other settings, it could still be a learned reward model.

What GRPO removes is specifically the **value model**, not necessarily the reward mechanism.

Another question you may have is: how can these extra generated solutions be free? Wouldn’t we have to do more forward passes on the GPU, so we are just trading one kind of compute for another?

Generating several answers is not free. It takes more inference. But it can be cheaper and simpler than training and synchronizing a separate multi-billion-parameter critic. GPUs are good at generation in parallel, and the policy model already exists. GRPO spends compute on extra samples instead of spending memory and training complexity on a value model.

A simple analogy is burgers. Asking the same kitchen to make a few extra burgers is more work, but it is normal work. My friend Will, who is obsessed with burgers, would probably say this is not a problem. This is just lunch.

Opening a second kitchen, hiring another cook, and making sure both kitchens stay perfectly in sync is a different kind of headache.

GRPO is more like ordering extra burgers from the kitchen you already have. PPO with a value model is more like running a second kitchen beside it: another model to store, train, update, and keep aligned with the policy.

![A burger restaurant kitchen making extra burgers beside a redundant second kitchen line](/blog/grpo/group-relative-baseline.png)

_GRPO is more like ordering extra burgers from the kitchen you already have than opening a second kitchen beside it._

Now let’s run through a full mini example of GRPO.

Suppose the model generates eight answers to a problem, and a verifier gives these scores:

```text
[1, 1, 0, 1, 0, 0, 1, 0]
```

The average reward is 0.5. A correct answer has positive advantage because it beat the average. An incorrect answer has negative advantage because it fell below the average.

The model then updates its policy. Tokens in better-than-average completions are reinforced, while tokens in worse-than-average completions are discouraged.

Like me, one of your immediate thoughts might be: what if the problem is too hard or too easy?

What happens if all answers are correct?

```text
[1, 1, 1, 1]
```

There is no useful contrast. The group average is 1, and every answer looks the same.

The same problem happens if all answers are wrong:

```text
[0, 0, 0, 0]
```

Again, there is no signal about which behavior was better.

This is why GRPO works best when prompts are neither too easy nor too hard. The useful training examples are the ones where the model sometimes succeeds and sometimes fails. Those prompts create variation inside the group, and variation is what makes relative learning possible.

This is also why it is common to filter data before training with GRPO. Questions that are too easy can lead to all correct answers. Questions that are too hard can lead to all wrong answers. The best questions are the ones that create a useful spread.

![Three groups of answer cards showing too easy, useful mix, and too hard prompts](/blog/grpo/prompt-difficulty-filtering.png)

_The useful prompts are the ones where the model sometimes succeeds and sometimes fails._

This is also why GRPO fits naturally with reinforcement learning from verifiable rewards, or RLVR. In domains like math and code, we can cheaply score many outputs. Does the final number match? Do the tests pass? Can the code run correctly in a [sandbox](https://daytona.io)?

These signals are imperfect, but they are fast, scalable, and do not require humans to rank every answer.

PPO is still important. GRPO is not magic, and it does not remove the need for careful training.

Like PPO, GRPO uses a clipped surrogate objective. That phrase sounds intense, but the idea is simple: do not let one training update push the model too far.

If an answer gets a high reward, we want the model to become more likely to produce answers like it. But we do not want the model to overreact and completely change its behavior after one batch. The “clip” acts like a guardrail. It says: update the policy, but only within a safe range.

That matters because language models are fragile. If reinforcement learning pushes too hard, the model can over-optimize the reward signal, lose useful behavior, or drift away from the reference model. GRPO keeps a KL-style regularization term to discourage the trained policy from moving too far from the reference policy.

The key idea is reusable because it is simple:

> When a model can cheaply produce multiple attempts, use those attempts to create the baseline.

That is GRPO in one sentence.

Instead of asking a critic model to estimate “what should have happened,” GRPO asks the current model to produce a small crowd of answers and then learns from the winners inside that crowd.

This is why GRPO feels elegant. It turns sampling into supervision. The extra answers are not wasted attempts; they are the comparison set that makes reinforcement learning possible without a separate critic.

## Sources

- [DeepSeekMath: Pushing the Limits of Mathematical Reasoning in Open Language Models](https://arxiv.org/abs/2402.03300)
- [Group Relative Policy Optimization (GRPO), Cameron R. Wolfe](https://cameronrwolfe.substack.com/p/grpo)
