import CRUDService from "../services/CRUDService";

let getHomeController = (req, res) => {
    res.render("homePage");
}

let getCRUD = (req, res) => {
    return res.render("crud");
}

let postCRUD = async (req, res) => {
    let message = await CRUDService.createNewUser(req.body);

    return res.send('post crud from server');
}

let displayGetCRUD = async (req, res) => {
    let data = await CRUDService.getAllUser();

    return res.render('displayCRUD', {
        dataTable: data
    })
}

let getEditCRUD = async (req, res) => {
    let userId = req.query.id;
    if (userId) {
        let userData = await CRUDService.getUserInfoById(userId);

        return res.render('editCRUD', {
            user: userData
        });
    }
    else {
        res.send('Users not found!');
    }
}

let putCRUD = async (req, res) => {
    let data = req.body;
    let allUsers = await CRUDService.updateUserData(data);
    return res.render('displayCRUD', {
        dataTable: allUsers
    })
}

let deleteCRUD = async (req, res) => {
    let userId = req.query.id;
    if (userId) {
        await CRUDService.deleteUserById(userId);

        return res.send('Delete user succeed!');
    }
    else {
        return res.send('User not found!');
    }
}

module.exports = {
    getHomeController: getHomeController,
    getCRUD: getCRUD,
    postCRUD: postCRUD,
    displayGetCRUD: displayGetCRUD,
    getEditCRUD: getEditCRUD,
    putCRUD: putCRUD,
    deleteCRUD: deleteCRUD
} 