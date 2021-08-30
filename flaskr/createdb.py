import sqlite3


con = sqlite3.connect('data.db')
cur = con.cursor()

cur.execute(""" CREATE TABLE Nodes (
    id integer PRIMARY KEY AUTOINCREMENT,
    ip text UNIQUE,
    name text UNIQUE,
    desc text
)
""")

cur.execute("""CREATE TABLE Channels (
    id integer PRIMARY KEY AUTOINCREMENT,
    name text,
    input text,
    pin text,
    desc text,
    node_id integer
) """)
