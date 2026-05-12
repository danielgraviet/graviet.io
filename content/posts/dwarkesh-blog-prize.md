## Question

> “A couple years ago, there was this idea that AI progress might slow down as we make further progress into the RL regime.
>
> 1. Because as horizon lengths increase, the AI needs to do many days’ worth of work before we can even see if it did it right, so if we’re still in a naive policy gradient world, the reward signal / FLOP goes down.
>
> 2. We’d crossed through many orders of magnitude of RL compute from GPT 4 to o1 to o3, and it would not be feasible to replicate that many OOMs increase in compute immediately again.
>
> But AI progress seems to have been fast nonetheless - even potentially speeding up if rumors about Spud or Mythos are to be believed. What gives? What did that previous intuition pump that motivated longer timelines miss? Feel free to deny the premise of the question.”

The original argument was mechanically correct about naive policy gradients with sparse rewards but that is not where it failed. It failed by treating compute and algorithms as separable inputs (Ho et al. 2024), measurable independently and combined after the fact. Algorithmic gains scale with compute, so modest hardware growth got amplified into the capability jumps we've seen. The empirical reality is closer to compute × algorithms where the multiplier itself grows with scale. Once you decompose "algorithms" into the distinct mechanisms doing this multiplication, the gap between small-scale ablations and frontier capability is clear. Three mechanisms operate at different levels of the training stack, and all three are scale-amplified.

## Scale-Dependent Scaling Exponents

(1) Scale-dependent scaling exponents. Architectural choices like LSTM → Transformer or dense → MoE yield more efficiency at larger scale because their compute-optimal scaling exponents differ. The same algorithm produces a larger gap between architectures the further you push compute. Gundlach et al. (2025) measured this directly: standard innovations ablated at small scale account for under 100x of the 22,000x algorithmic efficiency gain estimated by Ho et al. (2024) for 2012–2023 which is under 0.5% of the total. Their scaling experiments reconstruct 6,930x of the gap through scale-dependent effects, with the LSTM → Transformer transition doing most of the work. The headline finding is, "an algorithm's efficiency gains are tied to compute scale." Forecasters extrapolating from small-scale benchmarks were systematically under-crediting innovations that only “cash” out at frontier compute.

## Capability-Gated Post-Training Techniques

(2) Capability-gated post-training techniques. The reward-signal-per-FLOP problem was never the binding constraint, once you stop holding the reward structure fixed. Naive policy gradient on long-horizon tasks gives one bit of feedback per multi-day rollout. The techniques that actually got deployed don't accept that constraint. They reach into the rollout and reward intermediate structure, which turns a single sparse signal into many dense ones. RLVR, process supervision, and R-HORIZON-style decomposition all do this, and all need a base model strong enough to generate non-trivial rollouts. Their leverage grows as the base model improves because they have nothing to grab onto in a weak model. RLVR on a 1B-parameter base produces almost no useful signal because the base can't generate enough correct reasoning traces for the verifier to reward. The same technique applied to a frontier base gives you o3-class reasoning. Both pieces moved: the techniques replaced naive policy gradient with reward-densification methods, and the base models grew strong enough for those methods to bite.

The R-HORIZON benchmark (Lu et al. 2025, arXiv:2510.08189) shows the drop empirically: chain five AIME problems so each depends on the last, and DeepSeek-R1 falls from 87.3% to 24.6%. The fix is composed-data training: building longer problems out of simpler chained ones, then training on them. This technique applied to R1-Qwen-7B more than doubles accuracy on the long-horizon variant. The h1 paper (Motwani et al. 2025, arXiv:2510.07312) makes the underlying claim explicit: curriculum learning over composed problems achieves an "exponential improvement over full-horizon training, similar to dense rewards." Sample complexity drops from 1/p^k (exponential in horizon) to k/p (linear). This is the load-bearing result for the OOM question. The original argument assumed long-horizon RL would demand exponentially more compute as horizons grew, which is why several additional OOMs looked necessary. But the exponential dependence was a feature of the training regime, not the underlying problem. Curriculum over composed data converts that exponential into a linear, and once it's linear, modest compute growth is sufficient. The OOMs the original forecast was watching for were demanded by an algorithm we no longer use.

## Verification As Synthetic Compute

(3) Verification as synthetic compute. Multi-agent debate, self-critique, and model-graded trajectories convert FLOPs into training signal that previously required human time. Anthropic tested this with “Constitutional AI” (Bai et al. 2022, arXiv 2212.08073) by training harmless models "with far fewer human labels" by using the LM itself as the source of preference data. The mechanism is FLOP substitution, not a scaling-exponent shift, but it compounds with scale anyway: stronger verifiers produce higher-quality synthetic data, which trains stronger next-generation verifiers. Yuan et al. (2024, arXiv 2401.10020) ran this loop explicitly. Their procedure:

- Have the model generate candidate responses.
- Have the same model judge which response is better.
- Train on those self-generated preferences.
- Repeat.

Over three iterations, both the instruction-following ability and the judging ability improved together, lifting Llama 2 70B above Claude 2 and GPT-4 0613 on AlpacaEval 2.0. Their framing names the bottleneck cleanly: standard reward models are "bottlenecked by human performance level." RLAIF moves that bottleneck onto compute, where it actually scales.

This reframe makes total effective progress looks like

`(compute × scaling-exponent factor) + (compute × post-training factor) + (compute × verification factor)`

than to compute + algorithms. The same FLOP increase is being amplified across three independent multiplicative channels simultaneously. That's why the o3-to-frontier-2026 window produced larger capability jumps than 2023 forecasts predicted despite no further OOMs of RL compute: the OOMs weren't necessary. To slow progress, you'd need to hit ceilings on all three channels at once, and there's no particular reason to expect them to stop at the same time.

## Looking Forward

Looking forward, the picture is less reassuring than it appears. Every mechanism above relies on cheap verification. RLVR works because math and code have mechanical ground truth. Process reward models work because reasoning steps are locally checkable. R-HORIZON works because sub-problems remain individually verifiable. The bottleneck was never really long horizons. It was long horizons without verifiable substructure, and we have made enormous progress on the latter while making almost none on the former. When the task is "run a company for a year" or "pursue a research agenda," verification itself is the hard part, and none of these techniques transfer. My expectation is bifurcation: cheap-verification domains keep racing, while expensive-verification domains stall until we figure out how to verify them.
