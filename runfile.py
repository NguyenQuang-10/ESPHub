from ESPHub import esphub
import requests

# @esphub.onCustomChannel("Poo")
# def poo(data):
#     print(data)
#     if data['value'] == 1:    
#         # r = requests.get("http://192.168.1.27/5/on")
#         print("On")
#     elif data['value'] == 0:
#         # r = requests.get("http://192.168.1.27/5/off")
#         print("Off")

@esphub.onCustomChannelRecv("testChannel")
def poo(data):
    # print(data)
    esphub.updateDisplayChannel(data['ip'], "dd", data['value'])

esphub.run()