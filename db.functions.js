// connecting to db file
const db = require('./database');
const prompt = require('prompt-sync')(); // for user accepting input
const vd = require('give-me-date'); // to validate the date input

// setting up format for the input
const options = {
  format:  'dd/mm/yyyy'
}

// function to add a new user
function addUser() {

  // name and date
  let name 
  let date
  
  // ask user to input their name (till they input correct data)
  do {
    name = prompt('Please enter your name: ');
    isInputValid(name, isNameValid, "Name input shouldn't contain special characters!")
  } while (!isNameValid(name) || (name.length < 1));


  // only switch to the next questions once the name is correct
  if (isNameValid(name) && (name.length > 1)) {

    do {
      date = prompt('Please enter your check-in date: ');
      isInputValid(date, isDateValid, "Please enter a real date (today or in future)");
    } while (!isDateValid(date) || (date.length < 1));
    

    // only if both inputs are valid - we proceed to the next step - save the user to the db
    if (isDateValid(date) && isNameValid(name)) {

      db.none("INSERT INTO reg_users (users_name, entry_date) VALUES ($1, $2);", [name, date])
      .then(() => {

        // show success message and ask user if they would like to see the full list of users
        console.info('\x1b[36m%s\x1b[0m', '-----> New User has been added');

        let showList = prompt('Would you like to see the full list of checked in users?: (Y/N): ')

        // if user enters something different from y and n, we will keep prompting him
        if (!showList || showList && showList.trim().toLowerCase() !== 'y' && showList.trim().toLowerCase() !== 'n') {
          
          do {
            showList = prompt('Please reply Y or N: ');
          } while (!showList && (showList.trim().toLowerCase() !== 'y' || showList.trim().toLowerCase() !== 'n'));
        
        // scenarios for Y and N
        } else if (showList && showList.trim().toLowerCase() === 'y') {
          listUsers();
          
        } else if (showList && showList.trim().toLowerCase() === 'n') {
          console.log('\x1b[36m%s\x1b[0m', 'No worries, feel free to do something else here!')
        }

      })
      .catch((error) => console.error(error));
    }

  }
  
}

//  function to validate name input (no special characters)

function isNameValid(name) {
  const specialChars = /[`!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/;
  return !specialChars.test(name); 
}

function isDateValid(date) {

  // check if the data is indeed a date by using validator
  if (vd.validate(String(date), options)) {

    //  date can only be today or later
    let dateArray = date.split('/');

    const dateCleared = new Date(`${dateArray[2]}-${dateArray[1]}-${dateArray[0]}`);
    const today = new Date(new Date().toDateString()); // making sure there is no time attached

    return dateCleared >= today;

  } else {

    return false
  }

}

// generic validation function for the input values
function isInputValid(input, validateFunction, errorMessage) {
  
  if (!input) {
    console.info('\x1b[31m%s\x1b[0m', 'Input cannot be blank.')
  } else if (!validateFunction(input)) {
    console.info('\x1b[31m%s\x1b[0m', errorMessage)
  } else {
    console.info('\x1b[33m%s\x1b[0m','Correct input')
  } 
}

// fucntion to show a list of users from the db
const listUsers = () => {
  db.any("SELECT users_name, TO_CHAR(entry_date, 'DD/MM/YYYY') AS reg_date FROM reg_users ORDER BY entry_date;")
		.then(users => {


			console.info('\x1b[36m%s\x1b[0m',`     Users checked-in: (${users.length} in total)`);

      // print the list of users
      const structDatas = users.map(user => ({ Name: user.users_name, Date: user.reg_date }))
      console.table(structDatas);
			
		})
		.catch((error) => console.error(error))
    .finally(() => process.exit(0));
}

// Export All Methods
module.exports = {
  addUser,
  listUsers,
  isInputValid,
  isDateValid,
  isNameValid
}