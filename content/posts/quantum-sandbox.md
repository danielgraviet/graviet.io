---
title: What Would a Quantum Sandbox Look Like?
slug: quantum-sandbox
excerpt: What happens when quantum computers become infrastructure? Kai Sandberg and I explore the idea of a quantum sandbox.
publishedAt: 2026-09-16
tags: [Quantum Computing, Infrastructure, Sandboxes]
---

After meeting with my friend [Kai Sandberg](https://www.linkedin.com/in/kai-sandberg-837b112a0/), we quickly started talking about different applications of technology.

Kai comes from a quantum computing background. He won an MIT quantum hackathon and later conducted quantum research at the University of Maryland.

![Kai and team at the MIT quantum hackathon](/blog/quantum-sandbox/kai-mit-hack.jpeg)

My background is in machine learning research at Daytona, where I spend much of my time working on evaluations, benchmarking, sandboxes, and elastic compute.

Naturally, our backgrounds collided and got us wondering…

What would a quantum sandbox look like?

That led to a few more questions:

- How would a quantum sandbox operate?
- What would people actually use one for?
- What would isolation mean on quantum hardware?
- Could you snapshot or restore a quantum workload?
- What changes when the resource being virtualized is a qubit instead of a CPU core?

It is fun to imagine a data center in 2036 where Quantum Processing Units, or QPUs, sit alongside CPUs and GPUs. Some may live inside enormous cryogenic systems, cooled to temperatures close to absolute zero. Developers do not need to understand the physical machine underneath. They request quantum compute through an API, run a workload, collect the result, and release the resources.

I was surprised to find out that parts of this future already exist. [Amazon Braket](https://aws.amazon.com/braket/) currently lets developers submit quantum tasks to QPUs through an AWS service and software development kit. Those tasks are queued, executed on quantum hardware, and their results are returned through normal cloud infra.

![Amazon Braket dataflow: user submits quantum tasks through notebook to Braket service, which routes to simulators or QPUs, with results stored in S3](/blog/quantum-sandbox/braket-dataflow.webp)

What does not exist in the same mature form is the infrastructure layer we take for granted around classical compute.

I wanted to imagine something closer to a quantum sandbox. (Daytona might be the first?)

## Quantum Computing 101

I spent some time talking with Kai to understand the basics of quantum computing. Even after that, some of these ideas are still confusing. Hopefully this section gives you a simple foundation you can return to as we get into the infrastructure side.

The fundamental unit of a normal computer is the bit. Physically, computers can represent bits in different ways, but programmers usually do not care about the implementation. We simply treat a bit as either 0 or 1.

A quantum computer uses qubits.

A qubit is described using amplitudes associated with 0 and 1. Before measurement, both possibilities can contribute to the qubit's state. Once we measure it, though, we only observe a classical result: 0 or 1.

This is where I got confused.

If the final result is still just 0 or 1, how is a qubit actually different from a normal bit?

The part that helped me was realizing that the useful quantum behavior happens before the measurement.

You prepare the qubits, apply operations that manipulate their amplitudes, let those amplitudes interact through interference, and only then measure the final result.

Very roughly:

```text
prepare qubits
      ↓
manipulate amplitudes
      ↓
interference
      ↓
measure
      ↓
classical answer
```

So the interesting part is not that a qubit somehow gives us more than 0 or 1 at the end. The interesting part is what we can do to its state before we ask for that final answer.

That leads to three important ideas for understanding quantum computation: superposition, interference, and entanglement.

### Superposition

The easiest way for me to understand superposition was to start with the possible outcomes.

With one qubit, measurement can give us:

```text
0
1
```

With two qubits, there are four possible results:

```text
00
01
10
11
```

With three qubits, there are eight:

```text
000
001
010
011
100
101
110
111
```

Each additional qubit doubles the number of possible bit strings.

Now imagine that one of these bit strings represents the answer to a computation. For example, suppose the answer we care about is 101.

A quantum computer can prepare the three qubits in a superposition where all eight possibilities have some amplitude. The probabilities below are intentionally mixed up to show that “some amplitude” does not have to mean equal amplitude; the uniform average would be 100 / 8 = 12.5%:

![Illustrative measurement probabilities for a mixed three-qubit superposition](/blog/quantum-sandbox/quantum-superposition-probabilities.png)

If we measured immediately, this would not be very useful. We would simply get one of the possible answers.

Instead, the quantum computation happens before measurement. Quantum operations manipulate the amplitudes so that useful answers become more likely.

Ideally, interference moves us toward a distribution like this, where the state we care about has become much more likely:

![Illustrative measurement probabilities after interference increases the likelihood of 101](/blog/quantum-sandbox/quantum-superposition-probabilities-after.png)

The chart shows the result we want: after the computation, measuring 101 is much more likely.

### Interference

The simplest way I think about interference is:

> Interference makes wrong answers quieter and the right answer louder.

The figures above show what a quantum computer can do, but not why it works.

One useful way to think about it is that a quantum computer explores many possible answers, then uses interference to make some possibilities stronger and others weaker.

Imagine waves in water. When two waves line up, they combine into a bigger wave. When they meet in opposite directions, they can cancel each other out. Quantum computers use a similar idea.

A quantum algorithm carefully controls these interactions so that wrong answers tend to cancel out while useful answers become stronger. When the computer finally checks the result, the useful answer is more likely to appear.

Grover’s search algorithm is a good example. Suppose you are looking for one correct item in a huge unsorted list. A normal computer may need to check many items one by one. Grover’s algorithm repeatedly makes the correct answer stand out more from the rest, allowing a quantum computer to find it with far fewer checks.

So a quantum computer does more than simply “try every answer at once.” It creates many possibilities, then carefully reshapes them so the answer you want becomes easier to find.

### Entanglement

Entanglement is the most confusing of these ideas, and it is not something we are going to master in one blog post.

The main idea to leave with is that entanglement helps quantum computers represent relationships between variables.

If two parts of a problem depend on each other, entanglement lets the quantum state represent those variables together instead of treating them independently.

For example, if a valid solution requires two qubits to match, the relevant possibilities might be:

```text
00
11
```

rather than:

```text
00
01
10
11
```

The exact mechanics get much deeper than we need here. The important takeaway is simple: when variables in a problem are related, entanglement gives quantum computers a way to represent those relationships directly.

## What Would A Quantum Sandbox Make Possible?

At this point, we have spent enough time in the weeds and I do not want to bog you down with more technical details. Let’s talk about some cool sci-fi stuff that can happen with quantum.

### Better Drug And Material Discovery

One of the most interesting possibilities is chemistry.

Molecules are quantum systems themselves, which makes them extremely difficult to simulate perfectly on classical computers. Quantum computers may eventually make it possible to model some of these systems more naturally.

Imagine pharmaceutical researchers testing the behavior of a new molecule without needing to physically manufacture every candidate first.

I think the more exciting one is a materials company exploring thousands of possible battery chemistries and finding one that stores more energy, charges faster, or uses cheaper materials.

A researcher might run most of their normal software on CPUs and GPUs, then request a quantum sandbox only when they reach the part of the problem that is especially hard to simulate. The quantum computer would be the ultimate piece to your home lab.

![A researcher using classical compute while reserving a quantum sandbox for difficult molecular simulations](/blog/quantum-sandbox/scientist.png)

### Better Logistics

It amazes me how much moves around the world every day. While writing this post, I looked up how many packages Amazon delivers and found that its own logistics network delivered roughly 20 million packages per day in the U.S. in 2025.

That is just one company. Behind every package is a much larger system deciding where inventory should sit, which warehouse should fulfill an order, which truck should carry it, and what route it should take.

Each decision affects many other decisions and these problems can become enormous very quickly.

A future logistics company could continuously run normal software, then send especially difficult optimization problems into a quantum sandbox when it needs help exploring a huge number of possible plans.

That could mean finding better routes for thousands of delivery trucks, responding faster when a major port closes, or cutting fuel use across an airline’s fleet. At that scale, even small improvements can add up quickly.

### New Financial Tools

Finance is another obvious use case, although it is less inspiring to imagine some of the most advanced hardware ever built being used to help a hedge fund make slightly more money trading shrimp futures in Azerbaijan.

Still, the problems are real. Banks need to understand how portfolios behave across huge numbers of market conditions. Trading firms price complicated financial products. Insurers try to estimate rare events that are difficult to model well.

Quantum computers are being researched for some of these workloads because they may eventually reduce the amount of computation needed for certain kinds of estimation.

In that world, a financial firm would not need to own a quantum computer. It could request a quantum sandbox for a difficult calculation, get the result back, and move on.

I just hope we get a few new medicines and better batteries before all of this ends up optimizing celebrity-sponsored sports bets.

![A playful illustration of financial firms using quantum computing for speculative trading](/blog/quantum-sandbox/grift-kings.webp)

### Computers That Use Quantum Accelerators

The future I find easiest to imagine looks a lot like what happened with GPUs.

GPUs did not replace CPUs but we started giving different parts of a program to the hardware best suited for them.

A future computer might use a CPU for normal software, a GPU for a LLM, and a QPU for a handful of problems where quantum computation provides an advantage.

You might write something as simple as:

```python
result = quantum.run(problem)
```

and somewhere inside a data center, a machine sitting near absolute zero performs a calculation using the rules of quantum mechanics.

![A home computer with a capable CPU and GPU beside an absurd chandelier-like quantum computer](/blog/quantum-sandbox/home-quantum-computer.png)

## Making Quantum Computing Practical

This is what I find exciting about the idea of a quantum sandbox. The physics can stay incredibly complicated, but the experience for the developer does not have to be.

We have seen this pattern before. Very few developers understand every transistor inside a CPU, and most machine learning engineers do not need to understand the electrical behavior of a GPU before training a model. Over time, layers of infrastructure turn strange and expensive hardware into something ordinary enough to use without thinking about all the details underneath.

Quantum computers could follow the same path. They may start as giant experiments inside laboratories, then become specialized machines in data centers, then eventually become resources that developers can request through an API. At some point, the underlying hardware may become something most people barely think about at all.

You request a quantum sandbox, give it a problem, and somewhere in a data center a machine colder than outer space manipulates qubits using the laws of quantum mechanics. A few moments later, you get an answer back and keep working.

That is the future Kai and I found fun to imagine. Some of these applications may never work exactly the way we picture them today, and others will probably appear that we have not thought of yet. But there is something exciting about watching a technology move from a physics experiment, to expensive hardware, to infrastructure, and eventually into a tool that ordinary people can build with.

Quantum computing still feels like science fiction. A quantum sandbox would be one step toward making it feel normal.
