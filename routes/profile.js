import express from 'express';
const router = express.Router();
import { authMiddleware } from './user-login.js';
import { logging } from 'googleapis/build/src/apis/logging/index.js';

router.use(['/profile',], authMiddleware);

router.get("/", (req, res) => {
    const loggedIn = res.locals.isAuthenticated;

    if (loggedIn) {
        res.render("profile", { loggedIn, userName: "Aayush" })
    }
    else
    {   
        console.log('Please log in first');
        res.redirect('/');
    }
});

router.post("/", (req, res) => {
    res.send("profile update")
});

router
    .route("/:id")
    .get((req, res) => {
        res.send(`profile get ID: ${req.params.id}`)
    })
    .put((req, res) => {
        res.send("profile id update")
    })
    .delete((req, res) => {
        res.send("profile id delete")
    })

const users = [{ name: "Aayush" }, { name: "Varshita" }]

router.param("id", (req, res, next, id) => {
    req.user = users[id] 
    next()  
});

export default router;