package main

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/google/uuid"
)

func ReadConfigFile() Config {
	path, err := os.Getwd()
	if err != nil {
		log.Fatal(err)
	}

	rawConfig, err := os.ReadFile(path + "/config.json")
	if err != nil {
		log.Fatal(err)
	}

	config := Config{}

	json.Unmarshal(rawConfig, &config)

	return config
}

func CreateFileAndReturnTitle() string {
	path, err := os.Getwd()
	if err != nil {
		log.Fatal(err)
	}

	_, err = os.Stat(path + "/data")
	if os.IsNotExist(err) {
		fmt.Println("Folder temp is not found will create immediately")
		err := os.Mkdir(path+"/data", 0o775)
		if err != nil {
			log.Fatal(err)
		}
	}

	id := uuid.New().String()
	destinationPath := path + "/data/" + id + ".json"

	file, err := os.Create(destinationPath)
	if err != nil {
		log.Fatal(err)
	}

	defer file.Close()

	_, err = file.WriteString("{}")
	if err != nil {
		log.Fatal(err)
	}

	return id + ".json"
}

func convertTimezoneLocal(date string) string {
	utcTime, _ := time.Parse(time.RFC3339, date)

	localTime := utcTime.Local()

	constructedTime := fmt.Sprintf("%d:%d", localTime.Hour(), localTime.Minute())

	return constructedTime
}

func weekdayToJS(weekday string) int {
	availableDays := [7]string{"Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"}
	var selectedDays int

	for i := 0; i < len(availableDays); i++ {
		if availableDays[i] == weekday {
			selectedDays = i
		}
	}

	return selectedDays
}
