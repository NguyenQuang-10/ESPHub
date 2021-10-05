#include <ESP8266WiFi.h>
#include <esphub.h>

// ESPHub by William Nguyen

/* 
 * Enter your ip, change the port if you wish, and enter WiFi credentials 
 * For documentation on the API, visit the GitHub page: https://github.com/NguyenQuang-10/ESPHub
 * 
 */

IPAddress ip(192,168,1,15); // change this to your server IP Address
int port = 5501; // port the server is running on
ESPHub esp(ip, port , "Minh HS1143", "binhminh67"); // change SSID and password to your WiFi credentials

void setup() {
  // put your setup code here, to run once:
  Serial.begin(115200);
}

void loop() {
  // put your main code here, to run repeatedly:

  esp.connectToWiFi(); // connects to wifi if not already
  esp.connectToServer(); // connects to server if not already

  int number = 0;
  int counter = 0;

  while (esp.connectedToServer()){ // check whether is connected to server
      esp.listen(); // always keep this at the top of loop

      if(esp.receivedCustomChannel()){  // check if the last input was from a custom channel
        if (esp.message.channelName == "customChannel"){  //check if the channel that sent the input has name "customChannel"
          Serial.print("Value recieved from custom channel: ");
          Serial.println(esp.message.value);  // get the value from the custom input
        }
      }

      // send a counter value that increase every 100000 iteration
      if(number == 100000){
        number = 0;
        counter++;
        esp.sendToServer("display", String(counter)); // send the counter value to the server under channel name "display"
      } else {
        number++;
      }
            
      
  }
  

}
