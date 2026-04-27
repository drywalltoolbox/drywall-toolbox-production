#!/usr/bin/env python3
from __future__ import annotations

import csv
import html
import json
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Iterable


REPO_ROOT = Path(__file__).resolve().parent.parent
PUBLIC_CSV = REPO_ROOT / "frontend/public/wp-catalog.csv"
BACKUP_CSV = REPO_ROOT / "frontend/public/wp-catalog.columbia-tools-cleanup.bak"
SCRAPED_JSON = REPO_ROOT / "scripts/scraped_results/Columbia/columbia_tools/products.json"
REPORT_PATH = REPO_ROOT / "scripts/scraped_results/Columbia/columbia_tools/rebuild-report.txt"

BRAND = "Columbia Taping Tools"

CAT_HAND = "Drywall Finishing Tools > Columbia Taping Tools > Hand Tools"
CAT_AUTO = "Drywall Finishing Tools > Columbia Taping Tools > Automatic Tapers"
CAT_PUMPS = "Drywall Finishing Tools > Columbia Taping Tools > Pumps & Accessories"
CAT_CASES = "Drywall Finishing Tools > Columbia Taping Tools > Tool Cases"
CAT_SMOOTH = "Drywall Finishing Tools > Columbia Taping Tools > Smoothing Blades"
CAT_BOXES = "Drywall Finishing Tools > Columbia Taping Tools > Finishing Boxes"
CAT_CORNER = "Drywall Finishing Tools > Columbia Taping Tools > Corner & Angle Tools"
CAT_SPOT = "Drywall Finishing Tools > Columbia Taping Tools > Spotters"
CAT_APPS = "Drywall Finishing Tools > Columbia Taping Tools > Applicators"
CAT_HANDLES = "Drywall Finishing Tools > Columbia Taping Tools > Handles & Extensions"
CAT_TUBES = "Drywall Finishing Tools > Columbia Taping Tools > Compound Tubes"
CAT_MUD = "Drywall Finishing Tools > Columbia Taping Tools > Grooved Mud Heads"
CAT_SET = "Drywall Finishing Tools > Columbia Taping Tools > Tool Sets & Bundles"
CAT_SAND = "Drywall Finishing Tools > Columbia Taping Tools > Sanders"

PARENT_FIELDS = {
    "Brands": BRAND,
    "Published": "1",
    "Is featured?": "0",
    "Visibility in catalog": "visible",
    "Tax status": "taxable",
    "In stock?": "1",
    "Backorders allowed?": "0",
    "Sold individually?": "0",
    "Allow customer reviews?": "1",
    "Attribute 1 visible": "1",
    "Attribute 1 global": "1",
    "Attribute 1 used for variations": "1",
}

SIMPLE_FIELDS = {
    "Brands": BRAND,
    "Published": "1",
    "Is featured?": "0",
    "Visibility in catalog": "visible",
    "Tax status": "taxable",
    "In stock?": "1",
    "Backorders allowed?": "0",
    "Sold individually?": "0",
    "Allow customer reviews?": "1",
}

VARIATION_FIELDS = {
    "Brands": BRAND,
    "Published": "1",
    "Is featured?": "0",
    "Visibility in catalog": "visible",
    "Tax status": "taxable",
    "In stock?": "1",
    "Backorders allowed?": "0",
    "Sold individually?": "0",
    "Allow customer reviews?": "1",
    "Attribute 1 visible": "1",
    "Attribute 1 global": "1",
    "Attribute 1 used for variations": "1",
}

LOGO_NAME = "columbialogo.png"
TAG_SPLIT_RE = re.compile(r"[^A-Za-z0-9.+#-]+")
HTML_TAG_RE = re.compile(r"<[^>]+>")


@dataclass
class VariantSpec:
    sku: str
    label: str
    backup_sku: str | None = None
    name_override: str | None = None


@dataclass
class FamilySpec:
    key: str
    source_names: list[str]
    category: str
    kind: str
    parent_sku: str | None = None
    parent_name: str | None = None
    attribute_name: str | None = None
    variants: list[VariantSpec] = field(default_factory=list)
    backup_parent_sku: str | None = None
    backup_placeholder_skus: list[str] = field(default_factory=list)
    simple_sku: str | None = None
    simple_name: str | None = None
    backup_simple_sku: str | None = None
    source_description_name: str | None = None
    tag_terms: list[str] = field(default_factory=list)


