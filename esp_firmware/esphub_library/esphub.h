#ifndef ESPHUB

#define ESPHUB

#include "Arduino.h"
#include <ESP8266WiFi.h>

struct customChannelMessage {
    String channelName;
    String value;
};

class ESPHub
{
    private:
        int pinValues[17];
    //     bool customChannel = false;

        IPAddress serverIP;
        int serverPort;
        const char* WiFissid;
        const char* WiFipw;
        WiFiClient socketclient;
        String padMsg(String msg);
        bool customChannelRecieved = false;
    public:

        
        struct customChannelMessage message;

        ESPHub(IPAddress IP, int port, const char* ssid, const char* password);
        // Pair<String>* customChannelRecieved();
        // void sendToServer(const char * msg);
        void connectToWiFi();
        void connectToServer();
        bool receivedCustomChannel();
        void listen();
        bool connectedToServer();
        void sendToServer(String channel, String value);

};

#endif