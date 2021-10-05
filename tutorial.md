# Setup tutorial for example files

## Step 1: Setting up the files
- Download the repo
- Locate the esphub_library directory within the esp_firmware directory, and copy it to where you keep your Arduino library
- Locate the example.ino Arduino sketch file within the **esp_firmware** directory, use Arduino to flash an ESP8266 with the firmware, keep the ESP8266 running with serial monitor open
- Clone the repo onto your Raspberry Pi or central host device.
- Download dependencies
```
pip install -r requirements.txt
```
- Run example.py

**Note: I recommend you to take a look at the example.py and example.ino if you want to know how this work and configure your own setup**

## Step 2: Setup the Web Interface
#### Enter the address prompted into a web browser to access the web interface
![alt text](https://github.com/NguyenQuang-10/ESPHub/blob/master/png/promptaddress.PNG)
#### Click on add new node and fill in the info, for IP Address, look in your Arduino Serial Monitor
![alt text](https://github.com/NguyenQuang-10/ESPHub/blob/master/png/ipfrommonitor.PNG)  
![alt text](https://github.com/NguyenQuang-10/ESPHub/blob/master/png/nodesettings.PNG)
#### Create the new node, them click on the 3 dots menu on the right and click *Add channel*, here are 3 channels to create in order for this example to work:  
1. Channel that automatically set pin state for you, this channel will automatically set the selected GPIO to HIGH or LOW, as long as pin is not set to CUSTOM  (You can change *Channel type* to Slider if you want pin to output PWM signal). Hook up an LED to GPIO 5 and flick the switch to see it for yourself.  
![alt text](https://github.com/NguyenQuang-10/ESPHub/blob/master/png/newchannel1.PNG)
2. Channel that can cause pre-coded event to happen on server and ESP8266(check out example.py and example.ino to see the how to code in the custom events)  
![alt text](https://github.com/NguyenQuang-10/ESPHub/blob/master/png/newchannel2.PNG)
**CHANGE THE IP IN EXAMPLE.PY TO THE ESP8266 IP ADDRESS FOR THIS TO WORK**  
![alt text](https://github.com/NguyenQuang-10/ESPHub/tree/master/png/nodeip.PNG)  

   When ever you flick this switch, the server terminal and Arduino serial monitor should display this:  
   ![alt text](https://github.com/NguyenQuang-10/ESPHub/blob/master/png/servercustom2.PNG)  
   ![alt text](https://github.com/NguyenQuang-10/ESPHub/blob/master/png/custommonitor.PNG)  

3. Channel that display value sent from ESP8266, automatically display value from ESP8266 as long as the channel match
![alt text](https://github.com/NguyenQuang-10/ESPHub/blob/master/png/newchannel3.PNG)  
The new channel should display value that was sent under channel "display" from the ESP8266  
![alt text](https://github.com/NguyenQuang-10/ESPHub/blob/master/png/channels.PNG)