FAMILIES: list[FamilySpec] = [
    FamilySpec("taping-knives", ["Taping Knives"], CAT_HAND, "variable", "COL-CTK", "Columbia Stainless Steel Comfort Grip Taping Knife", "Size", [
        VariantSpec("CTK8", '8"'),
        VariantSpec("CTK10", '10"'),
        VariantSpec("CTK12", '12"'),
        VariantSpec("CTK14", '14"'),
    ], backup_parent_sku="COL-CTK", backup_placeholder_skus=["ONEPIECEPUTTYKNIVESCOPY"], tag_terms=["taping knife", "stainless knife", "comfort grip"]),
    FamilySpec("mud-pans", ["Mud Pans"], CAT_HAND, "variable", "COL-CMP", "Columbia Stainless Steel Mud Pan", "Size", [
        VariantSpec("C12MP-6", '12"', "C12MPX6", 'Columbia 12" Stainless Steel Mud Pan'),
        VariantSpec("C14MP-6", '14"', "C14MPX6", 'Columbia 14" Stainless Steel Mud Pan'),
        VariantSpec("C16MP-6", '16"', "C16MPX6", 'Columbia 16" Stainless Steel Mud Pan'),
    ], backup_parent_sku="COL-CMPX6", backup_placeholder_skus=["MUDPANS"], tag_terms=["mud pan", "stainless mud pan"]),
    FamilySpec("trowels", ["Trowels"], CAT_HAND, "variable", "COL-TROWEL", "Columbia Premium Finishing Trowels", "Model", [
        VariantSpec("12-4.7-0.7-G-C", '12" Gold Finishing Trowel'),
        VariantSpec("14-4.7-0.7-G-C", '14" Gold Finishing Trowel'),
        VariantSpec("16-4.7-0.7-G-C", '16" Gold Finishing Trowel'),
        VariantSpec("18-4.7-0.7-G-C", '18" Gold Finishing Trowel'),
        VariantSpec("12-4.7-0.7-G-C-C", '12" Gold Curved Trowel'),
        VariantSpec("14-4.7-0.7-G-C-C", '14" Gold Curved Trowel'),
        VariantSpec("16-4.7-0.7-G-C-C", '16" Gold Curved Trowel'),
        VariantSpec("12-4.7-0.4-S-C-C", '12" Silver Curved Trowel'),
        VariantSpec("14-4.7-0.4-S-C-C", '14" Silver Curved Trowel'),
        VariantSpec("12-4.3-0.3-G-C", '12" Gold Finishing Trowel .3mm'),
        VariantSpec("14-4.3-0.3-G-C", '14" Gold Finishing Trowel .3mm'),
    ], backup_placeholder_skus=["COLUMBIAMUDPANS3"], tag_terms=["finishing trowel", "gold trowel", "silver trowel"]),
    FamilySpec("finishing-hawk", ["Finishing Hawks"], CAT_HAND, "simple", simple_sku="13-H-S", simple_name='Columbia 13" Finishing Hawk', backup_simple_sku="FINISHINGHAWKS", tag_terms=["finishing hawk", "cork handle"]),
    FamilySpec("bucket-scoops", ["Bucket Scoops"], CAT_HAND, "variable", "COL-BS", "Columbia Bucket Scoop", "Handle Type", [
        VariantSpec("OPBS", "One Piece Stainless Steel"),
        VariantSpec("CBS2K", "Comfort Grip"),
        VariantSpec("BCNC", "Cork Handle"),
    ], backup_placeholder_skus=["THREEWAYKNIVESCOPY"], tag_terms=["bucket scoop", "comfort grip", "cork handle"]),
    FamilySpec("fat-boy-smoothing", ["Fat Boy Smoothing Blades"], CAT_HAND, "variable", "COL-FSB", "Columbia Fat Boy Smoothing Blade", "Size", [
        VariantSpec("FSB7", '7"'),
        VariantSpec("FSB10", '10"'),
        VariantSpec("FSB12", '12"'),
        VariantSpec("FSB14", '14"'),
        VariantSpec("FSB16", '16"'),
        VariantSpec("FSB18", '18"'),
        VariantSpec("FSB24", '24"'),
        VariantSpec("FSB32", '32"'),
        VariantSpec("FSB40", '40"'),
        VariantSpec("FSB48", '48"'),
    ], backup_placeholder_skus=["FATBOYSMOOTHINGBLADES"], tag_terms=["fat boy smoothing blade", "skimming blade"]),
    FamilySpec("tactical-set", ["The Tactical Set"], CAT_SET, "simple", simple_sku="TS", simple_name="Columbia Tactical Tool Set", tag_terms=["tool set", "automatic taper set"]),
    FamilySpec("commando-set", ["The Commando Set"], CAT_SET, "simple", simple_sku="SACS", simple_name="Columbia Commando Tool Set", tag_terms=["semi automatic set", "tool set"]),
    FamilySpec("predator-tactical-set", ["The Predator Tactical Set"], CAT_SET, "simple", simple_sku="PTS", simple_name="Columbia Predator Tactical Tool Set", tag_terms=["predator set", "tool set"]),
    FamilySpec("warrior-set", ["The Warrior Set"], CAT_SET, "simple", simple_sku="TWS", simple_name="Columbia Warrior Tool Set", tag_terms=["smoothing blade set", "tool set"]),
    FamilySpec("sabre-set", ["The Sabre Set"], CAT_SET, "simple", simple_sku="SBSET", simple_name="Columbia Sabre Tool Set", tag_terms=["sabre set", "tool set"]),
    FamilySpec("predator-taper", ["Columbia One Predator Taper"], CAT_AUTO, "simple", simple_sku="PTAPER", simple_name="Columbia Predator Carbon Fiber Automatic Taper", tag_terms=["predator taper", "automatic taper"]),
    FamilySpec("automatic-taper", ["Automatic Taper"], CAT_AUTO, "simple", simple_sku="TAPER", simple_name="Columbia Automatic Taper", tag_terms=["automatic taper", "bazooka"]),
    FamilySpec("sawed-off-taper", ["Sawed Off Taper"], CAT_AUTO, "variable", "COL-STAPER", "Columbia Sawed Off Automatic Taper", "Material/Type", [
        VariantSpec("STAPER", "Standard Billet"),
        VariantSpec("SPTAPER", "Predator Carbon Fiber"),
    ], tag_terms=["mini taper", "sawed off taper"]),
    FamilySpec("tallboy-pump", ["Tall Boy Mud Pump"], CAT_PUMPS, "simple", simple_sku="TBMP", simple_name="Columbia Tall Boy Mud Pump", tag_terms=["tall boy pump", "mud pump"]),
    FamilySpec("mud-pump", ["Mud Pump"], CAT_PUMPS, "simple", simple_sku="HMP", simple_name="Columbia Mud Pump", tag_terms=["mud pump"]),
    FamilySpec("gooseneck", ["Gooseneck"], CAT_PUMPS, "variable", "COL-GN", "Columbia Gooseneck", "Style", [
        VariantSpec("GN", "Standard"),
        VariantSpec("TBGN", "Tall Boy"),
    ], backup_parent_sku="COL-GN", tag_terms=["gooseneck", "taper filler"]),
    FamilySpec("box-filler", ["Box Filler"], CAT_PUMPS, "variable", "COL-BF", "Columbia Box Filler", "Style", [
        VariantSpec("BF", "Standard"),
        VariantSpec("TBBF", "Tall Boy"),
    ], tag_terms=["box filler", "pump attachment"]),
    FamilySpec("powerfill", ["Columbia X Graco PowerFill 3.5"], CAT_PUMPS, "simple", simple_sku="CPFP", simple_name="Columbia X Graco PowerFill 3.5", tag_terms=["powerfill", "graco"]),
    FamilySpec("road-case", ["The Road Case"], CAT_CASES, "simple", simple_sku="RC", simple_name="Columbia Road Case", tag_terms=["road case", "tool case"]),
    FamilySpec("semi-auto-case", ["The Semi-Automatic Case"], CAT_CASES, "simple", simple_sku="TCS", simple_name="Columbia Semi-Automatic Case", tag_terms=["semi automatic case", "tool case"]),
    FamilySpec("tomahawk", ["Tomahawk Smoothing Blades"], CAT_SMOOTH, "variable", "COL-TSB", "Columbia Tomahawk Smoothing Blade", "Size", [
        VariantSpec("TSB7", '7"'),
        VariantSpec("TSB10", '10"'),
        VariantSpec("TSB12", '12"'),
        VariantSpec("TSB14", '14"'),
        VariantSpec("TSB18", '18"'),
        VariantSpec("TSB24", '24"'),
        VariantSpec("TSB32", '32"'),
        VariantSpec("TSB40", '40"'),
        VariantSpec("TSB48", '48"'),
    ], backup_parent_sku="COL-TSB", tag_terms=["tomahawk smoothing blade", "skimming blade"]),
    FamilySpec("tomalock", ["Tomalock"], CAT_SMOOTH, "simple", simple_sku="CLTHA", simple_name="Columbia Tomalock Adapter", tag_terms=["tomalock", "adapter"]),
    FamilySpec("sabre", ["Sabre Smoothing Blades"], CAT_SMOOTH, "variable", "COL-SSB", "Columbia Sabre Smoothing Blade", "Size", [
        VariantSpec("SSB7", '7"'),
        VariantSpec("SSB10", '10"'),
        VariantSpec("SSB12", '12"'),
        VariantSpec("SSB14", '14"'),
        VariantSpec("SSB16", '16"'),
        VariantSpec("SSB18", '18"'),
        VariantSpec("SSB24", '24"'),
        VariantSpec("SSB32", '32"'),
        VariantSpec("SSB40", '40"'),
        VariantSpec("SSB48", '48"'),
    ], backup_parent_sku="COL-SSB", tag_terms=["sabre smoothing blade", "skimming blade"]),
    FamilySpec("flat-boxes", ["Flat Boxes"], CAT_BOXES, "variable", "COL-FFB", "Columbia Flat Finishing Box", "Size", [
        VariantSpec("55FFB", '5.5"'),
        VariantSpec("7FFB", '7"'),
        VariantSpec("8FFB", '8"'),
        VariantSpec("10FFB", '10"'),
        VariantSpec("12FFB", '12"'),
        VariantSpec("14FFB", '14"'),
    ], backup_parent_sku="COL-FFB", backup_placeholder_skus=["FLATBOXES"], tag_terms=["flat box", "finishing box"]),
    FamilySpec("fatboy-boxes", ["Fat Boy Boxes"], CAT_BOXES, "variable", "COL-FBB", "Columbia Fat Boy Flat Box", "Size", [
        VariantSpec("55FBB", '5.5"'),
        VariantSpec("8FBB", '8"'),
        VariantSpec("10FBB", '10"'),
        VariantSpec("12FBB", '12"'),
    ], backup_parent_sku="COL-FBB", backup_placeholder_skus=["FATBOYBOXES"], tag_terms=["fat boy box", "flat box"]),
    FamilySpec("auto-flat-boxes", ["Automatic Flat Boxes"], CAT_BOXES, "variable", "COL-FFBA", "Columbia Automatic Flat Box", "Size", [
        VariantSpec("8FFBA", '8"'),
        VariantSpec("10FFBA", '10"'),
        VariantSpec("12FFBA", '12"'),
        VariantSpec("14FFBA", '14"'),
    ], backup_placeholder_skus=["AUTOMATICFLATBOXES"], tag_terms=["automatic flat box", "finishing box"]),
    FamilySpec("auto-fatboy-boxes", ["Automatic Flat Boxes"], CAT_BOXES, "variable", "COL-FBBA", "Columbia Fat Boy Automatic Flat Box", "Size", [
        VariantSpec("8FBBA", '8"'),
        VariantSpec("10FBBA", '10"'),
        VariantSpec("12FBBA", '12"'),
    ], backup_parent_sku="COL-FBBA", backup_placeholder_skus=["AUTOMATICFLATBOXES"], tag_terms=["automatic flat box", "fat boy box"]),
    FamilySpec("inside-track", ["Inside Track Conversion Kits"], CAT_BOXES, "simple", simple_sku="ITC-K", simple_name="Columbia Inside Track Conversion Kit", tag_terms=["inside track conversion kit", "flat box kit"]),
    FamilySpec("corner-cobra", ["Corner Cobra"], CAT_CORNER, "simple", simple_sku="CC", simple_name="Columbia Corner Cobra Adjustable Roller", tag_terms=["corner cobra", "corner roller"]),
    FamilySpec("inside-corner-roller", ["Inside Corner Roller"], CAT_CORNER, "simple", simple_sku="CR", simple_name="Columbia Inside Corner Roller", tag_terms=["corner roller"]),
    FamilySpec("outside-corner-rollers", ["Standard Outside Corner Roller", "Bullnose Outside Corner Roller", "Wide Outside Corner Roller", "European/Micro Outside Corner Roller"], CAT_CORNER, "variable", "COL-OCR", "Columbia Outside Corner Roller", "Profile", [
        VariantSpec("COBCR", "Standard"),
        VariantSpec("CBNCR", "Bullnose"),
        VariantSpec("COBCRW", "Wide"),
        VariantSpec("COBCRE", "European/Micro"),
    ], tag_terms=["outside corner roller", "bullnose roller", "wide roller"]),
    FamilySpec("angleheads", ["2″ Anglehead", "2.5″ AngleHead", "3″ Anglehead", "3.5″ Anglehead"], CAT_CORNER, "variable", "COL-AH", "Columbia Anglehead", "Size", [
        VariantSpec("2AH", '2"'),
        VariantSpec("25AH", '2.5"'),
        VariantSpec("3AH", '3"'),
        VariantSpec("35AH", '3.5"'),
    ], backup_parent_sku="COL-AH", tag_terms=["anglehead", "corner finisher"]),
    FamilySpec("anglehead-adaptor", ["Anglehead Adaptor"], CAT_CORNER, "simple", simple_sku="AHA", simple_name="Columbia Anglehead Adaptor", tag_terms=["anglehead adaptor", "one handle"]),
    FamilySpec("nailspotter", ["2″ Nailspotter", "3″ Nailspotter"], CAT_SPOT, "variable", "COL-NS", "Columbia Nailspotter", "Size", [
        VariantSpec("2NS", '2"'),
        VariantSpec("3NS", '3"'),
    ], backup_parent_sku="COL-NS", tag_terms=["nailspotter", "screw spotter"]),
    FamilySpec("throttle-box", ["7 Inch Throttle Box", "8 Inch Throttle Box"], CAT_BOXES, "variable", "COL-CFB", "Columbia Throttle Box", "Size", [
        VariantSpec("7CFB", '7"'),
        VariantSpec("8CFB", '8"'),
    ], backup_parent_sku="COL-CFB", tag_terms=["throttle box", "corner box"]),
    FamilySpec("standard-flusher", ["Standard Corner Flusher"], CAT_CORNER, "variable", "COL-SF", "Columbia Standard Corner Flusher", "Profile", [
        VariantSpec("25SF", '2.5"'),
        VariantSpec("3SF", '3"'),
        VariantSpec("35SF", '3.5"'),
        VariantSpec("4SF", '4"'),
        VariantSpec("3WTSF", "Wide Track"),
    ], backup_placeholder_skus=["STANDARDCORNERFLUSHER"], tag_terms=["standard corner flusher", "corner flusher"]),
    FamilySpec("direct-flusher", ["Direct Corner Flusher"], CAT_CORNER, "variable", "COL-DF", "Columbia Direct Corner Flusher", "Profile", [
        VariantSpec("25DF", '2.5"'),
        VariantSpec("3DF", '3"'),
        VariantSpec("35DF", '3.5"'),
        VariantSpec("4DF", '4"'),
        VariantSpec("3WTDF", "Wide Track"),
    ], backup_parent_sku="COL-DF", backup_placeholder_skus=["DIRECTCORNERFLUSHER"], tag_terms=["direct corner flusher", "corner flusher"]),
    FamilySpec("combo-flusher", ["Combo Flusher"], CAT_CORNER, "variable", "COL-CSF", "Columbia Combo Flusher", "Profile", [
        VariantSpec("25CSF", '2.5"'),
        VariantSpec("3CSF", '3"'),
        VariantSpec("35CSF", '3.5"'),
        VariantSpec("3WTCSF", "Wide Track"),
    ], backup_parent_sku="COL-CSF", backup_placeholder_skus=["COMBOFLUSHER"], tag_terms=["combo flusher", "corner flusher"]),
    FamilySpec("semi-auto-taper", ["Semi Automatic Taper"], CAT_AUTO, "simple", simple_sku="SAT", simple_name="Columbia Semi-Automatic Taper", tag_terms=["semi automatic taper", "bucket taper"]),
    FamilySpec("sander-head", ["Sander Head"], CAT_SAND, "variable", "COL-CS", "Columbia Sander Head", "Style", [
        VariantSpec("CS", "Standard"),
        VariantSpec("CSH", "Head Kit"),
    ], tag_terms=["sander head", "drywall sander"]),
    FamilySpec("phantom-sander", ["The Phantom Sander"], CAT_SAND, "simple", simple_sku="PDDM", simple_name="Columbia Phantom Sander", tag_terms=["phantom sander", "dustless sander"]),
    FamilySpec("external-applicator", ["External Corner Applicator"], CAT_APPS, "simple", simple_sku="CEXT90", simple_name="Columbia External Corner Applicator", tag_terms=["external corner applicator", "mud applicator"]),
    FamilySpec("inside-applicator", ["Inside Corner Applicator"], CAT_APPS, "variable", "COL-ICA", "Columbia Inside Corner Applicator", "Model", [
        VariantSpec("ICA2-1", "Two Wheel"),
        VariantSpec("ICA4-1", "Four Wheel"),
    ], tag_terms=["inside corner applicator", "two wheel", "four wheel"]),
    FamilySpec("two-way-applicator", ["Two Way Internal Corner Applicator"], CAT_APPS, "simple", simple_sku="ICATW", simple_name="Columbia Two Way Internal Corner Applicator", tag_terms=["two way applicator", "internal corner applicator"]),
    FamilySpec("flat-applicator", ["Flat Applicators"], CAT_APPS, "simple", simple_sku="CFLT", simple_name="Columbia Flat Applicator", tag_terms=["flat applicator"]),
    FamilySpec("columbia-one", ["Columbia One"], CAT_HANDLES, "variable", "COL-C1", "Columbia One Handle", "Length", [
        VariantSpec("C1H", "4' Fixed"),
        VariantSpec("C1HEXT", "3'-5' Extendable"),
        VariantSpec("C1HS", "Short Extension"),
    ], tag_terms=["columbia one handle", "extendable handle"]),
    FamilySpec("matrix-handles", ["The Matrix Box Handles"], CAT_HANDLES, "variable", "COL-MH", "Columbia Matrix Flat Box Handles", "Length", [
        VariantSpec("MHS", '29-39"'),
        VariantSpec("MH", '40-58"'),
        VariantSpec("MHL", '56-76"'),
    ], backup_parent_sku="COL-MH", tag_terms=["matrix handle", "flat box handle"]),
    FamilySpec("long-handle", ["Long Extendible Handle"], CAT_HANDLES, "simple", simple_sku="CHXL", simple_name="Columbia Long Extendible Handle", tag_terms=["extendible handle"]),
    FamilySpec("closet-monster", ["Closet Monster Flat Box Handle"], CAT_HANDLES, "simple", simple_sku="CMH", simple_name='Columbia 18" Closet Monster Flat Box Handle', backup_simple_sku="CMH", tag_terms=["closet monster handle"]),
    FamilySpec("twist-lock", ["Twist Lock Handle"], CAT_HANDLES, "simple", simple_sku="TL3-8", simple_name="Columbia Twist Lock Handle", tag_terms=["twist lock handle"]),
    FamilySpec("flat-box-handle", ["Flat Box Handle"], CAT_HANDLES, "variable", "COL-BH", "Columbia Flat Box Handle", "Length", [
        VariantSpec("3BH", '36"'),
        VariantSpec("42BH", '42"'),
        VariantSpec("4BH", '48"'),
        VariantSpec("5BH", '60"'),
        VariantSpec("6BH", '72"'),
    ], backup_parent_sku="COL-BH", tag_terms=["flat box handle"]),
    FamilySpec("compound-tubes", ["Compound Tubes"], CAT_TUBES, "variable", "COL-CMT", "Columbia Compound Tube", "Length", [
        VariantSpec("CMT24", '24"'),
        VariantSpec("CMT32", '32"'),
        VariantSpec("CMT42", '42"'),
        VariantSpec("CMT55", '55"'),
    ], backup_parent_sku="COL-CMT", tag_terms=["compound tube"]),
    FamilySpec("cam-lock-tubes", ["Cam Lock Tube"], CAT_TUBES, "variable", "COL-CLT", "Columbia Cam Lock Tube", "Length", [
        VariantSpec("CLT24", '24"'),
        VariantSpec("CLT32", '32"'),
        VariantSpec("CLT42", '42"'),
        VariantSpec("CLT55", '55"'),
    ], backup_parent_sku="COL-CLT", tag_terms=["cam lock tube"]),
    FamilySpec("cam-lock-filler", ["Cam Lock Tube Box Filler"], CAT_TUBES, "simple", simple_sku="CLTBF", simple_name="Columbia Cam Lock Tube Box Filler", tag_terms=["cam lock box filler"]),
    FamilySpec("inside-90-mud-head", ["Inside 90 Grooved Mud Heads"], CAT_MUD, "simple", simple_sku="IA90", simple_name="Columbia Inside 90 Grooved Mud Head", tag_terms=["grooved mud head"]),
    FamilySpec("outside-90-mud-head", ["Outside 90 Grooved Mud Heads"], CAT_MUD, "variable", "COL-OA90", "Columbia Outside 90 Grooved Mud Head", "Type", [
        VariantSpec("OA90", "Standard"),
        VariantSpec("OA90-325", "325 No-Coat"),
    ], tag_terms=["outside 90 grooved mud head"]),
    FamilySpec("flat-mud-head", ["Flat Grooved Mud Heads"], CAT_MUD, "simple", simple_sku="FMH", simple_name="Columbia Flat Grooved Mud Head", tag_terms=["flat grooved mud head"]),
]


