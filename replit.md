# Overview

This is a Flask-based data analysis and visualization web application that allows users to upload datasets, perform analysis, and create visualizations. The application supports multiple file formats (CSV, JSON, Excel) and provides REST API endpoints for data management, statistical analysis, and chart generation. It's designed as a backend service that can be consumed by frontend applications for data exploration and visualization tasks.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Backend Framework
- **Flask**: Lightweight web framework chosen for its simplicity and flexibility in building REST APIs
- **Flask-RESTful**: Used to create clean, organized API endpoints following REST conventions
- **Flask-CORS**: Enables cross-origin requests for frontend integration

## Database Layer
- **SQLAlchemy**: ORM for database operations with declarative base model approach
- **PostgreSQL/SQLite**: Flexible database configuration supporting both production (PostgreSQL) and development (SQLite) environments
- **Connection pooling**: Configured with pool recycling and pre-ping for connection reliability

## Data Models
Three main entities with clear relationships:
- **User**: Manages user accounts with one-to-many relationships to datasets and visualizations
- **Dataset**: Stores file metadata, column information, and processing status
- **Visualization**: Links charts/analyses to specific datasets

## File Processing
- **Multi-format support**: Handles CSV, JSON, and Excel files through pandas
- **Secure uploads**: Uses werkzeug's secure_filename for file safety
- **Metadata extraction**: Automatically processes uploaded files to extract column types and row counts
- **File size limits**: Configurable upload limits (16MB default)

## API Architecture
Resource-based organization with specialized endpoints:
- **Data Resources**: File upload, dataset listing, and management
- **Chart Resources**: Data transformation for visualization
- **Analysis Resources**: Statistical analysis and data insights

## Data Processing
- **Pandas integration**: Heavy use of pandas for data manipulation and analysis
- **Statistical analysis**: Built-in support for correlations, outliers, and descriptive statistics
- **Flexible querying**: Supports filtering, grouping, and data transformation for charts

# External Dependencies

## Core Framework Dependencies
- **Flask ecosystem**: flask, flask-sqlalchemy, flask-cors, flask-restful
- **Database**: psycopg2-binary for PostgreSQL connectivity

## Data Processing Libraries
- **pandas**: Primary data manipulation and analysis library
- **numpy**: Mathematical operations and statistical computations
- **openpyxl**: Excel file processing support

## File Handling
- **python-magic**: File type detection and validation
- **werkzeug**: Secure filename handling (included with Flask)

## Configuration & Deployment
- **python-dotenv**: Environment variable management
- **gunicorn**: WSGI server for production deployment
- **marshmallow**: Data serialization and validation

## Development Tools
- **SQLite**: Development database (no additional dependency)
- **PostgreSQL**: Production database via psycopg2-binary

The application is designed to be easily deployable on platforms like Heroku or similar PaaS providers, with automatic database URL parsing and environment-based configuration.