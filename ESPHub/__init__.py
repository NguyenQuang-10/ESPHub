import os

# pylint: disable=import-error, line-too-long
from flask import Flask, render_template, redirect, request
from flask_socketio import SocketIO, emit
import socket
import json
import sqlite3
import threading
import time
import eventlet
import select

eventlet.monkey_patch()

CWD = os.path.abspath(os.path.dirname(__file__))

con = sqlite3.connect("data.db")
dbcur = con.cursor()

class ESPHub:
    def __init__(self,socketio, app):
        self.ws = socketio
        # socketio require app for context stuff
        self.app = app
        self.__tcpserver = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        # Let user decide port from a config file later
        self.__tcpserver.bind(("0.0.0.0", 5501))
        self.__udpserver = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        self.__udpserver.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)
        self.tcp_ip_conn_table = {}

        self.pin_state = {}

    def __tcp_listen(self):
        self.__tcpserver.listen()
        print("Starting TCP Server...")
        while True:
            # print('accepting')
            conn, addr = self.__tcpserver.accept()
            print(addr)
            self.tcp_ip_conn_table[addr[0]] = conn
            self.__get_pin_state(addr[0])

    def __pad_msg(self, msg):
        if len(msg) < 64:
            msg += b' ' * (64 - len(msg))
            return msg
        else:
            raise "[ERROR] TCP Socket message too big"
        
    def __send_to_node(self,ip, msg):
        send_target = self.tcp_ip_conn_table[ip]
        ascii_msg = msg.encode('ascii')
        tsend_thread = threading.Thread(target=send_target.send, args=(self.__pad_msg(ascii_msg),))
        tsend_thread.start()
        # print(f"Sent message: \n{msg}")

    def __recv_from_node(self,ip):
        conn = self.tcp_ip_conn_table[ip]
        conn.settimeout(2)
        while True:
            try:
                conn.send(self.__pad_msg("PING\n".encode('ascii')))
                msg = conn.recv(64)
                msg_parse = msg.strip().decode('ascii').split('\n')

                # [0] is the identifier, the rest is the pin value array
                if (msg_parse[0] == "PST"):
                    self.pin_state[ip] = {}
                    pins = [0,1,2,3,4,5,9,10,12,13,14,15,16]
                    for pin in pins:
                        self.pin_state[ip][pin] = msg_parse[pin + 1]
                    self.ws.emit("updconst", ["connected", ip, self.pin_state[ip] ])
            except socket.timeout:
                self.tcp_ip_conn_table.pop(ip)
                self.ws.emit("updconst", ["disconnected", ip])
                conn.close()
                print("Connection closed")
                break


    # Message size always smaller than 64 bytes
    def send_cmd(self, ip, inptype, pin, value):
        if pin != 'Custom':
            msg = "CMD" + "\n" + inptype + "\n" + str(pin) + "\n" + str(value) + "\n"
            self.__send_to_node(ip, msg)
        # else if pin == 'Custom':

        

    def __get_pin_state(self, ip):
        msg = "REQ" + '\n' + "PST" + "\n"
        self.__send_to_node(ip, msg)
        recvThread = threading.Thread(target=self.__recv_from_node, args=(ip,))
        recvThread.start()

        
    def open_tcp(self):
        listen_thread = threading.Thread(target=self.__tcp_listen)
        listen_thread.start()

    def run(self):
        self.open_tcp()
        self.ws.run(self.app, host='0.0.0.0', debug=False)

    # Broadcast bind message (for later feature not implemented yet)
    def __udp_broadcast(self):
        start_time = time.time()
        # start_length = len(self.tcp_ip_conn_table)
        bindMessage = "&!#@^OpESPHub_Bind"
        bindMessage += ' ' * (64 - len(bindMessage))
        while (time.time() - start_time < 10):            
            self.__udpserver.sendto(bindMessage.encode("ascii"), ("192.168.1.255",5500))
            # if (len(self.tcp_ip_conn_table) >)

    def udp_discovery(self):
        udp_thread = threading.Thread(target=self.__udp_broadcast)
        udp_thread.start()
        
def getNodeID(nodename):
    dbcur.execute(f"SELECT * FROM Nodes WHERE name='{nodename}'")
    try:
        nodeid = dbcur.fetchone()[0]
        return nodeid;        
    except TypeError:
        print(f'[DELETE] Channel {nodename} contains no channels')

