import os
import threading
import webbrowser
from fastapi import FastAPI
from dotenv import load_dotenv
from extensions import create_tables
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware

  # Import routers
from routers import data_router, charts_router, analysis_router, query_router

load_dotenv()

def create_app():
    # Initialize FastAPI app
    app = FastAPI(
    title="Data Visualization Backend API",
    description="A FastAPI backend for data visualization applications",
    version="2.0.0"
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/", include_in_schema=False)
    async def root_redirect():
        return RedirectResponse(url="/docs")

    # Create uploads folder
    os.makedirs("uploads", exist_ok=True)  

    # Create DB tables
    create_tables()

    # Include routers
    app.include_router(data_router.router, prefix="/api/data", tags=["Data"])
    app.include_router(charts_router.router, prefix="/api/charts", tags=["Charts"])
    app.include_router(analysis_router.router, prefix="/api/analysis", tags=["Analysis"])
    app.include_router(query_router.router, prefix="/query", tags=["Query"])

    # Optional: endpoint to list all routes
    @app.get("/endpoints")
    async def list_endpoints():
        return [
            {"path": route.path, "methods": list(route.methods)}
            for route in app.routes if hasattr(route, "methods")
        ]

    return app

app = create_app()


