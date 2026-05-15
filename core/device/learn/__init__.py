"""Wizard de descoberta: usuário aperta controles, app monta o layout."""
from .inference import InferredControl, infer_kind
from .autolayout import auto_layout
from .orchestrator import LearnOrchestrator, LearnPhase

__all__ = ["InferredControl", "LearnOrchestrator", "LearnPhase", "auto_layout", "infer_kind"]
