const jwt = require("jsonwebtoken");
const db = require("../../models");
const UserModel = db.user;
const RoleModel = db.role;

exports.authJwt = {
  verifyToken: (req, res, next) => {
    try {
      const token = req.headers?.authorization?.split(" ")[1];

      if (!token) {
        return res.status(403).json({ message: "No token provided!" });
      }

      jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
        if (err) {
          return res.status(401).json({ message: "Unauthorized!" });
        }

        req.userId = decoded.userInfo.sub;
        req.role = decoded.userInfo.role;
        req.user = decoded.userInfo;

        console.log("Sub id: ", req.userId);
      });

      next();
    } catch (error) {
      console.log("Error:", error);
    }
  },

  isAdmin: async (req, res, next) => {
    try {
      const user = await UserModel.findById(req.userId).exec();

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      console.log("isAdmin: " + user);

      const roleUser = await RoleModel.findOne({ _id: user.role }).exec();

      if (!roleUser) {
        return res.status(404).json({ error: "Role not found" });
      }

      console.log("Role: " + roleUser);

      if (roleUser.name === "admin") {
        next();
      } else {
        return res
          .status(403)
          .json({ error: "You are not authorized to access this resource" });
      }
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  },
};
