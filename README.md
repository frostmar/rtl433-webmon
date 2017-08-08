# rtl433-webmon
Web front end for a software defined radio reading sensors.  
Serves a simple webpage using websockets and Angular to display live
data received from 433MHz sensors.

Uses [rtl_433](https://github.com/merbanan/rtl_433) to receive and decode sensors transmissions

### Displays:
- Temperature/humidity (variety of cheap 433MHz temperature sensors)
- Power (CurrentCost TX watt meter)

![screenshot](./screenshot.png)

### Running
Uses [`forever`](https://github.com/foreverjs/forever) to run as a daemon.  
`npm run start-daemon`  
`npm run stop-daemon`  
