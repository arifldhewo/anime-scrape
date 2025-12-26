package main

import (
	"bufio"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"os/exec"
	"strconv"
	"strings"
	"time"
)

func main() {
	var day string
	var kuramanimeCommand string
	var inputType int
	var inputDay int
	var inputSetProvider int
	FILE_PATH := CreateFileAndReturnTitle()
	config := ReadConfigFile()

	versionValue, err := checkVersion()
	if err != nil {
		log.Fatal(err)
	}

	fmt.Printf("%s", versionValue)

	// interface to call different function based on config

	if err = showTodayAnimeList(); err != nil {
		log.Fatal(err)
	}

	for {
		fmt.Printf("Current Provider: %s \n", config.Provider.SetValue)
		fmt.Println("What do you want to scrape? ")
		fmt.Println("[1] Daily")
		fmt.Println("[2] Search")
		fmt.Println("[3] Set Another Provider")
		fmt.Print("Input: ")

		_, err := fmt.Scanln(&inputType)
		if err != nil {
			fmt.Println("Invalid Input Please enter a number")

			var discard string
			fmt.Scanln(&discard)
			continue
		}

		if inputType == 1 {
			kuramanimeCommand = "kuramanime-daily"
			break
		} else if inputType == 2 {
			kuramanimeCommand = "kuramanime-search"
			break
		} else if inputType == 3 {
			fmt.Println("Avaialble Provider: ")
			for i := 0; i < len(config.Provider.AvailableProviders); i++ {
				fmt.Printf("[%d]: %s \n", i, config.Provider.AvailableProviders[i])
				fmt.Print("Input: ")
				fmt.Scanln(&inputSetProvider)
			}
		} else {
			fmt.Println("Please enter valid option 1, 2 or 3")
		}
	}

	if inputType == 1 {
		for {
			fmt.Println("What day do you want to scrape? ")
			fmt.Println("[1] Monday")
			fmt.Println("[2] Tuesday")
			fmt.Println("[3] Wednesday")
			fmt.Println("[4] Thursday")
			fmt.Println("[5] Friday")
			fmt.Println("[6] Saturday")
			fmt.Println("[7] Sunday")
			fmt.Print("Input: ")

			_, err := fmt.Scanln(&inputDay)
			if err != nil {
				fmt.Println("Invalid input please enter number")

				var discard string
				fmt.Scanln(&discard)
				continue
			}

			if inputDay > 0 && inputDay < 8 {
				conv := strconv.Itoa(inputDay)
				day = conv
				break
			} else {
				fmt.Println("Please enter valid option from 0 -> 7")
			}
		}
	}

	if inputType == 2 {
		searchFlow()
	}

	if inputType == 3 {
	}

	cmd := exec.Command("npm", "run", kuramanimeCommand)
	cmd.Env = append(os.Environ(), "DAY="+day, "ANIME_FILE_TEMP="+FILE_PATH)

	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	err = cmd.Run()
	if err != nil {
		log.Fatal(err)
	}
}

func searchFlow() {
	path, err := os.Getwd()
	if err != nil {
		log.Fatal(err)
	}

	file, err := os.Open(path + "/data/search.json")
	if err != nil {
		log.Fatal(err)
	}

	byteValue, err := io.ReadAll(file)
	if err != nil {
		log.Fatal(err)
	}

	var search Search

	err = json.Unmarshal(byteValue, &search)
	if err != nil {
		log.Fatal(err)
	}

	reader := bufio.NewReader(os.Stdin)

	var inputAnimeTitle string

	fmt.Println("Search anime that you want scrape on kuramanime: ")
	fmt.Print("Input: ")

	inputAnimeTitle, _ = reader.ReadString('\n')

	fixedString := strings.TrimSpace(inputAnimeTitle)

	search.SearchTitle = fixedString

	newJSON, err := json.MarshalIndent(search, "", "    ")
	if err != nil {
		log.Fatal(err)
	}

	err = os.WriteFile(path+"/data/search.json", newJSON, 0o644)
	if err != nil {
		log.Fatal(err)
	}
}

func checkVersion() (string, error) {
	fmt.Print("Checking New Version")

	baseURL := "https://version.arifldhewo.my.id"
	var value string

	resp, err := http.Get(baseURL + "/version/anime-scrape")
	if err != nil {
		return err.Error(), err
	}

	fmt.Print("\r")

	defer resp.Body.Close()

	if resp.StatusCode > 399 && resp.StatusCode != 404 {
		return "Check Version Rate Limit Is Reaching (422)", errors.New("rate Limit is Reaching (422)")
	}

	if resp.StatusCode == 404 {
		return "Check Version baseURL Path is not found (404)", errors.New("path Is Not Found (404)")
	}

	var releasesGithubResponse ReleasesGithubResponse

	err = json.NewDecoder(resp.Body).Decode(&releasesGithubResponse)
	if err != nil {
		return err.Error(), err
	}

	filePackagePath, err := os.Getwd()
	if err != nil {
		return err.Error(), err
	}

	rawPackageJSON, err := os.Open(filePackagePath + "/package.json")
	if err != nil {
		return err.Error(), err
	}

	var packageJSON PackageJSON

	err = json.NewDecoder(rawPackageJSON).Decode(&packageJSON)
	if err != nil {
		return err.Error(), err
	}

	if releasesGithubResponse.TagName != packageJSON.Version {
		value = fmt.Sprintf("Hey, There's a new version %s, you could git pull yeah! [current: %s] \n\n", releasesGithubResponse.TagName, packageJSON.Version)
	}

	return value, nil
}

func showTodayAnimeList() error {
	res, err := getTodayAnimeList()
	if err != nil {
		return err
	}

	fmt.Println("---------------------- Today Anime Schedule ----------------------")
	fmt.Println("| Animes | Scheduled Time |")

	for i := 0; i < len(res.Animes.Data); i++ {
		fmt.Println("| " + res.Animes.Data[i].Title + " | " + convertTimezoneLocal(res.Animes.Data[i].ScheduledTime) + " |")
	}

	fmt.Println()

	return nil
}

func getTodayAnimeList() (ResKuramanimeScheduleRoot, error) {
	baseURL := "https://v8.kuramanime.tel"

	fmt.Print("Retrieve Today Animes")

	resp, err := http.Get(baseURL + "/schedule?scheduled_day=" + strings.ToLower(time.Now().Weekday().String()) + "&need_json=true")
	if err != nil {
		return ResKuramanimeScheduleRoot{}, err
	}

	fmt.Print("\r")

	defer resp.Body.Close()

	var resKuramanime ResKuramanimeScheduleRoot

	if err = json.NewDecoder(resp.Body).Decode(&resKuramanime); err != nil {
		return ResKuramanimeScheduleRoot{}, nil
	}

	var filtered ResKuramanimeScheduleRoot

	for _, res := range resKuramanime.Animes.Data {
		if res.CountryCode == "JP" {
			filtered.Animes.Data = append(filtered.Animes.Data, res)
		}
	}

	return filtered, nil
}
