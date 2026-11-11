import sensor


def ReadLight(port):
    return sensor.GetLightSensor(port)

def task1():
    print(ReadLight(5))

task1()
