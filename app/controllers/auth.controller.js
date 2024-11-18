const db = require("../models");
const UserModel = db.user;
const RoleModel = db.role;
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.authController = {
  signUp: async (req, res) => {
    const { firstName, lastName, email, password, role } = req.body;

    try {
      if (!firstName || !lastName || !email || !password) {
        res.status(400).json({
          status: 400,
          message: "Please provide all fields!",
        });
        return;
      }

      let roleId;

      if (!role) {
        const getDefaultRole = await RoleModel.findOne({ name: "user" }).exec();

        if (!getDefaultRole) {
          return res
            .status(404)
            .json({ message: "Failed! getting role by default!" });
        }

        roleId = getDefaultRole.id;
      } else {
        const roleSelected = await RoleModel.findOne({ name: role }).exec();

        if (!roleSelected) {
          return res
            .status(404)
            .json({ message: `Failed! Role ${roleSelected} does not exist!` });
        }

        roleId = roleSelected.id;
      }

      const newUser = new UserModel({
        firstName,
        lastName,
        email,
        password: bcrypt.hashSync(password, 8),
        role: roleId,
      });

      let savedUser = await newUser.save();

      if (!savedUser) {
        return res.status(400).json({ message: "Failed! User not created!" });
      }

      const accessToken = generateToken({
        userInfo: {
          sub: savedUser.id,
          firstName: savedUser.firstName,
          lastName: savedUser.lastName,
          email: savedUser.email,
          role: savedUser.role,
        },
      });

      res.status(201).json({
        status: 201,
        message: "User created successfully.",
        user: savedUser,
        role: savedUser.role,
        accessToken,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  signIn: async (req, res) => {
    const { email, password } = req.body;

    try {
      if (!email || !password) {
        res.status(400).json({
          status: 400,
          message: "Please provide all fields!",
        });
        return;
      }

      const user = await UserModel.findOne({ email })
        .populate("role", "name -_id")
        .exec();

      if (!user) {
        res.status(401).json({
          status: 401,
          message: "Email or password is invalid!!",
        });
        return;
      }

      const isPasswordValid = bcrypt.compareSync(password, user.password);

      if (!isPasswordValid) {
        res.status(401).json({
          status: 401,
          message: "Email or password is invalid!",
        });
        return;
      }

      const accessToken = generateToken({
        userInfo: {
          sub: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
        },
      });

      var authorities = "";

      authorities = "ROLE_" + user.role.name.toUpperCase();

      res.status(200).json({
        status: 200,
        message: "User authenticated successfully!",
        user,
        role: authorities,
        accessToken,
      });
    } catch (error) {
      res.status(500).json({
        status: 500,
        message: "Error logging user!",
        error: error.message,
      });
    }
  },
};

const generateToken = (payload) => {
  return jwt.sign(payload, process.env.SECRET_KEY, { expiresIn: "1d" });
};
