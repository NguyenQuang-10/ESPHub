import sqlite3

con = sqlite3.connect('data.db')
cur = con.cursor()
cur.execute('DELETE FROM Nodes')
cur.execute('DELETE FROM Channels')
con.commit()