def load_csv(path: Path) -> tuple[list[str], list[dict[str, str]]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        return list(reader.fieldnames or []), list(reader)


def write_csv(path: Path, fieldnames: list[str], rows: list[dict[str, str]]) -> None:
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)


def plain_text(value: str) -> str:
    text = HTML_TAG_RE.sub(" ", value or "")
    text = html.unescape(text).replace("\xa0", " ")
    return " ".join(text.split())


def short_text(value: str, limit: int = 220) -> str:
    text = plain_text(value)
    if len(text) <= limit:
        return text
    clipped = text[: limit - 1].rsplit(" ", 1)[0]
    return f"{clipped}…"


def dedupe(values: Iterable[str]) -> list[str]:
    seen: set[str] = set()
    result: list[str] = []
    for value in values:
        if not value or value in seen:
            continue
        seen.add(value)
        result.append(value)
    return result


def split_images(value: str) -> list[str]:
    return [item.strip() for item in (value or "").split("|") if item.strip()]


def slug_keywords(*values: str) -> list[str]:
    words: list[str] = []
    for value in values:
        for part in TAG_SPLIT_RE.split(plain_text(value).lower()):
            if len(part) >= 2 and not part.isdigit():
                words.append(part)
    return dedupe(words)


def build_tags(name: str, skus: Iterable[str], extra: Iterable[str]) -> str:
    tags = list(extra)
    tags.extend(skus)
    tags.extend(slug_keywords(name))
    return ", ".join(dedupe([item for item in tags if item]))


