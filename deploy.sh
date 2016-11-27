#!/usr/bin/expect -f

spawn ssh enoch@qlicker.etdev.ca
expect "password:"
sleep 1
send "$METEOR_DEPLOY_PASS\r"

cd ~/build/qlicker
git pull
npm install
rm qlicker.tar.gz
meteor build .
rm /home/qlicker/qlicker.tar.gz
mv qlicker.tar.gz /home/qlicker/qlicker.tar.gz
rm -rf /home/qlicker/bundle
cd /home/qlicker/
tar -zxf /home/qlicker/qlicker.tar.gz
(cd bundle/programs/server && npm install)
sudo /sbin/restart qlicker

