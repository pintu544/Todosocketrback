const db = require("../../models");
const UserModel = db.user;
const ROLES = db.ROLES;

exports.verifySignUp = {
  checkDuplicateEmail: async (req, res, next) => {
    try {
      const existsUser = await UserModel.findOne({
        email: req.body.email,
      }).exec();

      if (existsUser) {
        res.status(409).json({
          message: "Failed! Email is already in use!",
          email: existsUser.email,
        });
        return;
      }

      next();
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error checking email!", error: error.message });
    }
  },

  checkRolesExisted: (req, res, next) => {
    if (req.body.role) {
      if (!ROLES.includes(req.body.role)) {
        res
          .status(400)
          .json({ message: `Failed! Role ${req.body.role} does not exist!` });
        return;
      }
    }

    next();
  },
};