def build_seo_title(name: str, sku: str | None = None) -> str:
    if sku:
        return f"{name} - {sku}"
    return f"{name} | Columbia Taping Tools"


def build_seo_description(name: str, description_html: str) -> str:
    text = short_text(description_html, 155)
    if text:
        return text
    return f"{name} by Columbia Taping Tools. Shop Drywall Toolbox."


def product_map() -> dict[str, dict[str, object]]:
    products = json.loads(SCRAPED_JSON.read_text(encoding="utf-8"))
    mapped: dict[str, dict[str, object]] = {}
    for product in products:
        images = product.get("image_urls") or []
        if len(images) == 1 and LOGO_NAME in images[0]:
            continue
        if product.get("category") == "Maintenance Kits":
            continue
        if product.get("name") in {"SUGGESTED SETS"}:
            continue
        mapped[product["name"]] = product
    return mapped


def backup_indexes(rows: list[dict[str, str]]) -> tuple[dict[str, dict[str, str]], dict[str, list[dict[str, str]]]]:
    by_sku: dict[str, dict[str, str]] = {}
    by_parent: dict[str, list[dict[str, str]]] = {}
    for row in rows:
        if (row.get("Brands") or "") != BRAND:
            continue
        sku = (row.get("SKU") or "").strip()
        if sku:
            by_sku[sku] = row
        parent = (row.get("Parent") or "").strip()
        if parent:
            by_parent.setdefault(parent, []).append(row)
    return by_sku, by_parent


