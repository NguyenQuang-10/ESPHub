import os

from flask import Flask, render_template, redirect
from flask_socketio import SocketIO
import socket
import json

CWD = os.path.abspath(os.path.dirname(__file__))

def get_html(relative_file_path):
    file = open(os.path.join(CWD, relative_file_path), "r")
    outstr = file.read()
    return outstr

def create_app(test_config=None):
    # create and configure the app
    app = Flask(__name__, instance_relative_config=True, template_folder=os.path.join(CWD, "frontend"))
    app.config.from_mapping(
        SECRET_KEY='dev',
        DATABASE=os.path.join(app.instance_path, 'flaskr.sqlite'),
    )

    if test_config is None:
        # load the instance config, if it exists, when not testing
        app.config.from_pyfile('config.py', silent=True)
    else:
        # load the test config if passed in
        app.config.from_mapping(test_config)

    # ensure the instance folder exists
    try:
        os.makedirs(app.instance_path)
    except OSError:
        pass

    # a simple page that says hello

    @app.route('/')
    def landing():
        return redirect("/home", code=308)

    @app.route('/home')
    def home():
        return render_template("main.html") 

    return app

app = create_app()
socketio = SocketIO(app)
@socketio.on('init')
def response_init(data):
    hostname = socket.gethostname()
    ip = socket.gethostbyname(hostname)
    nodejson = json.load(open("nodedata.json", 'r'))
    nodejson["platformdata"]["hostname"] = hostname
    nodejson["platformdata"]["ip"] = ip
    nodestr = json.dumps(nodejson, indent=4)
    socketio.emit('init', nodestr)

if __name__ == '__main__':
    socketio.run(app)