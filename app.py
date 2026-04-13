from flask import Flask, render_template, request, jsonify
from flask_socketio import SocketIO, join_room, emit
from models import db

app = Flask(__name__)
app.config['SECRET_KEY'] = 'sccs_secret_key'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///sccs.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)
socketio = SocketIO(app, cors_allowed_origins="*")

with app.app_context():
    db.create_all()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/login')
def login_page():
    return render_template('login.html')

@app.route('/student-portal')
def student_portal():
    return render_template('student-portal.html')

@app.route('/teacher-portal')
def teacher_portal():
    return render_template('teacher-portal.html')

@app.route('/report')
def report_page():
    return render_template('report.html')

@socketio.on('join')
def on_join(data):
    room = data.get('room')
    if room:
        join_room(room)
        emit('status', {'msg': f'Someone joined {room}'}, room=room)

@socketio.on('submit_doubt')
def handle_doubt(data):
    room = data.get('room')
    doubt = data.get('doubt')
    if room and doubt:
        emit('new_doubt', {'doubt': doubt}, room=room)

if __name__ == '__main__':
    socketio.run(app, debug=True, port=5000)
