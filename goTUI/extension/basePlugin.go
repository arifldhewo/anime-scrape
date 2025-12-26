package extension

type BaseExtension interface {
	GetCommand() CommandSyntax
	AnimeDaily() ([]AnimeDaily, error)
}

type AnimeDaily struct {
	Title    string
	Schedule string
}

type CommandSyntax struct {
	Daily  string
	Search string
}
