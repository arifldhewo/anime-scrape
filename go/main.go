package main

import (
	"bufio"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"os/exec"
	"strings"
)

type Search struct {
	SearchTitle string `json:"searchTitle"`
}

type ReleasesGithubResponse struct {
	TagName string `json:"tag_name"`
}

type PackageJson struct {
	Version string `json:"version"`
}

type errorHandling struct {
	Error   string `json:"error"`
	Message string `json:"message"`
}

func main() {
	var kuramanimeCommand string
	var inputType int
	baseUrl := "https://anime-scrape-version-checker.vercel.app"

	resp, err := http.Get(baseUrl + "/version")

	if err != nil {
		log.Fatal(err)
	}

	defer resp.Body.Close()

	if resp.StatusCode > 399 {
		var errHandling errorHandling

		err = json.NewDecoder(resp.Body).Decode(&errHandling)

		if err != nil {
			log.Fatal(err)
		}

		fmt.Printf("%s %s (%d)", errHandling.Error, errHandling.Message, resp.StatusCode)
	} else {
		var releasesGithubResponse []ReleasesGithubResponse

		err = json.NewDecoder(resp.Body).Decode(&releasesGithubResponse)

		if err != nil {
			log.Fatal(err)
		}

		filePackagePath, err := os.Getwd()

		if err != nil {
			log.Fatal(err)
		}

		rawPackageJson, err := os.Open(filePackagePath + "\\package.json")

		if err != nil {
			log.Fatal(err)
		}

		var packageJson PackageJson

		err = json.NewDecoder(rawPackageJson).Decode(&packageJson)

		if err != nil {
			log.Fatal(err)
		}
		if releasesGithubResponse[0].TagName != packageJson.Version {
			fmt.Printf("Hey 👋, There's a new version %s, you could git pull yeah! [current: %s] \n\n", releasesGithubResponse[0].TagName, packageJson.Version)
		}
	}

	for {
		fmt.Println("What do you want to scrape? ")
		fmt.Println("[1] Kuramanime Daily")
		fmt.Println("[2] Kuramanime Search")
		fmt.Print("Input: ")

		_, err := fmt.Scanln(&inputType)

		if err != nil {
			log.Fatal("Error on Get Input Type: ", err)
		}

		if inputType == 1 {
			kuramanimeCommand = "kuramanime-daily"
			break
		} else if inputType == 2 {
			kuramanimeCommand = "kuramanime-search"
			break
		}
	}

	if inputType == 2 {
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

		err = os.WriteFile(path+"/data/search.json", newJSON, 0644)

		if err != nil {
			log.Fatal(err)
		}
	}

	cmd := exec.Command("npm", "run", kuramanimeCommand)

	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	err = cmd.Run()

	if err != nil {
		log.Fatal(err)
	}

	fmt.Println("Playwright complete")
}
