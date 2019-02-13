# rtl433-webmon
Web front end for a software defined radio reading sensors.  
Serves a simple webpage using websockets and Angular to display live
data received from 433MHz sensors.

Uses [rtl_433](https://github.com/merbanan/rtl_433) to receive and decode sensors transmissions

### Inputs:
- 433MHz temperature/humidity sensors that can be received and decoded by rtl_433
- PMS5003 air quality particulates sensor via serial port
- temperature/humidity device polled from Samsung SmartThings cloud

### Logging:
- Readings logged every 5mins to AWS CloudWatch

### Web Display:
Immediate readings for 
- Temperature and humidity (%RH)
- Electrical Power (Watts)
- Air Quality (PM2.5 and PM10 counts)

![screenshot](./screenshot.png)

### Running
Uses [`forever`](https://github.com/foreverjs/forever) to run as a daemon.  
`npm run start-daemon`  
`npm run stop-daemon`  
