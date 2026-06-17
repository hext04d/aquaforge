#!/bin/sh

valid_options="run restart stop"
valid_extra_params="--detach --build --no-kill"

exec_option="$1"

# Utility to check if element is in list
contains_element () {
    match="$1"
    shift
    for e in "$@"; do
        [ "$e" = "$match" ] && return 0
    done
    return 1
}

if [ "$exec_option" = "--help" ] || [ -z "$exec_option" ]; then
    echo "\
Usage:
./test.sh [run|restart|stop] (extra parameters...)

Possible execution options: ${valid_options}
Valid extra parameters: ${valid_extra_params}

Examples:
./test.sh run (starts the application)
./test.sh run --detach --build (starts the application in background with forced build)
./test.sh restart (restarts the containers)
./test.sh stop (stops and removes containers)
"
    exit 0
fi

# Check if exec_option is valid
contains_element "$exec_option" $valid_options
if [ $? -eq 1 ]; then
    echo "Error: parameter 1 must be one of the valid options: ${valid_options}"
    echo "Try running ./test.sh --help"
    exit 1
fi

# Set default values
KILL="true"
DETACH="false"
BUILD="false"

# Parse extra parameters
for arg in "$@"; do
    case "$arg" in
        *"--no-kill"*) KILL="false" ;;
        *"--detach"*) DETACH="true" ;;
        *"--build"*) BUILD="true" ;;
        *) ;;
    esac
done

if [ "$exec_option" = "stop" ]; then
    echo "Stopping and removing containers..."
    docker compose down
    exit 0
fi

if [ "$exec_option" = "restart" ]; then
    echo "Restarting application..."
    docker compose restart
    exit 0
fi

# Handle "run" option
if [ "$KILL" = "true" ]; then
    # Kills and removes containers to make clean start
    if [ -n "$(docker ps -q -f name=aquaforge)" ]; then
        echo "Stopping existing containers..."
        docker compose down > /test/null 2>&1
    fi
fi

command="docker compose up"

if [ "$BUILD" = "true" ]; then
    command="$command --build"
fi

if [ "$DETACH" = "true" ]; then
    command="$command --detach"
fi

echo "Starting application."
echo "Command: $command"

eval "$command"
exit_code=$?

echo ""
exit $exit_code
