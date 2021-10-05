# Arduino Library Documentation
##### Note: the ESP8266WiFi.h Library is needed

#### void ESPHub::ESPHub(*IPAddress IP, int port, const char* ssid, const char* password*) *constructor*
+ *IP* is the IP Address of the main server
+ *port* is the port that the server socket is running on
+ *ssid* is the ssid of the WiFi
+ *password* is the password of the WiFi

#### void ESPHub::connectToWiFi()
+ Connects to the WiFi network with the credentials specified when creating the ESPHub object

#### void ESPHub::connectToServer()
+ Initiate a TCP link with the IP Address specified when creating the ESPHub object

#### void ESPHub::listen()
+ Listens for command from the main server and also respond to PING messages, the communication protocol is the following:  
```
MSGTYPE_VALUETYPE_PIN_VALUE
```
+ **MSGTYPE**: Message type, can be *CMD* (command) or *REQ* (request), the server expects a return message to be sent back 
+ **VALUETYPE**: value type, can be:
    - *DIG* (digital): **VALUE** is either 0 or 1 (LOW or HIGH). Function automatically.
    - *PWM* (variable/pwm): **VALUE** is a value from 0 to 255.
    - *CST* (custom): **PIN** and **VALUE** will be store to *ESPHub.message.chnname* and *ESPHub.message.value* respectively.
+ Note: 
    - If **VALUETYPE** is *DIG* or *PWM*, the function will automatically will set GPIO pin of number **PIN** to **VALUE**
    - If **VALUETYPE** is *CST* however, meaning input from a channel with pin set to CUSTOM, **PIN** will the channel name. **PIN** and **VALUE** will be store to *ESPHub.message.chnname* and *ESPHub.message.value* respectively.
+ **YOU SHOULD KEEP THIS FUNCTION RUNNING IN A LOOP, LIKE IN BASIC.INO**

#### bool ESPHub::receivedCustomChannel()
+ returns **true** when input from a channel with pin set to CUSTOM (a.k.a CUSTOM channel), else return **false**.
+ When an input from CUSTOM channel is recieved, channel name and value will be store to *ESPHub.message.chnname* and *ESPHub.message.value* respectively.
+ **Use this feature to write custom event that happen when an input from a specific channel is recieved** 

#### void ESPHub::sendToServer(*String channel, String value*)
+ send value to server under a channel name 
