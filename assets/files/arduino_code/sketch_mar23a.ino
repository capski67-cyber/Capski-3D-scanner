//❀ © 2026 Capski. All Rights Reserved. ❀

#include <Arduino.h>

// ULN2003 motor pins (4 pins per motor)
int r_pins[4] = {7, 8, 9, 10};   // Turntable motor
int z_pins[4] = {3, 4, 5, 6};    // Z-axis motor

int joystick_btn = 2;
int sensor_pin = A0;

const int steps_per_rev = 2048;   // 28BYJ-48 real steps
const float layer_height_mm = .7;
const int lead_screw_rot_per_cm = 8;

int steps_per_layer;

// timing
unsigned long lastStepTime = 0;
int stepDelay = 3; // ms (smooth control)
int zStepDelay = 8; // slower than rotation (increase = slower)
unsigned long lastZStepTime = 0;

// STATE
enum State {
  IDLE,
  HOMING,
  READY,
  SCANNING,
  STOPPED
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
    sum += analogRead(A0);
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

    // NEW manual controls
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

// PEW PEW
bool movingZ = false;
int zStepProgress = 0;

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
      z += layer_height_mm;
    }
    return;
  }

  // Normal scanning
  stepMotor(r_pins, stepIndexR, 1);
  rotationSteps++;

  angle = (2 * 3.141592 * rotationSteps) / steps_per_rev;

  float distance = readDistance();

  float x = cos(angle) * distance;
  float y = sin(angle) * distance;

  Serial.print(x);
  Serial.print(",");
  Serial.print(y);
  Serial.print(",");
  Serial.println(z);

  if (rotationSteps >= steps_per_rev) {
    rotationSteps = 0;
    movingZ = true;   // instead of blocking loop
  }
}