//❀ © 2026 Capski. All Rights Reserved. ❀

#include <Arduino.h>

// ULN2003
int r_pins[4] = {7, 8, 9, 10};   // Turntable motor
int z_pins[4] = {3, 4, 5, 6};    // Z-axis motor
int joystick_y = A1;   // The joy of a stick

int joystick_btn = 2;
int sensor_pin = A0;

const int steps_per_rev = 2048; 
const float layer_height_mm = .7;
const float sensor_offset_cm = 8.0;
const int lead_screw_rot_per_cm = 8;

int steps_per_layer;

// timing
unsigned long lastStepTime = 0;
int stepDelay = 8; // ms 
int zStepDelay = 8; // increase = slower
unsigned long lastZStepTime = 0;

// STATE
enum State {
  IDLE,
  HOMING,
  READY,
  SCANNING,
  STOPPED,
  MANUAL_HOMING
};

State state = IDLE;

bool manualMove = false;
int manualDir = 0; // -1 = down, +1 = up

// VARIABLES

int stepIndexR = 0;
int stepIndexZ = 0;

int rotationSteps = 0;
int zStepsDone = 0;

float angle = 0;
float z = 0;
const float max_z_height_mm = 120;

bool movingZ = false;
int zStepProgress = 0;

// SEQUENCE

int seq[8][4] = {
  {1,0,0,0},
  {1,1,0,0},
  {0,1,0,0},
  {0,1,1,0},
  {0,0,1,0},
  {0,0,1,1},
  {0,0,0,1},
  {1,0,0,1}
};

// SETUP

void setup() {
  Serial.begin(9600);

  pinMode(joystick_btn, INPUT_PULLUP);

  for(int i=0;i<4;i++){
    pinMode(r_pins[i], OUTPUT);
    pinMode(z_pins[i], OUTPUT);
  }

  steps_per_layer = (steps_per_rev * lead_screw_rot_per_cm * layer_height_mm) / 10;

  Serial.println("READY");
}

// CONTROL la MOTOR

void stepMotor(int pins[4], int &index, int dir) {
  index += dir;
  if(index > 7) index = 0;
  if(index < 0) index = 7;

  for(int i=0;i<4;i++){
    digitalWrite(pins[i], seq[index][i]);
  }
}

// SENSOR

float readDistance() {
  float sum = 0;

  // average to reduce noise
  for(int i = 0; i < 5; i++) {
    sum += analogRead(sensor_pin);
    delay(2);
  }

  float avg = sum / 5.0;

  // convert to voltage
  float voltage = avg * (5.0 / 1023.0);

  // NEW formula (from your image)
  float distance = 29.988 * pow(voltage, -1.173);

  return distance;
}

// LOOP NGA MAIN LOL

void loop() {

  handleSerial();
  handleJoystick();

  if (millis() - lastStepTime >= stepDelay) {
    lastStepTime = millis();

    runState();
  }
}

// CEREAL

void handleSerial() {
  if (Serial.available()) {
    char cmd = Serial.read();

    if (cmd == 'H') state = READY;

    if (cmd == 'S') state = SCANNING;

    if (cmd == 'P') state = STOPPED;

    if (cmd == 'Q') {
      state = IDLE;
      Serial.println("DONE");
    }

    if (cmd == 'U') {
      manualMove = true;
      manualDir = 1;
      state = HOMING;
    }

    if (cmd == 'D') {
      manualMove = true;
      manualDir = -1;
      state = HOMING;
    }

    if (cmd == 'X') {
      manualMove = false;
    }

    if (cmd == 'M') {

      if (state != MANUAL_HOMING) {
        state = MANUAL_HOMING;
        Serial.println("MANUAL HOMING ON");
      }

      else {
        state = READY;

        z = 0;
        rotationSteps = 0;
        zStepProgress = 0;

        Serial.println("MANUAL HOMING OFF");
      }
    }
  }
}

// PS5
void handleJoystick() {
  if (digitalRead(joystick_btn) == LOW) {
    state = HOMING;
  }
}

// ASIMOV CASCADE

void runState() {

  switch(state) {

    case HOMING:
      if (manualMove) {
        stepMotor(z_pins, stepIndexZ, manualDir);
      }
      break;

    case READY:
      // idle, waiting for scan
      break;

    case MANUAL_HOMING:
      manualHomingControl();
      break;

    case SCANNING:
      scanningStep();
      break;

    case STOPPED:
      // do nothing, motors stop naturally
      break;

    case IDLE:
      break;
  }
}

void scanningStep() {

  if (movingZ) {

    if (millis() - lastZStepTime >= zStepDelay) {
      lastZStepTime = millis();

      stepMotor(z_pins, stepIndexZ, 1);
      zStepProgress++;
    }

    if (zStepProgress >= steps_per_layer) {
      movingZ = false;
      zStepProgress = 0;
      z += layer_height_mm / 10.0;
    }

    if (z >= max_z_height_mm / 10.0) {
      state = STOPPED;
      Serial.println("SCAN COMPLETE");
      return;
    }

    return;
  }

  // Normal scanning
  stepMotor(r_pins, stepIndexR, 1);
  rotationSteps++;

  angle = (2 * 3.141592 * rotationSteps) / steps_per_rev;

  if(rotationSteps % 8 == 0) {

    float distance = readDistance();

    distance = constrain(distance, 0, 30);

    distance = sensor_offset_cm - distance;

    float x = cos(angle) * distance;
    float y = sin(angle) * distance;

    Serial.print(x);
    Serial.print(",");
    Serial.print(y);
    Serial.print(",");
    Serial.println(z);
  }

  if (rotationSteps >= steps_per_rev) {
    rotationSteps = 0;
    movingZ = true;
  }
}

void manualHomingControl() {
  int joyVal = analogRead(joystick_y);

  int center = 512;
  int deadzone = 100;

  static unsigned long lastManualStep = 0;

  // UP
  if (joyVal > center + deadzone) {

    int speedAmount = joyVal - (center + deadzone);

    int manualDelay = map(
      speedAmount,
      0,
      511 - deadzone,
      25,   // can be slow
      3     // can be fast
    );

    if (millis() - lastManualStep >= manualDelay) {
      lastManualStep = millis();
      stepMotor(z_pins, stepIndexZ, 1);
    }
  }

  // DOWN
  else if (joyVal < center - deadzone) {

    int speedAmount = (center - deadzone) - joyVal;

    int manualDelay = map(
      speedAmount,
      0,
      511 - deadzone,
      25,
      3
    );

    if (millis() - lastManualStep >= manualDelay) {
      lastManualStep = millis();
      stepMotor(z_pins, stepIndexZ, -1);
    }
  }
}
