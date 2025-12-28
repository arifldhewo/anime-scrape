package extension

import (
	"example.com/bubbletea/helpers"
	tea "github.com/charmbracelet/bubbletea"
)

func FactoryCommand(day int, search string) (tea.Cmd, error) {
	config := helpers.ReadFileConfig()

	switch config.Provider.SetProvider {
	case 0:
		kuramanime := Kuramanime{}

		cmd, err := kuramanime.RunCommand(day, search)
		if err != nil {
			return nil, err
		}

		return cmd, nil
	}

	return nil, nil
}
