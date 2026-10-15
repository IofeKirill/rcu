export interface CSignature { name: string; returnType: string; parameters: string; header: string; macro: string; dependencies: string[]; }
export const C_SIGNATURES: CSignature[] = [
  {
    "name": "BluetoothConnect",
    "returnType": "void",
    "parameters": "const char *name",
    "header": "BluetoothConnect.h",
    "macro": "_BLUETOOTHCONNECT_",
    "dependencies": []
  },
  {
    "name": "BluetoothGetName",
    "returnType": "char *",
    "parameters": "",
    "header": "BluetoothGetName.h",
    "macro": "_BLUETOOTHGETNAME_",
    "dependencies": []
  },
  {
    "name": "BluetoothSetMode",
    "returnType": "void",
    "parameters": "uint8_t state",
    "header": "BluetoothSetMode.h",
    "macro": "_BLUETOOTHSETMODE_",
    "dependencies": []
  },
  {
    "name": "BluetoothSetName",
    "returnType": "void",
    "parameters": "char *name",
    "header": "BluetoothSetName.h",
    "macro": "_BLUETOOTHSETNAME_",
    "dependencies": []
  },
  {
    "name": "BluetoothWaitConnect",
    "returnType": "void",
    "parameters": "",
    "header": "BluetoothWaitConnect.h",
    "macro": "_BLUETOOTHWAITCONNECT_",
    "dependencies": []
  },
  {
    "name": "DisplayShowImage",
    "returnType": "int",
    "parameters": "const char* filename, float time",
    "header": "DisplayShowImage.h",
    "macro": "_DISPLAYSHOWIMAGE_",
    "dependencies": []
  },
  {
    "name": "GetAHRS",
    "returnType": "int16_t",
    "parameters": "uint8_t which,uint8_t command1,uint8_t command2",
    "header": "GetAHRS.h",
    "macro": "_GETAHRS_",
    "dependencies": []
  },
  {
    "name": "GetAICamData",
    "returnType": "uint8_t",
    "parameters": "uint8_t cmd",
    "header": "GetAICamData.h",
    "macro": "_GETAICAMDATA_",
    "dependencies": []
  },
  {
    "name": "GetAICamVoice",
    "returnType": "uint16_t",
    "parameters": "uint16_t cmd",
    "header": "GetAICamVoice.h",
    "macro": "_GETAICAMVOICE_",
    "dependencies": []
  },
  {
    "name": "GetAirPressure",
    "returnType": "float",
    "parameters": "u8 which",
    "header": "GetAirPressure.h",
    "macro": "_GETAIRPRESSURE_",
    "dependencies": []
  },
  {
    "name": "GetAirQuality",
    "returnType": "uint8_t",
    "parameters": "uint8_t which",
    "header": "GetAirQuality.h",
    "macro": "_GETAIRQUALITY_",
    "dependencies": []
  },
  {
    "name": "GetAntiLight",
    "returnType": "uint16_t",
    "parameters": "uint8_t which",
    "header": "GetAntiLight.h",
    "macro": "_GETANTILIGHT_",
    "dependencies": []
  },
  {
    "name": "GetBTModuleRemoteButton",
    "returnType": "uint16_t",
    "parameters": "void",
    "header": "GetBTModuleRemoteButton.h",
    "macro": "_GETBTMODULEREMOTEBUTTON_",
    "dependencies": []
  },
  {
    "name": "GetBTModuleRemoteCode",
    "returnType": "uint32_t",
    "parameters": "void",
    "header": "GetBTModuleRemoteCode.h",
    "macro": "_GETBTMODULEREMOTECODE_",
    "dependencies": []
  },
  {
    "name": "GetBTModuleRemoteRocker",
    "returnType": "int16_t",
    "parameters": "uint8_t direction,uint8_t axis",
    "header": "GetBTModuleRemoteRocker.h",
    "macro": "_GETBTMODULEREMOTEROCKER_",
    "dependencies": []
  },
  {
    "name": "GetBluetooth",
    "returnType": "uint16_t",
    "parameters": "void",
    "header": "GetBluetooth.h",
    "macro": "_GETBLUETOOTH_",
    "dependencies": []
  },
  {
    "name": "GetBluetoothControl",
    "returnType": "uint32_t",
    "parameters": "void",
    "header": "GetBluetoothControl.h",
    "macro": "_GETBLUETOOTHCONTROL_",
    "dependencies": []
  },
  {
    "name": "GetBluetoothControlData",
    "returnType": "uint8_t",
    "parameters": "void",
    "header": "GetBluetoothControlData.h",
    "macro": "_GETBLUETOOTHCONTROLDATA_",
    "dependencies": []
  },
  {
    "name": "GetBluetoothData",
    "returnType": "uint8_t",
    "parameters": "void",
    "header": "GetBluetoothData.h",
    "macro": "_GETBLUETOOTHDATA_",
    "dependencies": []
  },
  {
    "name": "GetCalendar",
    "returnType": "unsigned char",
    "parameters": "uint8_t which, unsigned char command",
    "header": "GetCalendar.h",
    "macro": "_GETCALENDAR_",
    "dependencies": []
  },
  {
    "name": "GetCamRecog",
    "returnType": "int8_t",
    "parameters": "uint8_t mode",
    "header": "GetCamRecog.h",
    "macro": "_GETCAMRECOG_",
    "dependencies": []
  },
  {
    "name": "GetChoiceBox",
    "returnType": "uint8_t",
    "parameters": "uint8_t* words",
    "header": "GetChoiceBox.h",
    "macro": "_GETCHOICEBOX_",
    "dependencies": []
  },
  {
    "name": "GetColorSensor",
    "returnType": "uint32_t",
    "parameters": "uint8_t which,uint8_t cmd",
    "header": "GetColorSensor.h",
    "macro": "_GETCOLORSENSOR_",
    "dependencies": []
  },
  {
    "name": "GetComStrCompare",
    "returnType": "int8_t",
    "parameters": "int8_t* pic",
    "header": "GetComStrCompare.h",
    "macro": "_GETCOMSTRCOMPARE_",
    "dependencies": []
  },
  {
    "name": "GetComVoice",
    "returnType": "int8_t",
    "parameters": "int8_t* pic",
    "header": "GetComVoice.h",
    "macro": "_GETCOMVOICE_",
    "dependencies": []
  },
  {
    "name": "GetCompassB",
    "returnType": "uint16_t",
    "parameters": "uint8_t which",
    "header": "GetCompassB.h",
    "macro": "_GETCOMPASSB_",
    "dependencies": []
  },
  {
    "name": "GetCompoI",
    "returnType": "uint8_t",
    "parameters": "uint8_t which, uint8_t command",
    "header": "GetCompoI.h",
    "macro": "_GETCOMPOI_",
    "dependencies": []
  },
  {
    "name": "GetCurrent",
    "returnType": "int",
    "parameters": "uint8_t which",
    "header": "GetCurrent.h",
    "macro": "_GETCURRENT_",
    "dependencies": []
  },
  {
    "name": "GetDTHSensor",
    "returnType": "uint16_t",
    "parameters": "uint8_t which,int mode",
    "header": "GetDTHSensor.h",
    "macro": "_GETDTHSENSOR_",
    "dependencies": []
  },
  {
    "name": "GetData",
    "returnType": "uint16_t",
    "parameters": "int dataadr",
    "header": "GetData.h",
    "macro": "_GETDATA_",
    "dependencies": []
  },
  {
    "name": "GetDisplayPixel",
    "returnType": "uint8_t",
    "parameters": "uint8_t x,uint16_t y",
    "header": "GetDisplayPixel.h",
    "macro": "_GETDISPLAYPIXEL_",
    "dependencies": []
  },
  {
    "name": "GetGSensor",
    "returnType": "int",
    "parameters": "uint8_t which,uint8_t axis",
    "header": "GetGSensor.h",
    "macro": "_GETGSENSOR_",
    "dependencies": []
  },
  {
    "name": "GetGesture",
    "returnType": "uint8_t",
    "parameters": "uint8_t which",
    "header": "GetGesture.h",
    "macro": "_GETGESTURE_",
    "dependencies": []
  },
  {
    "name": "GetIOTData",
    "returnType": "uint8_t",
    "parameters": "uint8_t which,char *topic,char *str2",
    "header": "GetIOTData.h",
    "macro": "_GETIOTDATA_",
    "dependencies": [
      "SetIOTConfig"
    ]
  },
  {
    "name": "GetIOTDataStr",
    "returnType": "void",
    "parameters": "uint8_t which,char *topic,const char *iot_str",
    "header": "GetIOTDataStr.h",
    "macro": "_GETIOTDATASTR_",
    "dependencies": [
      "SetIOTConfig"
    ]
  },
  {
    "name": "GetIR",
    "returnType": "uint8_t",
    "parameters": "uint8_t whichs,uint8_t whichr,uint8_t state",
    "header": "GetIR.h",
    "macro": "_GETIR_",
    "dependencies": []
  },
  {
    "name": "GetIRCode",
    "returnType": "uint8_t",
    "parameters": "uint8_t which",
    "header": "GetIRCode.h",
    "macro": "_GETIRCODE_",
    "dependencies": []
  },
  {
    "name": "GetIRDete",
    "returnType": "uint8_t",
    "parameters": "uint8_t which",
    "header": "GetIRDete.h",
    "macro": "_GETIRDETE_",
    "dependencies": []
  },
  {
    "name": "GetIRDist",
    "returnType": "uint16_t",
    "parameters": "uint8_t which",
    "header": "GetIRDist.h",
    "macro": "_GETIRDIST_",
    "dependencies": []
  },
  {
    "name": "GetInMic",
    "returnType": "uint16_t",
    "parameters": "void",
    "header": "GetInMic.h",
    "macro": "_GETINMIC_",
    "dependencies": []
  },
  {
    "name": "GetInVotage",
    "returnType": "uint16_t",
    "parameters": "void",
    "header": "GetInVotage.h",
    "macro": "_GETINVOTAGE_",
    "dependencies": []
  },
  {
    "name": "GetInfrared",
    "returnType": "uint16_t",
    "parameters": "uint8_t which",
    "header": "GetInfrared.h",
    "macro": "_GETINFRARED_",
    "dependencies": []
  },
  {
    "name": "GetLaserDist",
    "returnType": "uint16_t",
    "parameters": "uint8_t which, uint8_t vl_mode",
    "header": "GetLaserDist.h",
    "macro": "_GETLASERDIST_",
    "dependencies": []
  },
  {
    "name": "GetLeftButton",
    "returnType": "uint8_t",
    "parameters": "void",
    "header": "GetLeftButton.h",
    "macro": "_GETLEFTBUTTON_",
    "dependencies": []
  },
  {
    "name": "GetLightSensor",
    "returnType": "uint16_t",
    "parameters": "uint8_t which",
    "header": "GetLightSensor.h",
    "macro": "_GETLIGHTSENSOR_",
    "dependencies": []
  },
  {
    "name": "GetLightSensorData",
    "returnType": "uint16_t",
    "parameters": "uint8_t which",
    "header": "GetLightSensorData.h",
    "macro": "_GETLIGHTSENSORDATA_",
    "dependencies": []
  },
  {
    "name": "GetLightSensorThreshold",
    "returnType": "uint16_t",
    "parameters": "uint8_t which",
    "header": "GetLightSensorThreshold.h",
    "macro": "_GETLIGHTSENSORTHRESHOLD_",
    "dependencies": []
  },
  {
    "name": "GetMagnet",
    "returnType": "uint8_t",
    "parameters": "uint8_t which",
    "header": "GetMagnet.h",
    "macro": "_GETMAGNET_",
    "dependencies": []
  },
  {
    "name": "GetMagnetic",
    "returnType": "uint16_t",
    "parameters": "u8 which, u8 model",
    "header": "GetMagnetic.h",
    "macro": "_GETMAGNETIC_",
    "dependencies": []
  },
  {
    "name": "GetMagneticServoDegree",
    "returnType": "uint16_t",
    "parameters": "uint8_t which",
    "header": "GetMagneticServoDegree.h",
    "macro": "_GETMAGNETICSERVODEGREE_",
    "dependencies": []
  },
  {
    "name": "GetMagneticServoEncoder",
    "returnType": "int32_t",
    "parameters": "uint8_t which",
    "header": "GetMagneticServoEncoder.h",
    "macro": "_GETMAGNETICSERVOENCODER_",
    "dependencies": []
  },
  {
    "name": "GetMusicState",
    "returnType": "uint8_t",
    "parameters": "void",
    "header": "GetMusicState.h",
    "macro": "_GETMUSICSTATE_",
    "dependencies": []
  },
  {
    "name": "GetNFCStatus",
    "returnType": "int16_t",
    "parameters": "uint8_t which",
    "header": "GetNFCStatus.h",
    "macro": "_GETNFCSTATUS_",
    "dependencies": []
  },
  {
    "name": "GetNumberOfClicks",
    "returnType": "uint32_t",
    "parameters": "uint8_t which",
    "header": "GetNumberOfClicks.h",
    "macro": "_GETNUMBEROFCLICKS_",
    "dependencies": []
  },
  {
    "name": "GetPhoto",
    "returnType": "uint16_t",
    "parameters": "uint8_t which",
    "header": "GetPhoto.h",
    "macro": "_GETPHOTO_",
    "dependencies": []
  },
  {
    "name": "GetRFID522",
    "returnType": "uint32_t",
    "parameters": "uint8_t which",
    "header": "GetRFID522.h",
    "macro": "_GETRFID522_",
    "dependencies": []
  },
  {
    "name": "GetRFModuleByte",
    "returnType": "uint16_t",
    "parameters": "uint8_t which",
    "header": "GetRFModuleByte.h",
    "macro": "_GETRFMODULEBYTE_",
    "dependencies": []
  },
  {
    "name": "GetRFModuleRemoteBit",
    "returnType": "uint16_t",
    "parameters": "uint8_t which,uint8_t num",
    "header": "GetRFModuleRemoteBit.h",
    "macro": "_GETRFMODULEREMOTEBIT_",
    "dependencies": []
  },
  {
    "name": "GetRFModuleRemoteButton",
    "returnType": "uint16_t",
    "parameters": "uint8_t which",
    "header": "GetRFModuleRemoteButton.h",
    "macro": "_GETRFMODULEREMOTEBUTTON_",
    "dependencies": []
  },
  {
    "name": "GetRFModuleRemoteCode",
    "returnType": "uint32_t",
    "parameters": "uint8_t which",
    "header": "GetRFModuleRemoteCode.h",
    "macro": "_GETRFMODULEREMOTECODE_",
    "dependencies": []
  },
  {
    "name": "GetRFModuleRemoteGravity",
    "returnType": "int16_t",
    "parameters": "uint8_t which,uint8_t axis",
    "header": "GetRFModuleRemoteGravity.h",
    "macro": "_GETRFMODULEREMOTEGRAVITY_",
    "dependencies": []
  },
  {
    "name": "GetRFModuleRemoteKnob",
    "returnType": "int16_t",
    "parameters": "uint8_t which",
    "header": "GetRFModuleRemoteKnob.h",
    "macro": "_GETRFMODULEREMOTEKNOB_",
    "dependencies": []
  },
  {
    "name": "GetRFModuleRemoteRocker",
    "returnType": "int16_t",
    "parameters": "uint8_t which,uint8_t direction,uint8_t axis",
    "header": "GetRFModuleRemoteRocker.h",
    "macro": "_GETRFMODULEREMOTEROCKER_",
    "dependencies": []
  },
  {
    "name": "GetRFPenCode",
    "returnType": "uint32_t",
    "parameters": "uint8_t which",
    "header": "GetRFPenCode.h",
    "macro": "_GETRFPENCODE_",
    "dependencies": []
  },
  {
    "name": "GetRandom",
    "returnType": "int",
    "parameters": "int m,int n",
    "header": "GetRandom.h",
    "macro": "_GETRANDOM_",
    "dependencies": []
  },
  {
    "name": "GetRcuPortData",
    "returnType": "uint16_t",
    "parameters": "uint8_t which",
    "header": "GetRcuPortData.h",
    "macro": "_GETRCUPORTDATA_",
    "dependencies": []
  },
  {
    "name": "GetRemoIR",
    "returnType": "uint16_t",
    "parameters": "uint8_t which",
    "header": "GetRemoIR.h",
    "macro": "_GETREMOIR_",
    "dependencies": []
  },
  {
    "name": "GetRemoteControllerButton",
    "returnType": "uint32_t",
    "parameters": "void",
    "header": "GetRemoteControllerButton.h",
    "macro": "_GETREMOTECONTROLLERBUTTON_",
    "dependencies": []
  },
  {
    "name": "GetRemoteControllerButtonState",
    "returnType": "uint16_t",
    "parameters": "void",
    "header": "GetRemoteControllerButtonState.h",
    "macro": "_GETREMOTECONTROLLERBUTTONSTATE_",
    "dependencies": []
  },
  {
    "name": "GetRemoteControllerEulerian",
    "returnType": "int16_t",
    "parameters": "uint8_t i",
    "header": "GetRemoteControllerEulerian.h",
    "macro": "_GETREMOTECONTROLLEREULERIAN_",
    "dependencies": []
  },
  {
    "name": "GetRemoteControllerGravity",
    "returnType": "int16_t",
    "parameters": "uint8_t i",
    "header": "GetRemoteControllerGravity.h",
    "macro": "_GETREMOTECONTROLLERGRAVITY_",
    "dependencies": []
  },
  {
    "name": "GetRemoteControllerRocker",
    "returnType": "uint32_t",
    "parameters": "uint8_t dir,uint8_t axis",
    "header": "GetRemoteControllerRocker.h",
    "macro": "_GETREMOTECONTROLLERROCKER_",
    "dependencies": []
  },
  {
    "name": "GetRightButton",
    "returnType": "uint8_t",
    "parameters": "void",
    "header": "GetRightButton.h",
    "macro": "_GETRIGHTBUTTON_",
    "dependencies": []
  },
  {
    "name": "GetScanCamera",
    "returnType": "uint16_t",
    "parameters": "void",
    "header": "GetScanCamera.h",
    "macro": "_GETSCANCAMERA_",
    "dependencies": []
  },
  {
    "name": "GetShortIRDist",
    "returnType": "uint16_t",
    "parameters": "uint32_t which",
    "header": "GetShortIRDist.h",
    "macro": "_GETSHORTIRDIST_",
    "dependencies": []
  },
  {
    "name": "GetSht30",
    "returnType": "float",
    "parameters": "u8 which, u8 command",
    "header": "GetSht30.h",
    "macro": "_GETSHT30_",
    "dependencies": []
  },
  {
    "name": "GetSmartEyeDist",
    "returnType": "uint32_t",
    "parameters": "uint8_t which",
    "header": "GetSmartEyeDist.h",
    "macro": "_GETSMARTEYEDIST_",
    "dependencies": []
  },
  {
    "name": "GetSmartEyeIRcode",
    "returnType": "uint32_t",
    "parameters": "uint8_t which",
    "header": "GetSmartEyeIRcode.h",
    "macro": "_GETSMARTEYEIRCODE_",
    "dependencies": []
  },
  {
    "name": "GetSysTime",
    "returnType": "uint32_t",
    "parameters": "void",
    "header": "GetSysTime.h",
    "macro": "_GETSYSTIME_",
    "dependencies": []
  },
  {
    "name": "GetTouch",
    "returnType": "uint16_t",
    "parameters": "uint8_t which",
    "header": "GetTouch.h",
    "macro": "_GETTOUCH_",
    "dependencies": []
  },
  {
    "name": "GetTouchA",
    "returnType": "uint16_t",
    "parameters": "uint8_t which",
    "header": "GetTouchA.h",
    "macro": "_GETTOUCHA_",
    "dependencies": []
  },
  {
    "name": "GetTouchB",
    "returnType": "uint16_t",
    "parameters": "uint8_t which",
    "header": "GetTouchB.h",
    "macro": "_GETTOUCHB_",
    "dependencies": []
  },
  {
    "name": "GetTouchScreen",
    "returnType": "uint16_t",
    "parameters": "void",
    "header": "GetTouchScreen.h",
    "macro": "_GETTOUCHSCREEN_",
    "dependencies": []
  },
  {
    "name": "GetTouchScreenX",
    "returnType": "uint16_t",
    "parameters": "void",
    "header": "GetTouchScreenX.h",
    "macro": "_GETTOUCHSCREENX_",
    "dependencies": []
  },
  {
    "name": "GetTouchScreenY",
    "returnType": "uint16_t",
    "parameters": "void",
    "header": "GetTouchScreenY.h",
    "macro": "_GETTOUCHSCREENY_",
    "dependencies": []
  },
  {
    "name": "GetTraceV2I2C",
    "returnType": "uint8_t",
    "parameters": "uint8_t which, uint8_t command",
    "header": "GetTraceV2I2C.h",
    "macro": "_GETTRACEV2I2C_",
    "dependencies": []
  },
  {
    "name": "GetTraceV2I2CChxState",
    "returnType": "uint8_t",
    "parameters": "uint8_t which, uint8_t state",
    "header": "GetTraceV2I2CChxState.h",
    "macro": "_GETTRACEV2I2CCHXSTATE_",
    "dependencies": []
  },
  {
    "name": "GetTraceV2I2CState",
    "returnType": "uint8_t",
    "parameters": "uint8_t which, uint8_t bit",
    "header": "GetTraceV2I2CState.h",
    "macro": "_GETTRACEV2I2CSTATE_",
    "dependencies": []
  },
  {
    "name": "GetUartData",
    "returnType": "uint8_t",
    "parameters": "uint32_t baud",
    "header": "GetUartData.h",
    "macro": "_GETUARTDATA_",
    "dependencies": []
  },
  {
    "name": "GetUltrasound",
    "returnType": "uint16_t",
    "parameters": "uint8_t which",
    "header": "GetUltrasound.h",
    "macro": "_GETULTRASOUND_",
    "dependencies": []
  },
  {
    "name": "GetVoltage",
    "returnType": "uint16_t",
    "parameters": "uint8_t which",
    "header": "GetVoltage.h",
    "macro": "_GETVOLTAGE_",
    "dependencies": []
  },
  {
    "name": "GetVolume",
    "returnType": "uint16_t",
    "parameters": "uint8_t which",
    "header": "GetVolume.h",
    "macro": "_GETVOLUME_",
    "dependencies": []
  },
  {
    "name": "GetWifiCamCtrl",
    "returnType": "uint32_t",
    "parameters": "void",
    "header": "GetWifiCamCtrl.h",
    "macro": "_GETWIFICAMCTRL_",
    "dependencies": []
  },
  {
    "name": "GetWifiCamPictureResult",
    "returnType": "uint8_t",
    "parameters": "uint8_t mode",
    "header": "GetWifiCamPictureResult.h",
    "macro": "_GETWIFICAMPICTURERESULT_",
    "dependencies": []
  },
  {
    "name": "GetWifiCamPictureSite",
    "returnType": "uint8_t",
    "parameters": "uint8_t mode",
    "header": "GetWifiCamPictureSite.h",
    "macro": "_GETWIFICAMPICTURESITE_",
    "dependencies": []
  },
  {
    "name": "GetWifiCamPictureSize",
    "returnType": "uint8_t",
    "parameters": "uint8_t mode",
    "header": "GetWifiCamPictureSize.h",
    "macro": "_GETWIFICAMPICTURESIZE_",
    "dependencies": []
  },
  {
    "name": "GetWifiCamRockCtrl",
    "returnType": "int8_t",
    "parameters": "uint8_t direction,uint8_t axis",
    "header": "GetWifiCamRockCtrl.h",
    "macro": "_GETWIFICAMROCKCTRL_",
    "dependencies": []
  },
  {
    "name": "GetWifiCamRockCtrlNew",
    "returnType": "int8_t",
    "parameters": "uint8_t mode",
    "header": "GetWifiCamRockCtrlNew.h",
    "macro": "_GETWIFICAMROCKCTRLNEW_",
    "dependencies": []
  },
  {
    "name": "GetWifiData",
    "returnType": "uint16_t",
    "parameters": "void",
    "header": "GetWifiData.h",
    "macro": "_GETWIFIDATA_",
    "dependencies": []
  },
  {
    "name": "GetWifiPictureData",
    "returnType": "uint8_t",
    "parameters": "uint8_t mode",
    "header": "GetWifiPictureData.h",
    "macro": "_GETWIFIPICTUREDATA_",
    "dependencies": []
  },
  {
    "name": "GetWifiVoice",
    "returnType": "uint16_t",
    "parameters": "uint8_t *str",
    "header": "GetWifiVoice.h",
    "macro": "_GETWIFIVOICE_",
    "dependencies": []
  },
  {
    "name": "LineBasis",
    "returnType": "void",
    "parameters": "int8_t speedup",
    "header": "LineBasis.h",
    "macro": "_LINEBASIS_",
    "dependencies": []
  },
  {
    "name": "LineForBmp",
    "returnType": "void",
    "parameters": "int32_t sp0,int32_t bmp",
    "header": "LineForBmp.h",
    "macro": "_LINEFORBMP_",
    "dependencies": []
  },
  {
    "name": "LineGetState",
    "returnType": "void",
    "parameters": "",
    "header": "LineGetState.h",
    "macro": "_LINEGETSTATE_",
    "dependencies": []
  },
  {
    "name": "LineIntersectionStop",
    "returnType": "void",
    "parameters": "int32_t speedu,int32_t which",
    "header": "LineIntersectionStop.h",
    "macro": "_LINEINTERSECTIONSTOP_",
    "dependencies": []
  },
  {
    "name": "LineMillisecond",
    "returnType": "void",
    "parameters": "int8_t speed, int32_t time",
    "header": "LineMillisecond.h",
    "macro": "_LINEMILLISECOND_",
    "dependencies": []
  },
  {
    "name": "LineSetChassis",
    "returnType": "void",
    "parameters": "uint8_t p1,uint8_t p2,char * dir",
    "header": "LineSetChassis.h",
    "macro": "_LINESETCHASSIS_",
    "dependencies": []
  },
  {
    "name": "LineSetInitialize",
    "returnType": "void",
    "parameters": "uint8_t which,char * temp_color,char * temp_chassis",
    "header": "LineSetInitialize.h",
    "macro": "_LINESETINITIALIZE_",
    "dependencies": []
  },
  {
    "name": "LineSetInitializeForLight",
    "returnType": "void",
    "parameters": "uint8_t p1,uint8_t p2,uint8_t p3,uint8_t p4,uint8_t p5,char * temp_color,char * temp_chassis",
    "header": "LineSetInitializeForLight.h",
    "macro": "_LINESETINITIALIZEFORLIGHT_",
    "dependencies": []
  },
  {
    "name": "LineSetProportio",
    "returnType": "void",
    "parameters": "uint8_t power",
    "header": "LineSetProportio.h",
    "macro": "_LINESETPROPORTIO_",
    "dependencies": []
  },
  {
    "name": "LineSpeedControl",
    "returnType": "void",
    "parameters": "int32_t speedl,int32_t speedr",
    "header": "LineSpeedControl.h",
    "macro": "_LINESPEEDCONTROL_",
    "dependencies": []
  },
  {
    "name": "LineTurnEncounterline",
    "returnType": "void",
    "parameters": "int32_t spl,int32_t spr,int32_t whi",
    "header": "LineTurnEncounterline.h",
    "macro": "_LINETURNENCOUNTERLINE_",
    "dependencies": []
  },
  {
    "name": "ReadRFID522",
    "returnType": "uint16_t",
    "parameters": "uint8_t which",
    "header": "ReadRFID522.h",
    "macro": "_READRFID522_",
    "dependencies": []
  },
  {
    "name": "ReadRFID522Sector",
    "returnType": "uint32_t",
    "parameters": "uint8_t which,unsigned char snr,unsigned char kuai",
    "header": "ReadRFID522Sector.h",
    "macro": "_READRFID522SECTOR_",
    "dependencies": []
  },
  {
    "name": "Run",
    "returnType": "void",
    "parameters": "uint8_t which,int32_t speed",
    "header": "Run.h",
    "macro": "_RUN_",
    "dependencies": []
  },
  {
    "name": "Set3CLed",
    "returnType": "void",
    "parameters": "uint8_t which,uint16_t Color",
    "header": "Set3CLed.h",
    "macro": "_SET3CLED_",
    "dependencies": []
  },
  {
    "name": "SetAHRS",
    "returnType": "void",
    "parameters": "uint8_t which,uint8_t command",
    "header": "SetAHRS.h",
    "macro": "_SETAHRS_",
    "dependencies": []
  },
  {
    "name": "SetAICamData",
    "returnType": "void",
    "parameters": "uint8_t cmd0,uint8_t cmd1",
    "header": "SetAICamData.h",
    "macro": "_SETAICAMDATA_",
    "dependencies": []
  },
  {
    "name": "SetAICamLED",
    "returnType": "void",
    "parameters": "uint8_t cmd",
    "header": "SetAICamLED.h",
    "macro": "_SETAICAMLED_",
    "dependencies": []
  },
  {
    "name": "SetBE2560Back",
    "returnType": "void",
    "parameters": "uint8_t which, unsigned char led",
    "header": "SetBE2560Back.h",
    "macro": "_SETBE2560BACK_",
    "dependencies": []
  },
  {
    "name": "SetBE2560LCD1",
    "returnType": "void",
    "parameters": "uint8_t which, unsigned char command,unsigned char lx,unsigned char lxdchar",
    "header": "SetBE2560LCD1.h",
    "macro": "_SETBE2560LCD1_",
    "dependencies": []
  },
  {
    "name": "SetBE2560LCD3",
    "returnType": "void",
    "parameters": "uint8_t which, unsigned char lx,unsigned int lxdint",
    "header": "SetBE2560LCD3.h",
    "macro": "_SETBE2560LCD3_",
    "dependencies": []
  },
  {
    "name": "SetBE2560LCD8",
    "returnType": "void",
    "parameters": "uint8_t which, unsigned char lx,unsigned long lxdlong",
    "header": "SetBE2560LCD8.h",
    "macro": "_SETBE2560LCD8_",
    "dependencies": []
  },
  {
    "name": "SetBE2560spk",
    "returnType": "void",
    "parameters": "uint8_t which, unsigned char time,unsigned int freq",
    "header": "SetBE2560spk.h",
    "macro": "_SETBE2560SPK_",
    "dependencies": []
  },
  {
    "name": "SetBEMState",
    "returnType": "void",
    "parameters": "uint8_t state,uint8_t CMD",
    "header": "SetBEMState.h",
    "macro": "_SETBEMSTATE_",
    "dependencies": []
  },
  {
    "name": "SetBluetooth",
    "returnType": "void",
    "parameters": "uint8_t data",
    "header": "SetBluetooth.h",
    "macro": "_SETBLUETOOTH_",
    "dependencies": []
  },
  {
    "name": "SetBluetoothData",
    "returnType": "void",
    "parameters": "uint8_t data",
    "header": "SetBluetoothData.h",
    "macro": "_SETBLUETOOTHDATA_",
    "dependencies": []
  },
  {
    "name": "SetCalendar",
    "returnType": "void",
    "parameters": "uint8_t which, unsigned char sec,unsigned char min,unsigned char hour,unsigned char date,unsigned char month,unsigned char year",
    "header": "SetCalendar.h",
    "macro": "_SETCALENDAR_",
    "dependencies": []
  },
  {
    "name": "SetCarTurn",
    "returnType": "void",
    "parameters": "uint8_t whichL,uint8_t whichR,int speed,long pulse",
    "header": "SetCarTurn.h",
    "macro": "_SETCARTURN_",
    "dependencies": []
  },
  {
    "name": "SetColorSensor",
    "returnType": "uint32_t",
    "parameters": "uint8_t which,uint8_t cmd,int parameter",
    "header": "SetColorSensor.h",
    "macro": "_SETCOLORSENSOR_",
    "dependencies": []
  },
  {
    "name": "SetData",
    "returnType": "void",
    "parameters": "int dataadr,int datacode",
    "header": "SetData.h",
    "macro": "_SETDATA_",
    "dependencies": []
  },
  {
    "name": "SetDisplayFloat",
    "returnType": "void",
    "parameters": "int y,double data,uint16_t ch_color,uint16_t bg_color",
    "header": "SetDisplayFloat.h",
    "macro": "_SETDISPLAYFLOAT_",
    "dependencies": []
  },
  {
    "name": "SetDisplayLattice",
    "returnType": "void",
    "parameters": "uint8_t which,char* pic,int8_t luminance",
    "header": "SetDisplayLattice.h",
    "macro": "_SETDISPLAYLATTICE_",
    "dependencies": []
  },
  {
    "name": "SetDisplayLatticeClear",
    "returnType": "void",
    "parameters": "uint8_t which",
    "header": "SetDisplayLatticeClear.h",
    "macro": "_SETDISPLAYLATTICECLEAR_",
    "dependencies": []
  },
  {
    "name": "SetDisplayLatticePic",
    "returnType": "void",
    "parameters": "uint8_t which,int8_t* pic,int8_t luminance",
    "header": "SetDisplayLatticePic.h",
    "macro": "_SETDISPLAYLATTICEPIC_",
    "dependencies": []
  },
  {
    "name": "SetDisplayLatticeString",
    "returnType": "void",
    "parameters": "uint8_t which,char* pic,int8_t direction,uint32_t speed,int8_t luminance",
    "header": "SetDisplayLatticeString.h",
    "macro": "_SETDISPLAYLATTICESTRING_",
    "dependencies": []
  },
  {
    "name": "SetDisplayLatticeXY",
    "returnType": "void",
    "parameters": "uint8_t which,int8_t x,int8_t y,uint8_t state,uint8_t luminance",
    "header": "SetDisplayLatticeXY.h",
    "macro": "_SETDISPLAYLATTICEXY_",
    "dependencies": []
  },
  {
    "name": "SetDisplayPicture",
    "returnType": "int",
    "parameters": "int x,int y, const char* filename, char scale",
    "header": "SetDisplayPicture.h",
    "macro": "_SETDISPLAYPICTURE_",
    "dependencies": []
  },
  {
    "name": "SetDisplayStr",
    "returnType": "void",
    "parameters": "uint16_t x,uint16_t y,int8_t* pic,uint16_t ch_color,uint16_t bg_color",
    "header": "SetDisplayStr.h",
    "macro": "_SETDISPLAYSTR_",
    "dependencies": []
  },
  {
    "name": "SetDisplayString",
    "returnType": "void",
    "parameters": "uint16_t y,int8_t* pic,uint16_t ch_color,uint16_t bg_color",
    "header": "SetDisplayString.h",
    "macro": "_SETDISPLAYSTRING_",
    "dependencies": []
  },
  {
    "name": "SetDisplayStringXY",
    "returnType": "void",
    "parameters": "int x,int y,int8_t* pic,uint16_t ch_color,uint16_t bg_color,uint8_t T",
    "header": "SetDisplayStringXY.h",
    "macro": "_SETDISPLAYSTRINGXY_",
    "dependencies": []
  },
  {
    "name": "SetDisplayVar",
    "returnType": "void",
    "parameters": "int y,int32_t data,uint16_t ch_color,uint16_t bg_color",
    "header": "SetDisplayVar.h",
    "macro": "_SETDISPLAYVAR_",
    "dependencies": []
  },
  {
    "name": "SetDisplayVarU32",
    "returnType": "void",
    "parameters": "int y,uint32_t data,uint16_t ch_color,uint16_t bg_color",
    "header": "SetDisplayVarU32.h",
    "macro": "_SETDISPLAYVARU32_",
    "dependencies": []
  },
  {
    "name": "SetDisplayVarXY",
    "returnType": "void",
    "parameters": "int x,int y,int32_t data,uint16_t ch_color,uint16_t bg_color",
    "header": "SetDisplayVarXY.h",
    "macro": "_SETDISPLAYVARXY_",
    "dependencies": []
  },
  {
    "name": "SetDisplayVariable",
    "returnType": "void",
    "parameters": "int x,int y,int32_t data,uint16_t ch_color,uint16_t bg_color",
    "header": "SetDisplayVariable.h",
    "macro": "_SETDISPLAYVARIABLE_",
    "dependencies": []
  },
  {
    "name": "SetElectromagnet",
    "returnType": "void",
    "parameters": "uint8_t state,uint8_t CMD",
    "header": "SetElectromagnet.h",
    "macro": "_SETELECTROMAGNET_",
    "dependencies": []
  },
  {
    "name": "SetFan",
    "returnType": "void",
    "parameters": "uint8_t which,int speed",
    "header": "SetFan.h",
    "macro": "_SETFAN_",
    "dependencies": []
  },
  {
    "name": "SetFontSize",
    "returnType": "void",
    "parameters": "uint8_t size",
    "header": "SetFontSize.h",
    "macro": "_SETFONTSIZE_",
    "dependencies": []
  },
  {
    "name": "SetIOTConfig",
    "returnType": "void",
    "parameters": "uint8_t which,char * wifiname,char * wifipwd,char * IDname,char * IDpwd,char * IPaddr",
    "header": "SetIOTConfig.h",
    "macro": "_SETIOTCONFIG_",
    "dependencies": []
  },
  {
    "name": "SetIOTData",
    "returnType": "void",
    "parameters": "uint8_t which,char *topic,uint32_t data",
    "header": "SetIOTData.h",
    "macro": "_SETIOTDATA_",
    "dependencies": [
      "SetIOTConfig"
    ]
  },
  {
    "name": "SetIOTDataStr",
    "returnType": "void",
    "parameters": "uint8_t which,char *topic,char *string",
    "header": "SetIOTDataStr.h",
    "macro": "_SETIOTDATASTR_",
    "dependencies": [
      "SetIOTConfig"
    ]
  },
  {
    "name": "SetIOTTopic",
    "returnType": "void",
    "parameters": "uint8_t which,char *str",
    "header": "SetIOTTopic.h",
    "macro": "_SETIOTTOPIC_",
    "dependencies": [
      "SetIOTConfig"
    ]
  },
  {
    "name": "SetIR",
    "returnType": "void",
    "parameters": "uint8_t which,uint8_t state",
    "header": "SetIR.h",
    "macro": "_SETIR_",
    "dependencies": []
  },
  {
    "name": "SetIRBoard",
    "returnType": "void",
    "parameters": "uint8_t which,uint8_t addr,uint8_t mode,uint8_t color",
    "header": "SetIRBoard.h",
    "macro": "_SETIRBOARD_",
    "dependencies": []
  },
  {
    "name": "SetIRCode",
    "returnType": "uint8_t",
    "parameters": "uint8_t which,uint8_t data",
    "header": "SetIRCode.h",
    "macro": "_SETIRCODE_",
    "dependencies": []
  },
  {
    "name": "SetInBeep",
    "returnType": "void",
    "parameters": "uint8_t state",
    "header": "SetInBeep.h",
    "macro": "_SETINBEEP_",
    "dependencies": []
  },
  {
    "name": "SetInSound",
    "returnType": "void",
    "parameters": "int freq,int time",
    "header": "SetInSound.h",
    "macro": "_SETINSOUND_",
    "dependencies": []
  },
  {
    "name": "SetLCDBack",
    "returnType": "void",
    "parameters": "uint8_t led",
    "header": "SetLCDBack.h",
    "macro": "_SETLCDBACK_",
    "dependencies": []
  },
  {
    "name": "SetLCDClear",
    "returnType": "void",
    "parameters": "uint16_t m_color",
    "header": "SetLCDClear.h",
    "macro": "_SETLCDCLEAR_",
    "dependencies": []
  },
  {
    "name": "SetLCDDot",
    "returnType": "void",
    "parameters": "uint8_t x,uint16_t y,uint16_t m_color",
    "header": "SetLCDDot.h",
    "macro": "_SETLCDDOT_",
    "dependencies": []
  },
  {
    "name": "SetLCDFilledRectangle",
    "returnType": "void",
    "parameters": "int x1,int y1,int x2,int y2,uint16_t color",
    "header": "SetLCDFilledRectangle.h",
    "macro": "_SETLCDFILLEDRECTANGLE_",
    "dependencies": []
  },
  {
    "name": "SetLCDFilledRectangle2",
    "returnType": "void",
    "parameters": "uint16_t x,uint16_t y,uint16_t xlong ,uint16_t ylong,uint16_t color",
    "header": "SetLCDFilledRectangle2.h",
    "macro": "_SETLCDFILLEDRECTANGLE2_",
    "dependencies": []
  },
  {
    "name": "SetLCDLine",
    "returnType": "void",
    "parameters": "uint16_t x1,uint16_t y1,int16_t angle, uint16_t lenght,uint16_t color",
    "header": "SetLCDLine.h",
    "macro": "_SETLCDLINE_",
    "dependencies": []
  },
  {
    "name": "SetLCDRectangle",
    "returnType": "void",
    "parameters": "int x1,int y1,int x2,int y2,int w,uint16_t color",
    "header": "SetLCDRectangle.h",
    "macro": "_SETLCDRECTANGLE_",
    "dependencies": []
  },
  {
    "name": "SetLCDRectangle2",
    "returnType": "void",
    "parameters": "uint16_t x1,uint16_t y1,uint16_t xlong,uint16_t ylong,uint16_t w,uint16_t color",
    "header": "SetLCDRectangle2.h",
    "macro": "_SETLCDRECTANGLE2_",
    "dependencies": []
  },
  {
    "name": "SetLCDSolidCircle",
    "returnType": "void",
    "parameters": "int x,int y,uint16_t radius,uint16_t color",
    "header": "SetLCDSolidCircle.h",
    "macro": "_SETLCDSOLIDCIRCLE_",
    "dependencies": []
  },
  {
    "name": "SetLightSensorILamp",
    "returnType": "void",
    "parameters": "uint8_t which,int state",
    "header": "SetLightSensorILamp.h",
    "macro": "_SETLIGHTSENSORILAMP_",
    "dependencies": []
  },
  {
    "name": "SetLightSensorLed",
    "returnType": "void",
    "parameters": "uint8_t which,int state",
    "header": "SetLightSensorLed.h",
    "macro": "_SETLIGHTSENSORLED_",
    "dependencies": []
  },
  {
    "name": "SetLightSensorThreshold",
    "returnType": "void",
    "parameters": "uint8_t which,int Threshold",
    "header": "SetLightSensorThreshold.h",
    "macro": "_SETLIGHTSENSORTHRESHOLD_",
    "dependencies": []
  },
  {
    "name": "SetMagneticServoCodeMotor",
    "returnType": "void",
    "parameters": "uint8_t which,int32_t run_code,int16_t speed",
    "header": "SetMagneticServoCodeMotor.h",
    "macro": "_SETMAGNETICSERVOCODEMOTOR_",
    "dependencies": []
  },
  {
    "name": "SetMagneticServoDegreeSpeed",
    "returnType": "void",
    "parameters": "uint8_t which,uint16_t degree,uint16_t speed",
    "header": "SetMagneticServoDegreeSpeed.h",
    "macro": "_SETMAGNETICSERVODEGREESPEED_",
    "dependencies": []
  },
  {
    "name": "SetMagneticServoDegreeTime",
    "returnType": "void",
    "parameters": "uint8_t which,uint16_t degree,uint16_t time",
    "header": "SetMagneticServoDegreeTime.h",
    "macro": "_SETMAGNETICSERVODEGREETIME_",
    "dependencies": []
  },
  {
    "name": "SetMagneticServoEncoder",
    "returnType": "void",
    "parameters": "uint8_t which",
    "header": "SetMagneticServoEncoder.h",
    "macro": "_SETMAGNETICSERVOENCODER_",
    "dependencies": []
  },
  {
    "name": "SetMagneticServoMotor",
    "returnType": "void",
    "parameters": "uint8_t which,int16_t speed",
    "header": "SetMagneticServoMotor.h",
    "macro": "_SETMAGNETICSERVOMOTOR_",
    "dependencies": []
  },
  {
    "name": "SetMagneticServoPowerDown",
    "returnType": "void",
    "parameters": "uint8_t which",
    "header": "SetMagneticServoPowerDown.h",
    "macro": "_SETMAGNETICSERVOPOWERDOWN_",
    "dependencies": []
  },
  {
    "name": "SetMagneticServoSoftReset",
    "returnType": "void",
    "parameters": "uint8_t which",
    "header": "SetMagneticServoSoftReset.h",
    "macro": "_SETMAGNETICSERVOSOFTRESET_",
    "dependencies": []
  },
  {
    "name": "SetMagneticServoState",
    "returnType": "void",
    "parameters": "uint8_t which,uint8_t reset,uint8_t speed,uint16_t degree",
    "header": "SetMagneticServoState.h",
    "macro": "_SETMAGNETICSERVOSTATE_",
    "dependencies": []
  },
  {
    "name": "SetMagneticServoWaitForDegree",
    "returnType": "void",
    "parameters": "uint8_t which,uint16_t degree,uint16_t speed",
    "header": "SetMagneticServoWaitForDegree.h",
    "macro": "_GETMAGNETICSERVOWAITFORDEGREE_",
    "dependencies": []
  },
  {
    "name": "SetMagneticServo_CMD",
    "returnType": "void",
    "parameters": "uint8_t which,uint8_t cmd,uint16_t data1,uint16_t data2",
    "header": "SetMagneticServo_CMD.h",
    "macro": "_SETMAGNETICSERVO_CMD_",
    "dependencies": []
  },
  {
    "name": "SetMotor",
    "returnType": "void",
    "parameters": "uint8_t which,int speed",
    "header": "SetMotor.h",
    "macro": "_SETMOTOR_",
    "dependencies": []
  },
  {
    "name": "SetMotorAngle",
    "returnType": "void",
    "parameters": "uint8_t which,int speed,uint32_t Angle",
    "header": "SetMotorAngle.h",
    "macro": "_SETMOTORANGLE_",
    "dependencies": []
  },
  {
    "name": "SetMotorAngleDelay",
    "returnType": "void",
    "parameters": "uint8_t which,int speed,int32_t Angle",
    "header": "SetMotorAngleDelay.h",
    "macro": "_SETMOTORANGLEDELAY_",
    "dependencies": []
  },
  {
    "name": "SetMotorCode",
    "returnType": "void",
    "parameters": "uint8_t which",
    "header": "SetMotorCode.h",
    "macro": "_SETMOTORCODE_",
    "dependencies": []
  },
  {
    "name": "SetMotorConstCode",
    "returnType": "void",
    "parameters": "uint8_t which,int s_code",
    "header": "SetMotorConstCode.h",
    "macro": "_SETMOTORCONSTCODE_",
    "dependencies": []
  },
  {
    "name": "SetMotorConstSpeed",
    "returnType": "void",
    "parameters": "uint8_t which,int speed",
    "header": "SetMotorConstSpeed.h",
    "macro": "_SETMOTORCONSTSPEED_",
    "dependencies": []
  },
  {
    "name": "SetMotorConstSpeedValue",
    "returnType": "void",
    "parameters": "uint8_t which,int code,double p,double i,double d",
    "header": "SetMotorConstSpeedValue.h",
    "macro": "_SETMOTORCONSTSPEEDVALUE_",
    "dependencies": []
  },
  {
    "name": "SetMotorDirection",
    "returnType": "void",
    "parameters": "uint8_t dir,uint8_t speed",
    "header": "SetMotorDirection.h",
    "macro": "_SETMOTORDIRECTION_",
    "dependencies": []
  },
  {
    "name": "SetMotorPower",
    "returnType": "void",
    "parameters": "uint8_t m_Per1,int m_Per2,int m_Per3,int m_Per4",
    "header": "SetMotorPower.h",
    "macro": "_SETMOTORPOWER_",
    "dependencies": []
  },
  {
    "name": "SetMotorSecond",
    "returnType": "void",
    "parameters": "uint8_t port,int32_t speed,double time",
    "header": "SetMotorSecond.h",
    "macro": "_SETMOTORSECOND_",
    "dependencies": []
  },
  {
    "name": "SetMotorServo",
    "returnType": "void",
    "parameters": "uint8_t which,int speed,uint32_t Angle",
    "header": "SetMotorServo.h",
    "macro": "_SETMOTORSERVO_",
    "dependencies": []
  },
  {
    "name": "SetMotorServo128",
    "returnType": "void",
    "parameters": "uint8_t which,int speed,uint32_t Angle",
    "header": "SetMotorServo128.h",
    "macro": "_SETMOTORSERVO128_",
    "dependencies": []
  },
  {
    "name": "SetMotorStop",
    "returnType": "void",
    "parameters": "uint8_t which",
    "header": "SetMotorStop.h",
    "macro": "_SETMOTORSTOP_",
    "dependencies": []
  },
  {
    "name": "SetMotorStraight",
    "returnType": "void",
    "parameters": "uint8_t whichL,uint8_t whichR,int speed",
    "header": "SetMotorStraight.h",
    "macro": "_SETMOTORSTRAIGHT_",
    "dependencies": []
  },
  {
    "name": "SetMotorStraightAngle",
    "returnType": "void",
    "parameters": "uint8_t whichL,uint8_t whichR,int speed,int32_t pulse",
    "header": "SetMotorStraightAngle.h",
    "macro": "_SETMOTORSTRAIGHTANGLE_",
    "dependencies": []
  },
  {
    "name": "SetMotorStraightStop",
    "returnType": "int32_t",
    "parameters": "uint8_t whichL,uint8_t whichR",
    "header": "SetMotorStraightStop.h",
    "macro": "_SETMOTORSTRAIGHTSTOP_",
    "dependencies": []
  },
  {
    "name": "SetMotorStraightTurn",
    "returnType": "void",
    "parameters": "uint8_t whichL,uint8_t whichR,int speed,int8_t angle",
    "header": "SetMotorStraightTurn.h",
    "macro": "_SETMOTORSTRAIGHTTURN_",
    "dependencies": []
  },
  {
    "name": "SetMoveInitialize",
    "returnType": "void",
    "parameters": "uint8_t Left,uint8_t Right,char *Vector",
    "header": "SetMoveInitialize.h",
    "macro": "_SETMOVEINITIALIZE_",
    "dependencies": []
  },
  {
    "name": "SetMovePower",
    "returnType": "void",
    "parameters": "int32_t speedl,int32_t speedr",
    "header": "SetMovePower.h",
    "macro": "_SETMOVEPOWER_",
    "dependencies": []
  },
  {
    "name": "SetMoveRun",
    "returnType": "void",
    "parameters": "char * direction,int32_t speed",
    "header": "SetMoveRun.h",
    "macro": "_SETMOVERUN_",
    "dependencies": []
  },
  {
    "name": "SetMoveRunAngle",
    "returnType": "void",
    "parameters": "char * direction,int32_t speed,double angle",
    "header": "SetMoveRunAngle.h",
    "macro": "_SETMOVERUNANGLE_",
    "dependencies": []
  },
  {
    "name": "SetMoveRunSecond",
    "returnType": "void",
    "parameters": "char *direction,int32_t speed,double time",
    "header": "SetMoveRunSecond.h",
    "macro": "_SETMOVERUNSECOND_",
    "dependencies": []
  },
  {
    "name": "SetMoveSpeed",
    "returnType": "void",
    "parameters": "int32_t speedl,int32_t speedr",
    "header": "SetMoveSpeed.h",
    "macro": "_SETMOVESPEED_",
    "dependencies": []
  },
  {
    "name": "SetMoveSpeedSecond",
    "returnType": "void",
    "parameters": "int32_t speedl,int32_t speedr,double time",
    "header": "SetMoveSpeedSecond.h",
    "macro": "_SETMOVESPEEDSECOND_",
    "dependencies": []
  },
  {
    "name": "SetMoveStop",
    "returnType": "void",
    "parameters": "void",
    "header": "SetMoveStop.h",
    "macro": "_SETMOVESTOP_",
    "dependencies": []
  },
  {
    "name": "SetMp3Play",
    "returnType": "void",
    "parameters": "uint16_t folder,uint16_t mp3num",
    "header": "SetMp3Play.h",
    "macro": "_SETMP3PLAY_",
    "dependencies": []
  },
  {
    "name": "SetMp3Sound",
    "returnType": "void",
    "parameters": "uint8_t Mp3Sound",
    "header": "SetMp3Sound.h",
    "macro": "_SETMP3SOUND_",
    "dependencies": []
  },
  {
    "name": "SetMp3Suspend",
    "returnType": "void",
    "parameters": "void",
    "header": "SetMp3Suspend.h",
    "macro": "_SETMP3SUSPEND_",
    "dependencies": []
  },
  {
    "name": "SetMusicAddData",
    "returnType": "void",
    "parameters": "uint8_t mdata,int time",
    "header": "SetMusicAddData.h",
    "macro": "_SETMUSICADDDATA_",
    "dependencies": []
  },
  {
    "name": "SetMusicClear",
    "returnType": "void",
    "parameters": "void",
    "header": "SetMusicClear.h",
    "macro": "_SETMUSICCLEAR_",
    "dependencies": []
  },
  {
    "name": "SetMusicNote",
    "returnType": "uint8_t",
    "parameters": "uint8_t which,uint8_t m_note,uint8_t m_meter,uint8_t m_pitch,uint8_t m_scale",
    "header": "SetMusicNote.h",
    "macro": "_SETMUSICNOTE_",
    "dependencies": []
  },
  {
    "name": "SetMusicPlay",
    "returnType": "void",
    "parameters": "void",
    "header": "SetMusicPlay.h",
    "macro": "_SETMUSICPLAY_",
    "dependencies": []
  },
  {
    "name": "SetMusicPlayer",
    "returnType": "void",
    "parameters": "uint8_t which, int cmd",
    "header": "SetMusicPlayer.h",
    "macro": "_SETMUSICPLAYER_",
    "dependencies": []
  },
  {
    "name": "SetMusicRepeat",
    "returnType": "void",
    "parameters": "int c",
    "header": "SetMusicRepeat.h",
    "macro": "_SETMUSICREPEAT_",
    "dependencies": []
  },
  {
    "name": "SetNFC",
    "returnType": "void",
    "parameters": "uint8_t which",
    "header": "SetNFC.h",
    "macro": "_SETNFC_",
    "dependencies": []
  },
  {
    "name": "SetNote",
    "returnType": "void",
    "parameters": "int note",
    "header": "SetNote.h",
    "macro": "_SETNOTE_",
    "dependencies": []
  },
  {
    "name": "SetOneServo",
    "returnType": "void",
    "parameters": "uint8_t which,uint8_t Channel, uint8_t angle, uint16_t time",
    "header": "SetOneServo.h",
    "macro": "_SETONESERVO_",
    "dependencies": []
  },
  {
    "name": "SetPIDMotor",
    "returnType": "void",
    "parameters": "uint8_t which,uint8_t speed",
    "header": "SetPIDMotor.h",
    "macro": "_SETPIDMOTOR_",
    "dependencies": []
  },
  {
    "name": "SetPIDMotorRef",
    "returnType": "void",
    "parameters": "uint8_t pulse",
    "header": "SetPIDMotorRef.h",
    "macro": "_SETPIDMOTORREF_",
    "dependencies": []
  },
  {
    "name": "SetPump",
    "returnType": "void",
    "parameters": "uint8_t which,uint8_t State",
    "header": "SetPump.h",
    "macro": "_SETPUMP_",
    "dependencies": []
  },
  {
    "name": "SetRFModuleByte",
    "returnType": "uint8_t",
    "parameters": "uint8_t which,uint8_t _data",
    "header": "SetRFModuleByte.h",
    "macro": "_SETRFMODULEBYTE_",
    "dependencies": []
  },
  {
    "name": "SetRFModuleRemoteKnob",
    "returnType": "int8_t",
    "parameters": "uint8_t which,uint32_t axis",
    "header": "SetRFModuleRemoteKnob.h",
    "macro": "_SETRFMODULEREMOTEKNOB_",
    "dependencies": []
  },
  {
    "name": "SetRFPassWord",
    "returnType": "void",
    "parameters": "uint8_t which,uint32_t password",
    "header": "SetRFPassWord.h",
    "macro": "_SETRFPASSWORD_",
    "dependencies": []
  },
  {
    "name": "SetRcuPortData",
    "returnType": "void",
    "parameters": "uint8_t which,uint16_t Color",
    "header": "SetRcuPortData.h",
    "macro": "_SETRCUPORTDATA_",
    "dependencies": []
  },
  {
    "name": "SetRunAngle",
    "returnType": "void",
    "parameters": "uint8_t which,int speed,int32_t Angle",
    "header": "SetRunAngle.h",
    "macro": "_SETRUNANGLE_",
    "dependencies": []
  },
  {
    "name": "SetSeeringEngine",
    "returnType": "void",
    "parameters": "uint8_t which,int angle",
    "header": "SetSeeringEngine.h",
    "macro": "_SETSEERINGENGINE_",
    "dependencies": []
  },
  {
    "name": "SetSeeringEngineTime",
    "returnType": "void",
    "parameters": "uint8_t which,int angle,u16 time",
    "header": "SetSeeringEngineTime.h",
    "macro": "_SETSEERINGENGINETIME_",
    "dependencies": []
  },
  {
    "name": "SetServo",
    "returnType": "void",
    "parameters": "uint8_t which,int angle",
    "header": "SetServo.h",
    "macro": "_SETSERVO_",
    "dependencies": []
  },
  {
    "name": "SetServoMotor",
    "returnType": "void",
    "parameters": "uint8_t which,int speed",
    "header": "SetServoMotor.h",
    "macro": "_SETSERVOMOTOR_",
    "dependencies": []
  },
  {
    "name": "SetServoTime",
    "returnType": "void",
    "parameters": "uint8_t which,int angle,u16 time",
    "header": "SetServoTime.h",
    "macro": "_SETSERVOTIME_",
    "dependencies": []
  },
  {
    "name": "SetSmartEyeAllLed",
    "returnType": "uint32_t",
    "parameters": "uint8_t which,uint32_t led1, uint32_t led2,uint32_t led3,uint32_t led4,uint32_t led5,uint32_t led6,uint32_t led7,uint32_t led8",
    "header": "SetSmartEyeAllLed.h",
    "macro": "_SETSMARTEYEALLLED_",
    "dependencies": []
  },
  {
    "name": "SetSmartEyeAllLed2",
    "returnType": "void",
    "parameters": "uint8_t which,int8_t* color1, int8_t* color2,int8_t* color3,int8_t* color4,int8_t* color5,int8_t* color6,int8_t* color7,int8_t* color8",
    "header": "SetSmartEyeAllLed2.h",
    "macro": "_SETSMARTEYEALLLED2_",
    "dependencies": []
  },
  {
    "name": "SetSmartEyeIRcode",
    "returnType": "uint32_t",
    "parameters": "uint8_t which,uint8_t cmd",
    "header": "SetSmartEyeIRcode.h",
    "macro": "_SETSMARTEYEIRCODE_",
    "dependencies": []
  },
  {
    "name": "SetSmartEyeMode",
    "returnType": "uint32_t",
    "parameters": "uint8_t which,uint8_t cmd,uint32_t color",
    "header": "SetSmartEyeMode.h",
    "macro": "_SETSMARTEYEMODE_",
    "dependencies": []
  },
  {
    "name": "SetSmartEyeMode2",
    "returnType": "uint32_t",
    "parameters": "uint8_t which,uint8_t cmd,uint8_t* color",
    "header": "SetSmartEyeMode2.h",
    "macro": "_SETSMARTEYEMODE2_",
    "dependencies": []
  },
  {
    "name": "SetSysTime",
    "returnType": "void",
    "parameters": "void",
    "header": "SetSysTime.h",
    "macro": "_SETSYSTIME_",
    "dependencies": []
  },
  {
    "name": "SetTouchToScreenCoordinate",
    "returnType": "void",
    "parameters": "void",
    "header": "SetTouchToScreenCoordinate.h",
    "macro": "_SETTOUCHTOSCREENCOORDINATE_",
    "dependencies": []
  },
  {
    "name": "SetTraceV2BeepI2C",
    "returnType": "void",
    "parameters": "uint8_t which,int beeptime",
    "header": "SetTraceV2BeepI2C.h",
    "macro": "_SETTRACEV2BEEPI2C_",
    "dependencies": []
  },
  {
    "name": "SetTraceV2Color",
    "returnType": "void",
    "parameters": "uint8_t which,int ch1,int ch2,int ch3,int ch4,int ch5,int ch6,int ch7",
    "header": "SetTraceV2Color.h",
    "macro": "_SETTRACEV2COLOR_",
    "dependencies": []
  },
  {
    "name": "SetTraceV2I2AllColor",
    "returnType": "void",
    "parameters": "uint8_t which, uint8_t color",
    "header": "SetTraceV2I2AllColor.h",
    "macro": "_SETTRACEV2I2ALLCOLOR_",
    "dependencies": []
  },
  {
    "name": "SetTraceV2I2CLineColor",
    "returnType": "void",
    "parameters": "uint8_t which, uint8_t color",
    "header": "SetTraceV2I2CLineColor.h",
    "macro": "_SETTRACEV2I2CLINECOLOR_",
    "dependencies": []
  },
  {
    "name": "SetTraceV2I2Color",
    "returnType": "void",
    "parameters": "uint8_t which, uint8_t ch1,uint8_t ch2,uint8_t ch3,uint8_t ch4,uint8_t ch5,uint8_t ch6,uint8_t ch7",
    "header": "SetTraceV2I2Color.h",
    "macro": "_SETTRACEV2I2COLOR_",
    "dependencies": []
  },
  {
    "name": "SetTraceV2I2Threshold",
    "returnType": "void",
    "parameters": "uint8_t which, uint16_t time",
    "header": "SetTraceV2I2Threshold.h",
    "macro": "_SETTRACEV2I2THRESHOLD_",
    "dependencies": []
  },
  {
    "name": "SetTraceV2PercentI2C",
    "returnType": "void",
    "parameters": "uint8_t which,int molecular,int denominator",
    "header": "SetTraceV2PercentI2C.h",
    "macro": "_SETTRACEV2PERCENTI2C_",
    "dependencies": []
  },
  {
    "name": "SetTraceV2Threshold",
    "returnType": "void",
    "parameters": "uint8_t which,uint8_t pass, uint8_t thr",
    "header": "SetTraceV2Threshold.h",
    "macro": "_SETTRACEV2THRESHOLD_",
    "dependencies": []
  },
  {
    "name": "SetUartData",
    "returnType": "void",
    "parameters": "uint8_t data,uint32_t baud",
    "header": "SetUartData.h",
    "macro": "_SETUARTDATA_",
    "dependencies": []
  },
  {
    "name": "SetWaitForAICamData",
    "returnType": "void",
    "parameters": "uint8_t cmd0,uint8_t cmd1",
    "header": "SetWaitForAICamData.h",
    "macro": "_SETWAITFORAICAMDATA_",
    "dependencies": []
  },
  {
    "name": "SetWaitForAngle",
    "returnType": "void",
    "parameters": "uint8_t which,int speed,int32_t Angle",
    "header": "SetWaitForAngle.h",
    "macro": "_SETWAITFORANGLE_",
    "dependencies": []
  },
  {
    "name": "SetWaitForAngle128",
    "returnType": "void",
    "parameters": "uint8_t which,int speed,int32_t Angle",
    "header": "SetWaitForAngle128.h",
    "macro": "_SETWAITFORANGLE128_",
    "dependencies": []
  },
  {
    "name": "SetWaitForBluetooth",
    "returnType": "void",
    "parameters": "uint8_t data",
    "header": "SetWaitForBluetooth.h",
    "macro": "_SETWAITFORBLUETOOTH_",
    "dependencies": []
  },
  {
    "name": "SetWaitForBump",
    "returnType": "void",
    "parameters": "uint8_t which",
    "header": "SetWaitForBump.h",
    "macro": "_SETWAITFORBUMP_",
    "dependencies": []
  },
  {
    "name": "SetWaitForCarTurn",
    "returnType": "void",
    "parameters": "uint8_t whichL,uint8_t whichR,int speed,long pulse",
    "header": "SetWaitForCarTurn.h",
    "macro": "_SETWAITFORCARTURN_",
    "dependencies": []
  },
  {
    "name": "SetWaitForPress",
    "returnType": "void",
    "parameters": "uint8_t which",
    "header": "SetWaitForPress.h",
    "macro": "_SETWAITFORPRESS_",
    "dependencies": []
  },
  {
    "name": "SetWaitForRelease",
    "returnType": "void",
    "parameters": "uint8_t which",
    "header": "SetWaitForRelease.h",
    "macro": "_SETWAITFORRELEASE_",
    "dependencies": []
  },
  {
    "name": "SetWaitForStraight",
    "returnType": "void",
    "parameters": "uint8_t whichL,uint8_t whichR,int speed,long pulse",
    "header": "SetWaitForStraight.h",
    "macro": "_SETWAITFORSTRAIGHT_",
    "dependencies": []
  },
  {
    "name": "SetWaitForTime",
    "returnType": "void",
    "parameters": "float s",
    "header": "SetWaitForTime.h",
    "macro": "_SETWAITFORTIME_",
    "dependencies": []
  },
  {
    "name": "SetWaitForWifiData",
    "returnType": "void",
    "parameters": "uint8_t data",
    "header": "SetWaitForWifiData.h",
    "macro": "_SETWAITFORWIFIDATA_",
    "dependencies": []
  },
  {
    "name": "SetWaitforDark",
    "returnType": "void",
    "parameters": "uint8_t which,uint16_t value",
    "header": "SetWaitforDark.h",
    "macro": "_SETWAITFORDARK_",
    "dependencies": []
  },
  {
    "name": "SetWaitforDarker",
    "returnType": "uint16_t",
    "parameters": "uint8_t which,uint16_t value",
    "header": "SetWaitforDarker.h",
    "macro": "_SETWAITFORDARKER_",
    "dependencies": []
  },
  {
    "name": "SetWaitforLight",
    "returnType": "uint16_t",
    "parameters": "uint8_t which,uint16_t value",
    "header": "SetWaitforLight.h",
    "macro": "_SETWAITFORLIGHT_",
    "dependencies": []
  },
  {
    "name": "SetWaitforLighter",
    "returnType": "uint16_t",
    "parameters": "uint8_t which,uint16_t value",
    "header": "SetWaitforLighter.h",
    "macro": "_SETWAITFORLIGHTER_",
    "dependencies": []
  },
  {
    "name": "SetWaitforLoud",
    "returnType": "void",
    "parameters": "int value",
    "header": "SetWaitforLoud.h",
    "macro": "_SETWAITFORLOUD_",
    "dependencies": []
  },
  {
    "name": "SetWaitforLouder",
    "returnType": "void",
    "parameters": "int value",
    "header": "SetWaitforLouder.h",
    "macro": "_SETWAITFORLOUDER_",
    "dependencies": []
  },
  {
    "name": "SetWaitforQuiet",
    "returnType": "void",
    "parameters": "int value",
    "header": "SetWaitforQuiet.h",
    "macro": "_SETWAITFORQUIET_",
    "dependencies": []
  },
  {
    "name": "SetWaitforQuieter",
    "returnType": "void",
    "parameters": "int value",
    "header": "SetWaitforQuieter.h",
    "macro": "_SETWAITFORQUIETER_",
    "dependencies": []
  },
  {
    "name": "SetWifiData",
    "returnType": "uint8_t",
    "parameters": "uint8_t data",
    "header": "SetWifiData.h",
    "macro": "_SETWIFIDATA_",
    "dependencies": []
  },
  {
    "name": "SetWifiUdpMode",
    "returnType": "uint16_t",
    "parameters": "uint8_t *remotip,uint16_t remoteport,uint16_t port",
    "header": "SetWifiUdpMode.h",
    "macro": "_SETWIFIUDPMODE_",
    "dependencies": []
  },
  {
    "name": "SetWifiVoiceString",
    "returnType": "uint16_t",
    "parameters": "int y,uint16_t ch_color,uint16_t bg_color",
    "header": "SetWifiVoiceString.h",
    "macro": "_SETWIFIVOICESTRING_",
    "dependencies": []
  },
  {
    "name": "SoundMp3",
    "returnType": "void",
    "parameters": "uint16_t folder,uint16_t mp3num,float time",
    "header": "SoundMp3.h",
    "macro": "_SOUNDMP3_",
    "dependencies": []
  },
  {
    "name": "SoundStartBeep",
    "returnType": "void",
    "parameters": "uint16_t folder",
    "header": "SoundStartBeep.h",
    "macro": "_SOUNDSTARTBEEP_",
    "dependencies": []
  },
  {
    "name": "WriteRFID522",
    "returnType": "uint8_t",
    "parameters": "uint8_t which,uint8_t data",
    "header": "WriteRFID522.h",
    "macro": "_WRITERFID522_",
    "dependencies": []
  },
  {
    "name": "WriteRFID522Sector",
    "returnType": "uint8_t",
    "parameters": "uint8_t which,unsigned char snr,unsigned char kuai,uint32_t data",
    "header": "WriteRFID522Sector.h",
    "macro": "_WRITERFID522SECTOR_",
    "dependencies": []
  }
];

export const C_UNAVAILABLE = new Set<string>(["GetBluetooth", "GetGesture", "GetIR", "GetIRCode", "GetRemoteControllerButton", "GetRemoteControllerButtonState", "GetRemoteControllerEulerian", "GetRemoteControllerGravity", "GetRemoteControllerRocker", "GetWifiData", "GetWifiVoice", "SetBluetooth", "SetIRCode", "SetPIDMotor", "SetPIDMotorRef", "SetWaitForBluetooth", "SetWaitForWifiData", "SetWifiData", "SetWifiUdpMode", "SetWifiVoiceString"]);
