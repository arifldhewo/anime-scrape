package extension

func DetermineCommand(chosenProvider BaseExtension, daily map[int]struct{}, search string) string {
	getCommand := chosenProvider.GetCommand()

	if daily != nil {
		return getCommand.Daily
	} else {
		return getCommand.Search
	}
}
