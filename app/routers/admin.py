"""FastAPI router handling administrative telemetry, query audit logs, and government portal analytics."""

import logging
from typing import Optional
from fastapi import APIRouter, Depends, Query
from app.services.analytics_service import AnalyticsService, get_analytics_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin", tags=["Admin & Specialized Personnel Portal"])


@router.get(
    "/analytics/overview",
    summary="Dashboard Overview KPIs",
    description="Get aggregated metrics on total queries, categories, language distribution, and top gov domains.",
)
async def get_overview(analytics_service: AnalyticsService = Depends(get_analytics_service)):
    """Return top-level dashboard metrics for specialized personnel."""
    return analytics_service.get_overview()


@router.get(
    "/analytics/logs",
    summary="Query Audit Logs",
    description="Retrieve filterable, paginated query audit logs for review and compliance auditing.",
)
async def get_query_logs(
    category: Optional[str] = Query(None, description="Filter by domain category"),
    language: Optional[str] = Query(None, description="Filter by language"),
    search: Optional[str] = Query(None, description="Search term for query, answer, or domain"),
    limit: int = Query(50, ge=1, le=200, description="Page limit"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
    analytics_service: AnalyticsService = Depends(get_analytics_service),
):
    """Return filterable query logs."""
    return analytics_service.get_logs(
        category=category,
        language=language,
        search=search,
        limit=limit,
        offset=offset,
    )


@router.get(
    "/analytics/portals",
    summary="Government Portals Telemetry",
    description="Get detailed metrics and status of official .gov.in and .nic.in portals visited.",
)
async def get_portals(analytics_service: AnalyticsService = Depends(get_analytics_service)):
    """Return detailed analytics on all official government portals accessed by S.E.V.A AI."""
    return {
        "portals": analytics_service.get_portal_stats()
    }


@router.post(
    "/analytics/reset",
    summary="Reset Audit Telemetry",
    description="Reset audit telemetry to baseline seed data.",
)
async def reset_analytics(analytics_service: AnalyticsService = Depends(get_analytics_service)):
    """Reset logs."""
    analytics_service.clear_logs()
    return {"message": "Audit logs reset to baseline seed state."}
