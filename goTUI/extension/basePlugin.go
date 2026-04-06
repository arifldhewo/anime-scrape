package extension

import tea "github.com/charmbracelet/bubbletea"

type BaseExtension interface {
	GetCommand() CommandSyntax
	AnimeDaily() ([]AnimeDaily, error)
	RunCommand(day int, search string, pageState int) (tea.Cmd, error)
}

type AnimeDaily struct {
	Title    string
	Schedule string
}

type CommandSyntax struct {
	Daily  string
	Search string
	Season string
}
