"""list_recipes: agrega recipes de todos connectors."""
from __future__ import annotations

from typing import Any

from app.runtime import Runtime


def handle_list_recipes(runtime: Runtime, _payload: dict[str, Any]) -> dict[str, Any]:
    out: list[dict[str, Any]] = []
    for recipe in runtime.connectors.recipes():
        out.append(recipe.to_dict())
    return {"recipes": out}
