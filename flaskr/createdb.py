import sqlite3

file = open('data.db', 'w')
file.close()

con = sqlite3.connect('data.db')
cur = con.cursor()

cur.execute(""" CREATE TABLE Nodes (
    id integer AUTOINCREMENT,
    ip text,
    name text,
    desc text
)
""")

cur.execute("""CREATE TABLE Channels (
    id integer AUTOINCREMENT,
    name text UNIQUE,
    input text,
    desc text,
    node_id integer
) """)