def blank_row(fieldnames: list[str]) -> dict[str, str]:
    return {field: "" for field in fieldnames}


def choose_description(spec: FamilySpec, products: dict[str, dict[str, object]]) -> str:
    for name in ([spec.source_description_name] if spec.source_description_name else []) + spec.source_names:
        if not name:
            continue
        product = products.get(name)
        if product and product.get("description"):
            return str(product["description"])
    return ""


def combined_local_images(spec: FamilySpec, products: dict[str, dict[str, object]]) -> list[str]:
    images: list[str] = []
    for name in spec.source_names:
        product = products.get(name)
        if not product:
            continue
        images.extend(product.get("local_images") or [])
    return dedupe(images)


def gather_images(
    spec: FamilySpec,
    backup_by_sku: dict[str, dict[str, str]],
    row_skus: Iterable[str],
) -> list[str]:
    images: list[str] = []
    for sku in row_skus:
        backup_row = backup_by_sku.get(sku)
        if backup_row:
            images.extend(split_images(backup_row.get("Images", "")))
    for sku in [spec.backup_parent_sku, spec.parent_sku, spec.backup_simple_sku, spec.simple_sku, *spec.backup_placeholder_skus]:
        if not sku:
            continue
        backup_row = backup_by_sku.get(sku)
        if backup_row:
            images.extend(split_images(backup_row.get("Images", "")))
    return dedupe(images)


