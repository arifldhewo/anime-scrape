package main

import (
	"fmt"
	"os"

	"example.com/bubbletea/extension"
	"example.com/bubbletea/helpers"
	"example.com/bubbletea/types"
	"github.com/charmbracelet/bubbles/textinput"
	tea "github.com/charmbracelet/bubbletea"
)

func main() {
	p := tea.NewProgram(initialModel(), tea.WithAltScreen())
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
				Title:   "What do you want to do? [Adjust the terminal size if get truncated] \n\n",
				Choices: []string{"Daily", "Search", "Config", "Updater"},
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
		SearchPage: TypeModel{
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
		UpdaterPage: struct {
			Description      string
			IsLoading        bool
			AppNewestVersion string
		}{
			IsLoading: false,
		},
	}
}

func (m MainModel) Init() tea.Cmd {
	return tea.Batch(
		InitApp,
		tea.SetWindowTitle("Anime Scrape"),
	)
}

func InitApp() tea.Msg {
	version, err := helpers.CheckAppNewVersion()
	if err != nil {
		return InitResult{
			Err: err,
		}
	}

	config := helpers.ReadFileConfig()
	var bp extension.BaseExtension
	var animeDaily []extension.AnimeDaily

	// Retrieve anime daily
	// TODO Need to make a factory
	switch config.Provider.SetProvider {
	case 0:
		bp = extension.Kuramanime{}

		animeDaily, err = bp.AnimeDaily()
		if err != nil {
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
		case 3:
			return AppUpdate(msg, m)
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
			m.ExecPage.Method.Search = m.SearchPage.TextInput.Value()
			m.State = 3

		case "ctrl+c":
			return nil, tea.Quit
		}
	}

	m.SearchPage.TextInput, cmd = m.SearchPage.TextInput.Update(msg)
	return m, cmd
}

func ExecUpdate(msg tea.Msg, m MainModel) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.KeyMsg:
		if msg.String() == "r" && m.ExecPage.isRunning == false {
			m.ExecPage.isRunning = true
			extension.FactoryCommand(m.DailyPage.Selected, m.SearchPage.TextInput.Value())
			m.ExecPage.isRunning = false
			m.SearchPage.TextInput.Reset()
			m.State = 1
		}

		switch msg.String() {
		case "ctrl+c":
			return nil, tea.Quit
		case "esc":
			m.ExecPage.isRunning = false
			m.State = 1
			m.SearchPage.TextInput.Reset()
			return m, nil
		}
	}

	return m, nil
}

func ConfigUpdate(msg tea.Msg, m MainModel) (tea.Model, tea.Cmd) {

	if len(m.ConfigPage.Choices) == 0 {
		configJSON := helpers.ReadFileConfig()

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
			helpers.WriteFileConfig(m.ConfigPage.Selected)
		}
	}

	return m, nil
}

func AppUpdate(msg tea.Msg, m MainModel) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.KeyMsg:
		switch msg.String() {
		case "ctrl+c":
			return m, tea.Quit
		case "u":
			m.UpdaterPage.IsLoading = true
			return m, helpers.AppUpdater()
		case "esc":
			m.UpdaterPage.IsLoading = false
			m.UpdaterPage.Description = ""
			m.State = 1
		}

	case types.AppUpdater:
		m.UpdaterPage.Description = msg.Description
		m.UpdaterPage.AppNewestVersion = msg.AppNewestVersion
	}

	return m, nil
}

func (m MainModel) View() string {

	s := ""

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
			// return updater flow
			return UpdaterView(m)
		}
	case 3:
		return ExecView(m)
	}

	return s
}

func InitView(m MainModel) string {
	var s string

	s += "\n" + m.InitPage.AppVersionMessage

	var tableData [][]string
	header := []string{"Title", "Schedule"}

	for _, anime := range m.InitPage.AnimeDaily {
		row := []string{
			anime.Title,
			helpers.ConvertTimezoneLocal(anime.Schedule),
		}

		tableData = append(tableData, row)
	}

	tableDaily := helpers.RenderTable(tableData, header)

	s += tableDaily.Render()

	s += "\n " + m.InitPage.Title

	for i, choice := range m.InitPage.Choices {
		cursor := " "
		checked := " "
		if m.InitPage.Cursor == i {
			cursor = ">"
			checked = "x"
		}

		s += fmt.Sprintf(" %s [%s] %v \n", cursor, checked, choice)
	}

	s += "\n Press ctrl+c to Quit\n"

	return s
}

func DailyView(m MainModel) string {
	s := " " + m.DailyPage.Title

	for i, choice := range m.DailyPage.Choices {
		cursor := " "
		checked := " "
		if m.DailyPage.Cursor == i {
			cursor = ">"
			checked = "x"
		}

		s += fmt.Sprintf(" %s [%s] %v \n", cursor, checked, choice)
	}

	s += "\n Press ctrl+c to Quit\n"

	return s
}

func SearchView(m MainModel) string {
	return fmt.Sprintf(" %s\n Input: %s \n\n Press ctrl+c to Quit", m.SearchPage.Title, m.SearchPage.TextInput.View())
}

func ConfigView(m MainModel) string {
	s := " " + m.ConfigPage.Title

	configJSON := helpers.ReadFileConfig()

	s += fmt.Sprintf("Current provider used: %s \n", configJSON.Provider.AvailableProviders[configJSON.Provider.SetProvider])
	s += " List available providers: \n"

	for i, available := range configJSON.Provider.AvailableProviders {
		cursor := " "
		checked := " "
		if m.ConfigPage.Cursor == i {
			cursor = ">"
			checked = "x"
		}

		s += fmt.Sprintf(" %s [%s] %v \n", cursor, checked, available)
	}

	s += "\nPress ctrl+c to Quit"

	return s
}

func ExecView(m MainModel) string {
	s := "\n Press r to run the scrape"

	return s
}

func UpdaterView(m MainModel) string {
	s := " Press u for running updater \n\n Press Esc for going back to main menu \n Press ctrl+c to Quit"

	if m.UpdaterPage.IsLoading == true {
		s = "\n Downloading, please wait"
	}
	if m.UpdaterPage.Description != "" {
		s = "\n" + m.UpdaterPage.Description
		if m.UpdaterPage.Description != "Your app already in latest version" {
			s += "\n [1] It's only download the update. you need to replace the file and folder MANUALLY!"
			s += fmt.Sprintf("\n [2] Find file with name %s.zip", m.UpdaterPage.AppNewestVersion)
			s += "\n [3] The location is in `scrape-location/data` folder"
			s += "\n [4] Then extract the zip file and copy and replace all extracted files into your main folder. DON'T FORGET TO CLOSE THIS APPS"
		}
		s += "\n\n Press Esc for going back to main menu"
		s += "\n Press ctrl+c to Quit\n"
	}

	return s
}
