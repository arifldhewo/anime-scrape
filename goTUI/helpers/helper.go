package helpers

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"time"

	"example.com/bubbletea/types"
	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
	"github.com/charmbracelet/lipgloss/table"
	"github.com/google/uuid"
)

func ReadFileConfig() types.ProviderRoot {
	cwd, err := os.Getwd()
	if err != nil {
		log.Fatal(err)
	}

	// TODO! If need to run debug change this with /../
	path := fmt.Sprintf("%s/config.json", cwd)

	contentByte, err := os.ReadFile(path)
	if err != nil {
		log.Fatal(err)
	}

	var contentJSON types.ProviderRoot

	json.Unmarshal(contentByte, &contentJSON)

	return contentJSON
}

func WriteFileConfig(setProviderIndex int) {
	cwd, err := os.Getwd()
	if err != nil {
		log.Fatal(err)
	}

	// TODO! If needed run to debug change this with /../
	path := fmt.Sprintf("%s/config.json", cwd)

	contentByte, err := os.ReadFile(path)
	if err != nil {
		log.Fatal(err)
	}

	var contentUnmarshalJSON types.ProviderRoot

	json.Unmarshal(contentByte, &contentUnmarshalJSON)

	contentUnmarshalJSON.Provider.SetProvider = setProviderIndex

	contentMarshalJSON, err := json.MarshalIndent(&contentUnmarshalJSON, "", "    ")
	if err != nil {
		log.Fatal(err)
	}

	err = os.WriteFile(path, contentMarshalJSON, 0o644)
}

func WriteSearchFile(search string) error {
	cwd, err := os.Getwd()
	if err != nil {
		return err
	}

	path := fmt.Sprintf("%s/data/search.json", cwd)

	searchStruct := struct {
		SearchTitle string `json:"searchTitle"`
	}{
		SearchTitle: search,
	}

	searchMarshal, err := json.MarshalIndent(searchStruct, "", "    ")
	if err != nil {
		return err
	}

	err = os.WriteFile(path, searchMarshal, 0644)
	if err != nil {
		return err
	}

	return nil
}

func CreateFileTempAndReturnTitle() (string, error) {
	path, err := os.Getwd()
	if err != nil {
		log.Fatal(err)
		return "Error while getting current working directory", err
	}

	// TODO! If needed run to debug change this with /../
	_, err = os.Stat(path + "/data")
	if os.IsNotExist(err) {
		fmt.Println("Folder temp is not found will create immediately")
		err := os.Mkdir(path+"/data", 0o775)
		if err != nil {
			log.Fatal(err)
			return "Error while create new folder temp", err
		}
	}

	// TODO! If needed run to debug change this with /../
	id := uuid.New().String()
	destinationPath := path + "/data/" + id + ".json"

	file, err := os.Create(destinationPath)
	if err != nil {
		log.Fatal(err)
		return fmt.Sprintf("Error while create new file to destination path: %s", destinationPath), err
	}

	defer file.Close()

	_, err = file.WriteString("{}")
	if err != nil {
		log.Fatal(err)
		return "Error while write \"{}\" to the file", err
	}

	return id + ".json", nil
}

func CheckAppNewVersion() (string, error) {
	// Retrieve From Github Server
	baseURL := "https://version.arifldhewo.my.id"
	var appVerRelease types.ReleaseGithubResponse
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
	var appVerCurrent types.PackageJSON

	cwd, err := os.Getwd()
	if err != nil {
		log.Fatal(err)
	}

	// TODO! If needed run to debug change this with /../
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

func AppUpdater() tea.Cmd {
	return func() tea.Msg {
		// check differentiation version
		baseURL := "https://version.arifldhewo.my.id"
		var appVerRelease types.ReleaseGithubResponse

		resAppVersion, err := http.Get(baseURL + "/version/anime-scrape")
		if err != nil {
			return types.AppUpdater{
				Description: err.Error(),
			}
		}

		defer resAppVersion.Body.Close()

		if resAppVersion.StatusCode >= 400 && resAppVersion.StatusCode <= 599 {
			return types.AppUpdater{
				Description: fmt.Sprintf("Response Err Code: %d", resAppVersion.StatusCode),
			}
		}

		body, err := io.ReadAll(resAppVersion.Body)
		if err != nil {
			return types.AppUpdater{
				Description: fmt.Sprintf("Error: %v", err),
			}
		}

		json.Unmarshal(body, &appVerRelease)

		// Read Package JSON
		var appVerCurrent types.PackageJSON

		cwd, err := os.Getwd()
		if err != nil {
			return types.AppUpdater{
				Description: fmt.Sprintf("Error: %v", err),
			}
		}

		// TODO! If needed run to debug change this with /../
		path := cwd + "/package.json"

		appVerByte, err := os.ReadFile(path)
		if err != nil {
			return types.AppUpdater{
				Description: fmt.Sprintf("Error: %v", err),
			}
		}

		json.Unmarshal(appVerByte, &appVerCurrent)

		if appVerCurrent.Version != appVerRelease.TagName {
			// download the zip to temp folder
			cwd, err := os.Getwd()
			if err != nil {
				return types.AppUpdater{
					Description: fmt.Sprintf("Error: %v", err),
				}
			}

			file, err := os.Create(fmt.Sprintf("%s/data/%s.zip", cwd, appVerRelease.TagName))
			if err != nil {
				return types.AppUpdater{
					Description: fmt.Sprintf("Error: %v", err),
				}
			}
			defer file.Close()

			res, err := http.Get(fmt.Sprintf("https://codeload.github.com/arifldhewo/anime-scrape/zip/refs/tags/%s", appVerRelease.TagName))
			if err != nil {
				return types.AppUpdater{
					Description: fmt.Sprintf("Error: %v", err),
				}
			}
			defer res.Body.Close()

			if res.StatusCode >= 400 && res.StatusCode <= 599 {
				return types.AppUpdater{
					Description: fmt.Sprintf("Error: %v", err),
				}
			}

			// move file into the actual physical disk
			_, err = io.Copy(file, res.Body)
			if err != nil {
				return types.AppUpdater{
					Description: fmt.Sprintf("Error: %v", err),
				}
			}

			return types.AppUpdater{
				Description:      fmt.Sprintf("Download update complete with version: %s", appVerRelease.TagName),
				AppNewestVersion: appVerRelease.TagName,
			}

			// do replace file to the all existing folder
		} else {
			return types.AppUpdater{
				Description:      "Your app already in latest version",
				AppNewestVersion: appVerRelease.TagName,
			}
		}
	}
}
