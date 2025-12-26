package main

import (
	"fmt"
	"log"
	"os"
	"os/exec"
	"strconv"

	"example.com/bubbletea/extension"
	"github.com/charmbracelet/bubbles/textinput"
	tea "github.com/charmbracelet/bubbletea"
)

func main() {
	p := tea.NewProgram(initialModel())
	if _, err := p.Run(); err != nil {
		fmt.Printf("Alas, there's been an error: %v", err)
		os.Exit(1)
	}
}

func initialModel() MainModel {
	SearchInput := textinput.New()
	SearchInput.Placeholder = "Spy x Family"
	SearchInput.Focus()
	SearchInput.Width = 20

	return MainModel{
		State: 1,
		InitPage: struct {
			SelectModel
			AppVersionMessage string
			AnimeDaily        []extension.AnimeDaily
		}{
			SelectModel: SelectModel{
				Title:   "What do you want to do?\n\n",
				Choices: []string{"Daily", "Search [WIP]", "Config"},
				Cursor:  0,
			},
		},
		DailyPage: SelectModel{
			Title: "What day you want to scrape? | [Esc] Prev Menu\n\n",
			Choices: []string{
				"Monday",
				"Tuesday",
				"Wednesday",
				"Thursday",
				"Friday",
				"Saturday",
				"Sunday",
			},
			Cursor: 0,
		},
		SearchInput: TypeModel{
			Title:     "What do you want to search? | [Esc] Prev Menu\n\n",
			TextInput: SearchInput,
		},
		ConfigPage: SelectModel{
			Title:   "This info about what provider you used. | [Esc] Prev Menu\n\n",
			Choices: []string{},
		},
		ExecPage: struct {
			Method struct {
				Daily  map[int]struct{}
				Search string
			}
			Stdout    string
			Stderr    string
			Err       error
			isRunning bool
		}{
			isRunning: false,
		},
	}
}

func (m MainModel) Init() tea.Cmd {
	return InitApp
}

func InitApp() tea.Msg {
	version, err := GetAppVersion()
	if err != nil {
		log.Fatal(err)
		return InitResult{
			Err: err,
		}
	}

	config := ReadFileConfig()
	var bp extension.BaseExtension
	var animeDaily []extension.AnimeDaily

	// Retrieve anime daily
	// TODO Need to make a factory
	switch config.Provider.SetProvider {
	case 0:
		bp = extension.Kuramanime{}

		animeDaily, err = bp.AnimeDaily()
		if err != nil {
			log.Fatal(err)
			return InitResult{
				Err: err,
			}
		}
	}

	return InitResult{
		Msg:        version,
		Err:        err,
		AnimeDaily: animeDaily,
	}
}

func (m MainModel) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	if msg, ok := msg.(tea.KeyMsg); ok {
		keyPress := msg.String()
		if keyPress == "ctrl+c" {
			return m, tea.Quit
		}
	}

	switch m.State {
	case 1:
		return InitUpdate(msg, m)
	case 2:
		switch m.InitPage.Selected {
		case 0:
			// return daily flow
			return DailyUpdate(msg, m)
		case 1:
			// return search flow
			return SearchUpdate(msg, m)
		case 2:
			// return config flow
			return ConfigUpdate(msg, m)
		}
	case 3:
		// return the exec function
		return ExecUpdate(msg, m)
		// determine is it daily or search?
		// determine what provider being used?
	}

	return m, nil
}

func InitUpdate(msg tea.Msg, m MainModel) (tea.Model, tea.Cmd) {
	switch m.ExecPage.isRunning {
	case true:
		return m, nil
	}

	switch msg := msg.(type) {

	case InitResult:
		m.InitPage.AppVersionMessage = msg.Msg
		m.InitPage.AnimeDaily = msg.AnimeDaily

	case tea.KeyMsg:

		switch msg.String() {
		case "up", "k":
			if m.InitPage.Cursor > 0 {
				m.InitPage.Cursor--
			}

		case "down", "j":
			if m.InitPage.Cursor < len(m.InitPage.Choices)-1 {
				m.InitPage.Cursor++
			}

		case "enter", " ":
			m.InitPage.Selected = m.InitPage.Cursor
			m.State = 2
		}
	}
	return m, nil
}

func DailyUpdate(msg tea.Msg, m MainModel) (tea.Model, tea.Cmd) {

	switch msg := msg.(type) {

	case tea.KeyMsg:

		switch msg.String() {

		case "up", "k":
			if m.DailyPage.Cursor > 0 {
				m.DailyPage.Cursor--
			}

		case "down", "j":
			if m.DailyPage.Cursor < len(m.DailyPage.Choices)-1 {
				m.DailyPage.Cursor++
			}

		case "esc":
			m.State = 1

		case "enter", " ":
			m.DailyPage.Selected = m.DailyPage.Cursor
			m.ExecPage.Method.Daily = make(map[int]struct{})
			m.ExecPage.Method.Daily[m.DailyPage.Selected] = struct{}{}
			m.State = 3
		}
	}

	return m, nil
}

