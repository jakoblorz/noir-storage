#!/bin/bash

SERVICENAME=zipstore.service
SERVICEFILE="/opt/zipstore/zipstore.service"
SERVICECTLFILE="/etc/systemd/system/zipstore.service"
LEGACYEXISTS=false

# Stop Service if it is running
if [ "`systemctl is-active $SERVICENAME`" == "active" ]
then
    echo "> stopping $SERVICENAME as it is running..."
    systemctl stop $SERVICENAME
    echo "> stopping $SERVICENAME done"
    echo ""
    LEGACYEXISTS=true
fi

# Install Typescript to use latest runtime for compilation,
# Compile/Transpile codebase and install required npm dependencies
echo "> installing newest typescript version..."
npm install typescript -g
echo "> installing newest typescript version done"
echo ""

echo "> installing npm dependencies..."
npm install
echo "> installing npm dependencies done"
echo ""

echo "> compiling source..."
tsc
echo "> compiling source done"
echo ""

# Check if the required .service (locally /opt/zipstore) file exists,
# exit otherwise
if [ ! -f "$SERVICEFILE" ]
then
    echo "> installation requires $SERVICEFILE to exist"
    exit 0
fi

# Check if the .service (systemd /etc/systemd/system) file exists
# and remove it if necessary
if [ -f "$SERVICECTLFILE" ]
then
    echo "> removing legacy service file..."
    rm $SERVICECTLFILE
    echo "> removing legacy service file done"
    echo ""
fi

# Copy the .service file into /etc/systemd/system
echo "> copying service file to $SERVICECTLFILE..."
cp $SERVICEFILE $SERVICECTLFILE
echo "> copying service file to $SERVICECTLFILE done"
echo ""

if [ "`systemctl is-enabled $SERVICENAME`" != "enabled" ]
then
    echo "> enabling $SERVICENAME service ..."
    systemctl enable $SERVICENAME
    echo "> enabling $SERVICENAME service done"
    echo ""
fi

# Reload systemd Daemon
systemctl daemon-reload

# Restart the service if it was running previously,
# exit after that to prevent double starting
if [ $LEGACYEXISTS ]
then
    echo "> restarting $SERVICENAME ..."
    systemctl restart $SERVICENAME
    echo "> restarting $SERVICENAME done"
    exit 0
fi

echo "> starting $SERVICENAME ..."
systemctl start $SERVICENAME
echo "> starting $SERVICENAME done"
exit 0 
