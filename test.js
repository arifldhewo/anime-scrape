function getDay() {
	const date = new Date();

	const allDays = ["sunday", "monday", "tuesday", "wednesday", "friday", "saturday"];
	const currentDay = date.getDay();

	return allDays[currentDay];
}

console.log(getDay());
