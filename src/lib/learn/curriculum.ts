export type CurriculumKind = "topic" | "project";

export type CurriculumDomain = {
  id: string;
  title: string;
  goal: string;
  items: string[];
  projects: string[];
  resources: string[];
};

export const RUNTIME_SUBJECT_SLUG = "ai-runtime-systems";
export const INBOX_SUBJECT_SLUG = "inbox";

export const RUNTIME_SUBJECT = {
  slug: RUNTIME_SUBJECT_SLUG,
  title: "AI Runtime Systems Mastery",
  description:
    "Multi-year tracker for efficient execution of intelligent systems — hardware to GPU to ML to agent runtimes.",
};

export const INBOX_SUBJECT = {
  slug: INBOX_SUBJECT_SLUG,
  title: "Inbox",
  description: "Concepts captured while working, outside a structured curriculum.",
};

export const RUNTIME_CURRICULUM: CurriculumDomain[] = [
  {
    id: "architecture",
    title: "Computer Architecture",
    goal: "Understand what the hardware is actually doing.",
    items: [
      "CPU architecture and instruction pipelines",
      "Memory hierarchy and cache behavior",
      "Cache coherence",
      "Branch prediction",
      "SIMD and vectorization",
      "NUMA",
      "PCIe and DMA",
      "SSD and storage internals",
      "Hardware performance counters",
    ],
    projects: [
      "Write a cache benchmark comparing access patterns",
      "Profile branch prediction and SIMD effects",
      "Build a small memory-latency visualization",
    ],
    resources: [
      "Computer Systems: A Programmer's Perspective",
      "Computer Architecture: A Quantitative Approach",
    ],
  },
  {
    id: "operating-systems",
    title: "Operating Systems",
    goal: "Understand the abstractions underneath containers, runtimes, and execution environments.",
    items: [
      "Processes and threads",
      "CPU scheduling",
      "Virtual memory and paging",
      "mmap and the page cache",
      "Synchronization and lock-free basics",
      "epoll, kqueue, and io_uring",
      "Filesystems",
      "Linux namespaces",
      "cgroups",
      "Signals and process lifecycle",
    ],
    projects: [
      "Build a tiny Unix shell",
      "Implement a memory allocator",
      "Build a thread pool",
      "Create a toy process scheduler",
      "Build a minimal container with namespaces and cgroups",
    ],
    resources: ["Operating Systems: Three Easy Pieces", "The Linux Programming Interface"],
  },
  {
    id: "networking",
    title: "Networking",
    goal: "Reason about latency, throughput, failure, and communication across machines.",
    items: [
      "TCP/IP",
      "Congestion control",
      "DNS",
      "HTTP/1.1, HTTP/2, and HTTP/3",
      "QUIC",
      "RPC and gRPC",
      "Load balancing",
      "Service discovery",
      "Network namespaces and virtual networking",
      "Kernel bypass and RDMA basics",
    ],
    projects: [
      "Build an HTTP server",
      "Build a small RPC framework",
      "Build a reverse proxy",
      "Measure network tail latency under load",
    ],
    resources: [
      "Computer Networking: A Top-Down Approach",
      "Beej's Guide to Network Programming",
    ],
  },
  {
    id: "distributed-systems",
    title: "Distributed Systems",
    goal: "Design systems that remain useful when machines, networks, and assumptions fail.",
    items: [
      "Replication and partitioning",
      "Consistency models",
      "Consensus",
      "Raft and Paxos",
      "CAP and its limitations",
      "Distributed transactions",
      "Fault tolerance",
      "Schedulers and placement",
      "Backpressure",
      "Observability in distributed systems",
    ],
    projects: [
      "Implement Raft",
      "Build a replicated key-value store",
      "Build a distributed task scheduler",
      "Run failure-injection experiments",
    ],
    resources: [
      "Designing Data-Intensive Applications",
      "MIT 6.5840 Distributed Systems",
      "Google, Amazon, and Meta systems papers",
    ],
  },
  {
    id: "cloud-runtime",
    title: "Cloud Runtime & Kubernetes",
    goal: "Understand Kubernetes and containers as runtime systems, not just deployment tools.",
    items: [
      "Kubernetes control-plane architecture",
      "kubelet",
      "Scheduler",
      "Controller manager",
      "etcd",
      "OCI image and runtime specifications",
      "containerd and runc",
      "CRI",
      "CNI",
      "CSI",
      "Image distribution and snapshotters",
      "Autoscaling and cluster scheduling",
    ],
    projects: [
      "Write a Kubernetes scheduler plugin",
      "Build a minimal container runtime",
      "Trace pod startup end to end",
      "Benchmark image pulls and snapshot restoration",
      "Contribute to Kubernetes, containerd, or related projects",
    ],
    resources: [
      "Kubernetes source code",
      "OCI specifications",
      "containerd and runc source code",
    ],
  },
  {
    id: "compilers",
    title: "Compilers & Programming Languages",
    goal: "Understand how high-level programs become efficient machine execution.",
    items: [
      "Lexing and parsing",
      "Interpreters and bytecode",
      "Intermediate representations",
      "SSA",
      "Optimization passes",
      "JIT compilation",
      "LLVM",
      "Tracing compilers",
      "Automatic differentiation compilers",
    ],
    projects: [
      "Build a small interpreter",
      "Build a bytecode VM",
      "Write an LLVM optimization pass",
      "Create a toy tensor compiler",
    ],
    resources: ["Crafting Interpreters", "Engineering a Compiler", "LLVM documentation"],
  },
  {
    id: "gpu-systems",
    title: "GPU Systems",
    goal: "Make accelerator behavior intuitive enough to diagnose and improve real workloads.",
    items: [
      "GPU execution model",
      "Warps and scheduling",
      "Memory hierarchy",
      "Occupancy",
      "Tensor cores",
      "CUDA programming",
      "Kernel fusion",
      "Triton",
      "CUTLASS",
      "NCCL",
      "NVLink and multi-GPU communication",
      "GPU profiling",
    ],
    projects: [
      "Write and optimize CUDA kernels",
      "Reimplement a kernel in Triton",
      "Build a roofline analysis",
      "Profile an LLM inference workload",
      "Implement a fused attention-related kernel",
    ],
    resources: [
      "CUDA C++ Programming Guide",
      "Programming Massively Parallel Processors",
      "Triton and CUTLASS source code",
    ],
  },
  {
    id: "ml-systems",
    title: "ML Systems",
    goal: "Understand the complete path from model graph to efficient serving and training.",
    items: [
      "PyTorch internals",
      "torch.compile",
      "XLA",
      "ONNX",
      "TensorRT",
      "Continuous batching",
      "KV-cache management",
      "Paged attention",
      "FlashAttention",
      "Quantization",
      "Speculative decoding",
      "Mixture-of-experts routing",
      "Serving reliability and observability",
    ],
    projects: [
      "Build a tiny inference engine",
      "Implement continuous batching",
      "Build a KV-cache block manager",
      "Reproduce an inference optimization paper",
      "Contribute to vLLM or another serving system",
    ],
    resources: [
      "vLLM source code",
      "PyTorch source code",
      "MLSys and systems-for-ML papers",
    ],
  },
  {
    id: "rl-systems",
    title: "Reinforcement Learning Systems",
    goal: "Master the infrastructure that turns policies, environments, and feedback into scalable learning.",
    items: [
      "RL fundamentals",
      "Rollout generation",
      "Environment execution",
      "Replay buffers",
      "On-policy and off-policy pipelines",
      "Distributed training",
      "Simulation infrastructure",
      "Evaluation systems",
      "Checkpointing",
      "Fault-tolerant workers",
      "Asynchronous actor-learner systems",
    ],
    projects: [
      "Build a distributed rollout engine",
      "Build a replay buffer service",
      "Implement a small actor-learner system",
      "Benchmark execution substrates for RL workloads",
      "Reproduce an RL systems paper",
    ],
    resources: [
      "IMPALA",
      "SEED RL",
      "AlphaStar",
      "OpenAI Five",
      "RL infrastructure papers",
    ],
  },
  {
    id: "agent-runtime",
    title: "Agent & AI Runtime Systems",
    goal: "Develop original expertise in executing millions of intelligent, stateful workloads efficiently.",
    items: [
      "Sandbox isolation",
      "Snapshotting and restoration",
      "Environment scheduling",
      "Agent orchestration",
      "State and filesystem management",
      "Tool execution reliability",
      "Multi-tenant isolation",
      "Cold-start optimization",
      "Long-horizon workload recovery",
      "Evaluation infrastructure",
      "Security boundaries for agents",
      "Cost and capacity modeling",
    ],
    projects: [
      "Design a production-grade sandbox runtime",
      "Build a snapshot-aware scheduler",
      "Create a benchmark suite for agent runtimes",
      "Publish original research on rollout infrastructure",
      "Develop an open-source agent execution primitive",
    ],
    resources: [
      "Firecracker and microVM literature",
      "Container and snapshotter internals",
      "Agent evaluation and execution systems papers",
    ],
  },
  {
    id: "mathematics",
    title: "Mathematics",
    goal: "Build enough mathematical fluency to derive, critique, and invent systems and algorithms.",
    items: [
      "Linear algebra",
      "Probability",
      "Statistics",
      "Optimization",
      "Information theory",
      "Graph theory",
      "Numerical methods",
      "Queueing theory",
    ],
    projects: [
      "Derive important ML systems equations by hand",
      "Model a queueing system",
      "Implement numerical algorithms from scratch",
    ],
    resources: [
      "Mathematics for Machine Learning",
      "Convex Optimization",
      "Introduction to Probability",
    ],
  },
  {
    id: "craft",
    title: "Engineering Craft & Communication",
    goal: "Turn deep technical ability into trusted, visible, high-leverage impact.",
    items: [
      "Python mastery",
      "C and C++",
      "Rust",
      "Go",
      "Profiling and benchmarking",
      "Experimental design",
      "Technical writing",
      "Paper reading",
      "Public speaking",
      "Open-source collaboration",
      "Research taste",
      "Technical leadership",
    ],
    projects: [
      "Publish one substantial technical artifact each quarter",
      "Read and summarize two papers per week",
      "Give technical talks",
      "Maintain a serious open-source project",
      "Mentor others and teach difficult systems concepts",
    ],
    resources: [
      "High-quality source code",
      "Conference talks",
      "Systems and ML research communities",
    ],
  },
];

export function progressKey(
  domainId: string,
  kind: CurriculumKind,
  index: number,
): string {
  const section = kind === "topic" ? "topics" : "projects";
  return `${domainId}:${section}:${index}`;
}
