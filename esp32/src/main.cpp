#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <Adafruit_NeoPixel.h>
#include "HX711.h"

// --- DATOS A CAMBIAR POR EL USUARIO ---
const char* ssid = "iPhone de Alberto";
const char* password = "alberto123";

const String SUPABASE_URL = "https://vtbullshwdkpufritrth.supabase.co"; 
const String SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0YnVsbHNod2RrcHVmcml0cnRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxMTcxODUsImV4cCI6MjA5MzY5MzE4NX0.fFbyqAVvcEKIlk7q9DBj0cX7ckJ2yddibsQelw3BACY";
// --------------------------------------

// PINES
#define PIN_OLED_SDA     21
#define PIN_OLED_SCL     22
#define PIN_HX711_DOUT   32
#define PIN_HX711_PD_SCK 33
#define PIN_NEOPIXEL     18
#define PIN_BUTTON       19 // Pin para el botón de Tara

// CONSTANTES
#define SCREEN_WIDTH     128
#define SCREEN_HEIGHT    64
#define NUM_LEDS         16
#define MAX_BRIGHTNESS   50

Adafruit_SSD1306 oled(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);
Adafruit_NeoPixel ring(NUM_LEDS, PIN_NEOPIXEL, NEO_GRB + NEO_KHZ800);
HX711 scale;
float calibration_factor = 420.0;

// Variables lógicas
float lastStableWeight = 0;
bool isGlassLifted = false;
bool isStabilizing = false;
unsigned long liftTime = 0;
unsigned long placedTime = 0;
unsigned long lastWiFiCheck = 0; 
unsigned long lastSyncCheck = 0; 
float currentProgressPercent = 0.0; 
String macAddress = "Conectando...";

// Declaración de funciones antes de usarlas
void sendDrinkToSupabase(int amount);
void updateLedRing(float percent);

void setup() {
  Serial.begin(115200);
  
  // Inicializar Botón de Tara 
  pinMode(PIN_BUTTON, INPUT_PULLUP);
  
  ring.begin();
  ring.setBrightness(MAX_BRIGHTNESS);
  ring.clear();
  ring.show();

  Wire.begin(PIN_OLED_SDA, PIN_OLED_SCL);
  if(oled.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    oled.clearDisplay();
    oled.setTextColor(SSD1306_WHITE);
  }

  WiFi.mode(WIFI_STA);
  
  oled.clearDisplay();
  oled.setCursor(0,0);
  oled.println("Conectando Wi-Fi...");
  oled.display();
  
  WiFi.begin(ssid, password);
  int retries = 0;
  while (WiFi.status() != WL_CONNECTED && retries < 15) {
    delay(500);
    Serial.print(".");
    retries++;
  }

  macAddress = WiFi.macAddress();

  oled.clearDisplay();
  oled.setCursor(0,0);
  if (WiFi.status() == WL_CONNECTED) {
    oled.println("Wi-Fi CONECTADO!");
  } else {
    oled.println("Wi-Fi DESCONECTADO");
    oled.println("(Modo Solo USB)");
  }
  oled.setCursor(0, 20);
  oled.println("Tu MAC de Vinculacion:");
  oled.println(macAddress);
  oled.display();
  delay(3000);

  // Inicializar Báscula
  scale.begin(PIN_HX711_DOUT, PIN_HX711_PD_SCK);
  scale.set_scale();
  scale.tare();
  scale.set_scale(calibration_factor);
}

