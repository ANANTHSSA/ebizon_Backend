const verifyRoles = (...allowedRoles) => {
    return(req, res, next) => {
        if(!req?.role_id) {
            console.log("line 4 This role not allowed")
        return res.sendStatus(401);
        }
        const rolesArray = [...allowedRoles];
        const role_id_array = [req.role_id];
       const result = role_id_array.some((role) => rolesArray.includes(role)); 
       if(!result) {
       console.log(`line 11 This role ${req.role_id} not allowed`);
       return res.sendStatus(401);
       }
       console.log("ROLE VERIFIED")
        next();
    }
}

module.exports = verifyRoles;