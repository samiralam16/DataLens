from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, Float, JSON
from sqlalchemy.orm import relationship
from extensions import Base

class User(Base):
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True)
    username = Column(String(80), unique=True, nullable=False)
    email = Column(String(120), unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    datasets = relationship('Dataset', back_populates='owner', cascade='all, delete-orphan')
    visualizations = relationship('Visualization', back_populates='creator', cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'created_at': self.created_at.isoformat(),
            'datasets_count': len(self.datasets) if self.datasets else 0,
            'visualizations_count': len(self.visualizations) if self.visualizations else 0
        }

class Dataset(Base):
    __tablename__ = 'datasets'
    
    id = Column(Integer, primary_key=True)
    name = Column(String(200), nullable=False)
    description = Column(Text)
    filename = Column(String(200), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_type = Column(String(20), nullable=False)  # csv, json, xlsx
    file_size = Column(Integer, nullable=False)  # in bytes
    columns_info = Column(JSON)  # Store column names and types
    row_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_processed = Column(Boolean, default=False)
    
    # Foreign key
    user_id = Column(Integer, ForeignKey('users.id'), nullable=True)  # nullable for demo purposes
    
    # Relationships
    owner = relationship('User', back_populates='datasets')
    visualizations = relationship('Visualization', back_populates='dataset', cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'filename': self.filename,
            'file_type': self.file_type,
            'file_size': self.file_size,
            'columns_info': self.columns_info,
            'row_count': self.row_count,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'is_processed': self.is_processed,
            'user_id': self.user_id,
            'visualizations_count': len(self.visualizations) if self.visualizations else 0
        }

class Visualization(Base):
    __tablename__ = 'visualizations'
    
    id = Column(Integer, primary_key=True)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    chart_type = Column(String(50), nullable=False)  # bar, line, pie, scatter, etc.
    chart_config = Column(JSON, nullable=False)  # Chart configuration and styling
    data_config = Column(JSON, nullable=False)  # Data mapping (x-axis, y-axis, etc.)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_public = Column(Boolean, default=False)
    
    # Foreign keys
    dataset_id = Column(Integer, ForeignKey('datasets.id'), nullable=False)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=True)  # nullable for demo purposes
    
    # Relationships
    dataset = relationship('Dataset', back_populates='visualizations')
    creator = relationship('User', back_populates='visualizations')
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'chart_type': self.chart_type,
            'chart_config': self.chart_config,
            'data_config': self.data_config,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'is_public': self.is_public,
            'dataset_id': self.dataset_id,
            'user_id': self.user_id
        }

class Snapshot(Base):
    __tablename__ = "snapshots"

    id = Column(Integer, primary_key=True, index=True)
    snapshot_name = Column(String, nullable=False)
    sql_query = Column(Text, nullable=False)
    result_table = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "snapshot_name": self.snapshot_name,
            "sql_query": self.sql_query,
            "result_table": self.result_table,
            "created_at": self.created_at
        }

