import sqlite3


con = sqlite3.connect('data.db')
cur = con.cursor()

cur.execute(""" CREATE TABLE Nodes (
    id integer PRIMARY KEY AUTOINCREMENT,
    ip text UNIQUE,
    name text UNIQUE,
    conn text,
    desc text
)
""")

cur.execute("""CREATE TABLE Channels (
    id integer PRIMARY KEY AUTOINCREMENT,
    name text UNIQUE,
    input text,
    desc text,
    node_id integer
) """)
