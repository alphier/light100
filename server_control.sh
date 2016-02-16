#! /bin/sh
export DRAGON_HOME=/mnt/light100

USER_ID=`id -u`
DB_DIR=/mnt/mongodb
DB_BAK=$DB_DIR/bak
LOG_DIR=$DB_DIR
PROCESS_NAME="bootstrap.js $DRAGON_HOME"

if [ ! "$USER_ID" = "0" ]; then
    echo "Please re-run this program as the super user."
    exit 0
fi

#go to home
cd $DRAGON_HOME

#start server
start_server(){
	if [ -f "$DRAGON_HOME/light.lock" ]; then
        echo "light service has started, Please execute [light stop] command to stop service."
        exit 0       
    fi
	
	touch $DRAGON_HOME/light.lock
	
	if [ ! -d "$LOG_DIR" ]; then
	      mkdir -p "$LOG_DIR"
	fi
	
	if [ -z "`ps -ef | grep "mongod" | grep -v "grep"`" ]; then
		if [ ! -d "$DB_DIR" ]; then
			mkdir -p "$DB_DIR"
		fi
	
		mongod --repair --dbpath $DB_DIR
		mongod --journal --dbpath $DB_DIR --logpath $LOG_DIR/mongo.log --logappend --fork &
		sleep 5
	fi
		
	ulimit -n 40960
	ulimit -c unlimited
	
	nohup node $PROCESS_NAME >/dev/null 2>&1 &
	sleep 5
}

export_database(){
	if [ ! -d "$DB_BAK" ]; then
	      mkdir -p "$DB_BAK"
	fi
	BAK_CUR_DAY="$DB_BAK/`date +%Y%m%d`"
	echo "export to $BAK_CUR_DAY"
	if [ ! -d "$BAK_CUR_DAY" ]; then
	      mkdir -p "$BAK_CUR_DAY"
	fi
	mongodump -d light100 -o $BAK_CUR_DAY
}

import_database(){
	dbPath=$YESNO
	echo "import path is $dbPath"
	if [ -z "$dbPath" ]; then
		echo "Please specify DB backup path!"
		return 0
	fi
	if [ ! -d "$dbPath" ]; then
		echo "DB backup path not exists!"
		return 0
	fi
	if [ ! -d "$dbPath/light100" ]; then
		echo "DB backup files not found!"
		return 0
	fi
	echo "Import database..."
	mongorestore -d light100 --drop $dbPath/light100
	echo "Import succeed."
}

kill_process(){
	PIS=`ps -efww | grep "$PROCESS_NAME" | grep -v "grep" | awk '{print $2}'`
	if [ ! -z ${PIS} ]; then
		echo ${PIS} | xargs kill
		sleep 1
	fi
}

#stop server
stop_server(){
    rm -f $DRAGON_HOME/light.lock
	kill_process
	sleep 2
}

YESNO=$2
case "$1" in
start)
    echo "Starting light services ..."
    start_server
    echo "Server started."
    ;;
stop)
    echo "Stopping light services ...."
    stop_server
    echo "Server stopped"
    ;;
export)
	echo "Export database..."
	export_database
	echo "Export succeed."
	;;
import)
	import_database
	;;
version)
    if [ -f "$DRAGON_HOME/version" ]; then
        while read VLINE
        do
            echo $VLINE
        done<$DRAGON_HOME/version
    else
        echo "Unknow version"
    fi
    ;;
*)
    echo "Unknow command:light $1"
    echo "Command usage:"
    echo "light [start|stop|version|export|import]"
    ;;
esac

exit 0
