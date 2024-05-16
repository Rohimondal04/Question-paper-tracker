const express=require("express")
// const session = require("express-session
const app=express()
const port= 4000
const multer = require('multer')
const path=require("path")
const views_path=path.join(__dirname,"../template/views")
const hbs=require("hbs")
const body_parser=require("body-parser")
require("./db/conn")
const teacher=require("./models/add_teacher")
const details=require("./models/assign")
app.use(body_parser.json())
app.use(body_parser.urlencoded({extended:false}))
app.use("/uploads",express.static(path.join(__dirname,"../uploads")))
app.use("/images",express.static(path.join(__dirname,"../template/public/assets/images")))
app.use("/css",express.static(path.join(__dirname,"../template/public/assets/css")))
app.use("/js",express.static(path.join(__dirname,"../template/public/assets/js")))
app.set("view engine","hbs")
app.set("views",views_path)
// Multer setup for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null,`${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({ storage: storage });
app.get("/login",(req,res)=>{
    res.render("login")
})
app.listen(port,()=>{
    console.log(`running in port :${port}`)
    console.log(`view_path`)
})
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Check if user credentials match an HOD account
        const hodUser = await teacher.findOne({ email, password, type: "HOD" });
        if (hodUser) {
            // Redirect to HOD admin panel
            // Assuming the HOD panel is named "HodPanel.hbs"
            return res.render("choose.hbs");
        }

        // Check if user credentials match an Exam Co-ordinator account
        const examCoordinatorUser = await teacher.findOne({ email, password, type: "exam_coordinator" });
        if (examCoordinatorUser) {
            // Redirect to Exam Co-ordinator panel
            // Assuming the Exam Co-ordinator panel is named "ExamCoordinatorPanel.hbs"
            const qus = await details.find();

            return res.render("exam_coordinator.hbs",{qus});
        }

        // Check if user credentials match a Faculty account
        const facultyUser = await teacher.findOne({ email, password, type: "sub_faculty" });
        if (facultyUser) {
            // Redirect to Faculty upload panel
            // Assuming the Faculty upload panel is named "FacultyUploadPanel.hbs"
            try {
                // Check if user credentials match a sub_faculty account
                const facultyUser = await teacher.findOne({ email, password, type: "sub_faculty" });
                if (facultyUser) {
                    // Find details based on user's email
                    const userDetails = await details.findOne({ email: email });

                    // Render the question paper page with user details
                    return res.render("questionPaper.hbs", { userDetails });
                }

                // If no matching user found
                return res.send(`
            <script>
                alert("Invalid Email or Password");
                window.history.back();
            </script>`);

            } catch (error) {
                console.error('Error:', error);
                res.send('Internal Server Error');
            }

        }


        // If no matching user found
        return res.send(`
            <script>
                alert("Invalid Email or Password");
                window.history.back();
            </script>`);

    } catch (error) {
        console.error('Error:', error);
        res.send('Internal Server Error');
    }
});
app.post("/faculty",async(req,res)=>{
    res.render("facultyCred.hbs");
})
app.post("/save", async (req,res)=>{
    // const{email,password}=req.body;
    const email = req.body.email;
    const adamasDomain = /^[a-zA-Z0-9._%+-]+@adamasuniversity\.ac\.in$/;

    if (adamasDomain.test(email)) {
        try {
            const add_teacher = new teacher({
                email: req.body.email,
                password: req.body.password,
            });
            await add_teacher.save();
            // res.render("set_teacher.hbs");

            res.render("upload.hbs");
        } catch (err) {
            console.log(err);
        }
    } else {
        res.send(`
            <script>
                alert("Please enter a valid Adamas University Student's email address ");
                window.history.back();
            </script>
        `);
    }

})
app.post("/set",async (req,res)=>{
    // const email = req.body.email;
    try{
        const detail = new details({
            facultyName:req.body.facultyName,
            email:req.body.email,
            courseName:req.body.courseName,
            courseCode:req.body.courseCode,

        })
        await detail.save();
        res.send(`<script>
 alert("your respond in submited")
 window.history.back();
        </script>
`)
    } catch (err){
    console.log(err);
    }

})
app.post("/admin",async(req,res)=>{
    const qus = await details.find();
    res.render("admin.hbs",{qus});
})
app.post("/delete", async (req, res) => {
    const id = req.body.id;

    try {
        const result = await details.deleteOne({ _id: id });

        console.log('Delete Result:', result); // Log the result

        if (result.deletedCount > 0) {
            res.send(`
                <script>
                    alert("Record deleted successfully");
                    window.history.back();
                </script>
            `);
        } else {
            res.send(`
                <script>
                    alert("Record not found");
                    window.history.back();
                </script>
            `);
        }
    } catch (err) {
        console.error('Error during delete:', err);
        res.send(`
            <script>
                alert("An error occurred while deleting the record");
                window.history.back();
            </script>
        `);
    }
});
app.post('/upload',upload.single('file'), async (req, res) => {
    const { email } = req.body;

    try {
        if (!req.file) {
            return res.status(400).send('No file uploaded');
        }

        const docPath = req.file.path;
        const questionDoc = await details.findOne({ email: email });

        if (!questionDoc) {
            return res.status(404).send('User details not found');
        }

        questionDoc.file = req.file.filename;// Set the doc field with the filename
        questionDoc.Status=req.body.status;
        await questionDoc.save();

        res.json({
            message: 'File uploaded successfully',
            // file: req.file.filename
        });
    } catch (err) {
        res.status(500).send(err.message);
    }
});