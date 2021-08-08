import os

from flask import Flask, render_template, redirect, request
from flask_socketio import SocketIO
import socket
import json
import sqlite3

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


    return app

app = create_app()
socketio = SocketIO(app)
@socketio.on('init')
def response_init(data):
    hostname = socket.gethostname()
    ip = socket.gethostbyname(hostname)
    nodejson = {}
    nodejson["platformdata"] = {}
    nodejson["platformdata"]["hostname"] = hostname
    nodejson["platformdata"]["ip"] = ip
    nodestr = json.dumps(nodejson, indent=4)
    socketio.emit('init', nodestr)

@app.route('/')
    def landing():
        return redirect("/home", code=308)

# please remeber to escape the parameter before inserting later
# TO DO:
# ADD validation via websocket (maybe?) for channel and node name
# Add channel to save to db
@app.route('/home', methods=["POST", "GET"])
def home():

    con = sqlite3.connect("data.db")
    dbcur = con.cursor()

    if request.method == 'POST':
        form = request.form
        print(form)
        if form['formtype'] == 'newnodeform':
            nodename = form['nodename']
            if form['nodename'] == '':
                nodename = form['nodeip']

            dbcur.execute(f"INSERT INTO Nodes VALUES ( '{form['nodeip']}','{nodename}','{form['nodedesc']}')")
            con.commit()
            dbcur.execute(f"SELECT * FROM Nodes")
            print(dbcur.fetchone())

            
            
    return render_template("main.html") 


if __name__ == '__main__':
    socketio.run(app)