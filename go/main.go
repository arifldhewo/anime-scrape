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
)

func main() {
	var day string
	var kuramanimeCommand string
	var inputType int
	var inputDay int
	FILE_PATH := CreateFileAndReturnTitle()

	versionValue, err := checkVersion()
	if err != nil {
		log.Fatal(err)
	}

	fmt.Printf("%s", versionValue)

	// interface to call different function based on config

	for {
		fmt.Println("What do you want to scrape? ")
		fmt.Println("[1] Kuramanime Daily")
		fmt.Println("[2] Kuramanime Search")
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
		} else {
			fmt.Println("Please enter valid option 1 or 2")
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
