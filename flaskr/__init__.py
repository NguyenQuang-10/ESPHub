import os

# pylint: disable=import-error, line-too-long
from flask import Flask, render_template, redirect, request
from flask_socketio import SocketIO, emit
import socket
import json
import sqlite3
import threading

CWD = os.path.abspath(os.path.dirname(__file__))

con = sqlite3.connect("data.db")
dbcur = con.cursor()

class ConnectionHanlder:
    def __init__(self, sockfd):
        self.server = sockfd
        self.tcp_ip_conn_table = {}
        self.pin_gpio_table = {
            "D1" : "5",
            "D2" : "4",
            "D3" : "0",
            "D4" : "2",
            "D1" : "14",
            "D2" : "12",
            "D3" : "13",
            "D4" : "15"
        }

    def __tcp_server(self):
        self.server.listen()
        print("Starting TCP Server...")
        while True:
            conn, addr = self.server.accept()
            self.tcp_ip_conn_table[addr] = conn

    def send_cmd(self, ip, channel, value):
        send_target = self.tcp_ip_conn_table[ip]
        msg = "CMD" + "\n" + channel + "\n" + value
    # def open_tcp_server(self):
    #     self.server.

def get_html(relative_file_path):
    file = open(os.path.join(CWD, relative_file_path), "r")
    outstr = file.read()
    return outstr

def initiateSocketConnection():
    pass

def getNodesInfo():
    hostname = socket.gethostname()
    ip = socket.gethostbyname(hostname)
    nodejson = {}
    nodejson["platformdata"] = {}
    nodejson["platformdata"]["hostname"] = hostname
    nodejson["platformdata"]["ip"] = ip

    dbcur.execute('SELECT * FROM Nodes')
    nodeinfo = dbcur.fetchall()
    nodejson['nodes'] = {}
    for node in nodeinfo:
        nodeid = node[0]
        nodeip = node[1]
        nodename = node[2]
        nodedesc = node[3]
        nodejson['nodes'][nodename] = {}
        nodejson['nodes'][nodename]['ip'] = nodeip
        nodejson['nodes'][nodename]['desc'] = nodedesc
        dbcur.execute(f'SELECT * FROM Channels WHERE node_id = "{nodeid}"')
        channels = dbcur.fetchall()
        # print(channels)
        nodejson['nodes'][nodename]['channels']= {}
        for chn in channels:
            nodejson['nodes'][nodename]['channels'][chn[1]] = {
                'inp' : chn[2],
                'desc' : chn[3]
            }


    nodestr = json.dumps(nodejson, indent=4)
    return nodestr

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

# print(nodejson)

@socketio.on('init')
def response_init(data):
    nodejson = getNodesInfo()
    emit('init', nodejson, broadcast=False)


# @socketio.on('debug')
# def debug(data):
#     print(data)

@socketio.on('vldnodeform')
def validatenodename(data):
    print("New node form validation data: ", end="")
    print(data)
    errors = []
    dbcur.execute(f"SELECT COUNT(ip) FROM Nodes WHERE ip='{data['nodeip']}' ")
    if dbcur.fetchone()[0] > 0:
        print('[ERROR] Duplicate IP Address')
        errors.append('nodeip')
    dbcur.execute(f"SELECT COUNT(name) FROM Nodes WHERE name='{data['nodename']}' ")
    if dbcur.fetchone()[0] > 0:
        print('[ERROR] Duplicate Node Name')
        errors.append('nodename')

    # for use with new channels not for new node
    # for chnname in data['chnnames']:
    #     dbcur.execute(f"SELECT COUNT(name) FROM Channels WHERE name='{chnname}' ")
    #     if dbcur.fetchone()[0] > 0:
    #         print('[ERROR] Duplicate Channel Name')
    #         errors.append('chn' + str(data['chnnames'].index(chnname) + 1) + 'name')
    emit('newNodeFormError', errors, broadcast=False)

@socketio.on('input')
def handleInput(data):
    print('Input data: ', end='')
    print(data)

@app.route('/')
def landing():
    return redirect("/home", code=308)

# please remeber to escape the parameter before inserting later
# TO DO:
#
@app.route('/home', methods=["POST", "GET"])
def home():
    if request.method == 'POST':
        # print('shit')
        form = request.form
        print('Incoming form data: ',request.form, sep=" ")
        if form['formtype'] == 'newnodeform':
            nodename = form['nodename']
            if form['nodename'] == '':
                nodename = form['nodeip']

            dbcur.execute(f"INSERT INTO Nodes(ip, name, desc) VALUES ( '{form['nodeip']}','{nodename}','{form['nodedesc']}')")
            # con.commit()
            dbcur.execute(f"SELECT * FROM Nodes WHERE name='{nodename}'")
            node_id = dbcur.fetchone()[0]

            numberOfChn = int(form['numberOfChn'])

            for i in range(1,numberOfChn+1):
                chnname = form['chn' + str(i) + 'name']
                if chnname == '':
                    chnname = form['chn' + str(i) + 'pin']
                dbcur.execute(f"INSERT INTO Channels(name, input, desc, node_id) VALUES ( '{form['chn' + str(i) + 'name']}', '{form['chn' + str(i) + 'inp']}' , '{form['chn' + str(i) + 'desc']}', '{int(node_id)}')")
            
            con.commit()

            return render_template("main.html") 

            
    return render_template("main.html") 


if __name__ == '__main__':

    socketio.run(app, host='0.0.0.0', debug=False)