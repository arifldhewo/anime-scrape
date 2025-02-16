package main

import (
	"bufio"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"os/exec"
	"strings"
)

type Search struct {
    SearchTitle string `json:"searchTitle"`
}

func main() {
    var kuramanimeCommand string;
    var inputType int;
    for {
        fmt.Println("What do you want to scrape? ");
        fmt.Println("[1] Kuramanime Daily");
        fmt.Println("[2] Kuramanime Search");
        fmt.Print("Input: ");

        _, err := fmt.Scan(&inputType);

        if err != nil {
            fmt.Println("Error on Get Input Type: ", err);
            panic(err);
        }

        if (inputType == 1) {
            kuramanimeCommand = "kuramanime-daily";
            break;
        } else if (inputType == 2) {
            kuramanimeCommand = "kuramanime-search";
            break;
        } 
    }

    if (inputType == 2) {
        var inputAnimeTitle string;
    
        path, err := os.Getwd();
    
        if err != nil {
            fmt.Println("Error on Get Current directory: ", err);
            panic(err);
        }
    
        file, err := os.Open(path+"/data/search.json");
    
        if err != nil {
            fmt.Println("Error on Opening File: ", err);
            panic(err);
        }
    
        byteValue, err := io.ReadAll(file);
    
        if err != nil {
            fmt.Println("Error on Reading JSON File: ", err);
            panic(err);
        }
    
        var search Search;
    
        err = json.Unmarshal(byteValue, &search);
    
        reader := bufio.NewReader(os.Stdin);
    
        fmt.Print("Search anime that you want scrape on kuramanime: \n");
    
        inputAnimeTitle, _ = reader.ReadString('\n');
    
        fixedString := strings.TrimSpace(inputAnimeTitle);
    
        search.SearchTitle = fixedString;
    
        newJSON, err := json.MarshalIndent(search,"", "    ");
    
        if err != nil {
            fmt.Println("Error on Converting to Byte: ", err);
            panic(err);
        }
    
        err = os.WriteFile(path+"/data/search.json", newJSON, 0644);
    
        if err != nil {
            fmt.Println("Error on Write File: ", err);
            panic(err);
        }
    }

	cmd := exec.Command("npm", "run", kuramanimeCommand);
    
    cmd.Stdout = os.Stdout;
    cmd.Stderr = os.Stderr;

    err := cmd.Run();

    if err != nil {
        fmt.Println("Error on running CMD: ", err);
        panic(err);
    }

    fmt.Println("Playwright complete");
}