// Sketch de PlantOS.
//
// Lee dos sensores y manda los datos por el puerto serie, en bloques que
// terminan con una línea "---" (así los reconoce el backend en end1.ts).
//
//   - Temperatura: sensor DS18B20, conectado en el pin digital 3 (D3).
//   - "Conductividad": sensor de humedad de 2 patitas, conectado a la
//     entrada analógica A1. OJO: esto no es un sensor de conductividad de
//     verdad, es el sensor de humedad que tenemos usado como reemplazo
//     mientras llega el sensor de conductividad real, tal cual lo hablamos.
//     Por eso el valor no es preciso, es solo un número de referencia.
//
// Librerías que hay que instalar antes de subir este código (en el Arduino
// IDE: Herramientas -> Administrar bibliotecas...):
//   - "OneWire" (de Paul Stoffregen)
//   - "DallasTemperature" (de Miles Burton)

#include <OneWire.h>
#include <DallasTemperature.h>

const int PIN_TEMPERATURA = 3;   // DS18B20 - cable de datos (amarillo, normalmente)
const int PIN_CONDUCTIVIDAD = A1; // sensor de humedad de 2 patitas - salida analógica

OneWire cableTemperatura(PIN_TEMPERATURA);
DallasTemperature sensorTemperatura(&cableTemperatura);

void setup() {
  Serial.begin(9600);
  sensorTemperatura.begin();
}

void loop() {
  // Pedimos la temperatura y esperamos a que el sensor conteste.
  sensorTemperatura.requestTemperatures();
  float temperatura = sensorTemperatura.getTempCByIndex(0);

  // Leemos el valor analógico crudo (va de 0 a 1023).
  int lecturaConductividad = analogRead(PIN_CONDUCTIVIDAD);

  Serial.print("Temperatura: ");
  Serial.println(temperatura);

  Serial.print("Conductividad: ");
  Serial.println(lecturaConductividad);

  Serial.println("---");

  delay(5000); // manda una lectura nueva cada 5 segundos
}
