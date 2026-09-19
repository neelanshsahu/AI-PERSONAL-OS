# Routers package — register all API routers here
from .health import router as health_router
from .auth import router as auth_router
from .profiles import router as profiles_router
from .chat import router as chat_router
from .documents import router as documents_router
from .tasks import router as tasks_router
from .images import router as images_router
from .usage import router as usage_router
from .rag import router as rag_router
from .agents import router as agents_router
from .tools import router as tools_router

__all__ = [
    "health_router",
    "auth_router",
    "profiles_router",
    "chat_router",
    "documents_router",
    "tasks_router",
    "images_router",
    "usage_router",
    "rag_router",
    "agents_router",
    "tools_router",
]

