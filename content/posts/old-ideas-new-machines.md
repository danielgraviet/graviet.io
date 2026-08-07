---
title: Old Ideas, New Machines
slug: old-ideas-new-machines
excerpt: The same patterns keep reappearing in new disguises — branch prediction becomes speculative decoding, virtual memory becomes PagedAttention.
publishedAt: 2026-08-06
tags: [AI, Systems, CPU Architecture]
featured: true
---

One of the things I find most interesting about computer science is seeing the same patterns re-applied in completely different places.

Understanding CPU architecture, for example, directly applies to understanding some of the optimization techniques used in frontier LLM systems.

I think of [*Jiro Dreams of Sushi*](https://www.imdb.com/title/tt1772925/), the documentary about a legendary Tokyo sushi chef, and how it inspired a wave of chefs and restaurateurs abroad who studied his methods and carried them into kitchens on the other side of the world. The restaurant was different, the country was different, but the expertise traveled. Ideas developed in one kitchen were studied, carried elsewhere, and applied to something new.

![A vintage CPU and circuit boards send a glowing arc of small geometric blocks toward a modern GPU server, showing old computing ideas reappearing in AI systems.](/blog/old-ideas-new-machines/old-ideas-new-machines.png)
*Some of the ideas powering modern AI have been quietly waiting in computer architecture for decades.*

I think the same thing happens in computers.

Ideas that were developed decades ago to make CPUs faster are now appearing again in systems built to make LLMs faster. To me, this is also a good argument for learning things outside your immediate field. Knowledge has a funny way of becoming useful again.

Here are two concrete examples.

## 1. Branch Prediction → Speculative Decoding

First, the CPU approach.

Imagine we have a simple loop in C++:

```cpp
std::vector<int> values = {3, -2, 7, -8, 1, 0, -4, 9};
int total = 0;

for (int i = 0; i < values.size(); i++) {
    if (values[i] > 0) {
        total += values[i];
    }
}
```

Every time the CPU reaches that if statement, it has a problem.

Modern CPUs execute instructions through pipelines. Waiting until the condition is completely resolved before beginning the next instructions would waste precious CPU cycles.

The CPU is impatient.

Instead of waiting, it guesses which branch will execute and starts doing that work immediately.

If the prediction is correct, awesome. We just saved some precious CPU cycles so your HFT trades in Azerbaijan can go through slightly faster.

![A developer coding with divine confidence](/blog/old-ideas-new-machines/coding-jesus.webp)

If the prediction is wrong, the CPU throws away the speculative work and starts executing the correct path.

There are some sneaky consequences to doing this. Speculative execution has famously been exploited through vulnerabilities such as Spectre. But under normal operation, branch prediction works extremely well and is one of the reasons modern CPUs can execute code so quickly.

The important idea is simple:

> Do work before you know for certain that you need it. If you guessed correctly, you saved time.

LLMs have adopted a similar idea.

Normally, a large language model generates tokens one after another. The problem is that the large model is expensive, and every token requires another pass through it.

Speculative decoding introduces a smaller, faster draft model.

Instead of making the large model generate every token itself, the smaller model gets impatient and starts generating several possible tokens in advance. The large model then checks its work.

If the draft model was right, awesome. Your "rephrase this paragraph, don't sound like AI" prompt gets processed a little faster.

If it was wrong, the speculative tokens get thrown away, similar to the work of a finance intern whose spreadsheet turns out not to be needed.

Different machine. Same idea.

**Guess ahead, verify later, and keep the work when you were right.**

## 2. Virtual Memory → PagedAttention

The second example comes from memory management.

Modern CPUs use virtual memory. Programs work with virtual pages, while RAM contains physical frames, usually of the same size.

For example, a program might access data on a 4 KB virtual page. The CPU's Memory Management Unit, or MMU, translates that virtual address into the corresponding physical location in RAM.

Without any optimization, continually performing these translations would be expensive.

That is where the Translation Lookaside Buffer, or TLB, comes in.

I like thinking of the TLB as a tiny, extremely fast dictionary:

```text
virtual page -> physical frame
```

Instead of repeatedly walking through the page tables to figure out where something lives, the CPU can check whether it already knows the translation.

Most of the time, it does.

Learning about the TLB was one of those moments where CPU architecture really clicked for me. Modern computers have layers upon layers of small tricks like this, all designed to avoid doing expensive work repeatedly.

Would love to be a hardware engineer.

A similar memory-management problem appears when serving LLMs.

LLMs use the KV cache, or Key-Value cache.

During generation, the model needs information from the tokens it has already processed. Instead of recomputing all of that information every time it generates another token, it stores the previous results in the KV cache.

I think of the KV cache like a filing cabinet next to your desk.

![A compact filing cabinet holds small colored folders and blocks across separate drawers beside a GPU, illustrating paged KV-cache allocation.](/blog/old-ideas-new-machines/pagedattention-filing-cabinet.png)

*PagedAttention stores a growing KV cache in small blocks, rather than reserving one large contiguous cabinet for every request.*

You finish some work and put it in the cabinet. Later, when you need it again, you simply pull it out.

Without the filing cabinet, you would have to walk to a warehouse full of workers, explain the work you already did but forgot to save, and ask them to recompute the entire thing.

Very slow.

The problem was that this filing cabinet used to be organized somewhat poorly.

When an LLM starts generating a response, it does not know beforehand exactly how long that response will be. One prompt might produce three words. Another might refactor your entire codebase in Rust.

Older KV-cache memory management often reserved large contiguous regions of GPU memory for each sequence because it had to prepare for how large that sequence might become.

Imagine reserving an entire row of filing cabinets because you think your project might eventually need them.

Then your project uses two folders.

This wastes space and makes it harder to serve many requests simultaneously.

This is where PagedAttention comes in.

Instead of requiring one giant contiguous section of memory, PagedAttention divides the KV cache into smaller blocks that can live in different physical locations.

The idea should sound familiar.

Virtual memory does something similar with pages.

A simple analogy is seating at a restaurant.

The old approach is like reserving a 50-person banquet table because you might have 50 friends show up. Then only three arrive, while the restaurant tells everyone else it is full.

Paged allocation is like bringing out individual chairs as each new friend arrives.

Because LLM generation is autoregressive—tokens arrive one after another—we can allocate additional memory incrementally as the sequence grows.

Instead of asking:

> "How much memory could this request possibly need?"

we can ask:

> "How much memory does this request need right now?"

Fit more things into the filing cabinet.

Serve more requests with the same GPU.

## The Pattern

What I like about these examples is that the analogy is not superficial.

The underlying problems are genuinely similar.

Branch prediction and speculative decoding both ask:

> Can we perform likely future work before we know whether it will be needed?

Virtual memory and PagedAttention both ask:

> Can we separate the logical view of memory from its physical layout so that memory can be used more efficiently?

The hardware engineers who designed these CPU techniques were solving problems in a completely different era of computing. They were not thinking about transformer inference or billion-parameter language models.

Yet the patterns survived.

That is one reason I increasingly enjoy learning about CPU architecture even though most of my work is much higher in the stack. You start noticing that computer science has a relatively small collection of extremely good ideas that keep appearing in new disguises.

And once you recognize the pattern, understanding the new system becomes much easier.

## Two Ideas I'm Watching

There are two other CPU and hardware ideas that I think are interesting to compare with where AI systems are going.

The first is **cache coherence across multi-node systems**. As models and KV caches become distributed across more machines and accelerators, systems increasingly have to answer a familiar question: who owns which piece of memory, and how do we make sure everyone has the correct version?

This makes me think of how CPU cores manage their own caches. Each core may have private L1 and L2 caches, while larger caches can be shared. Once multiple cores are holding copies of the same data, the CPU needs a way to keep those copies coherent.

The scale is very different, but the underlying problem feels familiar: once memory is distributed, you need a system for deciding who owns the latest version and who needs to be updated.

The second is **chiplets and modular hardware design**. I am always a little wary when I hear the word "modular" in tech. LG G5's modular phone experiment did not exactly start a revolution and I am not a huge fan of the modular slate truck.

![LG G5 modular phone with its swappable module detached](/blog/old-ideas-new-machines/modular-phone.webp)

![Slate's modular electric truck with reconfigurable body panels](/blog/old-ideas-new-machines/slate-modular-truck.webp)

But chiplets are a much more compelling version of the idea. Instead of making one enormous piece of silicon responsible for everything, hardware designers can break the chip into smaller pieces specialized for different jobs: dense matrix multiplication, memory movement, integer operations, networking, and so on. You still get one system, but the pieces can be designed around what they are actually good at.

Again, these may look like completely new problems.

But I suspect that when you dig underneath them, you will find some very old ideas.
