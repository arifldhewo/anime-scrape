package extension

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"os/exec"
	"strconv"
	"strings"
	"time"

	"example.com/bubbletea/helpers"
	tea "github.com/charmbracelet/bubbletea"
)

type Kuramanime struct {
	command CommandSyntax
}

type ResKuramanimeScheduleRoot struct {
	Animes ResKuramanimeScheduleAnimes `json:"animes"`
}

type ResKuramanimeScheduleAnimes struct {
	Data []ResKuramanimeScheduleData `json:"data"`
}

type ResKuramanimeScheduleData struct {
	Title         string `json:"title"`
	ScheduledTime string `json:"scheduled_time"`
	CountryCode   string `json:"country_code"`
}

func (k Kuramanime) AnimeDaily() ([]AnimeDaily, error) {
	baseURL := "https://v9.kuramanime.tel"

	res, err := http.Get(fmt.Sprintf("%s/schedule?scheduled_day=%s&need_json=true", baseURL, strings.ToLower(time.Now().Weekday().String())))
	if err != nil {
		log.Fatal(err)
		return nil, err
	}

	defer res.Body.Close()

	byteJSON, err := io.ReadAll(res.Body)
	if err != nil {
		log.Fatal(err)
		return nil, err
	}

	var decodedJSON ResKuramanimeScheduleRoot

	err = json.Unmarshal(byteJSON, &decodedJSON)
	if err != nil {
		log.Fatal(err)
		return nil, err
	}

	var animeDaily []AnimeDaily

	for _, decode := range decodedJSON.Animes.Data {
		animeDaily = append(animeDaily, AnimeDaily{
			Title:    decode.Title,
			Schedule: decode.ScheduledTime,
		})
	}

	return animeDaily, nil
}

func (k Kuramanime) GetCommand() CommandSyntax {
	k.command.Daily = "kuramanime-daily"
	k.command.Search = "kuramanime-search"

	return k.command
}

func (k Kuramanime) RunCommand(day int, search string) (tea.Cmd, error) {
	fileName, err := helpers.CreateFileTempAndReturnTitle()
	if err != nil {
		return nil, err
	}

	getCommand := k.GetCommand()

	var selectedCommand string
	if search != "" {

		if err := helpers.WriteSearchFile(search); err != nil {
			return nil, err
		}

		selectedCommand = getCommand.Search
	} else {
		selectedCommand = getCommand.Daily
	}

	fmt.Println(selectedCommand)

	cmd := exec.Command("npm", "run", selectedCommand)
	if search != "" {
		cmd.Env = append(os.Environ(), "ANIME_FILE_TEMP="+fileName)
	} else {
		cmd.Env = append(os.Environ(), "DAY="+strconv.Itoa(day+1), "ANIME_FILE_TEMP="+fileName)
	}

	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	err = cmd.Run()
	if err != nil {
		return nil, err
	}

	return nil, nil
}
