.PHONY: browserbench

# Compare every installed browser; results are saved to benchmark-results/ as they come in.
# Extra options: make browserbench ARGS="--browser chrome --runs 3"
browserbench:
	node scripts/browser-benchmark/measure.mjs $(ARGS)
