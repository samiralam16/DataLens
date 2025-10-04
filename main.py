import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse

# Import routers
from routers import data_router, charts_router, analysis_router, query_router,dashboard_router
from extensions import create_tables


def create_app():
    app = FastAPI(
        title="Data Visualization Backend API",
        description="A FastAPI backend for data visualization applications",
        version="2.0.0"
    )

    # Enable CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Root redirect to Swagger docs
    @app.get("/", include_in_schema=False)
    async def root_redirect():
        return RedirectResponse(url="/docs")

    # Ensure upload folder exists
    os.makedirs("uploads", exist_ok=True)

    # Initialize database tables
    create_tables()

    # Include routers
    app.include_router(data_router.router, prefix="/api/data", tags=["Data"])
    app.include_router(charts_router.router, prefix="/api/charts", tags=["Charts"])
    app.include_router(analysis_router.router, prefix="/api/analysis", tags=["Analysis"])
    app.include_router(query_router.router, prefix="/query", tags=["Query"])
    app.include_router(dashboard_router.router, prefix="/api/dashboards", tags=["Dashboards"])

    return app


app = create_app()
