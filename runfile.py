from ESPHub import esphub

@esphub.onCustomChannelInput("test")
def bruh(data):
    print(data)

esphub.run()