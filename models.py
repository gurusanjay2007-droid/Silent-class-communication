from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class Institution(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    inst_id = db.Column(db.String(50), unique=True, nullable=False)
    name = db.Column(db.String(150), nullable=False)

class Staff(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    staff_id = db.Column(db.String(50), unique=True, nullable=False)
    name = db.Column(db.String(150), nullable=False)
    institution_id = db.Column(db.Integer, db.ForeignKey('institution.id'), nullable=False)

class Student(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    roll_number = db.Column(db.String(50), unique=True, nullable=False)
    name = db.Column(db.String(150), nullable=False)
    institution_id = db.Column(db.Integer, db.ForeignKey('institution.id'), nullable=False)

class Session(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    session_code = db.Column(db.String(20), unique=True, nullable=False)
    staff_id = db.Column(db.Integer, db.ForeignKey('staff.id'), nullable=False)
    subject = db.Column(db.String(100), nullable=False)
    is_active = db.Column(db.Boolean, default=True)

class Doubt(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey('session.id'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
