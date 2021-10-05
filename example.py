"""
In this example, we're gonna make:
+) An input that controls pin state on ESP8266
+) An input that trigger a custom input
+) Monitor and display sensor value

IMPORTANT NOTE:
Make sure that you follow the instruction in README.md as well
The IP "1.1.1.1" is being use as an example, replace with the IP address of your ESP8266

"""
from ESPHub import esphub

# CHANGE THE IP ADDRESS TO YOUR ESP-8266 IP ADDRESS
ip = ""

@esphub.onCustomChannelInput("customChannel") # this function runs when input from a channel with "customInput" as it's name is detected
def customInput(args):
	if args["ip"] == ip: # making sure that the channel belong to this node/ESP8266 IP address
		print(f"The custom input of node {args['ip']} was triggered")

		# Do something
		 
		esphub.send_cmd(args) # relay the message to the ESP8266, args can be modify if you wish so

# Note: if you just want to update the display box on the web interface without custom events, you can remove this function, as updating display box is automatic
@esphub.onCustomChannelRecv("display") # this function runs when a message is recieved from ESP8266 under a channel name of "display"
def sensor(args):
	if args["ip"] == ip: # making sure that "1.1.1.1" was the sender
		# print(f"Value from the sensor of node 1.1.1.1 is {args['value']}")	# uncomment this line when you wanna test it, else it's a little annoying

		# do something

		esphub.updateDisplayChannel(args["ip"], "display", args["value"]) # updating the display box on the web interface

esphub.run() # runs