def get_html(relative_file_path):
    file = open(os.path.join(CWD, relative_file_path), "r")
    outstr = file.read()
    return outstr


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
        connected = False
        nodejson['nodes'][nodename] = {}
        nodejson['nodes'][nodename]['ip'] = nodeip
        nodejson['nodes'][nodename]['desc'] = nodedesc
        if nodeip in esphub.tcp_ip_conn_table:
            nodejson['nodes'][nodename]['conn'] = "connected"
            connected = True
        else:
            nodejson['nodes'][nodename]['conn'] = "disconnected"
        dbcur.execute(f'SELECT * FROM Channels WHERE node_id = "{nodeid}"')
        channels = dbcur.fetchall()
        # print(channels)
        nodejson['nodes'][nodename]['channels']= {}
        for chn in channels:
            channelValue = -1
            if connected:
                channelValue = esphub.pin_state[nodeip][int(chn[3])]
            nodejson['nodes'][nodename]['channels'][chn[1]] = {
                'inp' : chn[2],
                'pin' : chn[3],
                'desc' : chn[4],
                'value' : channelValue
            }

    # nodestr = json.dumps(nodejson, indent=4)
    return nodejson

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
esphub = ESPHub(socketio,app)

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
            con.commit()

            return render_template("main.html") 
        elif form['formtype'] == 'appendChannelForm':
            dbcur.execute(f"INSERT INTO Channels(name, input, pin, desc, node_id) VALUES ( '{form['chnname']}', '{form['chninp']}' , '{form['chnpin']}' , '{form['chndesc']}', '{getNodeID(form['parent'])}')")
            
            con.commit()
        
        elif form['formtype'] == 'modifynodeform':
            if form['nodeip'] != "":
                dbcur.execute(f"UPDATE Nodes SET ip='{form['nodeip']}' WHERE name='{form['ogname']}'")
            if form['nodename'] != "":
                dbcur.execute(f"UPDATE Nodes SET name='{form['nodename']}' WHERE name='{form['ogname']}'")
            dbcur.execute(f"UPDATE Nodes SET desc='{form['nodedesc']}' WHERE name='{form['ogname']}'")

            con.commit()
        
        elif form['formtype'] == 'modifyChannelForm':
            dbcur.execute(f"UPDATE Channels SET name='{form['chnname']}' ,input='{form['chninp']}' ,pin='{form['chnpin']}' ,desc='{form['chndesc']}' WHERE name='{form['ogname']}' AND node_id='{getNodeID(form['parent'])}'")
            con.commit()

    return render_template("main.html") 

@socketio.on('init')
def response_init(data):
    emit('log', ["Loading Component JSON", 'info'])
    nodejson = getNodesInfo()
    emit('init', nodejson, broadcast=False)
    emit('log', ["Loaded Component JSON, Hello Operator!", 'info'])


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
    emit('newNodeFormError', [data['formid'],errors], broadcast=False)

@socketio.on('validateNewChannel')
def validateNewChannel(data):
    duplicated = False
    dbcur.execute(f"SELECT COUNT(name) FROM Channels WHERE name='{data['chnname']}' AND node_id = {getNodeID(data['parent'])}")
    if dbcur.fetchone()[0] > 0:
        print('[ERROR] DUPLICATED CHANNEL')
        duplicated = True
    emit('newChannelError', [data['formid'],duplicated])

@socketio.on('deleteComponent')
def deleteComponent(data):
    print(data)
    if (data['type'] == 'node'):
        dbcur.execute(f"DELETE FROM Channels WHERE node_id='{getNodeID(data['node'])}'")
        dbcur.execute(f"DELETE FROM Nodes WHERE name='{data['node']}' ")
        con.commit()
    elif (data['type'] == 'channel'):
        dbcur.execute(f"DELETE FROM Channels WHERE name='{data['channel']}' AND node_id = '{getNodeID(data['node'])}'")
        con.commit()

@socketio.on('input')
def handleInput(data):
    print('Input data: ', end='')
    print(data)
    try:
        esphub.send_cmd(data["ip"],data["type"], data["pin"], data['value'])
        # this won't get executed if node not connected because line above would fail first
        esphub.pin_state[data["ip"]][int(data['pin'])] = data['value']
    except KeyError:
        emit('log', [f"[ERROR] Node with IP:{data['ip']} is not connected", "error"])

# def testingstuff(ws):
#     while True:
#         print('bruh')
#         ws.emit('updconst', "shit")
#         time.sleep(0.1)

# testThread = threading.Thread(target=testingstuff, args=(socketio,))
# testThread.start()

    
    