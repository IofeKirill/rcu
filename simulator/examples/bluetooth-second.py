import rcu

while rcu.GetBluetoothData() != 10:
    pass
print('Робот 2 получил:', rcu.GetBluetoothData())
rcu.SetBluetoothData(20)

while rcu.GetBluetoothData() != 30:
    pass
print('Робот 2 получил:', rcu.GetBluetoothData())
rcu.SetBluetoothData(40)
