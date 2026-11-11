import rcu

# Add two robots and assign bluetooth-first.py / bluetooth-second.py to them.
# Both programs start together. No physical Bluetooth hardware is used.
rcu.SetBluetoothData(10)
while rcu.GetBluetoothData() != 20:
    pass

print('Робот 1 получил:', rcu.GetBluetoothData())
rcu.SetBluetoothData(30)
while rcu.GetBluetoothData() != 40:
    pass
print('Обмен завершён')