def restore_base_row(
    fieldnames: list[str],
    source: dict[str, str] | None,
    defaults: dict[str, str],
) -> dict[str, str]:
    row = blank_row(fieldnames)
    if source:
        for field in fieldnames:
            row[field] = source.get(field, "")
    row.update(defaults)
    return row


def make_parent_row(
    fieldnames: list[str],
    spec: FamilySpec,
    products: dict[str, dict[str, object]],
    backup_by_sku: dict[str, dict[str, str]],
    position: int,
) -> dict[str, str]:
    source = backup_by_sku.get(spec.backup_parent_sku or "") or backup_by_sku.get(spec.parent_sku or "")
    row = restore_base_row(fieldnames, source, PARENT_FIELDS)
    description = choose_description(spec, products)
    variant_skus = [variant.backup_sku or variant.sku for variant in spec.variants]
    images = gather_images(spec, backup_by_sku, variant_skus)
    row.update(
        {
            "Type": "variable",
            "SKU": spec.parent_sku or "",
            "MPN": spec.parent_sku or "",
            "Name": spec.parent_name or "",
            "Short description": short_text(description),
            "Description": description,
            "Categories": spec.category,
            "Tags": build_tags(spec.parent_name or "", [variant.sku for variant in spec.variants], spec.tag_terms),
            "Images": "|".join(images),
            "Position": str(position),
            "Attribute 1 name": spec.attribute_name or "Option",
            "Attribute 1 value(s)": " | ".join(variant.label for variant in spec.variants),
            "Attribute 2 name": "",
            "Attribute 2 value(s)": "",
            "Attribute 2 visible": "",
            "Attribute 2 global": "",
            "Attribute 2 used for variations": "",
            "meta:_dtb_seo_title": build_seo_title(spec.parent_name or "", spec.parent_sku),
            "meta:_dtb_seo_description": build_seo_description(spec.parent_name or "", description),
            "ID": row.get("ID", ""),
        }
    )
    return row


