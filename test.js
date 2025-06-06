const fs = require("fs");

function getDay() {
	const date = new Date();

	const allDays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
	const currentDay = date.getDay();

	return allDays[currentDay];
}

function readLatestFile() {
	const rawFileUpdated = JSON.parse(fs.readFileSync(`data/daily.json`).toString());

	const titleList = rawFileUpdated.map((data) => data.slug);

	let allFilesBecomeString = [];

	titleList.forEach((data) => {
		const fileString = fs.readFileSync(`outputm3u/${getDay()}/${data}.m3u`).toString();

		allFilesBecomeString.push(fileString);
	});

	let allSplitted = [];

	allFilesBecomeString.forEach((data, index) => {
		allSplitted.push(data.split("\n"));
	});

	let detailTitle = [];

	allSplitted.forEach((allData, allIndex) => {
		allData.forEach((detailData, detailIndex) => {
			if (detailIndex % 2 === 1) {
				detailTitle.push({ index: allIndex });
			}
		});
	});

	console.log(detailTitle.filter((data) => data.index === 0));
}

readLatestFile();
