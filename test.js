// let expectedDate = "2024-09-09"
// let actualDate= "2024-9-09"

// const res = (expectedDate === actualDate) ? true : false

// console.log(res)


function currentDate () {
  const date = new Date();
  
  let currentDay = String(date.getDate());
  let currentMonth = String(date.getMonth() + 1);
  let currentYear = String(date.getFullYear());

  if (currentDay.length === 1) {
    currentDay = `0${currentDay}`
  }

  if (currentMonth.length === 1) { 
    currentMonth = `0${currentMonth}`
  }

  return `${currentYear}-${currentMonth}-${currentDay}`
}