def make_variation_row(
    fieldnames: list[str],
    spec: FamilySpec,
    variant: VariantSpec,
    backup_by_sku: dict[str, dict[str, str]],
    position: int,
) -> dict[str, str]:
    source = backup_by_sku.get(variant.backup_sku or variant.sku, {})
    row = restore_base_row(fieldnames, source, VARIATION_FIELDS)
    images = gather_images(spec, backup_by_sku, [variant.backup_sku or variant.sku])
    row.update(
        {
            "Type": "variation",
            "SKU": variant.sku,
            "MPN": variant.sku,
            "Name": variant.name_override or source.get("Name") or f"{spec.parent_name} ({variant.label})",
            "Short description": "",
            "Description": "",
            "Categories": spec.category,
            "Tags": build_tags(variant.name_override or f"{spec.parent_name} {variant.label}", [variant.sku], spec.tag_terms),
            "Images": "|".join(images),
            "Parent": spec.parent_sku or "",
            "Position": str(position),
            "Attribute 1 name": spec.attribute_name or "Option",
            "Attribute 1 value(s)": variant.label,
            "Attribute 2 name": "",
            "Attribute 2 value(s)": "",
            "Attribute 2 visible": "",
            "Attribute 2 global": "",
            "Attribute 2 used for variations": "",
            "meta:_dtb_seo_title": build_seo_title(variant.name_override or row["Name"], variant.sku),
            "meta:_dtb_seo_description": source.get("meta:_dtb_seo_description") or f"{variant.name_override or row['Name']} by Columbia Taping Tools.",
        }
    )
    return row


