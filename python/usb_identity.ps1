param([string]$PortAddresses = '')
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)
$timer = [System.Diagnostics.Stopwatch]::StartNew()
$wantedPorts = @($PortAddresses -split ',' | Where-Object { $_ -match '^COM[0-9]+$' })
$cache = @{}
$propertyCache = @{}
function Get-UsbProperties([string]$instance) {
    if (-not $propertyCache.ContainsKey($instance)) {
        $values = @{}
        foreach ($property in @(Get-PnpDeviceProperty -InstanceId $instance -KeyName 'DEVPKEY_Device_ContainerId', 'DEVPKEY_Device_Parent' -ErrorAction SilentlyContinue)) {
            $values[$property.KeyName] = $property.Data
        }
        $propertyCache[$instance] = $values
    }
    return $propertyCache[$instance]
}
function Get-UsbIdentity([string]$instance) {
    if ($cache.ContainsKey($instance)) { return $cache[$instance] }
    $original = $instance
    $seen = @{}
    $root = ''
    $container = ''
    $chain = @()
    for ($index = 0; $index -lt 14 -and $instance -and -not $seen.ContainsKey($instance); $index++) {
        $seen[$instance] = $true
        $chain += $instance
        $properties = Get-UsbProperties $instance
        if (-not $container) {
            $containerValue = $properties['DEVPKEY_Device_ContainerId']
            if ($containerValue) {
                $value = ([string]$containerValue).Trim('{}').ToUpperInvariant()
                if ($value -ne '00000000-0000-0000-0000-000000000000' -and $value -ne '00000000-0000-0000-FFFF-FFFFFFFFFFFF') { $container = $value }
            }
        }
        # Accept hardware revision suffixes, but keep climbing past composite MI_xx interfaces.
        if ($instance -match '^USB\\VID_[0-9A-F]{4}&PID_[0-9A-F]{4}[^\\]*\\' -and $instance -notmatch '&MI_[0-9A-F]{2}') {
            $root = $instance.ToUpperInvariant()
            break
        }
        $parent = $properties['DEVPKEY_Device_Parent']
        if (-not $parent) { break }
        $instance = [string]$parent
    }
    $result = @{rootId=$root; containerId=$container; instanceId=$original; parentChain=@($chain)}
    $cache[$original] = $result
    return $result
}
$disks = @()
foreach ($disk in @(Get-CimInstance Win32_DiskDrive)) {
    # Internal disks have unrelated containers and do not belong to a controller.
    if ($disk.InterfaceType -ne 'USB' -and $disk.PNPDeviceID -notmatch '^(USB|USBSTOR)\\' -and $disk.Model -notmatch 'MicroPy|Joinmax|ZMROBO|E[67]-RCU') { continue }
    $identity = Get-UsbIdentity $disk.PNPDeviceID
    if (-not $identity.rootId -and -not $identity.containerId) { continue }
    $mounts = @()
    foreach ($partition in @(Get-CimAssociatedInstance -InputObject $disk -Association Win32_DiskDriveToDiskPartition)) {
        foreach ($logical in @(Get-CimAssociatedInstance -InputObject $partition -Association Win32_LogicalDiskToPartition)) {
            $mounts += ([string]$logical.DeviceID + '\')
        }
    }
    $disks += @{rootId=$identity.rootId; containerId=$identity.containerId; instanceId=$identity.instanceId;
        device=[string]$disk.DeviceID; mountpoints=@($mounts); parentChain=$identity.parentChain}
}
$ports = @()
foreach ($port in @(Get-PnpDevice -PresentOnly -Class Ports -ErrorAction SilentlyContinue)) {
    if ($port.FriendlyName -notmatch '\((COM[0-9]+)\)') { continue }
    $address = $Matches[1]
    if ($wantedPorts.Count -gt 0 -and $wantedPorts -notcontains $address) { continue }
    $identity = Get-UsbIdentity $port.InstanceId
    $ports += @{address=$address; name=[string]$port.FriendlyName; rootId=$identity.rootId; containerId=$identity.containerId;
        instanceId=$identity.instanceId; parentChain=$identity.parentChain}
}
$rows = @()
$notes = @()
foreach ($port in $ports) {
    $matched = @($disks | Where-Object { $port.rootId -and $_.rootId -eq $port.rootId })
    $byContainer = @()
    if ($port.containerId) {
        $portRoots = @($ports | Where-Object { $_.containerId -eq $port.containerId } | ForEach-Object { if ($_.rootId) { $_.rootId } else { $_.instanceId } } | Sort-Object -Unique)
        $containerDisks = @($disks | Where-Object { $_.containerId -eq $port.containerId -and $_.mountpoints.Count -gt 0 })
        $diskRoots = @($containerDisks | ForEach-Object { if ($_.rootId) { $_.rootId } else { $_.instanceId } } | Sort-Object -Unique)
        # Reject shared/conflicting containers instead of merging different classroom robots.
        if ($portRoots.Count -eq 1 -and $diskRoots.Count -eq 1) { $byContainer = $containerDisks }
        elseif ($portRoots.Count -gt 1 -or $diskRoots.Count -gt 1) { $notes += "Ambiguous ContainerId for $($port.address): $($port.containerId)" }
    }
    $physical = $port.rootId
    $method = 'USB parent'
    if ($matched.Count -eq 0 -and $byContainer.Count -gt 0) {
        $matched = $byContainer
        $physical = 'CONTAINER:' + $port.containerId
        $method = 'ContainerId'
    }
    if ($matched.Count -gt 0 -and $byContainer.Count -gt 0) { $physical = 'CONTAINER:' + $port.containerId }
    if ($matched.Count -eq 0) { $notes += "No disk match for $($port.address)" }
    $rows += @{address=$port.address; physicalId=$physical; rootId=$port.rootId; containerId=$port.containerId;
        matchMethod=$method; mountpoints=@($matched | ForEach-Object { $_.mountpoints });
        diskDevices=@($matched | ForEach-Object { $_.device })}
}
ConvertTo-Json -InputObject @{ports=@($rows); diskDiagnostics=@($disks); portDiagnostics=@($ports); notes=@($notes); elapsedMs=$timer.ElapsedMilliseconds} -Depth 8 -Compress
