#include <ESP8266WiFi.h>
#include <esphub.h>

// ESPHub by William Nguyen

/* 
 * Enter your ip, change the port if you wish, and enter WiFi credentials 
 * For documentation on the API, visit the GitHub page: https://github.com/NguyenQuang-10/ESPHub
 * 
 * If you find a bug, please contact me or open an issue, this project is still under development
 */
IPAddress ip(,,,);
int port = 5501;
ESPHub esp(ip, port , "SSID", "PASSWORD");

void setup() {
  // put your setup code here, to run once:
  Serial.begin(115200);
}

void loop() {
  // put your main code here, to run repeatedly:

  esp.connectToWiFi();
  esp.connectToServer();

  while (esp.connectedToServer()){
      esp.listen();
  }
  

}
