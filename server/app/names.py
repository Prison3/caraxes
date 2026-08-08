from __future__ import annotations


def normalize_name(name: str) -> str:
    """去首尾空白、合并中间空白，并做大小写折叠，用于判重。"""
    return " ".join((name or "").strip().split()).casefold()
