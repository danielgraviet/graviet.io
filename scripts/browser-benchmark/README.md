# Browser benchmark: one-command measurement

```sh
make browserbench
```

That's the whole workflow. For every installed browser (Safari, Arc, Chrome, Brave), the script quits and relaunches the browser, runs every scenario, and writes the results to CSV. It collects two kinds of data:

- **Whole-browser** (from macOS): launch time, total memory and CPU, and app and profile size. These are what a web page can't see.
- **Page-level** (from the `/browser-benchmark` pages): page load, interaction, tab-switch paint time, and video dropped frames. The script opens the pages itself, switches tabs with AppleScript, and the pages send their results back.

The two kinds go to separate files and are never combined into one score.

With the defaults (5 runs), expect about 45 minutes per browser. The script prints an estimate before it starts. Use `--browser chrome,brave` to limit browsers, `--scenario`, `--runs`, or `--help` for more options.

**The pages must be reachable.** By default the script uses `https://www.graviet.io`, so deploy first, or run `npm run build && npm start` and pass `--base-url http://localhost:3000`. The script checks this before it starts.

## Before you run

- Plug in, use the same display, and quit apps you don't need. The script records the power source in `sessions.csv`.
- For Safari, also quit Mail, Messages, and the App Store (see below).
- Set each browser to open a new window on launch, not to restore previous tabs.
- Use the same extensions policy everywhere, e.g. all extensions disabled.
- **Don't touch the Mac while it runs.** If another app covers the browser, macOS browsers treat their pages as hidden: they stop painting and throttle video. The script brings the browser to the front and records `browser_frontmost`, but it can't stop you from clicking away.
- The first time, macOS asks whether your terminal may control each browser. Allow it, because quitting and switching tabs depend on it. For complete Safari profile sizes, also give your terminal Full Disk Access.

## How it works

The script runs a small local server on `127.0.0.1`. It proxies every request to `--base-url`, so the benchmark pages load from the script's own address. Pages opened with `?report=1` POST their results to `/__bench/report` on that same address. Nothing is sent anywhere else, and visitors to the real site never report. The proxy adds a small, equal delay for every browser, so compare page-load numbers between browsers, not against the live site.

## Scenarios

| Scenario | What the script does | Whole-browser metrics (`observations.csv`) | Page-level metrics (`page-metrics.csv`) |
|---|---|---|---|
| `storage` | `du -sk` on the app bundle and each profile directory (once) | `app_size`, `profile_dir_size`, `profile_size` | — |
| `startup` | Quit, `open -a <app> <local start page>`, wait for the page's `load` event, settle `--settle` s, sample | `launch_to_page_load`, then `total_mem`, `total_cpu`, `process_count` | — |
| `page` | Opens `/browser-benchmark?autostart=page`: 15 filter/sort repetitions, then 5 reloads (once per browser) | — | interaction and navigation timings, per repetition |
| `tabs` | Quit, relaunch with 20 workload tabs, settle `--tabs-settle` s, sample `--idle` s untouched, then switch through all 20 tabs twice | per-sample totals, `browser_frontmost` | tab activation to next paint, per switch |
| `video` | Quit, relaunch with 19 workload tabs plus the video page in front, play and sample for `--video` s | per-sample totals, `mem_change`, `browser_frontmost` | first frame, stalls, dropped and total frames |

The startup time runs from `open` being called until the local page's `load` event reaches the script. That includes process launch, window creation, and one tiny local page load. It does not include the user's homepage, restored tabs, or network.

## Which processes are counted

A process counts when its executable path from `ps -axo pid=,comm=` matches:

| Browser | Rule |
|---|---|
| Chrome | path starts with `/Applications/Google Chrome.app/` (the main process, GPU, network, renderer, and helper processes) |
| Brave | path starts with `/Applications/Brave Browser.app/` |
| Arc | path starts with `/Applications/Arc.app/` |
| Safari | `…/Safari.app/Contents/MacOS/Safari`, plus any `com.apple.WebKit.WebContent`, `com.apple.WebKit.Networking`, or `com.apple.WebKit.GPU` process |

**Safari caveat:** those WebKit processes are system-wide XPC services. Mail, Messages, the App Store, and other apps that embed web views also use them. `ps` can't tell which app owns them, so quit those apps before you measure Safari. `processes.csv` lists every counted process for each sample, so you can check what was included.

CPU and memory come from `top -l 2 -s 1 -stats pid,cpu,mem`, using the second sample because top's first CPU reading is not a delta.

- `MEM` is top's physical footprint, the same number as Activity Monitor's Memory column. It's the most comparable per-process figure macOS offers, but summing it across processes can double-count some shared memory.
- `total_cpu` is the sum of per-process `%CPU`, as a percentage of one core. 250 means two and a half cores.

## Which directories are counted

| Browser | App | Profile directories (under `~`) |
|---|---|---|
| Safari | `/Applications/Safari.app` (on current macOS most of Safari lives in a system cryptex, so this undercounts) | `Library/Safari`, `Library/Containers/com.apple.Safari`, `Library/Caches/com.apple.Safari`, `Library/WebKit/com.apple.Safari` |
| Chrome | `/Applications/Google Chrome.app` | `Library/Application Support/Google/Chrome`, `Library/Caches/Google/Chrome` |
| Brave | `/Applications/Brave Browser.app` | `Library/Application Support/BraveSoftware/Brave-Browser`, `Library/Caches/BraveSoftware/Brave-Browser` |
| Arc | `/Applications/Arc.app` | `Library/Application Support/Arc`, `Library/Caches/Arc`, `Library/Caches/company.thebrowser.Browser` |

App size and profile size are reported separately. Profile size mostly reflects your own history and cache, not the browser's efficiency.

## Output

All output is appended to `benchmark-results/` (gitignored), so repeated runs add to the same files. Every sample is written the moment it's taken, so a crash or Ctrl-C keeps everything recorded up to that point. If one scenario or browser fails, the script logs it (a `scenario_failed` row) and moves on to the next.

- `sessions.csv`: one row per invocation, with the browser version, Mac model, macOS version, power source, and every timing option.
- `observations.csv`: long format, one row per observation (`scenario, run, sample, elapsed_s, metric, value, unit, detail`). Pivot on `browser × scenario × metric` for charts.
- `page-metrics.csv`: page-level results, one row per individual repetition, with `foreground_throughout`.
- `processes.csv`: every counted process in every sample, for auditing.

At the end, the script prints each scenario's median across runs. For memory and CPU, it first takes the median of samples within each run, then the median across runs.
