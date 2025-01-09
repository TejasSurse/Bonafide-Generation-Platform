const express = require("express");
const app = express();
const port = process.env.PORT || 8080;
const path = require("path");
const mysql = require("mysql2");
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/Views"));


if(process.env.NODE_ENV != "production"){
    require("dotenv").config();
}


const conn = mysql.createConnection({
    host: process.env.HOST,
    user: process.env.USER,
    password: process.env.PASSWORD, // Replace with your database password
    database: process.env.DB, // Your database name
    ssl: {
         rejectUnauthorized: false
    },
    connectionLimit: 10, // Adjust based on your needs
    waitForConnections: true,
    queueLimit: 0
});

if(conn){
    console.log("DB Connection Successful");
}else{
    console.log("DB Connection Failed");
}

app.use(express.static(path.join(__dirname, "Public")));
app.use(express.urlencoded({ extended: true })); 

app.listen(port, ()=>{
    console.log(`Server is running on port ${port}`);
});

app.get("/", (req, res)=>{
    res.render("home.ejs");
});

app.get("/form", (req, res)=>{
    res.render("form.ejs");
});

app.post("/getuser", (req, res) => {
    console.log(req.body);
    
    const enteredPRN = req.body.prn;
    const enteredPassword = req.body.pass;

    // Query the database to find the student by PRN
    conn.query(`SELECT * FROM StudentsData WHERE prn = ?`, [enteredPRN], (err, results) => {
        if (err) {
            console.log(err);
            return res.status(500).send("Error accessing the database.");
        } 

        if (results.length == 0) {
            console.log("No records found.");
            return res.status(404).send("No records found for the provided PRN.");
        }

        // Extract name and dob from the record
        const student = results[0];
        const name = student.name;  // Full name
        const dob = student.dob;    // Date of birth (assumed to be in YYYY-MM-DD format)

        // Extract the first 4 characters of the name and the birth year from dob
        const nameFirstFour = name.substring(0, 4);  // Get first 4 characters of the name
        const birthYear = dob.split('-')[0];          // Extract the year part from the DOB (assuming format YYYY-MM-DD)

        // Generate the password (name's first 4 characters + birth year)
        const generatedPassword = nameFirstFour + birthYear;
        console.log(generatedPassword , "Generated password ");
        // Compare the entered password with the generated password
        if (enteredPassword !== generatedPassword) {
            console.log("Incorrect password.");
            return res.status(401).send("Incorrect password.");
        }

        // Format today's date to 'dd-mm-yyyy'
        const today = new Date();
        const formattedDate = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`;
        
        // Set formatted date and pass data to the template
        student.Date = formattedDate;

        // Render the bonafide certificate with the student data
        res.render("bonafide.ejs", { data: student });
    });
});







