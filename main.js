/**
 * MakeCode extension for ESP8266 Wifi modules and ThinkSpeak website https://thingspeak.com/
 */
//% color=#009b5b icon="\uf1eb" block="ESP8266 ThingSpeak"

let wifi_connected: boolean = false
let thingspeak_connected: boolean = false
let last_upload_successful: boolean = false

let s = 0
let bird = 0
// bluetooth.onBluetoothConnected(function () {
//     music.playTone(988, music.beat(BeatFraction.Breve))
// })
// bluetooth.startAccelerometerService()
// bluetooth.startButtonService()
// bluetooth.startIOPinService()
// bluetooth.startLEDService()
// bluetooth.startTemperatureService()

connectWifi(
    SerialPin.P15,
    SerialPin.P16,
    BaudRate.BaudRate115200,
    // "ozhost",
    // "ozel2358"
    "Eva iphone",
    "xall8736"
)
basic.forever(function () {
    s = sonar.ping(
    DigitalPin.P7,
    DigitalPin.P6,
    PingUnit.Centimeters
    )
    serial.writeValue("d", s)
    serial.writeValue("t", input.temperature())
    if (s <= 15) {
        music.setVolume(255)
        music.playTone(988, music.beat(BeatFraction.Breve))
        bird = 1
    } else {
        bird = 0
    }
    connect_IFTTT(
        "maker.ifttt.com",          //Host
        "06170232_GS",           //Event Name
        "dwVaKU9FdjLbx5UDmvyPrW",   //Key
        s,
        input.temperature(),
        bird
    )
    wait(1000)
})

// write AT command with CR+LF ending
function sendAT(command: string, wait: number = 100) {
    serial.writeString(command + "\u000D\u000A")
    basic.pause(wait)
}

// wait for certain response from ESP8266
function waitResponse(): boolean {
    let serial_str: string = ""
    let result: boolean = false
    let time: number = input.runningTime()
    while (true) {
        serial_str += serial.readString()
        if (serial_str.length > 200) serial_str = serial_str.substr(serial_str.length - 200)
        if (serial_str.includes("OK") || serial_str.includes("ALREADY CONNECTED")) {
            result = true
            break
        } else if (serial_str.includes("ERROR") || serial_str.includes("SEND FAIL")) {
            break
        }
        if (input.runningTime() - time > 30000) break
    }
    return result
}

/**
* Initialize ESP8266 module and connect it to Wifi router
*/
//% block="Initialize ESP8266|RX (Tx of micro:bit) %tx|TX (Rx of micro:bit) %rx|Baud rate %baudrate|Wifi SSID = %ssid|Wifi PW = %pw"
//% tx.defl=SerialPin.P0
//% rx.defl=SerialPin.P1
//% ssid.defl=your_ssid
//% pw.defl=your_pw
function connectWifi(tx: SerialPin, rx: SerialPin, baudrate: BaudRate, ssid: string, pw: string) {
    wifi_connected = false
    thingspeak_connected = false
    serial.redirect(
        tx,
        rx,
        baudrate
    )
    sendAT("AT+RESTORE", 1000) // restore to factory settings
    sendAT("AT+CWMODE=1") // set to STA mode
    sendAT("AT+RST", 1000) // reset
    sendAT("AT+CWJAP=\"" + ssid + "\",\"" + pw + "\"", 0) // connect to Wifi router
    wifi_connected = waitResponse()
    basic.pause(100)
}

/**
* Connect to ThingSpeak and upload data. It would not upload anything if it failed to connect to Wifi or ThingSpeak.
*/
//% block="Upload data to ThingSpeak|URL/IP = %ip|Write API key = %write_api_key|Field 1 = %n1|Field 2 = %n2|Field 3 = %n3|Field 4 = %n4|Field 5 = %n5|Field 6 = %n6|Field 7 = %n7|Field 8 = %n8"
//% ip.defl=api.thingspeak.com
//% write_api_key.defl=your_write_api_key
function connect_IFTTT(host: string, eventName: string, key: string, n1: number, n2: number, n3: number) {
    if (wifi_connected && key != "") {
        sendAT("AT+CIPSTART=\"TCP\",\"" + host + "\",80", 0) // connect to website server
        basic.pause(100)
        let str: string = "GET /trigger/" + eventName + "/with/key/" + key + "?value1=" + n1 + "&value2=" + n2 + "&value3=" + n3 + " HTTP/1.1" + "\u000D\u000A" + "Host: maker.ifttt.com" + "\u000D\u000A" + "Connection: close" + "\u000D\u000A" + "\u000D\u000A";
        sendAT("AT+CIPSEND=" + (str.length + 2))
        sendAT(str, 0) // upload data
        basic.pause(100)
    }
}

/**
* Wait between uploads
*/
//% block="Wait %delay ms"
//% delay.min=0 delay.defl=5000
function wait(delay: number) {
    if (delay > 0) basic.pause(delay)
}

/**
* Check if ESP8266 successfully connected to Wifi
*/
//% block="Wifi connected ?"
function isWifiConnected() {
    return wifi_connected
}

/**
* Check if ESP8266 successfully connected to ThingSpeak
*/
//% block="ThingSpeak connected ?"
function isThingSpeakConnected() {
    return thingspeak_connected
}

/**
* Check if ESP8266 successfully uploaded data to ThingSpeak
*/
//% block="Last data upload successful ?"
function isLastUploadSuccessful() {
    return last_upload_successful
}
