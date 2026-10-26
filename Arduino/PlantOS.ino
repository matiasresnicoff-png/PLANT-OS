#include <OneWire.h>
#include <DallasTemperature.h>

// CONEXIONES ACTUALES DEL VIDEO
const int PIN_TEMPERATURA = 3;      // DATA del DS18B20 → D3
const int PIN_CONDUCTIVIDAD = A1;   // AO del sensor → A1

OneWire oneWire(PIN_TEMPERATURA);
DallasTemperature sensorTemperatura(&oneWire);

void setup() {
  Serial.begin(9600);

  sensorTemperatura.begin();

  pinMode(PIN_CONDUCTIVIDAD, INPUT);
}

void loop() {

  // ----- TEMPERATURA -----
  sensorTemperatura.requestTemperatures();
  float temperatura = sensorTemperatura.getTempCByIndex(0);

  // ----- "CONDUCTIVIDAD" -----
  // Por ahora se usa el sensor de humedad de 2 puntas
  // como reemplazo del sensor de conductividad real.
  int conductividad = analogRead(PIN_CONDUCTIVIDAD);

  // ----- ENVIAR DATOS -----
  Serial.print("Temperatura: ");
  Serial.println(temperatura);

  Serial.print("Conductividad: ");
  Serial.println(conductividad);

  // El backend reconoce el final de cada bloque con ---
  Serial.println("---");

  delay(5000);
}
