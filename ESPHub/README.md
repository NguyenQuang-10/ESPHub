# ESPHub API Documentation
#### You should also read the [Arduino Library Documentation]()

## The ESPHub object
In runfile.py or your own start script, import the *esphub* object from the library.  
```
from ESPHub import esphub
```
### Basic Methods
#### run(): 
+ Starts the TCP server and web interface, will prompt the address to access the interface through a browser.  

#### send_cmd(*data*):  
+ Parameter: 
  - *data*: A dictionary containing data about the command to send to the ESP8266 node.  
+ Data needed within the dicitionary:
```
{
"ip" :    \\ the ip address of the node
"chnname":    \\ the name of the channel
"inptype":    \\ input type
"pin":      \\ pin to be affected 
"value":    \\ the value to set the pin to
}
```
  - inptype can be set to:
    * ESPHub.DIGITAL : value is 0 or 1 (on or off).
    * ESPHub.ANALOG : value is between 0 to 255.
    * default to ESPHub.CUSTOM if "pin" is also ESPHub.CUSTOM.
  - pin can be set to:
    * An integer representing a GPIO number on ESP8266 (0,1,2,3,4,5,9,10,12,13,14,15,16).
    * ESPHub.CUSTOM: the data sent is to be processed by custom code written by user on the ESP8266.
  - value:
    * integer between 0-255.

### Input Preprocessing Decorators
If you want a custom event to happen on input, set the channel pin to **Custom**.  
Then in your runfile.py, you can use the **onChannelInputInput()** decorator to designate a function that will run when an input from a channel is detected.
#### onChannelInputInput(*chnname*)
```
@esphub.onCustomChannelInput("chnname") \\ put the channel name you want this function to run when input is detected
def foo(arg): // arg is MANDATORY, arg is a dictionary containing info
  // do something here

```
**arg** is a dictionary like the one describe above for **send_cmd()**, it contain information about the input, for example, you can use the arg("ip") to see which ESP8266 the input is meant for.  

If you wish to do something then relay the input message to the ESP8266, just put this at the end of the function:
```
send_cmd(arg)
```

### Process recieved message from ESP8266 and displaying them
To see how to send messages from the ESP8266 to the main server, check out the [Arduino Library Documentation]()  
If you want to display numbers or text that was recieved from a ESP8266, set the channel type to **Display**. When the ESP8266 sent a message or value with matching channel, it will automatically get display in the box by default.

However, if you want custom events to happen before the value is display to the web interface, for example, logging values to a file. You can use the **onCustomChannelRecv()** to designate a function that will run when a message is recieved from a ESP8266.

#### onCustomChannelRecv(*chnname*)
```
@esphub.onCustomChannelRecv("chnname") \\ put the channel name here
def foo(arg): // arg is MANDATORY
  // do something here
```
**arg** is a dictionary containing the IP address of the sender (*arg["ip"]*) and the value/message (*arg["value"]*).  

To display the value/message to the web interface after processing, use the **updateDisplayChannel()** method at the end of the function

#### updateDisplayChannel(*ip*, *chnname*, *value*)
+ Parameters:
  - ip: the IP Address of the node as a string
  - chnname: the name of the display channel as a string
  - value: the value to put into the display box as a string