"""
Base Service — Abstract base class for all service layer modules.

Pattern:
  - Each feature gets its own service class (e.g., UserService, ChatService).
  - Services contain all business logic, keeping routers thin.
  - Services are injected via FastAPI's dependency injection in later phases.
"""

from abc import ABC
from typing import Any


class BaseService(ABC):
    """
    Abstract base class for all services.

    Subclass this and implement domain-specific methods.
    Example:
        class UserService(BaseService):
            async def get_user(self, user_id: str) -> dict:
                ...
    """

    async def health(self) -> dict[str, Any]:
        """
        Optional health check method for each service.
        Override in subclasses to add service-specific checks.
        """
        return {"service": self.__class__.__name__, "status": "ok"}
