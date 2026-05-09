from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
from pathlib import Path

DEFAULT_ROOTS = [
    r"C:\Program Files\WSL",
    r"C:\Users\Elliott",
    r"C:\Windows",
]

DEFAULT_TOP_N = 20


def find_powershell() -> str:
    for candidate in ("pwsh", "powershell.exe"):
        path = shutil.which(candidate)
        if path:
            return path
    raise FileNotFoundError("PowerShell executable not found on PATH.")


def run_powershell(command: str) -> str:
    pwsh = find_powershell()
    completed = subprocess.run(
        [
            pwsh,
            "-NoProfile",
            "-NonInteractive",
            "-ExecutionPolicy",
            "Bypass",
            "-Command",
            command,
        ],
        capture_output=True,
        text=True,
    )
    if completed.returncode != 0:
        raise RuntimeError(
            f"PowerShell command failed with exit code {completed.returncode}: {completed.stderr.strip()}"
        )
    return completed.stdout.strip()


def quote_pwsh_string(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def bytes_to_human(size: int | None) -> str:
    if size is None:
        return "N/A"
    for unit in ("B", "KB", "MB", "GB", "TB"):
        if size < 1024:
            return f"{size:.2f} {unit}"
        size /= 1024
    return f"{size:.2f} PB"


def audit_paths(paths: list[str], top_n: int) -> list[dict[str, object]]:
    escaped_paths = ",".join(quote_pwsh_string(p) for p in paths)
    command = f"& {{ $roots = @({escaped_paths}); $results = @(); foreach ($root in $roots) {{ if (-not (Test-Path $root)) {{ $results += [pscustomobject]@{{Path=$root;Exists=$false;TotalBytes=0;Subdirectories=@()}}; continue }}; $total = (Get-ChildItem -Path $root -Recurse -Force -File -ErrorAction SilentlyContinue | Measure-Object Length -Sum).Sum; $subs = Get-ChildItem -Path $root -Force -Directory -ErrorAction SilentlyContinue | ForEach-Object {{ $size = (Get-ChildItem -Path $_.FullName -Recurse -Force -File -ErrorAction SilentlyContinue | Measure-Object Length -Sum).Sum; [pscustomobject]@{{Path=$_.FullName;Bytes=$size}} }} | Sort-Object Bytes -Descending | Select-Object -First {top_n}; $results += [pscustomobject]@{{Path=$root;Exists=$true;TotalBytes=$total;Subdirectories=$subs}} }}; $results | ConvertTo-Json -Depth 5 -Compress }}"
    output = run_powershell(command)
    return json.loads(output)


def launch_cleanup_tool(tool: str) -> None:
    if tool == "storage":
        command = "Start-Process -FilePath explorer.exe -ArgumentList 'ms-settings:storage'"
    elif tool == "dism":
        command = (
            "Start-Process -FilePath dism.exe "
            "-ArgumentList '/Online','/Cleanup-Image','/StartComponentCleanup' "
            "-Verb RunAs"
        )
    elif tool == "cleanmgr":
        command = "Start-Process -FilePath cleanmgr.exe -Verb RunAs"
    else:
        raise ValueError(f"Unsupported cleanup tool: {tool}")

    print(f"Launching {tool}... (the tool may prompt for elevation)")
    run_powershell(command)
    print(f"Launched {tool} successfully.")


def print_report(results: list[dict[str, object]]) -> None:
    for entry in results:
        path = entry.get("Path", "<unknown>")
        exists = entry.get("Exists", True)
        total_bytes = entry.get("TotalBytes")
        print(f"Path: {path}")
        print(f"  Exists: {exists}")
        print(f"  Total size: {bytes_to_human(total_bytes)}")

        subdirs = entry.get("Subdirectories", [])
        if subdirs:
            print("  Largest direct subdirectories:")
            for sub in subdirs:
                sub_path = sub.get("Path", "<unknown>")
                bytes_value = sub.get("Bytes")
                print(f"    {bytes_to_human(bytes_value):>12}  {sub_path}")
        print()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Audit Windows disk usage for selected root directories and launch built-in cleanup tools."
    )
    parser.add_argument(
        "--roots",
        nargs="+",
        default=DEFAULT_ROOTS,
        help="Root directories to audit. Defaults to the target cleanup candidates.",
    )
    parser.add_argument(
        "--top",
        type=int,
        default=DEFAULT_TOP_N,
        help="Number of largest immediate subdirectories to report for each root.",
    )
    parser.add_argument(
        "--cleanup",
        nargs="+",
        choices=("storage", "dism", "cleanmgr", "all"),
        help="Launch one or more built-in Windows cleanup tools.",
    )
    parser.add_argument(
        "--yes",
        action="store_true",
        help="Skip the confirmation prompt before launching cleanup tools.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    try:
        print("Auditing disk usage for configured roots...\n")
        results = audit_paths(args.roots, args.top)
        print_report(results)
    except Exception as exc:
        print(f"Error during audit: {exc}", file=sys.stderr)
        return 1

    if args.cleanup:
        if "all" in args.cleanup:
            tools = ["storage", "dism", "cleanmgr"]
        else:
            tools = args.cleanup

        if not args.yes:
            print("The following cleanup tools are about to be launched:")
            for tool in tools:
                print(f"  - {tool}")
            answer = input("Continue? [y/N] ").strip().lower()
            if answer not in ("y", "yes"):
                print("Cleanup aborted.")
                return 0

        for tool in tools:
            try:
                launch_cleanup_tool(tool)
            except Exception as exc:
                print(f"Failed to launch {tool}: {exc}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
