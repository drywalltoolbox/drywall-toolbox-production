from __future__ import annotations

import json
import os
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
IMAGES_DIR = ROOT / "products/Production/wp-images"
REPORT_PATH = ROOT / "products/Production/reports/asgard_wp_image_filename_normalization.json"

ALIASES = {
    "asgard-ag05-asgard-the-hammer-automatic-taper-AT01-AD-01.webp": "asgard-the-hammer-automatic-taper-AT01-AD-01.webp",
    "asgard-ag15-asgard-corner-roller-with-fixed-handle-CR01-AD-FH-AD-01.webp": "asgard-corner-roller-with-fixed-handle-CR01-AD-FH-AD-01.webp",
    "asgard-ag15a-asgard-inside-corner-roller-head-CR01-AD-01.webp": "asgard-inside-corner-roller-head-CR01-AD-01.webp",
    "asgard-ag15ext-asgard-corner-roller-with-extendable-handle-CR01-AD-XH-AD-01.webp": "asgard-corner-roller-with-extendable-handle-CR01-AD-XH-AD-01.webp",
    "asgard-ag20-asgard-finishing-box-EZ07-AD-01.webp": "asgard-finishing-box-EZ07-AD-01.webp",
    "asgard-ag22-asgard-maxxbox-finishing-box-EHC07-AD-01.webp": "asgard-maxxbox-finishing-box-EHC07-AD-01.webp",
    "asgard-ag24-asgard-power-assist-finishing-box-PA07-AD-01.webp": "asgard-power-assist-finishing-box-PA07-AD-01.webp",
    "asgard-ag25-asgard-finishing-box-EZ10-AD-01.webp": "asgard-finishing-box-EZ10-AD-01.webp",
    "asgard-ag26-asgard-maxxbox-finishing-box-EHC10-AD-01.webp": "asgard-maxxbox-finishing-box-EHC10-AD-01.webp",
    "asgard-ag28-asgard-power-assist-finishing-box-PA10-AD-01.webp": "asgard-power-assist-finishing-box-PA10-AD-01.webp",
    "asgard-ag30-asgard-finishing-box-EZ12-AD-01.webp": "asgard-finishing-box-EZ12-AD-01.webp",
    "asgard-ag31-asgard-maxxbox-finishing-box-EHC12-AD-01.webp": "asgard-maxxbox-finishing-box-EHC12-AD-01.webp",
    "asgard-ag33-asgard-power-assist-finishing-box-PA12-AD-01.webp": "asgard-power-assist-finishing-box-PA12-AD-01.webp",
    "asgard-ag35-asgard-angle-box-with-fixed-handle-CA08-AD-FH-AD-01.webp": "asgard-angle-box-with-fixed-handle-CA08-AD-FH-AD-01.webp",
    "asgard-ag35a-asgard-corner-applicator-CA08-AD-01.webp": "asgard-corner-applicator-CA08-AD-01.webp",
    "asgard-ag35ext-asgard-angle-box-with-extendable-handle-CA08-AD-XH-AD-01.webp": "asgard-angle-box-with-extendable-handle-CA08-AD-XH-AD-01.webp",
    "asgard-ag42-asgard-angle-head-AH25-AD-01.webp": "asgard-angle-head-AH25-AD-01.webp",
    "asgard-ag48-asgard-3-angle-head-AH30-AD-01.webp": "asgard-3-angle-head-AH30-AD-01.webp",
    "asgard-ag48x-asgard-angle-head-AH35-AD-01.webp": "asgard-angle-head-AH35-AD-01.webp",
    "asgard-ag68a-asgard-nail-spotter-NS03-AD-01.webp": "asgard-nail-spotter-NS03-AD-01.webp",
    "asgard-ag72-asgard-loading-pump-LP01-AD-01.webp": "asgard-loading-pump-LP01-AD-01.webp",
    "asgard-ag85-asgard-gooseneck-GN01-AD-01.webp": "asgard-gooseneck-GN01-AD-01.webp",
    "asgard-ag88-asgard-finishing-box-handle-extendable-FBHE-AD-01.webp": "asgard-finishing-box-handle-extendable-FBHE-AD-01.webp",
    "asgard-ag90-asgard-filler-adapter-FA01-AD-01.webp": "asgard-filler-adapter-FA01-AD-01.webp",
}


def main() -> None:
    removed: list[dict[str, str]] = []
    skipped: list[dict[str, str]] = []

    for alias_name, canonical_name in ALIASES.items():
        alias_path = IMAGES_DIR / alias_name
        canonical_path = IMAGES_DIR / canonical_name

        if not alias_path.exists():
            skipped.append({"alias": alias_name, "canonical": canonical_name, "reason": "alias_missing"})
            continue
        if not canonical_path.exists():
            skipped.append({"alias": alias_name, "canonical": canonical_name, "reason": "canonical_missing"})
            continue
        if not os.path.samefile(alias_path, canonical_path):
            skipped.append({"alias": alias_name, "canonical": canonical_name, "reason": "not_same_file"})
            continue

        alias_path.unlink()
        removed.append({"alias": alias_name, "canonical": canonical_name})

    summary = {
        "directory": str(IMAGES_DIR.relative_to(ROOT)).replace("\\", "/"),
        "alias_count": len(ALIASES),
        "removed_alias_files": len(removed),
        "skipped_alias_files": len(skipped),
        "removed": removed,
        "skipped": skipped,
    }
    REPORT_PATH.write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