def make_simple_row(
    fieldnames: list[str],
    spec: FamilySpec,
    products: dict[str, dict[str, object]],
    backup_by_sku: dict[str, dict[str, str]],
    position: int,
) -> dict[str, str]:
    source = backup_by_sku.get(spec.backup_simple_sku or spec.simple_sku or "") or backup_by_sku.get(spec.simple_sku or "")
    row = restore_base_row(fieldnames, source, SIMPLE_FIELDS)
    description = choose_description(spec, products)
    images = gather_images(spec, backup_by_sku, [spec.backup_simple_sku or spec.simple_sku or ""])
    row.update(
        {
            "Type": "simple",
            "SKU": spec.simple_sku or "",
            "MPN": spec.simple_sku or "",
            "Name": spec.simple_name or "",
            "Short description": short_text(description),
            "Description": description,
            "Categories": spec.category,
            "Tags": build_tags(spec.simple_name or "", [spec.simple_sku or ""], spec.tag_terms),
            "Images": "|".join(images),
            "Parent": "",
            "Position": str(position),
            "Attribute 1 name": "",
            "Attribute 1 value(s)": "",
            "Attribute 1 visible": "0",
            "Attribute 1 global": "0",
            "Attribute 1 used for variations": "0",
            "Attribute 2 name": "",
            "Attribute 2 value(s)": "",
            "Attribute 2 visible": "",
            "Attribute 2 global": "",
            "Attribute 2 used for variations": "",
            "meta:_dtb_seo_title": build_seo_title(spec.simple_name or "", spec.simple_sku),
            "meta:_dtb_seo_description": build_seo_description(spec.simple_name or "", description),
        }
    )
    return row


def collect_tool_skus() -> set[str]:
    skus: set[str] = set()
    for spec in FAMILIES:
        if spec.kind == "simple" and spec.simple_sku:
            skus.add(spec.simple_sku)
            if spec.backup_simple_sku:
                skus.add(spec.backup_simple_sku)
        if spec.kind == "variable":
            if spec.parent_sku:
                skus.add(spec.parent_sku)
            if spec.backup_parent_sku:
                skus.add(spec.backup_parent_sku)
            for variant in spec.variants:
                skus.add(variant.sku)
                if variant.backup_sku:
                    skus.add(variant.backup_sku)
        skus.update(spec.backup_placeholder_skus)
    return skus


def main() -> None:
    fieldnames, public_rows = load_csv(PUBLIC_CSV)
    _, backup_rows = load_csv(BACKUP_CSV)
    products = product_map()
    backup_by_sku, _ = backup_indexes(backup_rows)
    remove_skus = collect_tool_skus()

    filtered_public: list[dict[str, str]] = []
    removed_existing: list[dict[str, str]] = []
    for row in public_rows:
        if (row.get("Brands") or "") != BRAND:
            filtered_public.append(row)
            continue
        sku = (row.get("SKU") or "").strip()
        parent = (row.get("Parent") or "").strip()
        if sku in remove_skus or parent in remove_skus:
            removed_existing.append(row)
            continue
        filtered_public.append(row)

    positions = [int(row["Position"]) for row in filtered_public if (row.get("Position") or "").isdigit()]
    next_position = (max(positions) if positions else 0) + 1

    generated_rows: list[dict[str, str]] = []
    for spec in FAMILIES:
        if spec.kind == "variable":
            generated_rows.append(make_parent_row(fieldnames, spec, products, backup_by_sku, next_position))
            next_position += 1
            for variant in spec.variants:
                generated_rows.append(make_variation_row(fieldnames, spec, variant, backup_by_sku, next_position))
                next_position += 1
        else:
            generated_rows.append(make_simple_row(fieldnames, spec, products, backup_by_sku, next_position))
            next_position += 1

    final_rows = filtered_public + generated_rows
    write_csv(PUBLIC_CSV, fieldnames, final_rows)

    covered_names = {name for spec in FAMILIES for name in spec.source_names}
    uncovered = sorted(name for name in products if name not in covered_names)

    report_lines = [
        f"Removed existing Columbia rows during rebuild: {len(removed_existing)}",
        f"Generated Columbia tool rows: {len(generated_rows)}",
        f"Families rebuilt: {len(FAMILIES)}",
        "",
        "Uncovered scraped product names:",
    ]
    report_lines.extend(f"- {name}" for name in uncovered)
    REPORT_PATH.write_text("\n".join(report_lines), encoding="utf-8")

    print(f"Rebuilt Columbia tool rows: {len(generated_rows)}")
    print(f"Removed existing Columbia rows replaced by rebuild: {len(removed_existing)}")
    print(f"Uncovered scraped products: {len(uncovered)}")
    print(f"Report: {REPORT_PATH}")


if __name__ == "__main__":
    main()
