package main

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/charmbracelet/lipgloss"
	"github.com/charmbracelet/lipgloss/table"
	"github.com/google/uuid"
)

func ReadFileConfig() ProviderRoot {
	cwd, err := os.Getwd()
	if err != nil {
		log.Fatal(err)
	}

	path := fmt.Sprintf("%s/config.json", cwd)

	contentByte, err := os.ReadFile(path)
	if err != nil {
		log.Fatal(err)
	}

	var contentJSON ProviderRoot

	json.Unmarshal(contentByte, &contentJSON)

	return contentJSON
}

func WriteFileConfig(setProviderIndex int) {
	cwd, err := os.Getwd()
	if err != nil {
		log.Fatal(err)
	}

	path := fmt.Sprintf("%s/config.json", cwd)

	contentByte, err := os.ReadFile(path)
	if err != nil {
		log.Fatal(err)
	}

	var contentUnmarshalJSON ProviderRoot

	json.Unmarshal(contentByte, &contentUnmarshalJSON)

	contentUnmarshalJSON.Provider.SetProvider = setProviderIndex

	contentMarshalJSON, err := json.MarshalIndent(&contentUnmarshalJSON, "", "    ")
	if err != nil {
		log.Fatal(err)
	}

	err = os.WriteFile(path, contentMarshalJSON, 0o644)
}

func CreateFileTempAndReturnTitle() (string, error) {
	path, err := os.Getwd()
	if err != nil {
		log.Fatal(err)
		return "Error while getting current working directory", err
	}

	_, err = os.Stat(path + "/data")
	if os.IsNotExist(err) {
		fmt.Println("Folder temp is not found will create immediately")
		err := os.Mkdir(path+"/data", 0o775)
		if err != nil {
			log.Fatal(err)
			return "Error while create new folder temp", err
		}
	}

	id := uuid.New().String()
	destinationPath := path + "/data/" + id + ".json"

	file, err := os.Create(destinationPath)
	if err != nil {
		log.Fatal(err)
		return fmt.Sprintf("Error while create new file to destianation path: %s", destinationPath), err
	}

	defer file.Close()

	_, err = file.WriteString("{}")
	if err != nil {
		log.Fatal(err)
		return "Error while write \"{}\" to the file", err
	}

	return id + ".json", nil
}

func GetAppVersion() (string, error) {
	// Retrieve From Github Server
	baseURL := "https://version.arifldhewo.my.id"
	var appVerRelease ReleaseGithubResponse
	var (
		green  = lipgloss.Color("#04f700")
		orange = lipgloss.Color("#f79d00")
	)

	resAppVersion, err := http.Get(baseURL + "/version/anime-scrape")
	if err != nil {
		log.Fatal(err)
		return fmt.Sprintf("Sorry, this is unavailable right now | %v \n\n", err), err
	}

	defer resAppVersion.Body.Close()

	if resAppVersion.StatusCode >= 400 && resAppVersion.StatusCode <= 599 {
		return fmt.Sprintf("Sorry, This is unavailable right now | Response Code: %d \n\n", resAppVersion.StatusCode), err
	}

	body, err := io.ReadAll(resAppVersion.Body)
	if err != nil {
		log.Fatal(err)
	}

	json.Unmarshal(body, &appVerRelease)

	// Read Package JSON
	var appVerCurrent PackageJSON

	cwd, err := os.Getwd()
	if err != nil {
		log.Fatal(err)
	}
	path := cwd + "/package.json"

	appVerByte, err := os.ReadFile(path)
	if err != nil {
		log.Fatal(err)
		return "package.json is not found \n\n", err
	}

	json.Unmarshal(appVerByte, &appVerCurrent)

	var (
		currentVerStyle = lipgloss.NewStyle().Bold(true).Foreground(orange).Render(appVerCurrent.Version)
		releaseVerStyle = lipgloss.NewStyle().Bold(true).Foreground(green).Render(appVerRelease.TagName)
	)

	// Determine versioning
	if appVerCurrent.Version != appVerRelease.TagName {
		return fmt.Sprintf("Hey, there is a new version. Current [%s] | New [%s] \n\n", currentVerStyle, releaseVerStyle), nil
	} else {
		return "\r", nil
	}
}

func ConvertTimezoneLocal(date string) string {
	utcTime, _ := time.Parse(time.RFC3339, date)

	localTime := utcTime.Local()

	constructedTime := fmt.Sprintf("%d:%d", localTime.Hour(), localTime.Minute())

	return constructedTime
}

func RenderTable(data [][]string, header []string) *table.Table {
	var (
		greeny    = lipgloss.Color("#20c7b6")
		lightGray = lipgloss.Color("#dae6e4")
		gray      = lipgloss.Color("#96a8a6")

		headerStyle  = lipgloss.NewStyle().Foreground(greeny).Bold(true).Align(lipgloss.Center)
		cellStyle    = lipgloss.NewStyle().Padding(0, 1).Width(25)
		oddRowStyle  = cellStyle.Foreground(gray)
		evenRowStyle = cellStyle.Foreground(lightGray)
	)

	t := table.New().
		Border(lipgloss.NormalBorder()).
		BorderStyle(lipgloss.NewStyle().Foreground(greeny)).
		StyleFunc(func(row, col int) lipgloss.Style {
			switch {
			case row == table.HeaderRow:
				return headerStyle
			case row%2 == 0:
				return evenRowStyle
			default:
				return oddRowStyle
			}
		}).Headers(header...).Rows(data...)

	return t
}
