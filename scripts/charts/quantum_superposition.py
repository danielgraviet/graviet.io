"""Create the illustrative three-qubit superposition chart."""

import argparse
from pathlib import Path

import matplotlib.pyplot as plt


LABELS = ["000", "001", "010", "011", "100", "101", "110", "111"]
VALUES = [6, 18, 9, 14, 22, 11, 8, 12]
AFTER_VALUES = [1, 4, 2, 3, 5, 75, 3, 7]
AVERAGE = 100 / len(VALUES)


def create_chart(output: Path, values: list[int]) -> None:
    output.parent.mkdir(parents=True, exist_ok=True)

    plt.rcParams.update(
        {
            "font.family": "DejaVu Sans",
            "font.size": 9,
            "axes.labelsize": 10,
            "xtick.labelsize": 9,
            "ytick.labelsize": 9,
            "axes.linewidth": 0.8,
        }
    )
    fig, ax = plt.subplots(figsize=(5.8, 3.4), dpi=220)
    fig.patch.set_facecolor("white")
    ax.set_facecolor("white")
    ax.barh(
        LABELS,
        values,
        color="#4878a8",
        edgecolor="#315a82",
        linewidth=0.45,
        height=0.68,
    )
    ax.invert_yaxis()
    ax.set_xlim(0, max(25, max(values) + 5))
    ax.set_xlabel("Measurement probability (%)", labelpad=6)
    ax.set_ylabel("State", labelpad=6)
    ax.axvline(AVERAGE, color="#c45d3c", linestyle=(0, (3, 2)), linewidth=1.1)
    ax.text(
        AVERAGE + 0.45,
        -0.45,
        f"uniform ({AVERAGE:.1f}%)",
        color="#a54f34",
        ha="left",
        va="bottom",
        fontsize=8,
    )
    ax.grid(axis="x", color="#d9dfe5", linewidth=0.65)
    ax.set_axisbelow(True)
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    ax.spines["left"].set_color("#6b7280")
    ax.spines["bottom"].set_color("#6b7280")
    ax.tick_params(axis="both", colors="#374151", length=3, width=0.7)

    for bar, value in zip(ax.patches, values):
        ax.text(
            value + 0.35,
            bar.get_y() + bar.get_height() / 2,
            f"{value}%",
            va="center",
            fontsize=8.5,
            color="#374151",
        )

    fig.tight_layout(pad=0.8)
    fig.savefig(output, bbox_inches="tight", facecolor=fig.get_facecolor())
    plt.close(fig)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("output", type=Path, help="Path for the generated PNG")
    parser.add_argument("--after", action="store_true", help="Plot the post-interference distribution")
    args = parser.parse_args()
    create_chart(args.output, AFTER_VALUES if args.after else VALUES)
