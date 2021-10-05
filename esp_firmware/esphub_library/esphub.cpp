#include "Arduino.h"
#include <ESP8266WiFi.h>
#include "esphub.h"

// Constructor
ESPHub::ESPHub(IPAddress IP, int port, const char* ssid, const char* password){
    serverIP = IP;
    serverPort = port;
    WiFissid = ssid;
    WiFipw = password;
}

// Pair<String>* ESPHub::customChannelRecieved(){

// }

// void ESPHub::sendToServer(const char * msg){

// }

// if message size < 64 bytes, pad until the message is 64 byte because packet size is fixed to 64b
String ESPHub::padMsg(String msg){
  String out = msg;
  if (msg.length() < 64){
    for (int i = 0; i < (64 - msg.length()); i++){
      out += ' ';
    }
  }
  return out;
}



bool ESPHub::receivedCustomChannel(){
    return customChannelRecieved;
}

// connect to wifi,
void ESPHub::connectToWiFi(){
    if (WiFi.status() != WL_CONNECTED){
        Serial.println("Connecting to WiFi...");
        Serial.println("WiFi disconnected, reconnecting");
        Serial.print("Connecting to ");
        Serial.println(WiFissid);
        WiFi.begin(WiFissid,  WiFipw);
        while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
        }
        // Print local IP address and start web server
        Serial.println("");
        Serial.println("WiFi connected.");
        Serial.println("IP address: ");
        Serial.println(WiFi.localIP());
    } else {
        Serial.println("Already connected to WiFi");
    }
}

void ESPHub::connectToServer(){
    if (!socketclient.connected()){
        Serial.println("Connecting to Server...");
        if (socketclient.connect(serverIP, serverPort)){
            Serial.println("Connected to Server");
        } else {
            Serial.println("Couldn't connect to server. Retrying...");
        }
    } else {
        Serial.println("Already connected to Server");
    }
}

bool ESPHub::connectedToServer(){
    return socketclient.connected();
}

void ESPHub::sendToServer(String channel, String value){
    String msg = String("CST") + "\n" + channel + "\n" + value + "\n";
    socketclient.print(padMsg(msg));
}

// start connect to wifi and server then listening and recving
void ESPHub::listen(){
    customChannelRecieved = false;
    message.channelName = "";
    message.value = "";
    // while (socketclient.connected()){}
    if (socketclient.available()){
        int valueIndex = 0;

        // Parse message, 4 sub-message seperated by newline
        // First sub-message: CMD or REQ. CMD for when the server doesn't expect return message,
        //                    REQ is for when it does
        // If CMD: 2nd sm is Command type: 
        //              +) DIG: digital - digitalWrite() to pin
        //              +) PWM: analog write PWM signal to pin
        //              +) CST: output data to 'message' structure, your code will determine
        //                      what to do with them
        //          3rd sm is the pin (for DIG and PWM Command-Type) or (channel-name
        //          for CST Command-Type)
        //          4th sm is a value sent by server
        // If REQ: 2nd can be: 
        //          PST (requesting pin-state), if 2nd sm is PST, 3rd and 4th is empty
        //          CST (behaves like CMD_CST), but the ESP8266 respond to the server
        String a;
        String b;
        String c;
        String d;

        for (int i = 0; i < 64; i++){
            char temp = socketclient.read();
            if (temp != '\n'){
            switch (valueIndex) {
                case 0:
                    a += temp;
                    break;
                case 1:
                    b += temp;
                    break;
                case 2:
                    c += temp;
                    break;
                case 3:
                    d += temp;
                    break;
            }
            } else {
            valueIndex++;
            }
        }
        
        if (a != "PING"){
            // Serial.println(a);
            // Serial.println(b);
            // Serial.println(c);
            // Serial.println(d);

        }

        // CMD setting pin state
        if (a == "CMD"){

            int pin = c.toInt();
            int value = d.toInt();

            pinMode(pin, OUTPUT);

            if (b == "DIG"){
                digitalWrite(pin, value);

                if (value == 1){
                    pinValues[pin] = 255;
                } else {
                    pinValues[pin] = 0;
                }

            } else if (b == "PWM") { 

                int pin = c.toInt();
                int value = d.toInt();

                pinMode(pin, OUTPUT);

                analogWrite(pin, value);
                pinValues[pin] = value;
            } else if (b == "CST") {
                customChannelRecieved = true;
                message.channelName = c;
                message.value = d;
            }
        // REQ requesting pin-state
        } else if (a == "REQ"){
            if (b == "PST"){
            String pinString = b + '\n';
            for (int i = 0; i < 17; i++){
                pinString += String(pinValues[i]);
                pinString += '\n';
            }
            socketclient.print(padMsg(pinString));
            } else if (b == "CST") {
                customChannelRecieved = true;
                message.channelName = c;
                message.value = d;
            } 
        } else if (a == "PING") {
            socketclient.print(padMsg(String("PING\n")));
        }
    } 
}