func SearchUpdate(msg tea.Msg, m MainModel) (tea.Model, tea.Cmd) {
	var cmd tea.Cmd

	switch msg := msg.(type) {
	case tea.KeyMsg:

		switch msg.String() {
		case "esc":
			m.State = 1

		case "enter":
			m.ExecPage.Method.Search = m.SearchInput.TextInput.Value()
			m.State = 3
		}

		switch msg.Type {
		case tea.KeyCtrlC:
			return m, tea.Quit
		}
	}

	m.SearchInput.TextInput, cmd = m.SearchInput.TextInput.Update(msg)
	return m, cmd
}

func ConfigUpdate(msg tea.Msg, m MainModel) (tea.Model, tea.Cmd) {

	if len(m.ConfigPage.Choices) == 0 {
		configJSON := ReadFileConfig()

		m.ConfigPage.Selected = configJSON.Provider.SetProvider

		m.ConfigPage.Choices = append(m.ConfigPage.Choices, configJSON.Provider.AvailableProviders...)
	}

	switch msg := msg.(type) {
	case tea.KeyMsg:
		switch msg.String() {
		case "esc":
			m.State = 1

		case "up", "k":
			if m.ConfigPage.Cursor > 0 {
				m.ConfigPage.Cursor--
			}

		case "down", "j":
			if m.ConfigPage.Cursor < len(m.ConfigPage.Choices)-1 {
				m.ConfigPage.Cursor++
			}

		case "enter", " ":
			m.ConfigPage.Selected = m.ConfigPage.Cursor
			WriteFileConfig(m.ConfigPage.Selected)
		}
	}

	return m, nil
}

func ExecUpdate(msg tea.Msg, m MainModel) (tea.Model, tea.Cmd) {
	fileName, err := CreateFileTempAndReturnTitle()
	if err != nil {
		m.ExecPage.Err = err
		panic(err)
	}

	switch m.ExecPage.isRunning {
	case true:
		return m, nil
	}

	// determine by provider that used and method, daily | search
	//need to seperate by package helper, types to able to use correctly and able to determine in those file not this.
	var kuramanime extension.Kuramanime

	determineCommand := extension.DetermineCommand(kuramanime, m.ExecPage.Method.Daily, m.ExecPage.Method.Search)

	command := fmt.Sprintf("%s", determineCommand)

	cmd := exec.Command("npm", "run", command)
	cmd.Env = append(os.Environ(), "DAY="+strconv.Itoa(m.DailyPage.Selected+1), "ANIME_FILE_TEMP="+fileName)

	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	err = cmd.Run()
	if err != nil {
		panic(err)
	}

	return m, tea.Quit
}

func (m MainModel) View() string {

	s := "What do you want to scrape? \n\n"

	switch m.State {
	case 1:
		return InitView(m)
	case 2:
		switch m.InitPage.Selected {
		case 0:
			// return daily flow
			return DailyView(m)
		case 1:
			// return search flow
			return SearchView(m)
		case 2:
			// return config flow
			return ConfigView(m)
		case 3:
			// return view from command stream
		}
	}

	return s
}

func InitView(m MainModel) string {
	s := "\n" + m.InitPage.AppVersionMessage

	var tableData [][]string
	header := []string{"Title", "Schedule"}

	for _, anime := range m.InitPage.AnimeDaily {
		row := []string{
			anime.Title,
			ConvertTimezoneLocal(anime.Schedule),
		}

		tableData = append(tableData, row)
	}

	tableDaily := RenderTable(tableData, header)

	s += tableDaily.Render()

	s += "\n" + m.InitPage.Title

	s += "\n"

	for i, choice := range m.InitPage.Choices {
		cursor := " "
		checked := " "
		if m.InitPage.Cursor == i {
			cursor = ">"
			checked = "x"
		}

		s += fmt.Sprintf("%s [%s] %v \n", cursor, checked, choice)
	}

	s += "\nPress ctrl+c to Quit\n"

	return s
}

func DailyView(m MainModel) string {
	s := m.DailyPage.Title

	for i, choice := range m.DailyPage.Choices {
		cursor := " "
		checked := " "
		if m.DailyPage.Cursor == i {
			cursor = ">"
			checked = "x"
		}

		s += fmt.Sprintf("%s [%s] %v \n", cursor, checked, choice)
	}

	s += "\nPress ctrl+c to Quit\n"

	return s
}

func SearchView(m MainModel) string {
	return fmt.Sprintf("%s\n Input: %s \n\n Press ctrl+c to Quit", m.SearchInput.Title, m.SearchInput.TextInput.View())
}

func ConfigView(m MainModel) string {
	s := "\n" + m.ConfigPage.Title

	configJSON := ReadFileConfig()

	s += fmt.Sprintf("Current provider used: %s \n", configJSON.Provider.AvailableProviders[configJSON.Provider.SetProvider])
	s += "List available providers: \n"

	for i, available := range configJSON.Provider.AvailableProviders {
		cursor := " "
		checked := " "
		if m.ConfigPage.Cursor == i {
			cursor = ">"
			checked = "x"
		}

		s += fmt.Sprintf("%s [%s] %v \n", cursor, checked, available)
	}

	s += "\nPress ctrl+c to Quit"

	return s
}
