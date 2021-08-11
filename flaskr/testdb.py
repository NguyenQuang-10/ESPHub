import sqlite3

con = sqlite3.connect('data.db')
cur = con.cursor()

cur.execute('SELECT * FROM Nodes')
print(cur.fetchall())
cur.execute('SELECT * FROM Channels')
print(cur.fetchall())

# cur.execute('DELETE FROM Nodes')
# con.commit()