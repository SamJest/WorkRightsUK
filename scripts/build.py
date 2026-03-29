from pathlib import Path

print("Static deployment pack detected.")
print("No build step is required before deploying the current checkpoint files.")
print("Project root:", Path(__file__).resolve().parent.parent)