void loop() {
  // 0. BOTÓN DE TARA (Cambio de Vaso / Rellenado)
  if (digitalRead(PIN_BUTTON) == LOW) {
    scale.tare();
    lastStableWeight = 0;
    isGlassLifted = false;
    isStabilizing = false;
    
    oled.clearDisplay();
    oled.setTextSize(1);
    oled.setCursor(0, 10);
    oled.println("¡Báscula en 0g!");
    oled.println("Vaso cambiado.");
    oled.display();
    
    delay(1500); 
    return; 
  }

  // 1. RECONEXIÓN WI-FI Y SINCRONIZACIÓN
  if (WiFi.status() != WL_CONNECTED && (millis() - lastWiFiCheck > 10000)) {
    WiFi.reconnect();
    if(macAddress == "00:00:00:00:00:00" || macAddress == "Conectando...") {
        macAddress = WiFi.macAddress();
    }
    lastWiFiCheck = millis();

  } else if (WiFi.status() == WL_CONNECTED && (macAddress == "00:00:00:00:00:00" || macAddress == "Conectando...")) {
    macAddress = WiFi.macAddress();

  } else if (WiFi.status() == WL_CONNECTED && (millis() - lastSyncCheck > 3000)) { // Modificado a 3s como pediste
    sendDrinkToSupabase(0); 
    lastSyncCheck = millis();
  }

  // 2. LEER COMANDOS DE LA WEB (Vía cable Serial USB)
  if (Serial.available() > 0) {
    String command = Serial.readStringUntil('\n');
    command.trim();
    if (command.startsWith("PROGRESS:")) {
      float val = command.substring(9).toFloat();
      if (val < 0) {
        currentProgressPercent = -val;
        updateLedRing(0.0);
      } else {
        currentProgressPercent = val;
        updateLedRing(currentProgressPercent);
      }
    }
  }

  // 3. LEER BÁSCULA 
  float weight = -scale.get_units(10); 
  if (weight < 0) weight = 0.0;
  
  if (weight < 20 && !isGlassLifted && lastStableWeight > 30) {
    isGlassLifted = true;
    isStabilizing = false;
    liftTime = millis();
  }
  
  if (weight > 30 && isGlassLifted && !isStabilizing && (millis() - liftTime > 1000)) {
    isStabilizing = true;
    placedTime = millis();
  }
  
  if (isStabilizing && (millis() - placedTime > 3000)) {
    isGlassLifted = false;
    isStabilizing = false;
    
    float diff = lastStableWeight - weight;
    
    if (diff >= 10) {
      int amountDrank = (int)diff;
      
      Serial.print("DRINK:");
      Serial.println(amountDrank);
      
      if (WiFi.status() == WL_CONNECTED) {
        sendDrinkToSupabase(amountDrank);
        lastSyncCheck = millis(); 
      }
    }
    lastStableWeight = weight;
  }
  
  if (!isGlassLifted && !isStabilizing && weight > 30 && lastStableWeight < 30) {
    lastStableWeight = weight;
  }
  
  if (!isGlassLifted && !isStabilizing && weight > (lastStableWeight + 15)) {
    lastStableWeight = weight;
  }

  // 4. ACTUALIZAR PANTALLA OLED
  oled.clearDisplay();
  oled.setTextSize(1);
  oled.setCursor(0, 0);
  if(WiFi.status() == WL_CONNECTED) {
    oled.print("[Wi-Fi] ");
  } else {
    oled.print("[USB]   ");
  }
  oled.println(macAddress);
  
  oled.setCursor(0, 20);
  oled.print("Peso: ");
  oled.print((int)weight);
  oled.println("g");
  
  oled.setCursor(0, 35);
  oled.print("Progreso: ");
  oled.print((int)currentProgressPercent);
  oled.println("%");
  
  if (isGlassLifted || isStabilizing) {
    oled.setCursor(0, 50);
    oled.println(">> Bebiendo... <<");
  }
  oled.display();
  
  delay(150); 
}

void sendDrinkToSupabase(int amount) {
  HTTPClient http;
  String url = SUPABASE_URL + "/rest/v1/rpc/log_drink_from_device";
  
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", SUPABASE_ANON_KEY);
  http.addHeader("Authorization", "Bearer " + SUPABASE_ANON_KEY);
  
  String payload = "{\"device_mac\":\"" + macAddress + "\",\"drink_amount\":" + String(amount) + "}";
  
  int httpResponseCode = http.POST(payload);
  
  if (httpResponseCode == 200) {
    String response = http.getString();
    float val = response.toFloat();
    if (val < 0) {
      currentProgressPercent = -val;
      updateLedRing(0.0);
    } else {
      currentProgressPercent = val;
      updateLedRing(currentProgressPercent);
    }
  } else { 
    if (amount > 0) {
      Serial.print("Error enviando por Wi-Fi. HTTP Code: ");
      Serial.println(httpResponseCode);
    } else {
      currentProgressPercent = 0.0;
      updateLedRing(0.0);
    }
  }
  http.end();
}

void updateLedRing(float percent) {
  if(percent > 100.0) percent = 100.0;
  if(percent < 0.0) percent = 0.0;
  
  int ledsToLight = (int)((percent / 100.0) * NUM_LEDS);
  ring.clear();
  for(int i = 0; i < NUM_LEDS; i++) {
    if(i < ledsToLight) ring.setPixelColor(i, ring.Color(0, 100, 255));
  }
  if (percent >= 100.0) {
    for(int i = 0; i < NUM_LEDS; i++) ring.setPixelColor(i, ring.Color(0, 255, 0));
  }
  ring.show();
}
